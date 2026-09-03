import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Download, Mail, Printer, ArrowLeft, CheckCircle } from 'lucide-react';
import AppLayout from '../layouts/AppLayout';
import api from '../services/api';
import toast from 'react-hot-toast';
import InvoiceTemplate from '../components/InvoiceTemplate';
import { downloadInvoicePDF } from '../utils/downloadPDF';

const InvoiceViewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isNew = searchParams.get('new') === '1';
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [emailing, setEmailing] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    api.get(`/invoices/${id}`)
      .then((r) => setInvoice(r.data.data))
      .catch(() => toast.error('Invoice not found'))
      .finally(() => setLoading(false));
  }, [id]);

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
    } finally {
      setEmailing(false);
    }
  };

  if (loading) {
    return (
      <AppLayout title="Invoice">
        <div className="loading-spinner">
          <div className="spinner" />
        </div>
      </AppLayout>
    );
  }

  if (!invoice) {
    return (
      <AppLayout title="Invoice">
        <div className="empty-state">
          <h3>Invoice not found</h3>
        </div>
      </AppLayout>
    );
  }

  const isWithoutTax = invoice.businessType === 'OM_CARTRIDGE' || invoice.taxMode === 'without_tax';

  return (
    <AppLayout title={`Invoice ${invoice.invoiceNumber}`}>
      {/* Success banner for new invoices */}
      {isNew && (
        <div
          style={{
            background: 'var(--success-bg)',
            border: '1px solid var(--success)',
            borderRadius: 'var(--radius)',
            padding: '14px 20px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <CheckCircle size={20} color="var(--success)" />
          <div>
            <div style={{ fontWeight: 600, color: 'var(--success)' }}>Invoice Generated Successfully!</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Stock has been automatically deducted. Invoice: {invoice.invoiceNumber}
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
            <button className="btn btn-success btn-sm" onClick={downloadPDF} disabled={downloading}>
              <Download size={14} /> {downloading ? 'Downloading...' : 'Download PDF'}
            </button>
            {invoice.customerSnapshot?.email && (
              <button className="btn btn-outline btn-sm" onClick={emailInvoice} disabled={emailing}>
                <Mail size={14} /> {emailing ? '...' : 'Email'}
              </button>
            )}
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/invoices/create')}>
              + New Invoice
            </button>
          </div>
        </div>
      )}

      {/* Actions Bar */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="btn btn-outline btn-sm" onClick={() => navigate('/invoices')}>
          <ArrowLeft size={14} /> Back
        </button>
        <span
          style={{
            padding: '3px 10px',
            borderRadius: '99px',
            fontSize: '11px',
            fontWeight: 800,
            background: isWithoutTax ? '#fef3c7' : '#dbeafe',
            color: isWithoutTax ? '#b45309' : '#1d4ed8',
          }}
        >
          {isWithoutTax ? 'Om Cartridge (Without Tax)' : 'Om Enterprise (Tax Invoice)'}
        </span>
        <div style={{ flex: 1 }} />
        <button className="btn btn-outline" onClick={printInvoice}>
          <Printer size={15} /> Print
        </button>
        <button className="btn btn-primary" onClick={downloadPDF} disabled={downloading}>
          <Download size={15} /> {downloading ? 'Downloading...' : 'Download PDF'}
        </button>
        {invoice.customerSnapshot?.email && (
          <button className="btn btn-outline" onClick={emailInvoice} disabled={emailing}>
            <Mail size={15} /> {emailing ? 'Sending...' : 'Email Invoice'}
          </button>
        )}
      </div>

      {/* CANONICAL MASTER INVOICE TEMPLATE */}
      <InvoiceTemplate invoice={invoice} />
    </AppLayout>
  );
};

export default InvoiceViewPage;
