const PDFDocument = require('pdfkit');

const fmt = (n) =>
  Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';

/**
 * Generate PDF buffer from invoice data using pdfkit.
 * Exact 1-to-1 visual mirror of the Master InvoiceTemplate from the Viewing Page:
 *  - Outer border
 *  - Header with Logo / Business details and Metadata table
 *  - Consignee (Ship to) / Buyer (Bill to) 2-column split
 *  - Items table with full borders
 *  - Totals box with words, E. & O.E., subtotal, discounts, tax, grand total
 *  - GST HSN/SAC summary table (for with_tax) or Without-Tax banner
 *  - Declaration, Bank details, and Authorised Signatory box
 *  - Computer Generated Invoice footer
 */
async function generateInvoicePDF(invoice) {
  return new Promise((resolve, reject) => {
    try {
      // Standard A4: 595.28 x 841.89 points. Margin 28pt gives width 539pt, height 785pt.
      const doc = new PDFDocument({ size: 'A4', margin: 28 });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const isWithoutTax = invoice.businessType === 'OM_CARTRIDGE' || invoice.taxMode === 'without_tax';
      const biz = invoice.businessDetails || {};
      const cust = invoice.customerSnapshot || {};
      const bank = invoice.bankDetails || {};
      const items = invoice.items || [];

      const displayBizName = isWithoutTax
        ? 'OM CARTRIDGE'
        : (biz.name || 'OM ENTERPRISE');

      const displayBrand = isWithoutTax
        ? 'Printer & Xerox Cartridge Management'
        : (biz.brandName || 'OM CARTRIDGE — Printer & Xerox Cartridge Management');

      const invoiceTitle = isWithoutTax ? 'INVOICE' : 'TAX INVOICE';

      // Outer bounding box coordinates
      const boxX = 28;
      const boxY = 28;
      const boxW = 539.28;
      let curY = boxY;

      // ── 1. TITLE BANNER ──────────────────────────────────────────────────────────
      const titleH = 22;
      doc.rect(boxX, curY, boxW, titleH).fill(isWithoutTax ? '#FFFBEB' : '#F1F5F9');
      doc.rect(boxX, curY, boxW, titleH).stroke('#000000');
      doc.font('Helvetica-Bold').fontSize(12).fillColor(isWithoutTax ? '#92400E' : '#15527A');
      doc.text(invoiceTitle, boxX, curY + 5, { width: boxW, align: 'center', characterSpacing: 2 });
      curY += titleH;

      // ── 2. HEADER: BUSINESS INFO (LEFT) + INVOICE METADATA (RIGHT) ───────────────
      const colW = boxW / 2;
      const headerH = 100;
      doc.rect(boxX, curY, boxW, headerH).stroke('#000000');
      doc.moveTo(boxX + colW, curY).lineTo(boxX + colW, curY + headerH).stroke('#000000');

      // Left Column: Business Info
      doc.font('Helvetica-Bold').fontSize(13).fillColor('#15527A');
      doc.text(displayBizName, boxX + 8, curY + 8, { width: colW - 16 });

      doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#ED3838');
      doc.text(displayBrand, boxX + 8, curY + 24, { width: colW - 16 });

      doc.font('Helvetica').fontSize(7.5).fillColor('#333333');
      const cleanAddr = (biz.address || '10, C-DAC Computer, Bavla Road, Sanand, Ahmedabad').replace(/\n/g, ', ');
      doc.text(cleanAddr, boxX + 8, curY + 36, { width: colW - 16 });

      if (!isWithoutTax && biz.gstin) {
        doc.font('Helvetica-Bold').text(`GSTIN/UIN: ${biz.gstin}`, boxX + 8, curY + 54);
      }
      doc.font('Helvetica').text(`State: ${biz.state || 'Gujarat'} | Code: ${biz.stateCode || '24'}`, boxX + 8, curY + 66);
      doc.text(`Ph: ${biz.phone1 || '70967 06868'} / ${biz.phone2 || '70967 06363'}`, boxX + 8, curY + 78);

      // Right Column: Invoice Metadata Table
      const metaRows = [
        ['Invoice No.', invoice.invoiceNumber || ''],
        ['Dated', formatDate(invoice.invoiceDate)],
        ['Delivery Note', invoice.deliveryNote || ''],
        ['Payment Terms', invoice.paymentTerms || 'Due on Receipt'],
        ['Reference No.', invoice.referenceNumber || ''],
        ["Buyer's Order No.", invoice.buyersOrderNumber || ''],
        ['Dispatch Details', invoice.dispatchDetails || ''],
        ['Destination', invoice.destination || ''],
      ];

      let metaY = curY + 5;
      metaRows.forEach(([lbl, val]) => {
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#000000');
        doc.text(lbl, boxX + colW + 8, metaY, { width: 85 });
        doc.font(lbl === 'Invoice No.' ? 'Helvetica-Bold' : 'Helvetica').fillColor('#000000');
        doc.text(`: ${val}`, boxX + colW + 95, metaY, { width: colW - 105 });
        metaY += 11.5;
      });

      curY += headerH;

      // ── 3. CONSIGNEE & BUYER HEADER ──────────────────────────────────────────────
      const subHeaderH = 14;
      doc.rect(boxX, curY, boxW, subHeaderH).fill('#F5F5F5');
      doc.rect(boxX, curY, boxW, subHeaderH).stroke('#000000');
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#000000');
      doc.text('Consignee (Ship to)', boxX + 8, curY + 3);
      doc.text('Buyer (Bill to)', boxX + colW + 8, curY + 3);
      curY += subHeaderH;

      // ── 4. CONSIGNEE & BUYER BOXES ───────────────────────────────────────────────
      const custBoxH = 58;
      doc.rect(boxX, curY, boxW, custBoxH).stroke('#000000');
      doc.moveTo(boxX + colW, curY).lineTo(boxX + colW, curY + custBoxH).stroke('#000000');

      [0, 1].forEach((colIdx) => {
        const cX = boxX + (colIdx * colW) + 8;
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#000000');
        doc.text(cust.name || 'Customer', cX, curY + 5, { width: colW - 16 });

        doc.font('Helvetica').fontSize(7.5).fillColor('#333333');
        const custAddr = (cust.address || '').replace(/\n/g, ', ');
        doc.text(custAddr || '-', cX, curY + 17, { width: colW - 16, height: 16 });

        if (cust.gstin) {
          doc.text(`GSTIN/UIN: ${cust.gstin}`, cX, curY + 34);
        }
        doc.text(`State: ${cust.state || 'Gujarat'} | Code: ${cust.stateCode || '24'}`, cX, curY + (cust.gstin ? 44 : 34));
        if (cust.phone) {
          doc.text(`Ph: ${cust.phone}`, cX, curY + (cust.gstin ? 54 : 44));
        }
      });

      curY += custBoxH;

      // ── 5. ITEMS TABLE ───────────────────────────────────────────────────────────
      // Column widths totaling 539.28pt:
      // Sl: 24, Desc: 180, HSN: 55, Qty: 40, Unit: 38, Rate: 58, Disc: 60, Amt: 84.28
      const hasDiscount = (invoice.totalDiscount || 0) > 0;
      const cols = hasDiscount
        ? [
            { id: 'sl', label: 'Sl No.', w: 28, align: 'center' },
            { id: 'desc', label: 'Description of Goods', w: 175, align: 'left' },
            { id: 'hsn', label: 'HSN/SAC', w: 55, align: 'center' },
            { id: 'qty', label: 'Qty', w: 40, align: 'center' },
            { id: 'unit', label: 'Unit', w: 35, align: 'center' },
            { id: 'rate', label: 'Rate (₹)', w: 58, align: 'right' },
            { id: 'disc', label: 'Discount', w: 60, align: 'right' },
            { id: 'amt', label: 'Amount (₹)', w: 88.28, align: 'right' },
          ]
        : [
            { id: 'sl', label: 'Sl No.', w: 28, align: 'center' },
            { id: 'desc', label: 'Description of Goods', w: 215, align: 'left' },
            { id: 'hsn', label: 'HSN/SAC', w: 60, align: 'center' },
            { id: 'qty', label: 'Qty', w: 45, align: 'center' },
            { id: 'unit', label: 'Unit', w: 40, align: 'center' },
            { id: 'rate', label: 'Rate (₹)', w: 65, align: 'right' },
            { id: 'amt', label: 'Amount (₹)', w: 86.28, align: 'right' },
          ];

      const thH = 16;
      doc.rect(boxX, curY, boxW, thH).fill('#F5F5F5');
      doc.rect(boxX, curY, boxW, thH).stroke('#000000');

      let colX = boxX;
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#000000');
      cols.forEach((c) => {
        doc.text(c.label, colX + 2, curY + 4, { width: c.w - 4, align: c.align });
        colX += c.w;
        if (colX < boxX + boxW) {
          doc.moveTo(colX, curY).lineTo(colX, curY + thH).stroke('#999999');
        }
      });
      curY += thH;

      // Render Item Rows
      const rowH = 16;
      items.forEach((item, idx) => {
        doc.rect(boxX, curY, boxW, rowH).stroke('#CCCCCC');
        colX = boxX;

        const discAmt = Number(item.discountAmount || 0);
        const finalAmt = item.finalAmount !== undefined ? item.finalAmount : item.amount;

        cols.forEach((c) => {
          doc.font('Helvetica').fontSize(7.5).fillColor('#000000');
          let val = '';
          if (c.id === 'sl') val = (idx + 1).toString();
          else if (c.id === 'desc') val = item.description || '';
          else if (c.id === 'hsn') val = item.hsnSac || '-';
          else if (c.id === 'qty') val = (item.quantity || 0).toString();
          else if (c.id === 'unit') val = item.unit || 'PCS';
          else if (c.id === 'rate') val = `₹${fmt(item.rate)}`;
          else if (c.id === 'disc') {
            val = discAmt > 0
              ? `${item.discountType === 'percent' ? `${item.discountValue}% ` : ''}-₹${fmt(discAmt)}`
              : '-';
          } else if (c.id === 'amt') val = `₹${fmt(finalAmt)}`;

          doc.text(val, colX + 3, curY + 4, { width: c.w - 6, align: c.align, lineBreak: false });
          colX += c.w;
          if (colX < boxX + boxW) {
            doc.moveTo(colX, curY).lineTo(colX, curY + rowH).stroke('#CCCCCC');
          }
        });
        curY += rowH;
      });

      // Table Total Row
      const totalRowH = 16;
      doc.rect(boxX, curY, boxW, totalRowH).fill('#F9F9F9');
      doc.rect(boxX, curY, boxW, totalRowH).stroke('#000000');

      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#000000');
      // "Total" spanning across first 2 columns
      const spanW = cols[0].w + cols[1].w + (cols[2] ? cols[2].w : 0);
      doc.text('Total', boxX + 4, curY + 4, { width: spanW - 8, align: 'right' });

      // Total quantity
      const totalQty = items.reduce((s, i) => s + (Number(i.quantity) || 0), 0);
      const qtyCol = cols.find((c) => c.id === 'qty');
      let qX = boxX;
      for (const c of cols) {
        if (c.id === 'qty') break;
        qX += c.w;
      }
      doc.text(totalQty.toString(), qX + 2, curY + 4, { width: qtyCol.w - 4, align: 'center' });

      // Total taxable / amount
      doc.text(`₹${fmt(invoice.taxableValue)}`, boxX + boxW - cols[cols.length - 1].w - 4, curY + 4, {
        width: cols[cols.length - 1].w,
        align: 'right',
      });

      curY += totalRowH;

      // ── 6. TOTALS SECTION (SPLIT IN HALF) ────────────────────────────────────────
      const totalsH = 75;
      doc.rect(boxX, curY, boxW, totalsH).stroke('#000000');
      doc.moveTo(boxX + colW, curY).lineTo(boxX + colW, curY + totalsH).stroke('#000000');

      // Left: Words & Without Tax Badge
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#000000');
      doc.text('Amount Chargeable (in words):', boxX + 8, curY + 6);
      doc.font('Helvetica-Oblique').fontSize(7).fillColor('#333333');
      doc.text(invoice.amountInWords || '', boxX + 8, curY + 18, { width: colW - 16 });
      doc.font('Helvetica').fontSize(6.5).fillColor('#666666').text('E. & O.E.', boxX + 8, curY + 45);

      if (isWithoutTax) {
        doc.rect(boxX + 8, curY + 56, 125, 13).fill('#FFFBEB');
        doc.rect(boxX + 8, curY + 56, 125, 13).stroke('#FDE68A');
        doc.font('Helvetica-Bold').fontSize(6.5).fillColor('#92400E').text('⚠ WITHOUT TAX INVOICE', boxX + 12, curY + 59);
      }

      // Right: Detailed Totals
      let totY = curY + 4;
      const rightRows = [];
      if (hasDiscount) {
        rightRows.push(['Subtotal (Before Discount)', `₹${fmt(invoice.subtotal)}`]);
        rightRows.push(['(-) Total Discount', `-₹${fmt(invoice.totalDiscount)}`]);
      }
      rightRows.push([hasDiscount ? 'Taxable Value' : 'Subtotal', `₹${fmt(invoice.taxableValue)}`]);

      if (!isWithoutTax) {
        if (!invoice.isInterState) {
          rightRows.push(['CGST', `₹${fmt(invoice.cgst)}`]);
          rightRows.push(['SGST', `₹${fmt(invoice.sgst)}`]);
        } else {
          rightRows.push(['IGST', `₹${fmt(invoice.igst)}`]);
        }
        rightRows.push(['Total Tax', `₹${fmt(invoice.totalTax)}`]);
      } else {
        rightRows.push(['Tax (Without Tax Mode)', '₹0.00']);
      }

      const roff = invoice.roundOff || 0;
      rightRows.push(['Less: Round Off', `${roff < 0 ? '-' : '+'}₹${fmt(Math.abs(roff))}`]);

      rightRows.forEach(([lbl, val]) => {
        doc.font('Helvetica').fontSize(7).fillColor('#333333');
        doc.text(lbl, boxX + colW + 8, totY, { width: 140 });
        doc.text(val, boxX + boxW - 80, totY, { width: 72, align: 'right' });
        totY += 9.5;
      });

      // Grand Total Row
      doc.moveTo(boxX + colW, curY + totalsH - 16).lineTo(boxX + boxW, curY + totalsH - 16).stroke('#000000');
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#000000');
      doc.text('Grand Total', boxX + colW + 8, curY + totalsH - 13);
      doc.text(`₹${fmt(invoice.grandTotal)}`, boxX + boxW - 100, curY + totalsH - 13, { width: 92, align: 'right' });

      curY += totalsH;

      // ── 7. GST SUMMARY (FOR WITH TAX) OR BANNER (FOR WITHOUT TAX) ─────────────────
      if (!isWithoutTax) {
        const gstH = 42;
        doc.rect(boxX, curY, boxW, gstH).stroke('#000000');

        doc.font('Helvetica-Bold').fontSize(7).fillColor('#000000');
        doc.text(`Tax Amount (in words): ${invoice.taxAmountInWords || ''}`, boxX + 6, curY + 3);

        const gCols = [
          { label: 'HSN/SAC', w: 65, align: 'center' },
          { label: 'Taxable Val', w: 65, align: 'right' },
          { label: 'CGST %', w: 45, align: 'center' },
          { label: 'CGST Amt', w: 55, align: 'right' },
          { label: 'SGST %', w: 45, align: 'center' },
          { label: 'SGST Amt', w: 55, align: 'right' },
          { label: 'IGST %', w: 45, align: 'center' },
          { label: 'IGST Amt', w: 55, align: 'right' },
          { label: 'Total Tax', w: 109.28, align: 'right' },
        ];

        let gY = curY + 12;
        doc.rect(boxX, gY, boxW, 11).fill('#F5F5F5');
        doc.rect(boxX, gY, boxW, 11).stroke('#999999');

        let gx = boxX;
        doc.font('Helvetica-Bold').fontSize(6.5).fillColor('#000000');
        gCols.forEach((c) => {
          doc.text(c.label, gx + 1, gY + 2, { width: c.w - 2, align: c.align });
          gx += c.w;
        });

        // HSN aggregated row
        gY += 11;
        const map = {};
        items.forEach((i) => {
          const key = i.hsnSac || 'OTHER';
          if (!map[key]) map[key] = { hsn: key, taxable: 0, cgstAmt: 0, sgstAmt: 0, igstAmt: 0, gstRate: i.gstRate || 18 };
          const fAmt = i.finalAmount !== undefined ? i.finalAmount : i.amount;
          map[key].taxable += fAmt;
          map[key].cgstAmt += i.cgstAmount || 0;
          map[key].sgstAmt += i.sgstAmount || 0;
          map[key].igstAmt += i.igstAmount || 0;
        });

        Object.values(map).forEach((row) => {
          doc.rect(boxX, gY, boxW, 11).stroke('#CCCCCC');
          gx = boxX;
          doc.font('Helvetica').fontSize(6.5).fillColor('#000000');
          doc.text(row.hsn, gx, gY + 2, { width: gCols[0].w, align: 'center' });
          gx += gCols[0].w;
          doc.text(`₹${fmt(row.taxable)}`, gx, gY + 2, { width: gCols[1].w, align: 'right' });
          gx += gCols[1].w;
          doc.text(!invoice.isInterState ? `${row.gstRate / 2}%` : '-', gx, gY + 2, { width: gCols[2].w, align: 'center' });
          gx += gCols[2].w;
          doc.text(!invoice.isInterState ? `₹${fmt(row.cgstAmt)}` : '-', gx, gY + 2, { width: gCols[3].w, align: 'right' });
          gx += gCols[3].w;
          doc.text(!invoice.isInterState ? `${row.gstRate / 2}%` : '-', gx, gY + 2, { width: gCols[4].w, align: 'center' });
          gx += gCols[4].w;
          doc.text(!invoice.isInterState ? `₹${fmt(row.sgstAmt)}` : '-', gx, gY + 2, { width: gCols[5].w, align: 'right' });
          gx += gCols[5].w;
          doc.text(invoice.isInterState ? `${row.gstRate}%` : '-', gx, gY + 2, { width: gCols[6].w, align: 'center' });
          gx += gCols[6].w;
          doc.text(invoice.isInterState ? `₹${fmt(row.igstAmt)}` : '-', gx, gY + 2, { width: gCols[7].w, align: 'right' });
          gx += gCols[7].w;
          doc.text(`₹${fmt(row.cgstAmt + row.sgstAmt + row.igstAmt)}`, gx, gY + 2, { width: gCols[8].w - 4, align: 'right' });
          gY += 11;
        });

        curY += gstH;
      } else {
        const noTaxH = 16;
        doc.rect(boxX, curY, boxW, noTaxH).fill('#FFFBEB');
        doc.rect(boxX, curY, boxW, noTaxH).stroke('#000000');
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#92400E');
        doc.text(
          `⚠ TAX NOT APPLICABLE — This invoice was generated WITHOUT TAX. Grand Total = ₹${fmt(invoice.grandTotal)} (no GST applied).`,
          boxX + 8,
          curY + 4
        );
        curY += noTaxH;
      }

      // ── 8. DECLARATION, BANK DETAILS & SIGNATORY ─────────────────────────────────
      const footerBoxH = 68;
      doc.rect(boxX, curY, boxW, footerBoxH).stroke('#000000');
      doc.moveTo(boxX + colW, curY).lineTo(boxX + colW, curY + footerBoxH).stroke('#000000');

      // Left: Declaration & Bank Details
      doc.font('Helvetica-Bold').fontSize(7).fillColor('#000000');
      doc.text('Declaration:', boxX + 8, curY + 6);
      doc.font('Helvetica').fontSize(6.5).fillColor('#333333');
      doc.text(
        invoice.declaration || 'We declare that this invoice shows the actual price of the goods described.',
        boxX + 8,
        curY + 16,
        { width: colW - 16 }
      );

      doc.font('Helvetica-Bold').fontSize(7).fillColor('#000000').text('Bank Details:', boxX + 8, curY + 34);
      doc.font('Helvetica').fontSize(6.5).fillColor('#333333');
      doc.text(`Bank: ${bank.bankName || 'THE KALUPUR COMMERCIAL CO.OP.BANK LTD.'}`, boxX + 8, curY + 44);
      doc.text(
        `A/C No: ${bank.accountNo || '00520103077'} | IFSC: ${bank.ifsc || 'KCCB0SNN005'} | Branch: ${bank.branch || 'SANAND'}`,
        boxX + 8,
        curY + 54
      );

      // Right: Authorised Signatory
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#000000');
      doc.text(`for ${displayBizName}`, boxX + colW + 8, curY + 6, { width: colW - 16, align: 'right' });

      doc.moveTo(boxX + boxW - 140, curY + footerBoxH - 16).lineTo(boxX + boxW - 15, curY + footerBoxH - 16).stroke('#000000');
      doc.font('Helvetica').fontSize(7).fillColor('#000000');
      doc.text('Authorised Signatory', boxX + boxW - 140, curY + footerBoxH - 12, { width: 125, align: 'center' });

      curY += footerBoxH;

      // ── 9. BOTTOM LEGAL FOOTER ───────────────────────────────────────────────────
      const botH = 14;
      doc.rect(boxX, curY, boxW, botH).stroke('#000000');
      doc.font('Helvetica').fontSize(6.5).fillColor('#666666');
      doc.text(
        `${invoice.jurisdiction || 'SUBJECT TO AHMEDABAD JURISDICTION'} | This is a Computer Generated Invoice`,
        boxX,
        curY + 4,
        { width: boxW, align: 'center' }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateInvoicePDF };
