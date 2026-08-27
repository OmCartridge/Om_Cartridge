import { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, Users, X, Phone, Mail } from 'lucide-react';
import AppLayout from '../layouts/AppLayout';
import api from '../services/api';
import toast from 'react-hot-toast';

const defaultCustomer = { name: '', address: '', gstin: '', state: 'Gujarat', stateCode: '24', phone: '', email: '', contactPerson: '', notes: '' };

const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [form, setForm] = useState(defaultCustomer);
  const [saving, setSaving] = useState(false);

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/customers', { params: { search } });
      setCustomers(res.data.data);
    } catch { toast.error('Failed to load customers'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCustomers(); }, [search]);

  const openAdd = () => { setForm(defaultCustomer); setEditCustomer(null); setShowModal(true); };
  const openEdit = (c) => { setForm({ ...c }); setEditCustomer(c); setShowModal(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Customer name is required'); return; }
    setSaving(true);
    try {
      if (editCustomer) {
        await api.put(`/customers/${editCustomer._id}`, form);
        toast.success('Customer updated successfully');
      } else {
        await api.post('/customers', form);
        toast.success('Customer created successfully');
      }
      setShowModal(false);
      fetchCustomers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save customer');
    } finally { setSaving(false); }
  };

  const handleDelete = async (c) => {
    if (!window.confirm(`Delete "${c.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/customers/${c._id}`);
      toast.success('Customer deleted');
      fetchCustomers();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete'); }
  };

  return (
    <AppLayout title="Customer Management">
      <div className="page-header">
        <div>
          <h1>Customers</h1>
          <p>Manage your customer records</p>
        </div>
        <button className="btn btn-primary" id="add-customer-btn" onClick={openAdd}>
          <Plus size={16} /> Add Customer
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="search-bar">
            <Search size={15} className="search-icon" />
            <input
              id="customer-search"
              className="form-control"
              placeholder="Search by name, GSTIN, phone..."
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
                  <th>GSTIN</th>
                  <th>State</th>
                  <th>Phone</th>
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
                    <td>
                      {c.gstin ? (
                        <code style={{ fontSize: '12px', background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>{c.gstin}</code>
                      ) : <span className="text-muted">-</span>}
                    </td>
                    <td>{c.state || '-'} ({c.stateCode})</td>
                    <td>{c.phone ? <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={12} />{c.phone}</span> : '-'}</td>
                    <td>{c.email ? <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={12} />{c.email}</span> : '-'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn btn-outline btn-sm btn-icon" onClick={() => openEdit(c)}><Edit2 size={14} /></button>
                        <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(c)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

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
                  <input id="cust-name" className="form-control" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="AMBA INFOTECH" />
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <textarea className="form-control" rows={3} value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Full address" />
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">GSTIN/UIN</label>
                    <input className="form-control" value={form.gstin} onChange={e => setForm({...form, gstin: e.target.value.toUpperCase()})} placeholder="24APSPP7299B2ZB" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input className="form-control" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="Mobile number" />
                  </div>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">State</label>
                    <input className="form-control" value={form.state} onChange={e => setForm({...form, state: e.target.value})} placeholder="Gujarat" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">State Code</label>
                    <input className="form-control" value={form.stateCode} onChange={e => setForm({...form, stateCode: e.target.value})} placeholder="24" />
                  </div>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-control" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="customer@example.com" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contact Person</label>
                    <input className="form-control" value={form.contactPerson} onChange={e => setForm({...form, contactPerson: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea className="form-control" rows={2} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
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
    </AppLayout>
  );
};

export default CustomersPage;
