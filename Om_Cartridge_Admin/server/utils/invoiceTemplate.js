/**
 * Generate professional GST Tax Invoice HTML
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

  const formatCurrency = (num) => {
    if (num === undefined || num === null) return '0.00';
    return Number(num).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const itemRows = (invoice.items || [])
    .map(
      (item, idx) => `
    <tr>
      <td class="center">${idx + 1}</td>
      <td>${item.description || ''}</td>
      <td class="center">${item.hsnSac || ''}</td>
      <td class="center">${item.quantity}</td>
      <td class="center">${item.unit || 'PCS'}</td>
      <td class="right">₹${formatCurrency(item.rate)}</td>
      <td class="right">₹${formatCurrency(item.amount)}</td>
    </tr>`
    )
    .join('');

  // GST summary rows - group by GST rate
  const gstGroups = {};
  (invoice.items || []).forEach((item) => {
    const rate = item.gstRate || 18;
    if (!gstGroups[rate]) gstGroups[rate] = { taxable: 0, cgst: 0, sgst: 0, igst: 0 };
    gstGroups[rate].taxable += item.amount || 0;
    gstGroups[rate].cgst += item.cgstAmount || 0;
    gstGroups[rate].sgst += item.sgstAmount || 0;
    gstGroups[rate].igst += item.igstAmount || 0;
  });

  const gstRows = Object.entries(gstGroups)
    .map(
      ([rate, vals]) => `
    <tr>
      <td>${rate}%</td>
      <td class="right">₹${formatCurrency(vals.taxable)}</td>
      <td class="right">${invoice.isInterState ? '-' : rate / 2 + '%'}</td>
      <td class="right">${invoice.isInterState ? '-' : '₹' + formatCurrency(vals.cgst)}</td>
      <td class="right">${invoice.isInterState ? '-' : rate / 2 + '%'}</td>
      <td class="right">${invoice.isInterState ? '-' : '₹' + formatCurrency(vals.sgst)}</td>
      <td class="right">${invoice.isInterState ? rate + '%' : '-'}</td>
      <td class="right">${invoice.isInterState ? '₹' + formatCurrency(vals.igst) : '-'}</td>
      <td class="right">₹${formatCurrency((vals.cgst || 0) + (vals.sgst || 0) + (vals.igst || 0))}</td>
    </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Tax Invoice - ${invoice.invoiceNumber}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 10px;
    color: #000;
    background: #fff;
  }
  .invoice-wrapper {
    width: 794px;
    margin: 0 auto;
    padding: 15px;
    border: 2px solid #000;
  }
  .invoice-title {
    text-align: center;
    font-size: 16px;
    font-weight: bold;
    letter-spacing: 3px;
    border-bottom: 1px solid #000;
    padding-bottom: 6px;
    margin-bottom: 8px;
  }
  .header-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    border-bottom: 1px solid #000;
    margin-bottom: 0;
  }
  .header-left {
    padding: 6px;
    border-right: 1px solid #000;
  }
  .header-right {
    padding: 6px;
  }
  .company-name {
    font-size: 16px;
    font-weight: bold;
    color: #15527A;
    margin-bottom: 2px;
  }
  .brand-name {
    font-size: 12px;
    font-weight: bold;
    color: #ED3838;
    margin-bottom: 4px;
  }
  .address-text {
    font-size: 9px;
    line-height: 1.6;
    color: #333;
  }
  .gstin-text {
    font-size: 9px;
    font-weight: bold;
    margin-top: 4px;
  }
  table.info-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9px;
  }
  table.info-table td {
    padding: 2px 4px;
    vertical-align: top;
  }
  table.info-table td:first-child {
    font-weight: bold;
    white-space: nowrap;
    width: 40%;
  }
  .section-label {
    background: #f0f0f0;
    font-weight: bold;
    font-size: 9px;
    padding: 3px 6px;
    border-top: 1px solid #000;
    border-bottom: 1px solid #000;
  }
  .consignee-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    border-bottom: 1px solid #000;
  }
  .consignee-box {
    padding: 6px;
    font-size: 9px;
    line-height: 1.7;
  }
  .consignee-box.left {
    border-right: 1px solid #000;
  }
  .consignee-box strong {
    display: block;
    font-size: 10px;
    color: #000;
    margin-bottom: 2px;
  }
  table.items-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9px;
  }
  table.items-table th {
    background: #f5f5f5;
    border: 1px solid #555;
    padding: 4px 3px;
    font-weight: bold;
    text-align: center;
  }
  table.items-table td {
    border: 1px solid #aaa;
    padding: 3px;
    vertical-align: top;
  }
  .center { text-align: center; }
  .right { text-align: right; }
  .totals-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    border-top: 1px solid #000;
  }
  .totals-left {
    padding: 6px;
    border-right: 1px solid #000;
    font-size: 9px;
  }
  .totals-right {
    padding: 6px;
    font-size: 9px;
  }
  .totals-row {
    display: flex;
    justify-content: space-between;
    padding: 2px 0;
  }
  .totals-row.grand {
    font-weight: bold;
    font-size: 11px;
    border-top: 1px solid #000;
    padding-top: 4px;
    margin-top: 2px;
  }
  .amount-words-box {
    border-top: 1px solid #000;
    border-bottom: 1px solid #000;
    padding: 5px 6px;
    font-size: 9px;
  }
  .amount-words-box strong {
    font-size: 9px;
  }
  table.gst-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 8.5px;
    margin-top: 4px;
  }
  table.gst-table th {
    background: #f0f0f0;
    border: 1px solid #888;
    padding: 3px;
    text-align: center;
    font-weight: bold;
  }
  table.gst-table td {
    border: 1px solid #aaa;
    padding: 2px 4px;
  }
  .gst-section {
    padding: 4px 6px;
    border-bottom: 1px solid #000;
  }
  .tax-words-box {
    padding: 4px 6px;
    font-size: 9px;
    border-bottom: 1px solid #000;
  }
  .footer-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    min-height: 90px;
  }
  .footer-left {
    padding: 6px;
    border-right: 1px solid #000;
    font-size: 9px;
  }
  .footer-right {
    padding: 6px;
    font-size: 9px;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }
  .signatory-label {
    margin-top: auto;
    text-align: right;
  }
  .invoice-footer {
    text-align: center;
    font-size: 8px;
    padding: 4px;
    border-top: 1px solid #000;
    color: #555;
  }
  .logo-svg { display: inline-block; vertical-align: middle; margin-right: 8px; }
</style>
</head>
<body>
<div class="invoice-wrapper">

  <!-- Title -->
  <div class="invoice-title">TAX INVOICE</div>

  <!-- Header: Business + Invoice Info -->
  <div class="header-grid">
    <div class="header-left">
      <svg width="44" height="44" viewBox="0 0 44 44" class="logo-svg">
        <circle cx="14" cy="22" r="12" fill="#15527A"/>
        <circle cx="14" cy="22" r="6" fill="#fff"/>
        <circle cx="14" cy="22" r="3" fill="#ED3838"/>
        <rect x="28" y="10" width="14" height="24" rx="3" fill="#15527A"/>
        <rect x="30" y="14" width="10" height="3" rx="1" fill="#fff"/>
        <rect x="30" y="20" width="10" height="3" rx="1" fill="#fff"/>
        <rect x="30" y="26" width="10" height="3" rx="1" fill="#fff"/>
      </svg>
      <span class="company-name" style="display:inline-block;vertical-align:middle;">${biz.name || 'OM ENTERPRISE'}</span>
      <div class="brand-name">${biz.brandName || 'OM CARTRIDGE'}</div>
      <div class="address-text">${(biz.address || '').replace(/\n/g, '<br/>')}</div>
      <div class="gstin-text">GSTIN/UIN: ${biz.gstin || ''}</div>
      <div class="address-text">State Name: ${biz.state || 'Gujarat'} &nbsp; Code: ${biz.stateCode || '24'}</div>
      <div class="address-text" style="margin-top:3px;">Ph: ${biz.phone1 || ''} / ${biz.phone2 || ''}</div>
    </div>
    <div class="header-right">
      <table class="info-table">
        <tr><td>Invoice No.</td><td>: <strong>${invoice.invoiceNumber}</strong></td></tr>
        <tr><td>Dated</td><td>: ${formatDate(invoice.invoiceDate)}</td></tr>
        <tr><td>Delivery Note</td><td>: ${invoice.deliveryNote || ''}</td></tr>
        <tr><td>Mode/Terms of Payment</td><td>: ${invoice.paymentTerms || ''}</td></tr>
        <tr><td>Reference No. &amp; Date</td><td>: ${invoice.referenceNumber || ''}</td></tr>
        <tr><td>Buyer's Order No.</td><td>: ${invoice.buyersOrderNumber || ''}</td></tr>
        <tr><td>Dispatch Doc No.</td><td>: ${invoice.dispatchDetails || ''}</td></tr>
        <tr><td>Destination</td><td>: ${invoice.destination || ''}</td></tr>
        <tr><td>Terms of Delivery</td><td>: ${invoice.termsOfDelivery || ''}</td></tr>
      </table>
    </div>
  </div>

  <!-- Consignee / Buyer -->
  <div class="section-label">Consignee (Ship to) &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Buyer (Bill to)</div>
  <div class="consignee-grid">
    <div class="consignee-box left">
      <strong>${cust.name || ''}</strong>
      <div>${(cust.address || '').replace(/\n/g, '<br/>')}</div>
      ${cust.gstin ? `<div>GSTIN/UIN: ${cust.gstin}</div>` : ''}
      <div>State Name: ${cust.state || ''} &nbsp; Code: ${cust.stateCode || ''}</div>
      ${cust.phone ? `<div>Ph: ${cust.phone}</div>` : ''}
    </div>
    <div class="consignee-box">
      <strong>${cust.name || ''}</strong>
      <div>${(cust.address || '').replace(/\n/g, '<br/>')}</div>
      ${cust.gstin ? `<div>GSTIN/UIN: ${cust.gstin}</div>` : ''}
      <div>State Name: ${cust.state || ''} &nbsp; Code: ${cust.stateCode || ''}</div>
      ${cust.phone ? `<div>Ph: ${cust.phone}</div>` : ''}
    </div>
  </div>

  <!-- Items Table -->
  <table class="items-table">
    <thead>
      <tr>
        <th style="width:4%">Sl No.</th>
        <th style="width:36%">Description of Goods</th>
        <th style="width:10%">HSN/SAC</th>
        <th style="width:8%">Quantity</th>
        <th style="width:7%">Unit</th>
        <th style="width:12%">Rate</th>
        <th style="width:13%">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
      <tr style="height:40px"><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
    </tbody>
    <tfoot>
      <tr>
        <td colspan="3" style="font-weight:bold;text-align:right;border-top:1px solid #000;">Total</td>
        <td class="center" style="font-weight:bold;border-top:1px solid #000;">${(invoice.items || []).reduce((s, i) => s + i.quantity, 0)}</td>
        <td style="border-top:1px solid #000;"></td>
        <td style="border-top:1px solid #000;"></td>
        <td class="right" style="font-weight:bold;border-top:1px solid #000;">₹${formatCurrency(invoice.subtotal)}</td>
      </tr>
    </tfoot>
  </table>

  <!-- Totals -->
  <div class="totals-grid">
    <div class="totals-left">
      <div style="font-weight:bold;margin-bottom:4px;">Amount Chargeable (in words)</div>
      <div>${invoice.amountInWords || ''}</div>
      <div style="margin-top:6px;font-size:8px;font-style:italic;">E. &amp; O.E.</div>
    </div>
    <div class="totals-right">
      <div class="totals-row">
        <span>Taxable Value</span>
        <span>₹${formatCurrency(invoice.taxableValue)}</span>
      </div>
      ${!invoice.isInterState ? `
      <div class="totals-row">
        <span>CGST @ 9%</span>
        <span>₹${formatCurrency(invoice.cgst)}</span>
      </div>
      <div class="totals-row">
        <span>SGST @ 9%</span>
        <span>₹${formatCurrency(invoice.sgst)}</span>
      </div>` : `
      <div class="totals-row">
        <span>IGST @ 18%</span>
        <span>₹${formatCurrency(invoice.igst)}</span>
      </div>`}
      <div class="totals-row">
        <span>Less : Round Off</span>
        <span>${invoice.roundOff < 0 ? '-₹' + formatCurrency(Math.abs(invoice.roundOff)) : invoice.roundOff > 0 ? '+₹' + formatCurrency(invoice.roundOff) : '₹0.00'}</span>
      </div>
      <div class="totals-row grand">
        <span>Grand Total</span>
        <span>₹${formatCurrency(invoice.grandTotal)}</span>
      </div>
    </div>
  </div>

  <!-- GST Summary -->
  <div class="gst-section">
    <div style="font-weight:bold;font-size:9px;margin-bottom:3px;">Tax Amount (in words): ${invoice.taxAmountInWords || ''}</div>
    <table class="gst-table">
      <thead>
        <tr>
          <th>HSN/SAC</th>
          <th>Taxable Value</th>
          <th>Central Tax %</th>
          <th>Central Tax Amt</th>
          <th>State Tax %</th>
          <th>State Tax Amt</th>
          <th>IGST %</th>
          <th>IGST Amt</th>
          <th>Total Tax</th>
        </tr>
      </thead>
      <tbody>
        ${gstRows}
      </tbody>
      <tfoot>
        <tr>
          <td style="font-weight:bold">Total</td>
          <td class="right" style="font-weight:bold">₹${formatCurrency(invoice.taxableValue)}</td>
          <td></td>
          <td class="right" style="font-weight:bold">${!invoice.isInterState ? '₹' + formatCurrency(invoice.cgst) : '-'}</td>
          <td></td>
          <td class="right" style="font-weight:bold">${!invoice.isInterState ? '₹' + formatCurrency(invoice.sgst) : '-'}</td>
          <td></td>
          <td class="right" style="font-weight:bold">${invoice.isInterState ? '₹' + formatCurrency(invoice.igst) : '-'}</td>
          <td class="right" style="font-weight:bold">₹${formatCurrency(invoice.totalTax)}</td>
        </tr>
      </tfoot>
    </table>
  </div>

  <!-- Declaration + Bank + Signature -->
  <div class="footer-grid">
    <div class="footer-left">
      <div style="font-weight:bold;margin-bottom:3px;">Declaration</div>
      <div>${invoice.declaration || ''}</div>
      <div style="margin-top:8px;font-weight:bold;">Bank Details:</div>
      <div>Bank: ${bank.bankName || ''}</div>
      <div>A/c No.: ${bank.accountNo || ''}</div>
      <div>Branch &amp; IFSC: ${bank.branch || ''} &amp; ${bank.ifsc || ''}</div>
    </div>
    <div class="footer-right">
      <div style="font-weight:bold;">for ${biz.name || 'OM ENTERPRISE'}</div>
      <div style="height:50px;"></div>
      <div class="signatory-label">
        <div style="border-top:1px solid #000;padding-top:4px;">Authorised Signatory</div>
      </div>
    </div>
  </div>

  <div class="invoice-footer">
    ${invoice.jurisdiction || 'SUBJECT TO AHMEDABAD JURISDICTION'} &nbsp;|&nbsp; This is a Computer Generated Invoice
  </div>

</div>
</body>
</html>`;
}

module.exports = { generateInvoiceHTML };
