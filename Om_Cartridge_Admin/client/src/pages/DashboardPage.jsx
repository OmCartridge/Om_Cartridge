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
            <div className="card-title" style={{ color: 'var(--warning)' }}>⚠ Low Stock</div>
          </div>
          {lowStock.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px 20px' }}>
              <h3 style={{ color: 'var(--success)' }}>All stock OK</h3>
              <p>No low stock products</p>
            </div>
          ) : (
            <div style={{ padding: '0' }}>
              {lowStock.map(p => (
                <div key={p._id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)' }}>{p.name}</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{p.sku}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: p.quantity === 0 ? 'var(--red)' : 'var(--warning)', fontSize: '14px' }}>{p.quantity}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Min: {p.minimumStock}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default DashboardPage;
