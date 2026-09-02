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
      <div className="page-header">
        <div>
          <h1>Stock Management</h1>
          <p>Manage your product inventory</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-outline" onClick={() => setShowCSV(true)} style={{ gap: '6px' }}>
            <Upload size={15} /> Import CSV
          </button>
          <button className="btn btn-primary" id="add-product-btn" onClick={openAdd}>
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="search-bar">
            <Search size={15} className="search-icon" />
            <input
              id="stock-search"
              className="form-control"
              placeholder="Search products, SKU, HSN..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <span className="text-muted" style={{ fontSize: '13px' }}>{products.length} products</span>
        </div>

        <div className="table-wrapper">
          {loading ? (
            <div className="loading-spinner"><div className="spinner" /></div>
          ) : products.length === 0 ? (
            <div className="empty-state">
              <BarChart3 size={40} />
              <h3>No products found</h3>
              <p>Add your first product to get started</p>
            </div>
          ) : (
            <table>
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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p._id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{p.name}</div>
                      {p.description && <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{p.description}</div>}
                    </td>
                    <td><code style={{ fontSize: '12px', background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>{p.sku}</code></td>
                    <td>{p.hsnSac || '-'}</td>
                    <td>
                      <span style={{ fontWeight: 700, fontSize: '15px', color: p.quantity === 0 ? 'var(--red)' : p.quantity <= p.minimumStock ? 'var(--warning)' : 'var(--success)' }}>
                        {p.quantity}
                      </span>
                    </td>
                    <td>{p.unit}</td>
                    <td>₹{Number(p.sellingRate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td>{p.gstRate}%</td>
                    <td><StockStatusBadge qty={p.quantity} minStock={p.minimumStock} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button className="btn btn-outline btn-sm btn-icon" title="Adjust Stock" onClick={() => openAdjust(p)}><TrendingUp size={14} /></button>
                        <button className="btn btn-outline btn-sm btn-icon" title="Edit" onClick={() => openEdit(p)}><Edit2 size={14} /></button>
                        <button className="btn btn-danger btn-sm btn-icon" title="Delete" onClick={() => setConfirmDelete(p)}><Trash2 size={14} /></button>
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
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <div className="modal-header">
              <div className="modal-title">{editProduct ? 'Edit Product' : 'Add Product'}</div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowProductModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveProduct}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Product Name <span className="required">*</span></label>
                    <input id="prod-name" className="form-control" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Example Product Name" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">SKU / Product Code <span className="required">*</span></label>
                    <input id="prod-sku" className="form-control" value={form.sku} onChange={e => setForm({...form, sku: e.target.value.toUpperCase()})} placeholder="e.g. PROD-001" />
                  </div>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">HSN/SAC Code</label>
                    <input className="form-control" value={form.hsnSac} onChange={e => setForm({...form, hsnSac: e.target.value})} placeholder="84439952" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Unit</label>
                    <select className="form-control" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}>
                      {UNITS.map(u => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <input className="form-control" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Brief product description" />
                </div>
                <div className="form-grid-3">
                  <div className="form-group">
                    <label className="form-label">Quantity</label>
                    <input type="number" className="form-control" min="0" value={form.quantity} onChange={e => setForm({...form, quantity: Number(e.target.value)})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Purchase Rate (₹)</label>
                    <input type="number" className="form-control" min="0" step="0.01" value={form.purchaseRate} onChange={e => setForm({...form, purchaseRate: Number(e.target.value)})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Selling Rate (₹) <span className="required">*</span></label>
                    <input type="number" className="form-control" min="0" step="0.01" value={form.sellingRate} onChange={e => setForm({...form, sellingRate: Number(e.target.value)})} />
                  </div>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">GST Rate</label>
                    <select className="form-control" value={form.gstRate} onChange={e => setForm({...form, gstRate: Number(e.target.value)})}>
                      {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Minimum Stock Alert</label>
                    <input type="number" className="form-control" min="0" value={form.minimumStock} onChange={e => setForm({...form, minimumStock: Number(e.target.value)})} />
                  </div>
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} />
                    <span className="form-label" style={{ margin: 0 }}>Active Product</span>
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowProductModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : editProduct ? 'Update Product' : 'Add Product'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {showAdjustModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Adjust Stock</div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowAdjustModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAdjust}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Adjustment Quantity <span className="required">*</span></label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="e.g. +10 or -5"
                    value={adjustForm.adjustment}
                    onChange={e => setAdjustForm({...adjustForm, adjustment: e.target.value})}
                  />
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Use positive (+10) to add stock, negative (-5) to remove
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Reason <span className="required">*</span></label>
                  <select className="form-control" value={adjustForm.reason} onChange={e => setAdjustForm({...adjustForm, reason: e.target.value})}>
                    {ADJUST_REASONS.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowAdjustModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Adjusting...' : 'Adjust Stock'}</button>
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
