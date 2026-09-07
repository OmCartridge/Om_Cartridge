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
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 sm:p-5 mb-5 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <CheckCircle size={22} className="text-app-success flex-shrink-0" />
            <div>
              <div className="font-bold text-sm sm:text-base text-emerald-900">Invoice Generated Successfully!</div>
              <div className="text-xs sm:text-[13px] text-gray-600 mt-0.5">
                Stock has been automatically deducted. Invoice: {invoice.invoiceNumber}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:ml-auto pt-2 sm:pt-0">
            <button
              type="button"
              className="btn btn-success btn-sm gap-1.5"
              onClick={downloadPDF}
              disabled={downloading}
            >
              <Download size={14} /> {downloading ? 'Downloading...' : 'Download PDF'}
            </button>
            {invoice.customerSnapshot?.email && (
              <button
                type="button"
                className="btn btn-outline btn-sm gap-1.5"
                onClick={emailInvoice}
                disabled={emailing}
              >
                <Mail size={14} /> {emailing ? '...' : 'Email'}
              </button>
            )}
            <button
              type="button"
              className="btn btn-primary btn-sm gap-1.5"
              onClick={() => navigate('/invoices/create')}
            >
              + New Invoice
            </button>
          </div>
        </div>
      )}

      {/* Actions Bar */}
      <div className="flex items-center gap-2.5 mb-5 flex-wrap">
        <button
          type="button"
          className="btn btn-outline btn-sm gap-1.5"
          onClick={() => navigate('/invoices')}
        >
          <ArrowLeft size={14} /> Back
        </button>
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
            isWithoutTax ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
          }`}
        >
          {isWithoutTax ? 'Om Cartridge (Without Tax)' : 'Om Enterprise (Tax Invoice)'}
        </span>
        <div className="flex-1 min-w-[20px]" />
        <button
          type="button"
          className="btn btn-outline btn-sm sm:btn-md gap-1.5"
          onClick={printInvoice}
        >
          <Printer size={15} /> Print
        </button>
        <button
          type="button"
          className="btn btn-primary btn-sm sm:btn-md gap-1.5"
          onClick={downloadPDF}
          disabled={downloading}
        >
          <Download size={15} /> {downloading ? 'Downloading...' : 'Download PDF'}
        </button>
        {invoice.customerSnapshot?.email && (
          <button
            type="button"
            className="btn btn-outline btn-sm sm:btn-md gap-1.5"
            onClick={emailInvoice}
            disabled={emailing}
          >
            <Mail size={15} /> {emailing ? 'Sending...' : 'Email Invoice'}
          </button>
        )}
      </div>

      {/* CANONICAL MASTER INVOICE TEMPLATE (Wrapped in horizontal scroll container for mobile responsiveness) */}
      <div className="w-full overflow-x-auto pb-8">
        <InvoiceTemplate invoice={invoice} />
      </div>
    </AppLayout>
  );
};


export default InvoiceViewPage;
