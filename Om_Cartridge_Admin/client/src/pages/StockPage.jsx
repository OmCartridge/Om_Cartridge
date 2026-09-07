import { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, TrendingUp, BarChart3, X, Upload } from 'lucide-react';
import AppLayout from '../layouts/AppLayout';
import api from '../services/api';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';
import CSVImportModal from '../components/CSVImportModal';

const GST_RATES = [0, 5, 12, 18, 28];
const UNITS = ['PCS', 'BOX', 'PACK', 'SET', 'ROLL', 'KG', 'LTR', 'MTR'];
const ADJUST_REASONS = ['New Purchase', 'Damaged', 'Manual Correction', 'Returned', 'Other'];

const StockStatusBadge = ({ qty, minStock }) => {
  if (qty <= 0) return <span className="badge badge-danger">Out of Stock</span>;
  if (qty <= minStock) return <span className="badge badge-warning">Low Stock</span>;
  return <span className="badge badge-success">In Stock</span>;
};

const defaultProduct = {
  name: '', sku: '', hsnSac: '', description: '', quantity: 0, unit: 'PCS',
  purchaseRate: 0, sellingRate: 0, gstRate: 18, minimumStock: 5, isActive: true,
};

const StockPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState(defaultProduct);
  const [adjustForm, setAdjustForm] = useState({ productId: '', adjustment: '', reason: 'New Purchase' });
  const [saving, setSaving] = useState(false);

  // Confirm delete modal
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // CSV import
  const [showCSV, setShowCSV] = useState(false);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products', { params: { search } });
      setProducts(res.data.data);
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(); }, [search]);

  const openAdd = () => { setForm(defaultProduct); setEditProduct(null); setShowProductModal(true); };
  const openEdit = (p) => { setForm({ ...p }); setEditProduct(p); setShowProductModal(true); };
  const openAdjust = (p) => { setAdjustForm({ productId: p._id, adjustment: '', reason: 'New Purchase' }); setShowAdjustModal(true); };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Product name is required'); return; }
    if (!form.sku.trim()) { toast.error('SKU is required'); return; }
    setSaving(true);
    try {
      if (editProduct) {
        await api.put(`/products/${editProduct._id}`, form);
        toast.success('Product updated successfully');
      } else {
        await api.post('/products', form);
        toast.success('Product added successfully');
      }
      setShowProductModal(false);
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/products/${confirmDelete._id}`);
      toast.success('Product deleted');
      setConfirmDelete(null);
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete product');
    } finally { setDeleting(false); }
  };

  const handleAdjust = async (e) => {
    e.preventDefault();
    if (!adjustForm.adjustment || adjustForm.adjustment === '0') { toast.error('Enter a valid adjustment quantity'); return; }
    setSaving(true);
    try {
      await api.post('/stock/adjust', {
        productId: adjustForm.productId,
        adjustment: Number(adjustForm.adjustment),
        reason: adjustForm.reason,
      });
      toast.success('Stock adjusted successfully');
      setShowAdjustModal(false);
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Adjustment failed');
    } finally { setSaving(false); }
  };

  return (
    <AppLayout title="Stock Management">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Stock Management</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Manage your product inventory and stock levels</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            className="btn btn-outline btn-sm sm:btn-md gap-1.5"
            onClick={() => setShowCSV(true)}
          >
            <Upload size={15} /> Import CSV
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm sm:btn-md gap-1.5"
            id="add-product-btn"
            onClick={openAdd}
          >
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      {/* Main Stock Table Card */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-app-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              id="stock-search"
              className="form-control pl-9 py-2 text-xs sm:text-sm"
              placeholder="Search products, SKU, HSN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <span className="text-xs text-gray-500 font-medium">{products.length} products</span>
        </div>

        <div className="table-wrapper w-full">
          {loading ? (
            <div className="loading-spinner py-16"><div className="spinner" /></div>
          ) : products.length === 0 ? (
            <div className="empty-state py-16">
              <BarChart3 size={40} className="mx-auto mb-2 text-gray-300" />
              <h3 className="text-sm font-semibold text-gray-800">No products found</h3>
              <p className="text-xs text-gray-500">Add your first product or import a CSV to get started</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>HSN/SAC</th>
                  <th>Quantity</th>
                  <th>Unit</th>
                  <th>Selling Rate</th>
                  <th>GST</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <div className="font-semibold text-gray-900">{p.name}</div>
                      {p.description && <div className="text-[11.5px] text-gray-500 mt-0.5">{p.description}</div>}
                    </td>
                    <td>
                      <code className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono text-gray-700">
                        {p.sku}
                      </code>
                    </td>
                    <td className="text-gray-600">{p.hsnSac || '-'}</td>
                    <td>
                      <span
                        className={`font-bold text-sm ${
                          p.quantity === 0
                            ? 'text-app-danger'
                            : p.quantity <= p.minimumStock
                            ? 'text-app-warning'
                            : 'text-app-success'
                        }`}
                      >
                        {p.quantity}
                      </span>
                    </td>
                    <td className="text-gray-600">{p.unit}</td>
                    <td className="font-semibold text-gray-900">
                      ₹{Number(p.sellingRate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="text-gray-600">{p.gstRate}%</td>
                    <td><StockStatusBadge qty={p.quantity} minStock={p.minimumStock} /></td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          className="btn btn-outline btn-sm btn-icon"
                          title="Adjust Stock"
                          onClick={() => openAdjust(p)}
                        >
                          <TrendingUp size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm btn-icon"
                          title="Edit"
                          onClick={() => openEdit(p)}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm btn-icon"
                          title="Delete"
                          onClick={() => setConfirmDelete(p)}
                        >
                          <Trash2 size={14} />
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

      {/* Product Add/Edit Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col animate-[modal-pop_0.18s_ease-out]">
            <div className="p-4 sm:px-6 border-b border-app-border flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-base font-bold text-gray-900">
                {editProduct ? 'Edit Product' : 'Add Product'}
              </h3>
              <button
                type="button"
                className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
                onClick={() => setShowProductModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-group mb-0">
                  <label className="form-label" htmlFor="prod-name">
                    Product Name <span className="required">*</span>
                  </label>
                  <input
                    id="prod-name"
                    className="form-control"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Example Product Name"
                  />
                </div>
                <div className="form-group mb-0">
                  <label className="form-label" htmlFor="prod-sku">
                    SKU / Product Code <span className="required">*</span>
                  </label>
                  <input
                    id="prod-sku"
                    className="form-control"
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })}
                    placeholder="e.g. PROD-001"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-group mb-0">
                  <label className="form-label">HSN/SAC Code</label>
                  <input
                    className="form-control"
                    value={form.hsnSac}
                    onChange={(e) => setForm({ ...form, hsnSac: e.target.value })}
                    placeholder="84439952"
                  />
                </div>
                <div className="form-group mb-0">
                  <label className="form-label">Unit</label>
                  <select
                    className="form-control"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  >
                    {UNITS.map((u) => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group mb-0">
                <label className="form-label">Description</label>
                <input
                  className="form-control"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief product description"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="form-group mb-0">
                  <label className="form-label">Quantity</label>
                  <input
                    type="number"
                    className="form-control"
                    min="0"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group mb-0">
                  <label className="form-label">Purchase Rate (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    min="0"
                    step="0.01"
                    value={form.purchaseRate}
                    onChange={(e) => setForm({ ...form, purchaseRate: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group mb-0">
                  <label className="form-label">
                    Selling Rate (₹) <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    min="0"
                    step="0.01"
                    value={form.sellingRate}
                    onChange={(e) => setForm({ ...form, sellingRate: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-group mb-0">
                  <label className="form-label">GST Rate</label>
                  <select
                    className="form-control"
                    value={form.gstRate}
                    onChange={(e) => setForm({ ...form, gstRate: Number(e.target.value) })}
                  >
                    {GST_RATES.map((r) => <option key={r} value={r}>{r}%</option>)}
                  </select>
                </div>
                <div className="form-group mb-0">
                  <label className="form-label">Minimum Stock Alert</label>
                  <input
                    type="number"
                    className="form-control"
                    min="0"
                    value={form.minimumStock}
                    onChange={(e) => setForm({ ...form, minimumStock: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="pt-1">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-navy focus:ring-navy h-4 w-4"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  />
                  <span className="text-xs font-semibold text-gray-700">Active Product</span>
                </label>
              </div>

              <div className="flex gap-2.5 justify-end pt-4 border-t border-app-border">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowProductModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : editProduct ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-[modal-pop_0.18s_ease-out]">
            <div className="p-4 sm:px-6 border-b border-app-border flex items-center justify-between bg-white">
              <h3 className="text-base font-bold text-gray-900">Adjust Stock</h3>
              <button
                type="button"
                className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
                onClick={() => setShowAdjustModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAdjust} className="p-4 sm:p-6 space-y-4">
              <div className="form-group mb-0">
                <label className="form-label">
                  Adjustment Quantity <span className="required">*</span>
                </label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. +10 or -5"
                  value={adjustForm.adjustment}
                  onChange={(e) => setAdjustForm({ ...adjustForm, adjustment: e.target.value })}
                />
                <div className="text-xs text-gray-500 mt-1">
                  Use positive (+10) to add stock, negative (-5) to remove
                </div>
              </div>

              <div className="form-group mb-0">
                <label className="form-label">
                  Reason <span className="required">*</span>
                </label>
                <select
                  className="form-control"
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                >
                  {ADJUST_REASONS.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>

              <div className="flex gap-2.5 justify-end pt-4 border-t border-app-border">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowAdjustModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Adjusting...' : 'Adjust Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!confirmDelete}
        variant="danger"
        title="Delete Product?"
        message={confirmDelete ? `Are you sure you want to delete "${confirmDelete.name}" (SKU: ${confirmDelete.sku})? This cannot be undone.` : ''}
        warning="Products used in invoices cannot be deleted without removing the invoices first."
        confirmText="Delete Product"
        cancelText="Cancel"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      {/* CSV Import Modal */}
      <CSVImportModal
        isOpen={showCSV}
        onClose={() => setShowCSV(false)}
        type="products"
        onImportComplete={fetchProducts}
      />
    </AppLayout>
  );
};

export default StockPage;

