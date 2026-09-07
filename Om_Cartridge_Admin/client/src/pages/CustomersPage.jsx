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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Customers</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Manage your customer directory and GST details</p>
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
            id="add-customer-btn"
            onClick={openAdd}
          >
            <Plus size={16} /> Add Customer
          </button>
        </div>
      </div>

      {/* Main Customers Table Card */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-app-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              id="customer-search"
              className="form-control pl-9 py-2 text-xs sm:text-sm"
              placeholder="Search by name, mobile, GSTIN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <span className="text-xs text-gray-500 font-medium">{customers.length} customers</span>
        </div>

        <div className="table-wrapper w-full">
          {loading ? (
            <div className="loading-spinner py-16"><div className="spinner" /></div>
          ) : customers.length === 0 ? (
            <div className="empty-state py-16">
              <Users size={40} className="mx-auto mb-2 text-gray-300" />
              <h3 className="text-sm font-semibold text-gray-800">No customers found</h3>
              <p className="text-xs text-gray-500">Add your first customer or import a CSV to get started</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Mobile</th>
                  <th>GSTIN</th>
                  <th>State</th>
                  <th>Email</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <div className="font-semibold text-gray-900">{c.name}</div>
                      {c.address && (
                        <div className="text-[11.5px] text-gray-500 mt-0.5 truncate max-w-xs">
                          {c.address.split('\n')[0]}
                        </div>
                      )}
                    </td>
                    <td>
                      {c.phone ? (
                        <span className="inline-flex items-center gap-1.5 text-gray-700">
                          <Phone size={12} className="text-gray-400" />
                          {c.phone}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td>
                      {c.gstin ? (
                        <code className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono text-gray-700">
                          {c.gstin}
                        </code>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="text-gray-600">
                      {c.state || '-'} ({c.stateCode})
                    </td>
                    <td>
                      {c.email ? (
                        <span className="inline-flex items-center gap-1.5 text-gray-700">
                          <Mail size={12} className="text-gray-400" />
                          {c.email}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          className="btn btn-outline btn-sm btn-icon"
                          title="Edit"
                          onClick={() => openEdit(c)}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm btn-icon"
                          title="Delete"
                          onClick={() => setConfirmDelete(c)}
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

      {/* Add/Edit Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col animate-[modal-pop_0.18s_ease-out]">
            <div className="p-4 sm:px-6 border-b border-app-border flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-base font-bold text-gray-900">
                {editCustomer ? 'Edit Customer' : 'Add Customer'}
              </h3>
              <button
                type="button"
                className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
                onClick={() => setShowModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-4">
              <div className="form-group mb-0">
                <label className="form-label" htmlFor="cust-name">
                  Customer Name <span className="required">*</span>
                </label>
                <input
                  id="cust-name"
                  className={`form-control ${formErrors.name ? 'error' : ''}`}
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  placeholder="Enter customer name"
                />
                {formErrors.name && <div className="form-error">{formErrors.name}</div>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-group mb-0">
                  <label className="form-label">Mobile Number</label>
                  <input
                    className={`form-control ${formErrors.phone ? 'error' : ''}`}
                    value={form.phone}
                    onChange={(e) =>
                      setField('phone', e.target.value.replace(/\D/g, '').slice(0, 10))
                    }
                    placeholder="9876543210"
                    maxLength={10}
                  />
                  {formErrors.phone && <div className="form-error">{formErrors.phone}</div>}
                </div>
                <div className="form-group mb-0">
                  <label className="form-label">
                    Email <span className="text-xs text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="email"
                    className={`form-control ${formErrors.email ? 'error' : ''}`}
                    value={form.email}
                    onChange={(e) => setField('email', e.target.value)}
                    placeholder="customer@example.com"
                  />
                  {formErrors.email && <div className="form-error">{formErrors.email}</div>}
                </div>
              </div>

              <div className="form-group mb-0">
                <label className="form-label">Address</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={form.address}
                  onChange={(e) => setField('address', e.target.value)}
                  placeholder="Example Address, City"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-group mb-0">
                  <label className="form-label">
                    GSTIN/UIN <span className="text-xs text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    className={`form-control ${formErrors.gstin ? 'error' : ''}`}
                    value={form.gstin}
                    onChange={(e) => setField('gstin', e.target.value.toUpperCase())}
                    placeholder="22AAAAA0000A1Z5"
                  />
                  {formErrors.gstin && <div className="form-error">{formErrors.gstin}</div>}
                </div>
                <div className="form-group mb-0">
                  <label className="form-label">Contact Person</label>
                  <input
                    className="form-control"
                    value={form.contactPerson}
                    onChange={(e) => setField('contactPerson', e.target.value)}
                    placeholder="Contact name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-group mb-0">
                  <label className="form-label">State</label>
                  <input
                    className="form-control"
                    value={form.state}
                    onChange={(e) => setField('state', e.target.value)}
                    placeholder="Gujarat"
                  />
                </div>
                <div className="form-group mb-0">
                  <label className="form-label">State Code</label>
                  <input
                    className="form-control"
                    value={form.stateCode}
                    onChange={(e) => setField('stateCode', e.target.value)}
                    placeholder="24"
                  />
                </div>
              </div>

              <div className="form-group mb-0">
                <label className="form-label">Notes</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setField('notes', e.target.value)}
                  placeholder="Any additional notes"
                />
              </div>

              <div className="flex gap-2.5 justify-end pt-4 border-t border-app-border">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : editCustomer ? 'Update Customer' : 'Add Customer'}
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
