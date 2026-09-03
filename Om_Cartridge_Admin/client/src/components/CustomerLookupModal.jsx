import { useState, useEffect, useRef } from 'react';
import { Phone, User, Mail, FileText, MapPin, X, Check, Search, UserPlus, AlertCircle, Loader } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const PHONE_REGEX = /^[0-9]{10}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const validateMobile = (num) => {
  if (!num) return 'Please enter a mobile number';
  const clean = num.replace(/\s/g, '');
  if (/\D/.test(clean)) return 'Mobile number can contain digits only.';
  if (clean.length !== 10) return 'Mobile number must contain exactly 10 digits.';
  if (!PHONE_REGEX.test(clean)) return 'Please enter a valid 10-digit mobile number.';
  return '';
};

/**
 * Customer Name-first lookup and creation modal.
 * 1. Search customer by Name or Mobile
 * 2. Real-time auto-suggestions as user types
 * 3. Quick create customer if not found
 */
const CustomerLookupModal = ({ isOpen, onClose, onCustomerReady, initialName = '' }) => {
  const [activeTab, setActiveTab] = useState('search'); // 'search' | 'create'
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Create form state
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    gstin: '',
    address: '',
    state: 'Gujarat',
    stateCode: '24',
  });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const searchInputRef = useRef(null);
  const debounceTimerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab('search');
      setSearchQuery(initialName || '');
      setSearchResults([]);
      setHasSearched(false);
      setForm({
        name: initialName || '',
        phone: '',
        email: '',
        gstin: '',
        address: '',
        state: 'Gujarat',
        stateCode: '24',
      });
      setFormErrors({});

      setTimeout(() => searchInputRef.current?.focus(), 80);

      // If initialName provided, search immediately
      if (initialName && initialName.trim()) {
        executeSearch(initialName.trim());
      }
    }
  }, [isOpen, initialName]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const executeSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }
    setSearching(true);
    try {
      const res = await api.get('/customers', { params: { search: query.trim() } });
      setSearchResults(res.data.data || []);
      setHasSearched(true);
    } catch {
      toast.error('Error searching customers');
    } finally {
      setSearching(false);
    }
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      executeSearch(val);
    }, 250);
  };

  const handleSelectCustomer = (customer) => {
    onCustomerReady(customer);
    onClose();
  };

  const handleSwitchToCreate = () => {
    setForm((f) => ({ ...f, name: searchQuery.trim() }));
    setActiveTab('create');
  };

  const validateCreateForm = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Customer name is required';
    if (!form.phone.trim()) {
      errs.phone = 'Mobile number is required';
    } else {
      const phoneErr = validateMobile(form.phone);
      if (phoneErr) errs.phone = phoneErr;
    }
    if (form.email && !EMAIL_REGEX.test(form.email.trim())) errs.email = 'Invalid email format';
    if (form.gstin && !GSTIN_REGEX.test(form.gstin.trim().toUpperCase())) {
      errs.gstin = 'Invalid GSTIN (e.g. 24ACWPZ3281G1ZX)';
    }
    return errs;
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    const errs = validateCreateForm();
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }
    setFormErrors({});
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.replace(/\s/g, ''),
        email: form.email.trim() || '',
        gstin: form.gstin.trim().toUpperCase() || '',
        address: form.address.trim() || '',
        state: form.state || 'Gujarat',
        stateCode: form.stateCode || '24',
      };
      const res = await api.post('/customers', payload);
      toast.success(`Customer "${res.data.data.name}" created`);
      onCustomerReady(res.data.data);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create customer';
      if (err.response?.status === 409 && err.response?.data?.data) {
        toast.error('A customer with this mobile number already exists.');
        onCustomerReady(err.response.data.data);
        onClose();
      } else {
        toast.error(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9000,
        padding: '20px',
        backdropFilter: 'blur(2px)',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '520px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #15527A, #1a6fa6)',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#fff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <User size={20} />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
              {activeTab === 'search' ? 'Select Customer' : 'Create New Customer'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              borderRadius: '50%',
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', background: '#f8fafc' }}>
          <button
            type="button"
            onClick={() => setActiveTab('search')}
            style={{
              flex: 1,
              padding: '12px',
              background: activeTab === 'search' ? '#fff' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'search' ? '2.5px solid #15527A' : 'none',
              fontWeight: activeTab === 'search' ? 700 : 500,
              color: activeTab === 'search' ? '#15527A' : '#64748b',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Search size={14} /> Search Existing
          </button>
          <button
            type="button"
            onClick={handleSwitchToCreate}
            style={{
              flex: 1,
              padding: '12px',
              background: activeTab === 'create' ? '#fff' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'create' ? '2.5px solid #15527A' : 'none',
              fontWeight: activeTab === 'create' ? 700 : 500,
              color: activeTab === 'create' ? '#15527A' : '#64748b',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <UserPlus size={14} /> + Add New Customer
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {activeTab === 'search' ? (
            <div>
              {/* Search Bar */}
              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <Search
                  size={16}
                  color="#9ca3af"
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  className="form-control"
                  placeholder="Type customer name or mobile number..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  style={{ paddingLeft: '38px', height: '42px', fontSize: '13.5px' }}
                />
                {searching && (
                  <Loader
                    size={16}
                    className="spin"
                    color="#15527A"
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}
                  />
                )}
              </div>

              {/* Results List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '180px' }}>
                {searchResults.length > 0 ? (
                  searchResults.map((cust) => (
                    <div
                      key={cust._id}
                      onClick={() => handleSelectCustomer(cust)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        background: '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#15527A';
                        e.currentTarget.style.background = '#f0f9ff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#e2e8f0';
                        e.currentTarget.style.background = '#fff';
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>
                          {cust.name}
                        </div>
                        <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#64748b', marginTop: '3px' }}>
                          {cust.phone && <span>📞 {cust.phone}</span>}
                          {cust.gstin && <span>GST: {cust.gstin}</span>}
                        </div>
                        {cust.address && (
                          <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '380px' }}>
                            📍 {cust.address.replace(/\n/g, ', ')}
                          </div>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#15527A',
                          background: '#e0f2fe',
                          padding: '4px 10px',
                          borderRadius: '6px',
                        }}
                      >
                        Select
                      </span>
                    </div>
                  ))
                ) : hasSearched && !searching ? (
                  <div style={{ textAlign: 'center', padding: '32px 16px', color: '#64748b' }}>
                    <AlertCircle size={32} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
                    <div style={{ fontWeight: 600, color: '#334155' }}>No customer found matching "{searchQuery}"</div>
                    <div style={{ fontSize: '12px', marginTop: '4px', marginBottom: '16px' }}>
                      Would you like to create a new customer record?
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleSwitchToCreate}
                      style={{ margin: '0 auto', fontSize: '12px', padding: '8px 16px' }}
                    >
                      <UserPlus size={14} /> Create "{searchQuery}"
                    </button>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 16px', color: '#94a3b8', fontSize: '13px' }}>
                    Start typing a customer name or mobile number to search
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Create Customer Form */
            <form onSubmit={handleCreateCustomer}>
              <div className="form-group mb-12">
                <label className="form-label">
                  Customer Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className={`form-control ${formErrors.name ? 'is-invalid' : ''}`}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Enter full customer / company name"
                  autoFocus
                />
                {formErrors.name && <div style={{ color: '#ef4444', fontSize: '11.5px', marginTop: '3px' }}>{formErrors.name}</div>}
              </div>

              <div className="form-group mb-12">
                <label className="form-label">
                  Mobile Number (10 Digits) <span className="required">*</span>
                </label>
                <input
                  type="text"
                  maxLength={10}
                  className={`form-control ${formErrors.phone ? 'is-invalid' : ''}`}
                  value={form.phone}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setForm({ ...form, phone: digits });
                  }}
                  placeholder="10-digit mobile number"
                />
                {formErrors.phone && <div style={{ color: '#ef4444', fontSize: '11.5px', marginTop: '3px' }}>{formErrors.phone}</div>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }} className="mb-12">
                <div className="form-group">
                  <label className="form-label">Email (Optional)</label>
                  <input
                    type="email"
                    className="form-control"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="customer@example.com"
                  />
                  {formErrors.email && <div style={{ color: '#ef4444', fontSize: '11.5px', marginTop: '3px' }}>{formErrors.email}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label">GSTIN (Optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.gstin}
                    onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
                    placeholder="24ACWPZ3281G1ZX"
                    maxLength={15}
                  />
                  {formErrors.gstin && <div style={{ color: '#ef4444', fontSize: '11.5px', marginTop: '3px' }}>{formErrors.gstin}</div>}
                </div>
              </div>

              <div className="form-group mb-12">
                <label className="form-label">Address</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Street, City, State..."
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                  onClick={() => setActiveTab('search')}
                >
                  Back to Search
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save & Select'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerLookupModal;
