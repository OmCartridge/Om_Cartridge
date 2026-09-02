import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, TrendingUp, AlertTriangle, FileText, IndianRupee, Calendar } from 'lucide-react';
import AppLayout from '../layouts/AppLayout';
import api from '../services/api';
import toast from 'react-hot-toast';
import { downloadInvoicePDF } from '../utils/downloadPDF';

const formatCurrency = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '-';

const StatusBadge = ({ status }) => {
  const map = {
    GENERATED: { class: 'badge-navy', label: 'Generated' },
    PAID: { class: 'badge-success', label: 'Paid' },
    CANCELLED: { class: 'badge-danger', label: 'Cancelled' },
    DRAFT: { class: 'badge-gray', label: 'Draft' },
  };
  const info = map[status] || { class: 'badge-gray', label: status };
  return <span className={`badge ${info.class}`}>{info.label}</span>;
};

const DashboardPage = () => {
  const [summary, setSummary] = useState(null);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryRes, invoicesRes, lowStockRes] = await Promise.all([
          api.get('/dashboard/summary'),
          api.get('/dashboard/recent-invoices'),
          api.get('/dashboard/low-stock'),
        ]);
        setSummary(summaryRes.data.data);
        setRecentInvoices(invoicesRes.data.data);
        setLowStock(lowStockRes.data.data);
      } catch {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <AppLayout title="Dashboard">
      <div className="loading-spinner"><div className="spinner" /></div>
    </AppLayout>
  );

  const stats = [
    { label: 'Total Products', value: summary?.totalProducts || 0, icon: Package, color: 'navy' },
    { label: 'Total Stock Qty', value: summary?.totalStockQuantity || 0, icon: TrendingUp, color: 'green' },
    { label: 'Low Stock Items', value: summary?.lowStockCount || 0, icon: AlertTriangle, color: 'orange' },
    { label: 'Total Invoices', value: summary?.totalInvoices || 0, icon: FileText, color: 'navy' },
    { label: "Today's Sales", value: `₹${formatCurrency(summary?.todaysSales)}`, icon: IndianRupee, color: 'green' },
    { label: 'Month Sales', value: `₹${formatCurrency(summary?.monthSales)}`, icon: Calendar, color: 'navy' },
  ];

  return (
    <AppLayout title="Dashboard">
      {/* Stats */}
      <div className="stats-grid">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div className="stat-card" key={label}>
            <div className={`stat-icon ${color}`}><Icon size={22} /></div>
            <div>
              <div className="stat-value">{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Two column */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
        {/* Recent Invoices */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Recent Invoices</div>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/invoices')}>View All</button>
          </div>
          <div className="table-wrapper">
            {recentInvoices.length === 0 ? (
              <div className="empty-state">
                <FileText size={36} />
                <h3>No invoices yet</h3>
                <p>Create your first invoice to see it here</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInvoices.map(inv => (
                    <tr key={inv._id}>
                      <td><span className="fw-bold text-navy">{inv.invoiceNumber}</span></td>
                      <td>{inv.customerSnapshot?.name || inv.customerId?.name || '-'}</td>
                      <td>{formatDate(inv.invoiceDate)}</td>
                      <td className="fw-bold">₹{formatCurrency(inv.grandTotal)}</td>
                      <td><StatusBadge status={inv.status} /></td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button className="btn btn-outline btn-sm" onClick={() => navigate(`/invoices/${inv._id}`)}>View</button>
                          <button className="btn btn-outline btn-sm" onClick={() => downloadInvoicePDF(inv._id, inv.invoiceNumber).catch(() => toast.error('PDF download failed'))}>PDF</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Low Stock */}
        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{ color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle size={18} />
              <span>Low Stock Alerts</span>
            </div>
            <span className="badge badge-warning" style={{ fontSize: '11px' }}>
              {lowStock.length} items &lt; 20
            </span>
          </div>
          {lowStock.length === 0 ? (
            <div className="empty-state" style={{ padding: '36px 20px', textAlign: 'center' }}>
              <div style={{ color: 'var(--success)', fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
                All inventory levels are healthy.
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No products currently have stock below 20.</p>
            </div>
          ) : (
            <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-light)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)' }}>Product</th>
                    <th style={{ padding: '8px 8px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)' }}>SKU</th>
                    <th style={{ padding: '8px 8px', textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)' }}>Stock</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--text-muted)' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.map(p => (
                    <tr key={p._id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px 12px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{p.name}</div>
                      </td>
                      <td style={{ padding: '8px 8px' }}>
                        <code style={{ fontSize: '11px', background: '#f3f4f6', padding: '1px 5px', borderRadius: '4px' }}>{p.sku}</code>
                      </td>
                      <td style={{ padding: '8px 8px', textAlign: 'center' }}>
                        <span style={{ fontWeight: 700, color: p.quantity <= 0 ? 'var(--red)' : '#d97706' }}>
                          {p.quantity} {p.unit || ''}
                        </span>
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          background: p.quantity <= 0 ? '#fee2e2' : '#fef3c7',
                          color: p.quantity <= 0 ? '#dc2626' : '#b45309',
                        }}>
                          {p.quantity <= 0 ? 'Out of Stock' : 'Low Stock'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default DashboardPage;
