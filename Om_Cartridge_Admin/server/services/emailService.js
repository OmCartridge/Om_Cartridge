const nodemailer = require('nodemailer');

/**
 * Send invoice email with PDF attachment
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
  const grandTotal = Number(invoice.grandTotal || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
  });

  const emailSubject = `Tax Invoice - ${biz.name || 'OM ENTERPRISE'} - ${invoice.invoiceNumber}`;

  const emailBody = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; font-size: 14px; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="border-top: 4px solid #15527A; padding-top: 20px;">
    <h2 style="color: #15527A; margin: 0 0 5px 0;">OM ENTERPRISE</h2>
    <p style="color: #ED3838; margin: 0 0 20px 0; font-size: 12px;">OM CARTRIDGE — Printer &amp; Xerox Cartridge Management</p>
    
    <p>Dear <strong>${cust.name || 'Customer'}</strong>,</p>
    
    <p>Please find attached your tax invoice <strong>${invoice.invoiceNumber}</strong> from <strong>${biz.name || 'OM ENTERPRISE'}</strong>.</p>
    
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
      <strong style="color: #15527A;">OM ENTERPRISE</strong> | OM CARTRIDGE<br>
      10, C-DAC Computer, Bavla Road, Sanand, Ahmedabad, Gujarat<br>
      📞 ${biz.phone1 || '70967 06868'} / ${biz.phone2 || '70967 06363'}
    </p>
  </div>
</body>
</html>`;

  const mailOptions = {
    from: from || user,
    to: cust.email,
    subject: emailSubject,
    html: emailBody,
    attachments: [
      {
        filename: `${invoice.invoiceNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  };

  await transporter.sendMail(mailOptions);
  return true;
}

module.exports = { sendInvoiceEmail };
