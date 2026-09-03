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
  return <span className={`badge ${cls}`} style={{ fontSize: '10.5px' }}>{label}</span>;
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
      <div className="page-header">
        <div>
          <h1>Invoices</h1>
          <p>View and manage all invoices</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/invoices/create')}>
          + Create Invoice
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="filters-row" style={{ margin: 0 }}>
            <div className="search-bar">
              <Search size={15} className="search-icon" />
              <input
                id="invoice-search"
                className="form-control"
                placeholder="Search invoice no., customer..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select className="form-control" style={{ width: '160px' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="GENERATED">Generated</option>
              <option value="PAID">Paid</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <span className="text-muted" style={{ fontSize: '13px' }}>{invoices.length} invoices</span>
        </div>

        <div className="table-wrapper">
          {loading ? (
            <div className="loading-spinner"><div className="spinner" /></div>
          ) : invoices.length === 0 ? (
            <div className="empty-state">
              <FileText size={40} />
              <h3>No invoices found</h3>
              <p>Create your first invoice to get started</p>
            </div>
          ) : (
            <table>
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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => {
                  const isWithoutTax = inv.businessType === 'OM_CARTRIDGE' || inv.taxMode === 'without_tax';
                  return (
                    <tr key={inv._id}>
                      <td><span className="fw-bold text-navy">{inv.invoiceNumber}</span></td>
                      <td>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: isWithoutTax ? '#fef3c7' : '#dbeafe',
                          color: isWithoutTax ? '#b45309' : '#1d4ed8',
                          whiteSpace: 'nowrap',
                        }}>
                          {isWithoutTax ? 'Om Cartridge' : 'Om Enterprise'}
                        </span>
                      </td>
                      <td>{formatDate(inv.invoiceDate)}</td>
                      <td>{inv.customerSnapshot?.name || inv.customerId?.name || '-'}</td>
                      <td>₹{fmt(inv.taxableValue)}</td>
                      <td>₹{fmt(inv.totalTax)}</td>
                      <td className="fw-bold">₹{fmt(inv.grandTotal)}</td>
                      <td><StatusBadge status={inv.status} /></td>
                      <td><EmailBadge status={inv.emailStatus} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        <button className="btn btn-outline btn-sm" onClick={() => navigate(`/invoices/${inv._id}`)}>View</button>
                        <button className="btn btn-outline btn-sm btn-icon" title="Download PDF" onClick={() => handleDownload(inv)}><Download size={13} /></button>
                        {inv.customerSnapshot?.email && (
                          <button className="btn btn-outline btn-sm btn-icon" title="Email Invoice" disabled={emailingId === inv._id} onClick={() => handleEmail(inv)}><Mail size={13} /></button>
                        )}
                        {inv.status !== 'CANCELLED' && (
                          <button className="btn btn-danger btn-sm" disabled={cancellingId === inv._id} onClick={() => handleCancel(inv)}>
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
