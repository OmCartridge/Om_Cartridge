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
      {/* Stats Grid: 2 cols on mobile, 3 on tablet, 6 on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 mb-6">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="bg-white rounded-xl p-3.5 sm:p-4 border border-app-border shadow-sm flex items-start gap-3 transition-shadow hover:shadow-md"
          >
            <div className={`stat-icon ${color}`}>
              <Icon size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xl sm:text-2xl font-bold text-gray-900 leading-none truncate">
                {value}
              </div>
              <div className="text-[11.5px] font-medium text-gray-500 mt-1 truncate">
                {label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content: 1 col on mobile/tablet, 2 col on desktop (lg) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 items-start">
        {/* Recent Invoices Card */}
        <div className="card overflow-hidden">
          <div className="card-header">
            <h2 className="card-title">Recent Invoices</h2>
            <button
              type="button"
              className="btn btn-outline btn-sm text-xs"
              onClick={() => navigate('/invoices')}
            >
              View All
            </button>
          </div>
          <div className="table-wrapper">
            {recentInvoices.length === 0 ? (
              <div className="empty-state py-12">
                <FileText size={36} className="mx-auto mb-2 text-gray-300" />
                <h3 className="text-sm font-semibold text-gray-800">No invoices yet</h3>
                <p className="text-xs text-gray-500">Create your first invoice to see it here</p>
              </div>
            ) : (
              <table className="w-full">
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
                  {recentInvoices.map((inv) => (
                    <tr key={inv._id}>
                      <td>
                        <span className="font-bold text-navy">{inv.invoiceNumber}</span>
                      </td>
                      <td className="max-w-[160px] truncate">
                        {inv.customerSnapshot?.name || inv.customerId?.name || '-'}
                      </td>
                      <td className="whitespace-nowrap">{formatDate(inv.invoiceDate)}</td>
                      <td className="font-bold whitespace-nowrap">₹{formatCurrency(inv.grandTotal)}</td>
                      <td>
                        <StatusBadge status={inv.status} />
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <button
                            type="button"
                            className="btn btn-outline btn-sm text-xs py-1 px-2.5"
                            onClick={() => navigate(`/invoices/${inv._id}`)}
                          >
                            View
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm text-xs py-1 px-2.5"
                            onClick={() =>
                              downloadInvoicePDF(inv._id, inv.invoiceNumber).catch(() =>
                                toast.error('PDF download failed')
                              )
                            }
                          >
                            PDF
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Low Stock Alerts Card */}
        <div className="card overflow-hidden">
          <div className="card-header">
            <div className="text-amber-600 font-semibold flex items-center gap-2 text-sm sm:text-base">
              <AlertTriangle size={18} />
              <span>Low Stock Alerts</span>
            </div>
            <span className="badge badge-warning text-[11px]">
              {lowStock.length} items &lt; 20
            </span>
          </div>
          {lowStock.length === 0 ? (
            <div className="py-9 px-5 text-center">
              <div className="text-emerald-700 font-semibold text-sm mb-1">
                All inventory levels are healthy.
              </div>
              <p className="text-xs text-gray-500">No products currently have stock below 20.</p>
            </div>
          ) : (
            <div className="max-h-[420px] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-surface-bg border-b border-app-border sticky top-0">
                  <tr>
                    <th className="py-2 px-3 text-left font-semibold text-gray-500">Product</th>
                    <th className="py-2 px-2 text-left font-semibold text-gray-500">SKU</th>
                    <th className="py-2 px-2 text-center font-semibold text-gray-500">Stock</th>
                    <th className="py-2 px-3 text-right font-semibold text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-app-border">
                  {lowStock.map((p) => (
                    <tr key={p._id}>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-gray-900 truncate max-w-[120px]">
                          {p.name}
                        </div>
                      </td>
                      <td className="py-2.5 px-2">
                        <code className="text-[11px] bg-gray-100 px-1.5 py-0.5 rounded font-mono">
                          {p.sku}
                        </code>
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span
                          className={`font-bold ${
                            p.quantity <= 0 ? 'text-app-danger' : 'text-amber-600'
                          }`}
                        >
                          {p.quantity} {p.unit || ''}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10.5px] font-bold ${
                            p.quantity <= 0
                              ? 'bg-red-100 text-app-danger'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
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
