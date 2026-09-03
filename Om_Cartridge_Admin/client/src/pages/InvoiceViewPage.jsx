import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Download, Mail, Printer, ArrowLeft, CheckCircle } from 'lucide-react';
import AppLayout from '../layouts/AppLayout';
import api from '../services/api';
import toast from 'react-hot-toast';
import OMLogo from '../components/OMLogo';
import { downloadInvoicePDF } from '../utils/downloadPDF';

const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';

const InvoiceViewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isNew = searchParams.get('new') === '1';
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [emailing, setEmailing] = useState(false);

  useEffect(() => {
    api.get(`/invoices/${id}`)
      .then(r => setInvoice(r.data.data))
      .catch(() => toast.error('Invoice not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const [downloading, setDownloading] = useState(false);

  const downloadPDF = async () => {
    setDownloading(true);
    try {
      await downloadInvoicePDF(invoice._id, invoice.invoiceNumber);
    } catch {
      toast.error('PDF download failed');
    } finally {
      setDownloading(false);
    }
  };
  const printInvoice = () => window.print();

  const emailInvoice = async () => {
    setEmailing(true);
    try {
      await api.post(`/invoices/${id}/email`);
      toast.success('Invoice emailed successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send email');
    } finally { setEmailing(false); }
  };

  if (loading) return <AppLayout title="Invoice"><div className="loading-spinner"><div className="spinner" /></div></AppLayout>;
  if (!invoice) return <AppLayout title="Invoice"><div className="empty-state"><h3>Invoice not found</h3></div></AppLayout>;

  const biz = invoice.businessDetails || {};
  const cust = invoice.customerSnapshot || {};
  const bank = invoice.bankDetails || {};

  const isWithoutTax = invoice.businessType === 'OM_CARTRIDGE' || invoice.taxMode === 'without_tax';
  const displayBizName = isWithoutTax ? 'OM CARTRIDGE' : (biz.name || 'OM ENTERPRISE');
  const displayBrand = isWithoutTax ? 'Printer & Xerox Cartridge Management' : (biz.brandName || 'OM CARTRIDGE');
  const invoiceTitle = isWithoutTax ? 'INVOICE' : 'TAX INVOICE';

  return (
    <AppLayout title={`Invoice ${invoice.invoiceNumber}`}>
      {/* Success banner for new invoices */}
      {isNew && (
        <div style={{ background: 'var(--success-bg)', border: '1px solid var(--success)', borderRadius: 'var(--radius)', padding: '14px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <CheckCircle size={20} color="var(--success)" />
          <div>
            <div style={{ fontWeight: 600, color: 'var(--success)' }}>Invoice Generated Successfully!</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>Stock has been automatically deducted. Invoice: {invoice.invoiceNumber}</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
            <button className="btn btn-success btn-sm" onClick={downloadPDF}><Download size={14} /> Download PDF</button>
            {invoice.customerSnapshot?.email && <button className="btn btn-outline btn-sm" onClick={emailInvoice} disabled={emailing}><Mail size={14} /> {emailing ? '...' : 'Email'}</button>}
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/invoices/create')}>+ New Invoice</button>
          </div>
        </div>
      )}

      {/* Actions Bar */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="btn btn-outline btn-sm" onClick={() => navigate('/invoices')}><ArrowLeft size={14} /> Back</button>
        <span style={{
          padding: '3px 10px',
          borderRadius: '99px',
          fontSize: '11px',
          fontWeight: 800,
          background: isWithoutTax ? '#fef3c7' : '#dbeafe',
          color: isWithoutTax ? '#b45309' : '#1d4ed8',
        }}>
          {isWithoutTax ? 'Om Cartridge (Without Tax)' : 'Om Enterprise (Tax Invoice)'}
        </span>
        <div style={{ flex: 1 }} />
        <button className="btn btn-outline" onClick={printInvoice}><Printer size={15} /> Print</button>
        <button className="btn btn-primary" onClick={downloadPDF}><Download size={15} /> Download PDF</button>
        {invoice.customerSnapshot?.email && (
          <button className="btn btn-outline" onClick={emailInvoice} disabled={emailing}><Mail size={15} /> {emailing ? 'Sending...' : 'Email Invoice'}</button>
        )}
      </div>

      {/* Invoice Preview */}
      <div id="invoice-preview" style={{ background: '#fff', border: '2px solid #222', maxWidth: '820px', margin: '0 auto', fontFamily: 'Arial, sans-serif', fontSize: '11px', color: '#000' }}>

        {/* Title */}
        <div style={{
          textAlign: 'center',
          fontSize: '16px',
          fontWeight: 'bold',
          letterSpacing: '3px',
          borderBottom: '1px solid #000',
          padding: '8px 0',
          background: isWithoutTax ? '#fffbeb' : '#f8fafc',
          color: isWithoutTax ? '#92400e' : '#15527A',
        }}>
          {invoiceTitle}
        </div>

        {/* Header - Business Info + Invoice Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #000' }}>
          <div style={{ padding: '12px 14px', borderRight: '1px solid #000', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ flexShrink: 0, marginTop: '2px' }}>
              <OMLogo variant="compact" />
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#15527A' }}>{displayBizName}</div>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#ED3838', marginBottom: '4px' }}>{displayBrand}</div>
              <div style={{ fontSize: '10px', lineHeight: '1.6', whiteSpace: 'pre-line', color: '#333' }}>{biz.address}</div>
              {!isWithoutTax && biz.gstin && (
                <div style={{ fontSize: '10px', fontWeight: 'bold', marginTop: '4px' }}>GSTIN/UIN: {biz.gstin}</div>
              )}
              <div style={{ fontSize: '10px' }}>State: {biz.state} | Code: {biz.stateCode}</div>
              <div style={{ fontSize: '10px', marginTop: '3px' }}>Ph: {biz.phone1} / {biz.phone2}</div>
            </div>
          </div>
          <div style={{ padding: '10px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
              <tbody>
                {[
                  ['Invoice No.', <strong>{invoice.invoiceNumber}</strong>],
                  ['Dated', formatDate(invoice.invoiceDate)],
                  ['Delivery Note', invoice.deliveryNote || ''],
                  ['Payment Terms', invoice.paymentTerms || ''],
                  ['Reference No.', invoice.referenceNumber || ''],
                  ["Buyer's Order No.", invoice.buyersOrderNumber || ''],
                  ['Dispatch Details', invoice.dispatchDetails || ''],
                  ['Destination', invoice.destination || ''],
                ].map(([label, val]) => (
                  <tr key={label}>
                    <td style={{ padding: '2px 6px', fontWeight: 'bold', whiteSpace: 'nowrap', width: '45%' }}>{label}</td>
                    <td style={{ padding: '2px 6px' }}>: {val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Consignee / Buyer */}
        <div style={{ background: '#f5f5f5', padding: '3px 8px', fontSize: '10px', fontWeight: 'bold', borderBottom: '1px solid #000' }}>
          Consignee (Ship to) &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Buyer (Bill to)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #000' }}>
          {[1, 2].map(n => (
            <div key={n} style={{ padding: '8px 10px', fontSize: '10px', lineHeight: '1.7', borderRight: n === 1 ? '1px solid #000' : 'none' }}>
              <div style={{ fontWeight: 'bold', fontSize: '11px' }}>{cust.name}</div>
              <div style={{ whiteSpace: 'pre-line', color: '#333' }}>{cust.address}</div>
              {cust.gstin && <div>GSTIN/UIN: {cust.gstin}</div>}
              <div>State: {cust.state} | Code: {cust.stateCode}</div>
              {cust.phone && <div>Ph: {cust.phone}</div>}
            </div>
          ))}
        </div>

        {/* Items Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              {['Sl No.', 'Description of Goods', 'HSN/SAC', 'Quantity', 'Unit', 'Rate',
                ...(invoice.totalDiscount > 0 ? ['Discount'] : []),
                'Amount'].map(h => (
                <th key={h} style={{ border: '1px solid #999', padding: '5px 6px', textAlign: h === 'Amount' || h === 'Rate' || h === 'Discount' ? 'right' : h === 'Quantity' || h === 'Unit' || h === 'Sl No.' ? 'center' : 'left', fontWeight: 'bold', fontSize: '10px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, idx) => (
              <tr key={idx}>
                <td style={{ border: '1px solid #ccc', padding: '4px 6px', textAlign: 'center' }}>{idx + 1}</td>
                <td style={{ border: '1px solid #ccc', padding: '4px 6px' }}>{item.description}</td>
                <td style={{ border: '1px solid #ccc', padding: '4px 6px', textAlign: 'center' }}>{item.hsnSac}</td>
                <td style={{ border: '1px solid #ccc', padding: '4px 6px', textAlign: 'center' }}>{item.quantity}</td>
                <td style={{ border: '1px solid #ccc', padding: '4px 6px', textAlign: 'center' }}>{item.unit}</td>
                <td style={{ border: '1px solid #ccc', padding: '4px 6px', textAlign: 'right' }}>₹{fmt(item.rate)}</td>
                {invoice.totalDiscount > 0 && (
                  <td style={{ border: '1px solid #ccc', padding: '4px 6px', textAlign: 'right', color: '#c0392b' }}>
                    {item.discountAmount > 0 ? (
                      <span>
                        {item.discountType === 'percent' ? `${item.discountValue}% ` : ''}-₹{fmt(item.discountAmount)}
                      </span>
                    ) : '-'}
                  </td>
                )}
                <td style={{ border: '1px solid #ccc', padding: '4px 6px', textAlign: 'right' }}>₹{fmt(item.finalAmount !== undefined ? item.finalAmount : item.amount)}</td>
              </tr>
            ))}
            <tr style={{ height: '40px' }}>
              {Array((invoice.totalDiscount > 0 ? 8 : 7)).fill(null).map((_, i) => <td key={i} style={{ border: '1px solid #ccc' }} />)}
            </tr>
            <tr style={{ fontWeight: 'bold', background: '#f9f9f9' }}>
              <td colSpan="3" style={{ border: '1px solid #999', padding: '5px 6px', textAlign: 'right' }}>Total</td>
              <td style={{ border: '1px solid #999', padding: '5px 6px', textAlign: 'center' }}>{invoice.items.reduce((s, i) => s + i.quantity, 0)}</td>
              <td style={{ border: '1px solid #999', padding: '5px 6px' }} />
              <td style={{ border: '1px solid #999', padding: '5px 6px' }} />
              {invoice.totalDiscount > 0 && <td style={{ border: '1px solid #999', padding: '5px 6px', textAlign: 'right', color: '#c0392b' }}>-₹{fmt(invoice.totalDiscount)}</td>}
              <td style={{ border: '1px solid #999', padding: '5px 6px', textAlign: 'right' }}>₹{fmt(invoice.taxableValue)}</td>
            </tr>
          </tbody>
        </table>

        {/* Totals Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '1px solid #000' }}>
          <div style={{ padding: '10px', borderRight: '1px solid #000', fontSize: '10px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Amount Chargeable (in words)</div>
            <div style={{ fontStyle: 'italic' }}>{invoice.amountInWords}</div>
            <div style={{ marginTop: '8px', fontSize: '9px', color: '#555' }}>E. &amp; O.E.</div>
            {invoice.taxMode === 'without_tax' && (
              <div style={{ marginTop: '8px', display: 'inline-block', background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', padding: '3px 8px', borderRadius: '4px', fontSize: '9px', fontWeight: 'bold' }}>
                ⚠ WITHOUT TAX INVOICE
              </div>
            )}
          </div>
          <div style={{ padding: '10px', fontSize: '10px' }}>
            {invoice.totalDiscount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px solid #eee' }}>
                <span>Subtotal (Before Discount)</span><span>₹{fmt(invoice.subtotal)}</span>
              </div>
            )}
            {invoice.totalDiscount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px solid #eee', color: '#c0392b', fontWeight: 600 }}>
                <span>(-) Total Discount</span><span>-₹{fmt(invoice.totalDiscount)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px solid #eee' }}>
              <span>{invoice.totalDiscount > 0 ? 'Taxable Value' : 'Subtotal'}</span>
              <span>₹{fmt(invoice.taxableValue)}</span>
            </div>

            {invoice.taxMode !== 'without_tax' ? (
              <>
                {!invoice.isInterState ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px solid #eee' }}>
                      <span>CGST</span><span>₹{fmt(invoice.cgst)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px solid #eee' }}>
                      <span>SGST</span><span>₹{fmt(invoice.sgst)}</span>
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px solid #eee' }}>
                    <span>IGST</span><span>₹{fmt(invoice.igst)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px solid #eee' }}>
                  <span>Total Tax</span><span>₹{fmt(invoice.totalTax)}</span>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px solid #eee', color: '#92400e' }}>
                <span>Tax (Without Tax Mode)</span><span>₹0.00</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px solid #eee' }}>
              <span>Less: Round Off</span>
              <span>{invoice.roundOff < 0 ? '-' : '+'}₹{fmt(Math.abs(invoice.roundOff))}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontWeight: 'bold', fontSize: '12px', borderTop: '2px solid #000', marginTop: '3px' }}>
              <span>Grand Total</span><span>₹{fmt(invoice.grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* GST Summary */}
        {invoice.taxMode !== 'without_tax' ? (
          <div style={{ padding: '8px', borderTop: '1px solid #000' }}>
            <div style={{ fontWeight: 'bold', fontSize: '10px', marginBottom: '4px' }}>
              Tax Amount (in words): {invoice.taxAmountInWords}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9.5px' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  {['HSN/SAC', 'Taxable Value', 'CGST %', 'CGST Amt', 'SGST %', 'SGST Amt', 'IGST %', 'IGST Amt', 'Total Tax'].map(h => (
                    <th key={h} style={{ border: '1px solid #999', padding: '3px 5px', textAlign: 'center', fontWeight: 'bold' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const map = {};
                  invoice.items.forEach(i => {
                    const key = i.hsnSac || 'OTHER';
                    if (!map[key]) map[key] = { hsn: key, taxable: 0, cgstAmt: 0, sgstAmt: 0, igstAmt: 0, gstRate: i.gstRate || 18 };
                    const finalAmt = i.finalAmount !== undefined ? i.finalAmount : i.amount;
                    map[key].taxable += finalAmt;
                    map[key].cgstAmt += i.cgstAmount || 0;
                    map[key].sgstAmt += i.sgstAmount || 0;
                    map[key].igstAmt += i.igstAmount || 0;
                  });
                  return Object.values(map).map((row, idx) => (
                    <tr key={idx}>
                      <td style={{ border: '1px solid #ccc', padding: '3px 5px', textAlign: 'center' }}>{row.hsn}</td>
                      <td style={{ border: '1px solid #ccc', padding: '3px 5px', textAlign: 'right' }}>₹{fmt(row.taxable)}</td>
                      <td style={{ border: '1px solid #ccc', padding: '3px 5px', textAlign: 'center' }}>{!invoice.isInterState ? `${row.gstRate / 2}%` : '-'}</td>
                      <td style={{ border: '1px solid #ccc', padding: '3px 5px', textAlign: 'right' }}>{!invoice.isInterState ? `₹${fmt(row.cgstAmt)}` : '-'}</td>
                      <td style={{ border: '1px solid #ccc', padding: '3px 5px', textAlign: 'center' }}>{!invoice.isInterState ? `${row.gstRate / 2}%` : '-'}</td>
                      <td style={{ border: '1px solid #ccc', padding: '3px 5px', textAlign: 'right' }}>{!invoice.isInterState ? `₹${fmt(row.sgstAmt)}` : '-'}</td>
                      <td style={{ border: '1px solid #ccc', padding: '3px 5px', textAlign: 'center' }}>{invoice.isInterState ? `${row.gstRate}%` : '-'}</td>
                      <td style={{ border: '1px solid #ccc', padding: '3px 5px', textAlign: 'right' }}>{invoice.isInterState ? `₹${fmt(row.igstAmt)}` : '-'}</td>
                      <td style={{ border: '1px solid #ccc', padding: '3px 5px', textAlign: 'right' }}>₹{fmt(row.cgstAmt + row.sgstAmt + row.igstAmt)}</td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '8px 12px', borderTop: '1px solid #000', background: '#fffbeb', fontSize: '9.5px', color: '#92400e', fontWeight: 'bold' }}>
            ⚠ TAX NOT APPLICABLE — This invoice was generated WITHOUT TAX. Grand Total = ₹{fmt(invoice.grandTotal)} (no GST applied).
          </div>
        )}

        {/* Footer - Declaration + Bank + Signatory */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '1px solid #000', minHeight: '90px' }}>
          <div style={{ padding: '10px', borderRight: '1px solid #000', fontSize: '10px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Declaration</div>
            <div>{invoice.declaration}</div>
            <div style={{ marginTop: '10px', fontWeight: 'bold' }}>Bank Details:</div>
            <div>Bank: {bank.bankName}</div>
            <div>A/c No.: {bank.accountNo}</div>
            <div>Branch &amp; IFSC: {bank.branch} &amp; {bank.ifsc}</div>
          </div>
          <div style={{ padding: '10px', fontSize: '10px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <div style={{ fontWeight: 'bold' }}>for {displayBizName}</div>
            <div style={{ flex: 1 }} />
            <div style={{ borderTop: '1px solid #000', paddingTop: '5px', textAlign: 'center' }}>Authorised Signatory</div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', fontSize: '9px', padding: '5px', borderTop: '1px solid #000', color: '#555' }}>
          {invoice.jurisdiction} &nbsp;|&nbsp; This is a Computer Generated Invoice
        </div>
      </div>
    </AppLayout>
  );
};

export default InvoiceViewPage;
