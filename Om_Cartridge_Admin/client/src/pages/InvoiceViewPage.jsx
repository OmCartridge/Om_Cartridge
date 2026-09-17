import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Download, Mail, Printer, ArrowLeft, CheckCircle, ZoomIn, ZoomOut } from 'lucide-react';
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

  // Responsive scaling for mobile viewports
  const containerRef = useRef(null);
  const templateRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [isZoomed, setIsZoomed] = useState(false);
  const [docHeight, setDocHeight] = useState(0);
  const [isMobileScreen, setIsMobileScreen] = useState(false);

  useEffect(() => {
    const updateDimensions = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.clientWidth;
      const isMobile = containerWidth < 830;
      setIsMobileScreen(isMobile);

      if (templateRef.current) {
        setDocHeight(templateRef.current.offsetHeight);
      }

      if (isMobile && !isZoomed) {
        // Fits comfortably within container with padding
        const calculatedScale = Math.min(1, Math.max(0.25, (containerWidth - 12) / 820));
        setScale(calculatedScale);
      } else {
        setScale(1);
      }
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    if (templateRef.current) {
      resizeObserver.observe(templateRef.current);
    }

    window.addEventListener('resize', updateDimensions);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, [invoice, isZoomed]);

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

        {/* Zoom / Fit to Screen control for mobile */}
        {isMobileScreen && (
          <button
            type="button"
            className="btn btn-outline btn-sm gap-1.5 text-xs print:hidden"
            onClick={() => setIsZoomed(!isZoomed)}
            title={isZoomed ? 'Fit invoice to screen' : 'View full size with horizontal scroll'}
          >
            {isZoomed ? (
              <>
                <ZoomOut size={14} className="text-navy" /> Fit Screen
              </>
            ) : (
              <>
                <ZoomIn size={14} className="text-navy" /> Full Size
              </>
            )}
          </button>
        )}

        <div className="flex-1 min-w-[10px]" />
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

      {/* CANONICAL MASTER INVOICE: Automatically scales to fit mobile screens without overflow */}
      <div
        ref={containerRef}
        className="w-full pb-8 flex flex-col items-center overflow-x-auto"
      >
        <div
          className="invoice-scale-wrapper"
          style={{
            width: scale < 1 ? `${Math.round(820 * scale)}px` : '100%',
            maxWidth: '820px',
            height: scale < 1 && docHeight ? `${Math.round(docHeight * scale)}px` : 'auto',
            overflow: scale < 1 ? 'hidden' : 'visible',
            position: 'relative',
            margin: '0 auto',
          }}
        >
          <div
            ref={templateRef}
            className="invoice-scale-inner"
            style={{
              width: '820px',
              transform: scale < 1 ? `scale(${scale})` : 'none',
              transformOrigin: 'top left',
            }}
          >
            <InvoiceTemplate invoice={invoice} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default InvoiceViewPage;
