import { useState, useEffect, useRef } from 'react';
import { Phone, User, Mail, FileText, MapPin, X, Check, Search, UserPlus, AlertCircle, Loader } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const PHONE_REGEX = /^[0-9]{10}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const validateMobile = (num) => {
  if (!num) return 'Please enter a mobile number';
  if (/\D/.test(num)) return 'Mobile number can contain digits only.';
  if (num.length < 10) return 'Please enter a valid 10-digit mobile number.';
  if (num.length > 10) return 'Mobile number must contain exactly 10 digits.';
  if (!PHONE_REGEX.test(num)) return 'Please enter a valid 10-digit mobile number.';
  return '';
};

/**
 * Mobile-first customer lookup and creation modal.
 * Step 1: Enter mobile → search
 * Step 2a: Customer found → confirm to use
 * Step 2b: Not found → show create form
 * Step 3: Customer selected/created → calls onCustomerReady(customer)
 *
 * Props:
 *   isOpen           — boolean
 *   onClose          — function
 *   onCustomerReady  — function(customer)  called when customer is confirmed/created
 */
const CustomerLookupModal = ({ isOpen, onClose, onCustomerReady }) => {
  const [step, setStep] = useState('phone'); // 'phone' | 'searching' | 'found' | 'notfound' | 'creating'
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [foundCustomer, setFoundCustomer] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', gstin: '', address: '', state: 'Gujarat', stateCode: '24' });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const phoneRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setStep('phone');
      setPhone('');
      setPhoneError('');
      setFoundCustomer(null);
      setForm({ name: '', phone: '', email: '', gstin: '', address: '', state: 'Gujarat', stateCode: '24' });
      setFormErrors({});
      setTimeout(() => phoneRef.current?.focus(), 80);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const handlePhoneSearch = async () => {
    const clean = phone.trim();
    const err = validateMobile(clean);
    if (err) { setPhoneError(err); return; }
    setPhoneError('');
    setStep('searching');
    try {
      const res = await api.get(`/customers/by-phone/${clean}`);
      setFoundCustomer(res.data.data);
      setStep('found');
    } catch (err) {
      if (err.response?.status === 404) {
        setStep('notfound');
        setForm(f => ({ ...f, phone: clean }));
      } else {
        toast.error('Error searching customer. Please try again.');
        setStep('phone');
      }
    }
  };

  const handlePhoneKeyDown = (e) => {
    if (e.key === 'Enter') handlePhoneSearch();
  };

  const handleUseCustomer = () => {
    onCustomerReady(foundCustomer);
    onClose();
  };

  const validateCreateForm = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Customer name is required';
    const phoneErr = validateMobile(form.phone);
    if (phoneErr) errs.phone = phoneErr;
    if (form.email && !EMAIL_REGEX.test(form.email.trim())) errs.email = 'Invalid email format';
    if (form.gstin && !GSTIN_REGEX.test(form.gstin.trim().toUpperCase())) errs.gstin = 'Invalid GSTIN (e.g., 22AAAAA0000A1Z5)';
    return errs;
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    const errs = validateCreateForm();
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }
    setFormErrors({});
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.replace(/\s/g, '') || null,
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
        // Duplicate — offer to use existing
        setFoundCustomer(err.response.data.data);
        setStep('found');
        toast.error('A customer with this number already exists.');
      } else {
        toast.error(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const overlay = (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9000, padding: '20px', backdropFilter: 'blur(2px)',
    }}>
      <div style={{
        background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '480px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.22)', overflow: 'hidden',
        animation: 'modal-pop 0.18s ease-out',
      }}>
        {/* Modal Header */}
        <div style={{ background: 'linear-gradient(135deg, #15527A, #1a6fa6)', padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Phone size={20} color="#fff" />
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '15px' }}>Select Customer</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.8)', padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Progress indicator */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #e5e7eb' }}>
          {['Enter Mobile', 'Verify Customer', 'Confirm'].map((label, i) => {
            const stepIndex = step === 'phone' ? 0 : step === 'searching' ? 0 : step === 'found' || step === 'notfound' ? 1 : step === 'creating' ? 2 : 0;
            const active = i <= stepIndex;
            return (
              <div key={label} style={{ flex: 1, padding: '8px', textAlign: 'center', fontSize: '10.5px', fontWeight: active ? 700 : 400, color: active ? '#15527A' : '#9ca3af', borderBottom: active ? '2px solid #15527A' : '2px solid transparent', background: active ? '#eff6ff' : '#fff', transition: 'all 0.2s' }}>
                {label}
              </div>
            );
          })}
        </div>

        <div style={{ padding: '22px' }}>

          {/* ===== STEP: Enter Phone ===== */}
          {(step === 'phone') && (
            <div>
              <div style={{ fontSize: '14px', color: '#374151', marginBottom: '16px', lineHeight: 1.5 }}>
                Enter the customer's mobile number to search their record.
              </div>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}>
                  <Phone size={16} />
                </span>
                <input
                  ref={phoneRef}
                  type="tel"
                  className="form-control"
                  style={{ paddingLeft: '38px', fontSize: '16px', letterSpacing: '1px', fontWeight: 600 }}
                  placeholder="9876543210"
                  value={phone}
                  onChange={e => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setPhoneError(''); }}
                  onKeyDown={handlePhoneKeyDown}
                  maxLength={10}
                />
              </div>
              {phoneError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#dc2626', fontSize: '12.5px', marginTop: '6px' }}>
                  <AlertCircle size={13} /> {phoneError}
                </div>
              )}
              <button
                onClick={handlePhoneSearch}
                className="btn btn-primary full-width"
                style={{ marginTop: '16px', justifyContent: 'center', gap: '8px', fontSize: '14px', padding: '11px' }}
              >
                <Search size={15} /> Search Customer
              </button>
            </div>
          )}

          {/* ===== STEP: Searching ===== */}
          {step === 'searching' && (
            <div style={{ textAlign: 'center', padding: '30px 0' }}>
              <Loader size={36} color="#15527A" style={{ animation: 'spin 1s linear infinite', marginBottom: '12px' }} />
              <div style={{ fontSize: '14px', color: '#374151', fontWeight: 500 }}>Searching customer database...</div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>Checking mobile: {phone}</div>
            </div>
          )}

          {/* ===== STEP: Found ===== */}
          {step === 'found' && foundCustomer && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16a34a', fontWeight: 700, fontSize: '14px', marginBottom: '14px' }}>
                <Check size={18} /> Customer Found
              </div>
              <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '10px', padding: '14px 16px', marginBottom: '16px' }}>
                <div style={{ fontWeight: 800, fontSize: '15px', color: '#111', marginBottom: '8px' }}>{foundCustomer.name}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '12.5px', color: '#374151' }}>
                  {foundCustomer.phone && <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Phone size={12} color="#15527A" />{foundCustomer.phone}</span>}
                  {foundCustomer.email && <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Mail size={12} color="#15527A" />{foundCustomer.email}</span>}
                  {foundCustomer.gstin && <span style={{ display: 'flex', alignItems: 'center', gap: '5px', gridColumn: 'span 2' }}><FileText size={12} color="#15527A" />GSTIN: {foundCustomer.gstin}</span>}
                  {foundCustomer.address && <span style={{ display: 'flex', alignItems: 'flex-start', gap: '5px', gridColumn: 'span 2' }}><MapPin size={12} color="#15527A" style={{ marginTop: 2, flexShrink: 0 }} />{foundCustomer.address.replace(/\n/g, ', ')}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => { setStep('phone'); setPhone(''); setFoundCustomer(null); }}
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                >
                  Use Different Number
                </button>
                <button
                  onClick={handleUseCustomer}
                  className="btn btn-primary"
                  style={{ flex: 2, justifyContent: 'center', gap: '6px' }}
                >
                  <Check size={15} /> Use This Customer
                </button>
              </div>
            </div>
          )}

          {/* ===== STEP: Not Found ===== */}
          {step === 'notfound' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#d97706', fontWeight: 700, fontSize: '14px', marginBottom: '6px' }}>
                <AlertCircle size={18} /> No Customer Found
              </div>
              <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
                No customer found with mobile <strong>{phone}</strong>. Would you like to create a new customer?
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => { setStep('phone'); setPhone(''); }} className="btn btn-outline" style={{ flex: 1 }}>
                  Try Again
                </button>
                <button
                  onClick={() => { setForm(f => ({ ...f, phone })); setStep('creating'); }}
                  className="btn btn-primary"
                  style={{ flex: 2, justifyContent: 'center', gap: '6px' }}
                >
                  <UserPlus size={15} /> Create New Customer
                </button>
              </div>
            </div>
          )}

          {/* ===== STEP: Create Customer ===== */}
          {step === 'creating' && (
            <form onSubmit={handleCreateCustomer}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#15527A', fontWeight: 700, fontSize: '14px', marginBottom: '16px' }}>
                <UserPlus size={18} /> Create New Customer
              </div>

              <div className="form-group">
                <label className="form-label">Customer Name <span className="required">*</span></label>
                <input
                  className={`form-control${formErrors.name ? ' error' : ''}`}
                  placeholder="Enter customer name"
                  value={form.name}
                  onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setFormErrors(fe => ({ ...fe, name: undefined })); }}
                />
                {formErrors.name && <div className="form-error">{formErrors.name}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Mobile Number <span className="required">*</span></label>
                <input
                  className={`form-control${formErrors.phone ? ' error' : ''}`}
                  placeholder="9876543210"
                  value={form.phone}
                  onChange={e => { setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })); setFormErrors(fe => ({ ...fe, phone: undefined })); }}
                  maxLength={10}
                />
                {formErrors.phone && <div className="form-error">{formErrors.phone}</div>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Email <span style={{ fontSize: '11px', color: '#9ca3af' }}>(optional)</span></label>
                  <input
                    type="email"
                    className={`form-control${formErrors.email ? ' error' : ''}`}
                    placeholder="customer@example.com"
                    value={form.email}
                    onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setFormErrors(fe => ({ ...fe, email: undefined })); }}
                  />
                  {formErrors.email && <div className="form-error">{formErrors.email}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">GSTIN <span style={{ fontSize: '11px', color: '#9ca3af' }}>(optional)</span></label>
                  <input
                    className={`form-control${formErrors.gstin ? ' error' : ''}`}
                    placeholder="22AAAAA0000A1Z5"
                    value={form.gstin}
                    onChange={e => { setForm(f => ({ ...f, gstin: e.target.value.toUpperCase() })); setFormErrors(fe => ({ ...fe, gstin: undefined })); }}
                  />
                  {formErrors.gstin && <div className="form-error">{formErrors.gstin}</div>}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Address <span style={{ fontSize: '11px', color: '#9ca3af' }}>(optional)</span></label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Example Address, City, State"
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button type="button" onClick={() => setStep('notfound')} className="btn btn-outline" style={{ flex: 1 }}>
                  Back
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 2, justifyContent: 'center', gap: '6px' }}>
                  {saving ? <><Loader size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> Creating...</> : <><UserPlus size={14} /> Create &amp; Use Customer</>}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>

      <style>{`
        @keyframes modal-pop {
          from { opacity: 0; transform: scale(0.94) translateY(-10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );

  return overlay;
};

export default CustomerLookupModal;
