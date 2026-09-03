/**
 * Download a PDF invoice using fetch with JWT Authorization header.
 * The /api/invoices/:id/pdf endpoint now requires authentication.
 */
export const downloadInvoicePDF = async (invoiceId, invoiceNumber) => {
  const url = `/api/invoices/${invoiceId}/pdf`;

  // Attach the stored auth token so the protected endpoint accepts the request
  const token = localStorage.getItem('om_token');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, { headers });

  if (response.status === 401) {
    throw new Error('Session expired. Please log in again.');
  }
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'PDF download failed');
  }

  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);

  // Create a hidden <a> and click it to trigger browser download
  const a = document.createElement('a');
  a.href = blobUrl;
  const safeName = (invoiceNumber || 'invoice').replace(/[/\\:*?"<>|]/g, '-');
  a.download = `OM-INV-${safeName}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // Clean up the object URL after a short delay
  setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
};
