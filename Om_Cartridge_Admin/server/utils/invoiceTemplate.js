const fs = require('fs');
const path = require('path');

// Load logo as base64 data URI at module init — works reliably with Puppeteer
let LOGO_DATA_URI = '';
const LOGO_PATHS = [
  path.join(__dirname, '../../client/src/assets/hero.png'),
  path.join(__dirname, '../assets/logo.png'),
];
for (const p of LOGO_PATHS) {
  try {
    if (fs.existsSync(p)) {
      const ext = path.extname(p).slice(1).toLowerCase();
      const mime = ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
      LOGO_DATA_URI = `data:${mime};base64,${fs.readFileSync(p).toString('base64')}`;
      break;
    }
  } catch (_) {}
}

/**
 * Generate professional A4 GST Tax Invoice HTML
 */
function generateInvoiceHTML(invoice) {
  const biz = invoice.businessDetails || {};
  const cust = invoice.customerSnapshot || {};
  const bank = invoice.bankDetails || {};

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const fc = (num) => {
    if (num === undefined || num === null) return '0.00';
    return Number(num).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const hasDiscount = (invoice.items || []).some(i => i.discountAmount && i.discountAmount > 0) || (invoice.totalDiscount && invoice.totalDiscount > 0);

  const isWithTax = !invoice.taxMode || invoice.taxMode === 'with_tax';

  // Build item rows
  const itemRows = (invoice.items || []).map((item, idx) => {
    const discountCell = hasDiscount
      ? `<td class="right">${item.discountAmount > 0 ? `<span class="discount-badge">${item.discountType === 'percent' ? item.discountValue + '%' : ''}</span>₹${fc(item.discountAmount)}` : '-'}</td>`
      : '';
    return `
    <tr>
      <td class="center">${idx + 1}</td>
      <td class="desc-cell">${item.description || ''}</td>
      <td class="center">${item.hsnSac || ''}</td>
      <td class="center">${item.quantity}</td>
      <td class="center">${item.unit || 'PCS'}</td>
      <td class="right">₹${fc(item.rate)}</td>
      ${discountCell}
      <td class="right fw6">₹${fc(item.finalAmount !== undefined ? item.finalAmount : item.amount)}</td>
    </tr>`;
  }).join('');

  // GST summary by rate
  const gstGroups = {};
  (invoice.items || []).forEach((item) => {
    const rate = item.gstRate || 18;
    if (!gstGroups[rate]) gstGroups[rate] = { taxable: 0, cgst: 0, sgst: 0, igst: 0 };
    const taxBase = item.finalAmount !== undefined ? item.finalAmount : item.amount;
    gstGroups[rate].taxable += taxBase || 0;
    gstGroups[rate].cgst += item.cgstAmount || 0;
    gstGroups[rate].sgst += item.sgstAmount || 0;
    gstGroups[rate].igst += item.igstAmount || 0;
  });

  const gstRows = Object.entries(gstGroups).map(([rate, vals]) => `
    <tr>
      <td>${rate}%</td>
      <td class="right">₹${fc(vals.taxable)}</td>
      <td class="center">${invoice.isInterState ? '-' : rate / 2 + '%'}</td>
      <td class="right">${invoice.isInterState ? '-' : '₹' + fc(vals.cgst)}</td>
      <td class="center">${invoice.isInterState ? '-' : rate / 2 + '%'}</td>
      <td class="right">${invoice.isInterState ? '-' : '₹' + fc(vals.sgst)}</td>
      <td class="center">${invoice.isInterState ? rate + '%' : '-'}</td>
      <td class="right">${invoice.isInterState ? '₹' + fc(vals.igst) : '-'}</td>
      <td class="right fw6">₹${fc((vals.cgst || 0) + (vals.sgst || 0) + (vals.igst || 0))}</td>
    </tr>`).join('');

  const logoHtml = LOGO_DATA_URI
    ? `<img src="${LOGO_DATA_URI}" alt="Logo" style="width:52px;height:52px;object-fit:contain;" />`
    : `<div style="width:52px;height:52px;background:#15527A;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:18px;font-weight:900;">OM</div>`;

  const discountTh = hasDiscount ? `<th style="width:10%">Discount</th>` : '';
  const amountWidth = hasDiscount ? '12%' : '13%';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Tax Invoice — ${invoice.invoiceNumber}</title>
<style>
  @page {
    size: A4;
    margin: 12mm 10mm;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 9.5px;
    color: #111;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .invoice-wrap {
    width: 100%;
    border: 1.5px solid #333;
    min-height: 100%;
  }

  /* ===== HEADER ===== */
  .inv-header {
    display: grid;
    grid-template-columns: 1fr 1fr;
    border-bottom: 1.5px solid #333;
  }
  .biz-info {
    padding: 10px 12px;
    border-right: 1px solid #333;
  }
  .biz-logo-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 6px;
  }
  .biz-name {
    font-size: 15px;
    font-weight: 900;
    color: #15527A;
    line-height: 1.1;
  }
  .biz-brand {
    font-size: 11px;
    font-weight: 700;
    color: #c0392b;
    margin-bottom: 2px;
  }
  .biz-addr { font-size: 8.5px; color: #444; line-height: 1.65; }
  .biz-gstin { font-size: 8.5px; font-weight: 700; margin-top: 3px; }

  .inv-meta {
    padding: 10px 12px;
  }
  .inv-title {
    text-align: center;
    font-size: 15px;
    font-weight: 900;
    letter-spacing: 3px;
    color: #15527A;
    border-bottom: 1px solid #ddd;
    padding-bottom: 6px;
    margin-bottom: 8px;
  }
  .meta-table { width: 100%; border-collapse: collapse; font-size: 8.5px; }
  .meta-table td { padding: 2px 4px; vertical-align: top; }
  .meta-table td:first-child { font-weight: 700; white-space: nowrap; width: 45%; color: #555; }
  .meta-val { font-weight: 700; color: #111; font-size: 9.5px; }

  /* ===== CONSIGNEE SECTION ===== */
  .section-bar {
    background: #f0f4f8;
    font-weight: 700;
    font-size: 8.5px;
    padding: 3px 10px;
    border-top: 1px solid #333;
    border-bottom: 1px solid #333;
    color: #15527A;
    letter-spacing: 0.5px;
  }
  .cust-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    border-bottom: 1px solid #333;
  }
  .cust-box {
    padding: 8px 10px;
    font-size: 8.5px;
    line-height: 1.7;
  }
  .cust-box:first-child { border-right: 1px solid #333; }
  .cust-name { font-size: 10.5px; font-weight: 800; color: #111; margin-bottom: 2px; }

  /* ===== ITEMS TABLE ===== */
  .items-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9px;
  }
  .items-table thead tr {
    background: #15527A;
    color: #fff;
  }
  .items-table thead th {
    padding: 5px 4px;
    font-weight: 700;
    font-size: 8.5px;
    border: 1px solid #0e3a57;
    text-align: center;
  }
  .items-table tbody td {
    border: 1px solid #ccc;
    padding: 4px 5px;
    vertical-align: top;
  }
  .items-table tbody tr:nth-child(even) td { background: #f9fbfc; }
  .items-table tfoot td {
    border: 1px solid #aaa;
    padding: 4px 5px;
    font-weight: 700;
    background: #f0f4f8;
  }
  .center { text-align: center; }
  .right { text-align: right; }
  .fw6 { font-weight: 700; }
  .desc-cell { text-align: left; word-break: break-word; max-width: 200px; }
  .discount-badge {
    display: inline-block;
    background: #fee2e2;
    color: #c0392b;
    font-size: 7px;
    padding: 1px 3px;
    border-radius: 3px;
    margin-right: 3px;
    font-weight: 700;
  }

  /* ===== TOTALS ===== */
  .totals-grid {
    display: grid;
    grid-template-columns: 1fr 280px;
    border-top: 1.5px solid #333;
  }
  .totals-left {
    padding: 8px 10px;
    border-right: 1px solid #333;
    font-size: 8.5px;
  }
  .totals-right {
    padding: 8px 10px;
    font-size: 9px;
  }
  .tot-row {
    display: flex;
    justify-content: space-between;
    padding: 2.5px 0;
    border-bottom: 1px solid #f0f0f0;
  }
  .tot-row .lbl { color: #555; }
  .tot-row.discount .lbl { color: #c0392b; }
  .tot-row.discount .val { color: #c0392b; font-weight: 600; }
  .tot-row.grand {
    font-weight: 900;
    font-size: 12px;
    color: #15527A;
    border-top: 2px solid #15527A;
    border-bottom: none;
    padding-top: 5px;
    margin-top: 3px;
  }

  /* ===== GST SUMMARY ===== */
  .gst-section {
    padding: 6px 10px;
    border-top: 1px solid #333;
    border-bottom: 1px solid #333;
  }
  .gst-title { font-weight: 700; font-size: 8.5px; margin-bottom: 4px; color: #15527A; }
  .gst-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 8px;
  }
  .gst-table th {
    background: #e8eff6;
    border: 1px solid #aaa;
    padding: 3px 4px;
    text-align: center;
    font-weight: 700;
    color: #15527A;
  }
  .gst-table td {
    border: 1px solid #ccc;
    padding: 2px 5px;
  }
  .gst-table tfoot td {
    background: #f0f4f8;
    font-weight: 700;
    border: 1px solid #aaa;
  }

  /* ===== FOOTER ===== */
  .footer-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    min-height: 100px;
  }
  .footer-left {
    padding: 8px 10px;
    border-right: 1px solid #333;
    font-size: 8.5px;
    line-height: 1.6;
  }
  .footer-right {
    padding: 8px 10px;
    font-size: 8.5px;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }
  .footer-company { font-weight: 700; font-size: 9.5px; color: #15527A; }
  .sig-line {
    margin-top: auto;
    text-align: center;
    border-top: 1px solid #555;
    padding-top: 4px;
    font-size: 8.5px;
    width: 160px;
  }
  .bottom-bar {
    text-align: center;
    font-size: 8px;
    padding: 5px;
    border-top: 1px solid #333;
    color: #666;
    background: #fafafa;
  }

  /* Print: keep items together, repeat thead */
  thead { display: table-header-group; }
  tfoot { display: table-footer-group; }
  .items-table tbody tr { page-break-inside: avoid; }
  .footer-grid { page-break-inside: avoid; }
  .gst-section { page-break-inside: avoid; }
</style>
</head>
<body>
<div class="invoice-wrap">

  <!-- Header -->
  <div class="inv-header">
    <!-- Business Info -->
    <div class="biz-info">
      <div class="biz-logo-row">
        ${logoHtml}
        <div>
          <div class="biz-name">${biz.name || 'OM ENTERPRISE'}</div>
          <div class="biz-brand">${biz.brandName || 'OM CARTRIDGE'}</div>
        </div>
      </div>
      <div class="biz-addr">${(biz.address || '').replace(/\n/g, '<br/>')}</div>
      <div class="biz-gstin" style="margin-top:4px;">GSTIN/UIN: ${biz.gstin || ''}</div>
      <div class="biz-addr">State: ${biz.state || 'Gujarat'} &nbsp;|&nbsp; Code: ${biz.stateCode || '24'}</div>
      ${biz.phone1 ? `<div class="biz-addr" style="margin-top:2px;">📞 ${biz.phone1}${biz.phone2 ? ' / ' + biz.phone2 : ''}</div>` : ''}
    </div>

    <!-- Invoice Meta -->
    <div class="inv-meta">
      <div class="inv-title">TAX INVOICE</div>
      <table class="meta-table">
        <tr><td>Invoice No.</td><td>: <span class="meta-val">${invoice.invoiceNumber}</span></td></tr>
        <tr><td>Date</td><td>: <span class="meta-val">${formatDate(invoice.invoiceDate)}</span></td></tr>
        ${invoice.paymentTerms ? `<tr><td>Payment Terms</td><td>: ${invoice.paymentTerms}</td></tr>` : ''}
        ${invoice.referenceNumber ? `<tr><td>Reference No.</td><td>: ${invoice.referenceNumber}</td></tr>` : ''}
        ${invoice.buyersOrderNumber ? `<tr><td>Buyer's Order No.</td><td>: ${invoice.buyersOrderNumber}</td></tr>` : ''}
        ${invoice.deliveryNote ? `<tr><td>Delivery Note</td><td>: ${invoice.deliveryNote}</td></tr>` : ''}
        ${invoice.dispatchDetails ? `<tr><td>Dispatch Doc No.</td><td>: ${invoice.dispatchDetails}</td></tr>` : ''}
        ${invoice.destination ? `<tr><td>Destination</td><td>: ${invoice.destination}</td></tr>` : ''}
        ${invoice.termsOfDelivery ? `<tr><td>Terms of Delivery</td><td>: ${invoice.termsOfDelivery}</td></tr>` : ''}
      </table>
    </div>
  </div>

  <!-- Consignee / Buyer -->
  <div class="section-bar">
    CONSIGNEE (SHIP TO) &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; BUYER (BILL TO)
  </div>
  <div class="cust-grid">
    <div class="cust-box">
      <div class="cust-name">${cust.name || ''}</div>
      ${cust.address ? `<div>${(cust.address).replace(/\n/g, '<br/>')}</div>` : ''}
      ${cust.gstin ? `<div><b>GSTIN/UIN:</b> ${cust.gstin}</div>` : ''}
      <div><b>State:</b> ${cust.state || ''}&nbsp; Code: ${cust.stateCode || ''}</div>
      ${cust.phone ? `<div><b>Ph:</b> ${cust.phone}</div>` : ''}
    </div>
    <div class="cust-box">
      <div class="cust-name">${cust.name || ''}</div>
      ${cust.address ? `<div>${(cust.address).replace(/\n/g, '<br/>')}</div>` : ''}
      ${cust.gstin ? `<div><b>GSTIN/UIN:</b> ${cust.gstin}</div>` : ''}
      <div><b>State:</b> ${cust.state || ''}&nbsp; Code: ${cust.stateCode || ''}</div>
      ${cust.phone ? `<div><b>Ph:</b> ${cust.phone}</div>` : ''}
    </div>
  </div>

  <!-- Items Table -->
  <table class="items-table">
    <thead>
      <tr>
        <th style="width:4%">No.</th>
        <th style="width:${hasDiscount ? '28%' : '36%'}">Description of Goods</th>
        <th style="width:9%">HSN/SAC</th>
        <th style="width:7%">Qty</th>
        <th style="width:6%">Unit</th>
        <th style="width:10%">Rate (₹)</th>
        ${discountTh}
        <th style="width:${amountWidth}">Amount (₹)</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
      <tr style="height:32px"><td colspan="${hasDiscount ? 8 : 7}"></td></tr>
    </tbody>
    <tfoot>
      <tr>
        <td colspan="${hasDiscount ? 3 : 3}" class="right">Total</td>
        <td class="center">${(invoice.items || []).reduce((s, i) => s + (i.quantity || 0), 0)}</td>
        <td></td>
        <td></td>
        ${hasDiscount ? `<td class="right" style="color:#c0392b;">-₹${fc(invoice.totalDiscount || 0)}</td>` : ''}
        <td class="right">₹${fc(invoice.taxableValue)}</td>
      </tr>
    </tfoot>
  </table>

  <!-- Totals -->
  <div class="totals-grid">
    <div class="totals-left">
      <div style="font-weight:700;margin-bottom:5px;font-size:9px;color:#15527A;">Amount Chargeable (in words)</div>
      <div style="font-style:italic;font-size:8.5px;line-height:1.5;">${invoice.amountInWords || ''}</div>
      <div style="margin-top:10px;font-size:8px;color:#777;font-style:italic;">E. &amp; O.E. — Errors and Omissions Excepted</div>
      ${!isWithTax ? `<div style="margin-top:10px;display:inline-block;background:#fef3c7;border:1px solid #fde68a;color:#92400e;padding:4px 10px;border-radius:5px;font-size:8.5px;font-weight:700;">⚠ WITHOUT TAX INVOICE — No GST Applied</div>` : ''}
    </div>
    <div class="totals-right">
      ${hasDiscount ? `<div class="tot-row"><span class="lbl">Subtotal (Before Discount)</span><span>₹${fc(invoice.subtotal)}</span></div>
      <div class="tot-row discount"><span class="lbl">(-) Total Discount</span><span class="val">-₹${fc(invoice.totalDiscount || 0)}</span></div>` : ''}
      <div class="tot-row"><span class="lbl">${hasDiscount ? 'Taxable Value' : 'Subtotal'}</span><span>₹${fc(invoice.taxableValue)}</span></div>
      ${isWithTax ? `
      ${!invoice.isInterState ? `
      <div class="tot-row"><span class="lbl">CGST</span><span>₹${fc(invoice.cgst)}</span></div>
      <div class="tot-row"><span class="lbl">SGST</span><span>₹${fc(invoice.sgst)}</span></div>` : `
      <div class="tot-row"><span class="lbl">IGST</span><span>₹${fc(invoice.igst)}</span></div>`}
      <div class="tot-row"><span class="lbl">Total Tax</span><span>₹${fc(invoice.totalTax)}</span></div>` : `
      <div class="tot-row" style="color:#92400e;"><span class="lbl">Tax (Without Tax Mode)</span><span>₹0.00</span></div>`}
      <div class="tot-row"><span class="lbl">Round Off</span><span>${invoice.roundOff < 0 ? '-₹' + fc(Math.abs(invoice.roundOff)) : invoice.roundOff > 0 ? '+₹' + fc(invoice.roundOff) : '₹0.00'}</span></div>
      <div class="tot-row grand"><span>GRAND TOTAL</span><span>₹${fc(invoice.grandTotal)}</span></div>
    </div>
  </div>

  <!-- GST Summary -->
  ${isWithTax ? `
  <div class="gst-section">
    <div class="gst-title">Tax Amount (in words): <span style="font-weight:400;font-style:italic;">${invoice.taxAmountInWords || ''}</span></div>
    <table class="gst-table">
      <thead>
        <tr>
          <th>GST Rate</th>
          <th>Taxable Value</th>
          <th>CGST %</th>
          <th>CGST Amt</th>
          <th>SGST %</th>
          <th>SGST Amt</th>
          <th>IGST %</th>
          <th>IGST Amt</th>
          <th>Total Tax</th>
        </tr>
      </thead>
      <tbody>${gstRows}</tbody>
      <tfoot>
        <tr>
          <td class="fw6">Total</td>
          <td class="right fw6">₹${fc(invoice.taxableValue)}</td>
          <td></td>
          <td class="right fw6">${!invoice.isInterState ? '₹' + fc(invoice.cgst) : '-'}</td>
          <td></td>
          <td class="right fw6">${!invoice.isInterState ? '₹' + fc(invoice.sgst) : '-'}</td>
          <td></td>
          <td class="right fw6">${invoice.isInterState ? '₹' + fc(invoice.igst) : '-'}</td>
          <td class="right fw6">₹${fc(invoice.totalTax)}</td>
        </tr>
      </tfoot>
    </table>
  </div>` : `
  <div class="gst-section" style="background:#fffbeb;">
    <div class="gst-title" style="color:#92400e;">
      ⚠ TAX NOT APPLICABLE — This invoice was generated WITHOUT TAX. Grand Total = ₹${fc(invoice.grandTotal)} (includes no GST).
    </div>
  </div>`}

  <!-- Footer: Declaration + Bank + Signatory -->
  <div class="footer-grid">
    <div class="footer-left">
      <div style="font-weight:700;font-size:9px;color:#15527A;margin-bottom:4px;">Declaration</div>
      <div>${invoice.declaration || ''}</div>
      <div style="margin-top:10px;font-weight:700;font-size:9px;color:#15527A;">Bank Details</div>
      <div>Bank: <b>${bank.bankName || ''}</b></div>
      <div>A/c No.: <b>${bank.accountNo || ''}</b></div>
      <div>Branch &amp; IFSC: ${bank.branch || ''} &amp; <b>${bank.ifsc || ''}</b></div>
    </div>
    <div class="footer-right">
      <div class="footer-company">For ${biz.name || 'OM ENTERPRISE'}</div>
      <div style="flex:1;min-height:60px;"></div>
      <div class="sig-line">Authorised Signatory</div>
    </div>
  </div>

  <div class="bottom-bar">
    ${invoice.jurisdiction || 'SUBJECT TO AHMEDABAD JURISDICTION'} &nbsp;|&nbsp; This is a Computer Generated Invoice
  </div>

</div>
</body>
</html>`;
}

module.exports = { generateInvoiceHTML };
