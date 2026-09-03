const PDFDocument = require('pdfkit');

/**
 * Generate PDF buffer from invoice data using pdfkit.
 * Pure JavaScript — 0 native binaries, 0 Puppeteer, 100% Vercel Serverless compatible!
 * Dynamically supports OM CARTRIDGE (Without Tax) and OM ENTERPRISE (With Tax).
 */
async function generateInvoicePDF(invoice) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 30 });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const isWithoutTax = invoice.businessType === 'OM_CARTRIDGE' || invoice.taxMode === 'without_tax';
      const biz = invoice.businessDetails || {};
      const cust = invoice.customerSnapshot || {};
      const bank = invoice.bankDetails || {};
      const items = invoice.items || [];

      const businessName = isWithoutTax
        ? 'OM CARTRIDGE'
        : (biz.name || 'OM ENTERPRISE');

      const brandSubtitle = isWithoutTax
        ? 'Printer & Xerox Cartridge Management'
        : 'OM CARTRIDGE — Printer & Xerox Cartridge Management';

      const invoiceTitle = isWithoutTax ? 'INVOICE' : 'TAX INVOICE';

      // --- Header / Business Info ---
      doc.fontSize(18).font('Helvetica-Bold').fillColor('#15527A').text(businessName, { align: 'center' });
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#ED3838').text(brandSubtitle, { align: 'center' });

      const cleanAddr = (biz.address || '').replace(/\n/g, ', ');
      doc.fontSize(8).font('Helvetica').fillColor('#444444').text(cleanAddr, { align: 'center' });
      const gstinText = !isWithoutTax && biz.gstin ? `GSTIN: ${biz.gstin} | ` : '';
      doc.text(`${gstinText}Phone: ${biz.phone1 || ''} / ${biz.phone2 || ''}`, { align: 'center' });
      doc.moveDown(0.6);

      // --- Title Banner ---
      const titleY = doc.y;
      doc.rect(30, titleY, 535, 20).fill('#15527A');
      doc.fillColor('#FFFFFF').fontSize(11).font('Helvetica-Bold').text(invoiceTitle, 35, titleY + 4, { align: 'center' });
      doc.moveDown(1.4);

      // --- Invoice & Customer Details Box ---
      const infoY = doc.y;
      doc.fontSize(9).fillColor('#000000');

      // Left Column (Customer)
      doc.font('Helvetica-Bold').text('BILLED TO / BUYER:', 35, infoY);
      doc.font('Helvetica').text(cust.name || 'Customer', 35, infoY + 12);
      if (cust.address) doc.text(cust.address.replace(/\n/g, ', '), 35, infoY + 24, { width: 250 });
      if (cust.phone) doc.text(`Phone: ${cust.phone}`, 35, infoY + 44);
      if (!isWithoutTax && cust.gstin) doc.text(`GSTIN: ${cust.gstin}`, 35, infoY + 56);

      // Right Column (Invoice Metadata)
      doc.font('Helvetica-Bold').text(`Invoice No: ${invoice.invoiceNumber || ''}`, 340, infoY);
      const invDateStr = invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString('en-IN') : '';
      doc.font('Helvetica').text(`Date: ${invDateStr}`, 340, infoY + 12);
      doc.text(`Payment Terms: ${invoice.paymentTerms || 'Due on Receipt'}`, 340, infoY + 24);
      if (invoice.buyersOrderNumber) doc.text(`Buyer's Order No: ${invoice.buyersOrderNumber}`, 340, infoY + 36);
      if (invoice.deliveryNote) doc.text(`Delivery Note: ${invoice.deliveryNote}`, 340, infoY + 48);

      doc.y = infoY + 70;
      doc.moveDown(0.5);

      // --- Items Table ---
      const tableTop = doc.y;
      doc.rect(30, tableTop, 535, 18).fill('#15527A');
      doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');

      doc.text('#', 35, tableTop + 4);
      doc.text('Item Description', 55, tableTop + 4);
      doc.text('HSN/SAC', 240, tableTop + 4);
      doc.text('Qty', 310, tableTop + 4);
      doc.text('Rate (₹)', 365, tableTop + 4);
      if (!isWithoutTax) {
        doc.text('Taxable (₹)', 425, tableTop + 4);
        doc.text('Total (₹)', 495, tableTop + 4);
      } else {
        doc.text('Amount (₹)', 485, tableTop + 4);
      }

      let y = tableTop + 22;
      doc.fillColor('#000000').font('Helvetica').fontSize(8);

      items.forEach((item, index) => {
        const lineTotal = Number(item.finalAmount !== undefined ? item.finalAmount : item.amount || (item.quantity * item.rate)).toFixed(2);
        const taxable = Number(item.taxableValue || item.finalAmount || (item.quantity * item.rate)).toFixed(2);

        doc.text((index + 1).toString(), 35, y);
        doc.text(item.description || '', 55, y, { width: 175 });
        doc.text(item.hsnSac || '-', 240, y);
        doc.text(`${item.quantity} ${item.unit || 'PCS'}`, 310, y);
        doc.text(`₹${Number(item.rate).toFixed(2)}`, 365, y);
        if (!isWithoutTax) {
          doc.text(`₹${taxable}`, 425, y);
          doc.text(`₹${lineTotal}`, 495, y);
        } else {
          doc.text(`₹${lineTotal}`, 485, y);
        }
        y += 18;
      });

      doc.moveDown();
      doc.y = y + 10;

      // --- Totals Summary ---
      const grandTotalStr = Number(invoice.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#15527A');
      doc.text(`Grand Total: ₹${grandTotalStr}`, 30, doc.y, { align: 'right' });

      if (invoice.totalDiscount > 0) {
        doc.fontSize(8).font('Helvetica').fillColor('#C0392B').text(`Total Discount: -₹${Number(invoice.totalDiscount).toFixed(2)}`, 30, doc.y + 2, { align: 'right' });
      }

      if (isWithoutTax) {
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#D97706').text(`[Without Tax Invoice — GST: ₹0.00]`, 30, doc.y + 3, { align: 'right' });
      }

      if (invoice.amountInWords) {
        doc.fontSize(8).font('Helvetica').fillColor('#444444').text(`Amount in Words: ${invoice.amountInWords}`, 30, doc.y + 4);
      }

      // --- Bank Details & Footer ---
      doc.moveDown(1.5);
      const footerY = doc.y;
      doc.rect(30, footerY, 535, 1).fill('#CCCCCC');
      doc.moveDown(0.5);

      doc.fontSize(8).font('Helvetica-Bold').fillColor('#15527A').text('BANK DETAILS FOR PAYMENT', 30, doc.y);
      doc.font('Helvetica').fillColor('#444444');
      doc.text(`Bank: ${bank.bankName || 'THE KALUPUR COMMERCIAL CO.OP.BANK LTD.'}`);
      doc.text(`A/C No: ${bank.accountNo || '00520103077'} | IFSC: ${bank.ifsc || 'KCCB0SNN005'} | Branch: ${bank.branch || 'SANAND'}`);

      doc.moveDown(0.5);
      doc.fontSize(7).fillColor('#666666').text(invoice.declaration || 'We declare that this invoice shows the actual price of the goods described.', { width: 535 });
      doc.text(invoice.jurisdiction || 'SUBJECT TO AHMEDABAD JURISDICTION', { align: 'right' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateInvoicePDF };
