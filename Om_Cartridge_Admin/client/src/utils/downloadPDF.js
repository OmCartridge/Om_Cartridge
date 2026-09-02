/**
 * Download a PDF invoice using fetch
 * Uses the public PDF endpoint /api/invoices/:id/pdf
 */
export const downloadInvoicePDF = async (invoiceId, invoiceNumber) => {
  const url = `/api/invoices/${invoiceId}/pdf`;

  const response = await fetch(url);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'PDF download failed');
  }

  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);

  // Create a hidden <a> and click it to trigger download
  const a = document.createElement('a');
  a.href = blobUrl;
  const safeName = (invoiceNumber || 'invoice').replace(/[\/\\:*?"<>|]/g, '-');
  a.download = `OM-INV-${safeName}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // Clean up the object URL after a short delay
  setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
};
