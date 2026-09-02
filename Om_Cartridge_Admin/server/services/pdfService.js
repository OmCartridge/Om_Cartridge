const htmlPdf = require('html-pdf-node');
const { generateInvoiceHTML } = require('../utils/invoiceTemplate');

/**
 * Generate PDF from invoice data using html-pdf-node.
 * Returns a Buffer — no file is written to disk.
 * This is Vercel-compatible (no Puppeteer / no local Chrome required).
 */
async function generateInvoicePDF(invoice) {
  const html = generateInvoiceHTML(invoice);

  const file = { content: html };

  const options = {
    format: 'A4',
    printBackground: true,
    margin: { top: '10mm', bottom: '10mm', left: '8mm', right: '8mm' },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  };

  const pdfBuffer = await htmlPdf.generatePdf(file, options);
  return pdfBuffer; // Buffer
}

module.exports = { generateInvoicePDF };
