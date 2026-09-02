import { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, Users, X, Phone, Mail, Upload } from 'lucide-react';
import AppLayout from '../layouts/AppLayout';
import api from '../services/api';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';
import CSVImportModal from '../components/CSVImportModal';

const PHONE_REGEX = /^[0-9]{10}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const validateMobile = (num) => {
  if (!num) return '';
  if (/\D/.test(num)) return 'Mobile number can contain digits only.';
  if (num.length < 10) return 'Please enter a valid 10-digit mobile number.';
  if (num.length > 10) return 'Mobile number must contain exactly 10 digits.';
  if (!PHONE_REGEX.test(num)) return 'Please enter a valid 10-digit mobile number.';
  return '';
};

const defaultCustomer = {
  name: '', address: '', gstin: '', state: 'Gujarat', stateCode: '24',
  phone: '', email: '', contactPerson: '', notes: '',
};

const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [form, setForm] = useState(defaultCustomer);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Confirm modal for delete
  const [confirmDelete, setConfirmDelete] = useState(null); // customer object
  const [deleting, setDeleting] = useState(false);

  // CSV import modal
  const [showCSV, setShowCSV] = useState(false);

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/customers', { params: { search } });
      setCustomers(res.data.data);
    } catch { toast.error('Failed to load customers'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCustomers(); }, [search]);

  const openAdd = () => { setForm(defaultCustomer); setEditCustomer(null); setFormErrors({}); setShowModal(true); };
  const openEdit = (c) => { setForm({ ...c, phone: c.phone || '' }); setEditCustomer(c); setFormErrors({}); setShowModal(true); };

  const validateForm = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Customer name is required';
    if (form.phone) {
      const clean = form.phone.trim();
      const phoneErr = validateMobile(clean);
      if (phoneErr) errs.phone = phoneErr;
    }
    if (form.email && !EMAIL_REGEX.test(form.email.trim())) errs.email = 'Invalid email format';
    if (form.gstin && !GSTIN_REGEX.test(form.gstin.trim().toUpperCase())) errs.gstin = 'Invalid GSTIN (e.g., 22AAAAA0000A1Z5)';
    return errs;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const errs = validateForm();
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        phone: form.phone ? form.phone.replace(/\s/g, '') : null,
        gstin: form.gstin ? form.gstin.toUpperCase() : '',
      };
      if (editCustomer) {
        await api.put(`/customers/${editCustomer._id}`, payload);
        toast.success('Customer updated successfully');
      } else {
        await api.post('/customers', payload);
        toast.success('Customer created successfully');
      }
      setShowModal(false);
      fetchCustomers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save customer');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/customers/${confirmDelete._id}`);
      toast.success('Customer deleted');
      setConfirmDelete(null);
      fetchCustomers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete customer');
    } finally { setDeleting(false); }
  };

  const setField = (key, val) => { setForm(f => ({ ...f, [key]: val })); setFormErrors(fe => ({ ...fe, [key]: undefined })); };

  return (
    <AppLayout title="Customer Management">
      <div className="page-header">
        <div>
          <h1>Customers</h1>
          <p>Manage your customer records</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-outline" onClick={() => setShowCSV(true)} style={{ gap: '6px' }}>
            <Upload size={15} /> Import CSV
          </button>
          <button className="btn btn-primary" id="add-customer-btn" onClick={openAdd}>
            <Plus size={16} /> Add Customer
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="search-bar">
            <Search size={15} className="search-icon" />
            <input
              id="customer-search"
              className="form-control"
              placeholder="Search by name, mobile, GSTIN..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <span className="text-muted" style={{ fontSize: '13px' }}>{customers.length} customers</span>
        </div>

        <div className="table-wrapper">
          {loading ? (
            <div className="loading-spinner"><div className="spinner" /></div>
          ) : customers.length === 0 ? (
            <div className="empty-state">
              <Users size={40} />
              <h3>No customers found</h3>
              <p>Add your first customer to get started</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Mobile</th>
                  <th>GSTIN</th>
                  <th>State</th>
                  <th>Email</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{c.name}</div>
                      {c.address && <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{c.address.split('\n')[0]}</div>}
                    </td>
                    <td>{c.phone ? <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={12} />{c.phone}</span> : <span className="text-muted">-</span>}</td>
                    <td>
                      {c.gstin ? (
                        <code style={{ fontSize: '12px', background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>{c.gstin}</code>
                      ) : <span className="text-muted">-</span>}
                    </td>
                    <td>{c.state || '-'} ({c.stateCode})</td>
                    <td>{c.email ? <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={12} />{c.email}</span> : <span className="text-muted">-</span>}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn btn-outline btn-sm btn-icon" onClick={() => openEdit(c)}><Edit2 size={14} /></button>
                        <button className="btn btn-danger btn-sm btn-icon" onClick={() => setConfirmDelete(c)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <div className="modal-header">
              <div className="modal-title">{editCustomer ? 'Edit Customer' : 'Add Customer'}</div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Customer Name <span className="required">*</span></label>
                  <input id="cust-name" className={`form-control${formErrors.name ? ' error' : ''}`} value={form.name} onChange={e => setField('name', e.target.value)} placeholder="Enter customer name" />
                  {formErrors.name && <div className="form-error">{formErrors.name}</div>}
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Mobile Number</label>
                    <input className={`form-control${formErrors.phone ? ' error' : ''}`} value={form.phone} onChange={e => setField('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="9876543210" maxLength={10} />
                    {formErrors.phone && <div className="form-error">{formErrors.phone}</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email <span style={{ fontSize: '11px', color: '#9ca3af' }}>(optional)</span></label>
                    <input type="email" className={`form-control${formErrors.email ? ' error' : ''}`} value={form.email} onChange={e => setField('email', e.target.value)} placeholder="customer@example.com" />
                    {formErrors.email && <div className="form-error">{formErrors.email}</div>}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Address</label>
                  <textarea className="form-control" rows={2} value={form.address} onChange={e => setField('address', e.target.value)} placeholder="Example Address, City" />
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">GSTIN/UIN <span style={{ fontSize: '11px', color: '#9ca3af' }}>(optional)</span></label>
                    <input className={`form-control${formErrors.gstin ? ' error' : ''}`} value={form.gstin} onChange={e => setField('gstin', e.target.value.toUpperCase())} placeholder="22AAAAA0000A1Z5" />
                    {formErrors.gstin && <div className="form-error">{formErrors.gstin}</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contact Person</label>
                    <input className="form-control" value={form.contactPerson} onChange={e => setField('contactPerson', e.target.value)} placeholder="Contact name" />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">State</label>
                    <input className="form-control" value={form.state} onChange={e => setField('state', e.target.value)} placeholder="Gujarat" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">State Code</label>
                    <input className="form-control" value={form.stateCode} onChange={e => setField('stateCode', e.target.value)} placeholder="24" />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea className="form-control" rows={2} value={form.notes} onChange={e => setField('notes', e.target.value)} placeholder="Any additional notes" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : editCustomer ? 'Update Customer' : 'Add Customer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!confirmDelete}
        variant="danger"
        title="Delete Customer?"
        message={confirmDelete ? `Are you sure you want to delete "${confirmDelete.name}"? This action cannot be undone.` : ''}
        warning="Customers with existing invoices cannot be deleted."
        confirmText="Delete Customer"
        cancelText="Cancel"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      {/* CSV Import Modal */}
      <CSVImportModal
        isOpen={showCSV}
        onClose={() => setShowCSV(false)}
        type="customers"
        onImportComplete={fetchCustomers}
      />
    </AppLayout>
  );
};

export default CustomersPage;
