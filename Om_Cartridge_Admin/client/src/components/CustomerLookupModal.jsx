import { useState, useEffect, useRef } from 'react';
import { User, X, Search, UserPlus, AlertCircle, Loader } from 'lucide-react';
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
      className="fixed inset-0 bg-black/55 z-[9000] flex items-center justify-center p-4 backdrop-blur-sm transition-opacity"
      onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-[modal-pop_0.18s_ease-out]">
        {/* Header */}
        <div className="bg-gradient-to-r from-navy to-[#1a6fa6] px-5 py-4 flex items-center justify-between text-white flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <User size={20} />
            <h3 className="text-base font-bold">
              {activeTab === 'search' ? 'Select Customer' : 'Create New Customer'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-app-border bg-slate-50 flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('search')}
            className={`flex-1 py-3 text-xs sm:text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
              activeTab === 'search'
                ? 'bg-white text-navy border-navy'
                : 'text-gray-500 hover:text-gray-700 border-transparent'
            }`}
          >
            <Search size={14} /> Search Existing
          </button>
          <button
            type="button"
            onClick={handleSwitchToCreate}
            className={`flex-1 py-3 text-xs sm:text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
              activeTab === 'create'
                ? 'bg-white text-navy border-navy'
                : 'text-gray-500 hover:text-gray-700 border-transparent'
            }`}
          >
            <UserPlus size={14} /> + Add New Customer
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1">
          {activeTab === 'search' ? (
            <div>
              {/* Search Bar */}
              <div className="relative mb-4">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  className="form-control pl-10 h-10 text-[13.5px]"
                  placeholder="Type customer name or mobile number..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
                {searching && (
                  <Loader
                    size={16}
                    className="animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-navy"
                  />
                )}
              </div>

              {/* Results List */}
              <div className="flex flex-col gap-2 min-h-[180px]">
                {searchResults.length > 0 ? (
                  searchResults.map((cust) => (
                    <div
                      key={cust._id}
                      onClick={() => handleSelectCustomer(cust)}
                      className="p-3 sm:p-3.5 rounded-xl border border-gray-200 bg-white hover:border-navy hover:bg-sky-50/50 cursor-pointer transition-all flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-sm text-gray-900 truncate">
                          {cust.name}
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 mt-0.5">
                          {cust.phone && <span>📞 {cust.phone}</span>}
                          {cust.gstin && <span>GST: {cust.gstin}</span>}
                        </div>
                        {cust.address && (
                          <div className="text-[11.5px] text-gray-400 mt-0.5 truncate max-w-sm">
                            📍 {cust.address.replace(/\n/g, ', ')}
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] font-bold text-navy bg-sky-100 hover:bg-navy hover:text-white px-2.5 py-1 rounded-md transition-colors flex-shrink-0">
                        Select
                      </span>
                    </div>
                  ))
                ) : hasSearched && !searching ? (
                  <div className="text-center py-8 px-4 text-gray-500">
                    <AlertCircle size={32} className="mx-auto mb-2 text-gray-400" />
                    <div className="font-semibold text-gray-800">
                      No customer found matching "{searchQuery}"
                    </div>
                    <div className="text-xs mt-1 mb-4 text-gray-500">
                      Would you like to create a new customer record?
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5"
                      onClick={handleSwitchToCreate}
                    >
                      <UserPlus size={14} /> Create "{searchQuery}"
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-10 px-4 text-gray-400 text-xs sm:text-sm">
                    Start typing a customer name or mobile number to search
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Create Customer Form */
            <form onSubmit={handleCreateCustomer} className="space-y-3.5">
              <div className="form-group mb-0">
                <label className="form-label">
                  Customer Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className={`form-control ${formErrors.name ? 'error' : ''}`}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Enter full customer / company name"
                  autoFocus
                />
                {formErrors.name && <div className="form-error">{formErrors.name}</div>}
              </div>

              <div className="form-group mb-0">
                <label className="form-label">
                  Mobile Number (10 Digits) <span className="required">*</span>
                </label>
                <input
                  type="text"
                  maxLength={10}
                  className={`form-control ${formErrors.phone ? 'error' : ''}`}
                  value={form.phone}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setForm({ ...form, phone: digits });
                  }}
                  placeholder="10-digit mobile number"
                />
                {formErrors.phone && <div className="form-error">{formErrors.phone}</div>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="form-group mb-0">
                  <label className="form-label">Email (Optional)</label>
                  <input
                    type="email"
                    className="form-control"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="customer@example.com"
                  />
                  {formErrors.email && <div className="form-error">{formErrors.email}</div>}
                </div>

                <div className="form-group mb-0">
                  <label className="form-label">GSTIN (Optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.gstin}
                    onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
                    placeholder="24ACWPZ3281G1ZX"
                    maxLength={15}
                  />
                  {formErrors.gstin && <div className="form-error">{formErrors.gstin}</div>}
                </div>
              </div>

              <div className="form-group mb-0">
                <label className="form-label">Address</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Street, City, State..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  className="btn btn-outline flex-1 justify-center"
                  onClick={() => setActiveTab('search')}
                >
                  Back to Search
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1 justify-center"
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
