const nodemailer = require('nodemailer');

/**
 * Send invoice email with PDF attachment.
 * Dynamically supports OM CARTRIDGE vs OM ENTERPRISE.
 */
async function sendInvoiceEmail({ invoice, pdfBuffer, smtpConfig }) {
  const { host, port, user, password, from } = smtpConfig;

  if (!host || !user || !password) {
    throw new Error('SMTP configuration is incomplete');
  }

  const transporter = nodemailer.createTransport({
    host,
    port: parseInt(port) || 587,
    secure: parseInt(port) === 465,
    auth: { user, pass: password },
    tls: { rejectUnauthorized: false },
  });

  const cust = invoice.customerSnapshot || {};
  const biz = invoice.businessDetails || {};
  const isWithoutTax = invoice.businessType === 'OM_CARTRIDGE' || invoice.taxMode === 'without_tax';

  const businessName = isWithoutTax
    ? 'OM CARTRIDGE'
    : (biz.name || 'OM ENTERPRISE');

  const brandSubtitle = isWithoutTax
    ? 'Printer & Xerox Cartridge Management'
    : 'OM CARTRIDGE — Printer & Xerox Cartridge Management';

  const invoiceTypeTitle = isWithoutTax ? 'Invoice' : 'Tax Invoice';

  const grandTotal = Number(invoice.grandTotal || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
  });

  const emailSubject = `${invoiceTypeTitle} - ${businessName} - ${invoice.invoiceNumber}`;

  const emailBody = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; font-size: 14px; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="border-top: 4px solid #15527A; padding-top: 20px;">
    <h2 style="color: #15527A; margin: 0 0 5px 0;">${businessName}</h2>
    <p style="color: #ED3838; margin: 0 0 20px 0; font-size: 12px;">${brandSubtitle}</p>
    
    <p>Dear <strong>${cust.name || 'Customer'}</strong>,</p>
    
    <p>Please find attached your ${invoiceTypeTitle.toLowerCase()} <strong>${invoice.invoiceNumber}</strong> from <strong>${businessName}</strong>.</p>
    
    <div style="background: #f7f9fb; border: 1px solid #ddd; border-radius: 6px; padding: 15px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 5px 0; color: #666; width: 40%;">Invoice Number</td>
          <td style="padding: 5px 0; font-weight: bold;">${invoice.invoiceNumber}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #666;">Invoice Date</td>
          <td style="padding: 5px 0;">${new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #666;">Invoice Amount</td>
          <td style="padding: 5px 0; font-weight: bold; font-size: 16px; color: #15527A;">₹${grandTotal}</td>
        </tr>
      </table>
    </div>
    
    <p>Thank you for your business. Please review the attached invoice and feel free to contact us for any queries.</p>
    
    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
    
    <p style="font-size: 12px; color: #666;">
      <strong style="color: #15527A;">${businessName}</strong><br>
      10, C-DAC Computer, Bavla Road, Sanand, Ahmedabad, Gujarat<br>
      📞 ${biz.phone1 || '70967 06868'} / ${biz.phone2 || '70967 06363'}
    </p>
  </div>
</body>
</html>`;

  const safeName = (invoice.invoiceNumber || 'invoice').replace(/[/\\:*?"<>|]/g, '-');
  const mailOptions = {
    from: from || user,
    to: cust.email,
    subject: emailSubject,
    html: emailBody,
    attachments: [
      {
        filename: `OM-INV-${safeName}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  };

  await transporter.sendMail(mailOptions);
  return true;
}

module.exports = { sendInvoiceEmail };
