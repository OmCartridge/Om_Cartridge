const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const { generateInvoiceHTML } = require('../utils/invoiceTemplate');

const INVOICES_DIR = path.join(__dirname, '../invoices');

// Ensure invoices directory exists
if (!fs.existsSync(INVOICES_DIR)) {
  fs.mkdirSync(INVOICES_DIR, { recursive: true });
}

/**
 * Generate PDF from invoice data using Puppeteer
 * Returns the path to the saved PDF file
 */
async function generateInvoicePDF(invoice) {
  const html = generateInvoiceHTML(invoice);

  // Sanitize invoice number for filename
  const safeName = (invoice.invoiceNumber || 'invoice').replace(/[\/\\:*?"<>|]/g, '-');
  const filename = `OM-INV-${safeName}.pdf`;
  const filepath = path.join(INVOICES_DIR, filename);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    await page.pdf({
      path: filepath,
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', bottom: '10mm', left: '8mm', right: '8mm' },
    });

    return { filename, filepath };
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = { generateInvoicePDF };
