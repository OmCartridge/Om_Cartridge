const PDFDocument = require('pdfkit');

/**
 * Generate PDF buffer from invoice data using pdfkit.
 * Pure JavaScript — 0 native binaries, 0 Puppeteer, 100% Vercel Serverless compatible!
 */
async function generateInvoicePDF(invoice) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 30 });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const biz = invoice.businessDetails || {};
      const cust = invoice.customerSnapshot || {};
      const bank = invoice.bankDetails || {};
      const items = invoice.items || [];

      // --- Header / Business Info ---
      doc.fontSize(18).fillColor('#15527A').text(biz.name || 'OM ENTERPRISE', { align: 'center' });
      doc.fontSize(9).fillColor('#ED3838').text(biz.brandName || 'OM CARTRIDGE — Printer & Xerox Cartridge Management', { align: 'center' });
      
      const cleanAddr = (biz.address || '').replace(/\n/g, ', ');
      doc.fontSize(8).fillColor('#444444').text(cleanAddr, { align: 'center' });
      doc.text(`GSTIN: ${biz.gstin || ''} | Phone: ${biz.phone1 || ''} / ${biz.phone2 || ''}`, { align: 'center' });
      doc.moveDown(0.8);

      // --- Title ---
      const titleY = doc.y;
      doc.rect(30, titleY, 535, 20).fill('#15527A');
      doc.fillColor('#FFFFFF').fontSize(11).text('TAX INVOICE', 35, titleY + 4, { align: 'center' });
      doc.moveDown(1.5);

      // --- Invoice & Customer Details Box ---
      const infoY = doc.y;
      doc.fontSize(9).fillColor('#000000');
      
      // Left Column (Customer)
      doc.font('Helvetica-Bold').text('BILLED TO:', 35, infoY);
      doc.font('Helvetica').text(cust.name || 'Customer', 35, infoY + 12);
      if (cust.address) doc.text(cust.address.replace(/\n/g, ', '), 35, infoY + 24, { width: 250 });
      if (cust.gstin) doc.text(`GSTIN: ${cust.gstin}`, 35, infoY + 44);

      // Right Column (Invoice Metadata)
      doc.font('Helvetica-Bold').text(`Invoice No: ${invoice.invoiceNumber || ''}`, 340, infoY);
      const invDateStr = invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString('en-IN') : '';
      doc.font('Helvetica').text(`Date: ${invDateStr}`, 340, infoY + 12);
      doc.text(`Payment Terms: ${invoice.paymentTerms || 'Due on Receipt'}`, 340, infoY + 24);
      if (invoice.buyersOrderNumber) doc.text(`Buyer's Order No: ${invoice.buyersOrderNumber}`, 340, infoY + 36);

      doc.y = infoY + 60;
      doc.moveDown(0.5);

      // --- Items Table ---
      const tableTop = doc.y;
      doc.rect(30, tableTop, 535, 18).fill('#15527A');
      doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
      doc.text('#', 35, tableTop + 4);
      doc.text('Item Description', 60, tableTop + 4);
      doc.text('HSN/SAC', 230, tableTop + 4);
      doc.text('Qty', 280, tableTop + 4);
      doc.text('Rate', 330, tableTop + 4);
      doc.text('Taxable', 410, tableTop + 4);
      doc.text('Total (₹)', 480, tableTop + 4);

      let y = tableTop + 22;
      doc.fillColor('#000000').font('Helvetica').fontSize(8);

      items.forEach((item, index) => {
        const lineTotal = Number(item.totalAmount || (item.quantity * item.rate)).toFixed(2);
        const taxable = Number(item.taxableValue || (item.quantity * item.rate)).toFixed(2);

        doc.text((index + 1).toString(), 35, y);
        doc.text(item.description || '', 60, y, { width: 165 });
        doc.text(item.hsnSac || '-', 230, y);
        doc.text(`${item.quantity} ${item.unit || 'PCS'}`, 280, y);
        doc.text(`₹${Number(item.rate).toFixed(2)}`, 330, y);
        doc.text(`₹${taxable}`, 410, y);
        doc.text(`₹${lineTotal}`, 480, y);
        y += 18;
      });

      doc.moveDown();
      doc.y = y + 10;

      // --- Totals Summary ---
      const grandTotalStr = Number(invoice.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#15527A');
      doc.text(`Grand Total: ₹${grandTotalStr}`, 30, doc.y, { align: 'right' });
      
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
