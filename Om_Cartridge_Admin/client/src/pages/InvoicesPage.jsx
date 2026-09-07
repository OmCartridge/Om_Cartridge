import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Download, Mail, X } from 'lucide-react';
import AppLayout from '../layouts/AppLayout';
import api from '../services/api';
import toast from 'react-hot-toast';
import { downloadInvoicePDF } from '../utils/downloadPDF';

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '-';
const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

const StatusBadge = ({ status }) => {
  const map = { GENERATED: ['badge-navy', 'Generated'], PAID: ['badge-success', 'Paid'], CANCELLED: ['badge-danger', 'Cancelled'], DRAFT: ['badge-gray', 'Draft'] };
  const [cls, label] = map[status] || ['badge-gray', status];
  return <span className={`badge ${cls}`}>{label}</span>;
};

const EmailBadge = ({ status }) => {
  const map = { SENT: ['badge-success', 'Emailed'], FAILED: ['badge-danger', 'Failed'], NOT_SENT: ['badge-gray', 'Not Sent'] };
  const [cls, label] = map[status] || ['badge-gray', status];
  return <span className={`badge ${cls} text-[10.5px]`}>{label}</span>;
};

const InvoicesPage = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const [emailingId, setEmailingId] = useState(null);

  const fetchInvoices = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/invoices', { params });
      setInvoices(res.data.data);
    } catch { toast.error('Failed to load invoices'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchInvoices(); }, [search, statusFilter]);

  const handleCancel = async (inv) => {
    if (!window.confirm(`Cancel invoice ${inv.invoiceNumber}?\n\nThis will restore the deducted stock for all items.`)) return;
    setCancellingId(inv._id);
    try {
      await api.post(`/invoices/${inv._id}/cancel`);
      toast.success('Invoice cancelled and stock restored');
      fetchInvoices();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel invoice');
    } finally { setCancellingId(null); }
  };

  const handleEmail = async (inv) => {
    if (!inv.customerSnapshot?.email) { toast.error('Customer has no email address'); return; }
    setEmailingId(inv._id);
    try {
      await api.post(`/invoices/${inv._id}/email`);
      toast.success('Invoice emailed successfully');
      fetchInvoices();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send email');
    } finally { setEmailingId(null); }
  };

  const handleDownload = async (inv) => {
    try {
      await downloadInvoicePDF(inv._id, inv.invoiceNumber);
    } catch {
      toast.error('PDF download failed');
    }
  };

  return (
    <AppLayout title="Invoice History">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Invoices</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">View, filter, download, and manage customer invoices</p>
        </div>
        <button
          type="button"
          className="btn btn-primary self-start sm:self-auto gap-1.5"
          onClick={() => navigate('/invoices/create')}
        >
          + Create Invoice
        </button>
      </div>

      {/* Invoices List Card */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-app-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                id="invoice-search"
                className="form-control pl-9 py-2 text-xs sm:text-sm"
                placeholder="Search invoice no., customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="form-control py-2 text-xs sm:text-sm sm:w-44"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="GENERATED">Generated</option>
              <option value="PAID">Paid</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <span className="text-xs text-gray-500 font-medium">{invoices.length} invoices</span>
        </div>

        <div className="table-wrapper w-full">
          {loading ? (
            <div className="loading-spinner py-16"><div className="spinner" /></div>
          ) : invoices.length === 0 ? (
            <div className="empty-state py-16">
              <FileText size={40} className="mx-auto mb-2 text-gray-300" />
              <h3 className="text-sm font-semibold text-gray-800">No invoices found</h3>
              <p className="text-xs text-gray-500">Create your first invoice to get started</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <th>Invoice No.</th>
                  <th>Business</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Taxable Amt</th>
                  <th>GST</th>
                  <th>Grand Total</th>
                  <th>Status</th>
                  <th>Email</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const isWithoutTax = inv.businessType === 'OM_CARTRIDGE' || inv.taxMode === 'without_tax';
                  return (
                    <tr key={inv._id}>
                      <td>
                        <span className="font-bold text-navy">{inv.invoiceNumber}</span>
                      </td>
                      <td>
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold whitespace-nowrap ${
                            isWithoutTax
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {isWithoutTax ? 'Om Cartridge' : 'Om Enterprise'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap">{formatDate(inv.invoiceDate)}</td>
                      <td className="max-w-[150px] truncate">{inv.customerSnapshot?.name || inv.customerId?.name || '-'}</td>
                      <td>₹{fmt(inv.taxableValue)}</td>
                      <td>₹{fmt(inv.totalTax)}</td>
                      <td className="font-bold whitespace-nowrap">₹{fmt(inv.grandTotal)}</td>
                      <td><StatusBadge status={inv.status} /></td>
                      <td><EmailBadge status={inv.emailStatus} /></td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                          <button
                            type="button"
                            className="btn btn-outline btn-sm text-xs py-1 px-2"
                            onClick={() => navigate(`/invoices/${inv._id}`)}
                          >
                            View
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm btn-icon"
                            title="Download PDF"
                            onClick={() => handleDownload(inv)}
                          >
                            <Download size={13} />
                          </button>
                          {inv.customerSnapshot?.email && (
                            <button
                              type="button"
                              className="btn btn-outline btn-sm btn-icon"
                              title="Email Invoice"
                              disabled={emailingId === inv._id}
                              onClick={() => handleEmail(inv)}
                            >
                              <Mail size={13} />
                            </button>
                          )}
                          {inv.status !== 'CANCELLED' && (
                            <button
                              type="button"
                              className="btn btn-danger btn-sm text-xs py-1 px-2"
                              disabled={cancellingId === inv._id}
                              onClick={() => handleCancel(inv)}
                            >
                              {cancellingId === inv._id ? '...' : 'Cancel'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default InvoicesPage;
