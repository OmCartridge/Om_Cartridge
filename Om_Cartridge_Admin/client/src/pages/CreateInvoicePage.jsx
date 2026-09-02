import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Trash2, AlertCircle, CheckCircle, User, Phone, Edit2,
  Tag, DollarSign, ChevronDown, X, Eye, Download, RotateCcw,
} from 'lucide-react';
import AppLayout from '../layouts/AppLayout';
import api from '../services/api';
import toast from 'react-hot-toast';
import CustomerLookupModal from '../components/CustomerLookupModal';
import ConfirmModal from '../components/ConfirmModal';

// ─── Shared calculation logic (mirrors server/utils/invoiceUtils.js) ──────────
const roundTo2 = (n) => Math.round(n * 100) / 100;

function computeItemDiscount(amount, discountType, discountValue) {
  if (!discountType || discountType === 'none' || !discountValue) return 0;
  if (discountType === 'percent') return roundTo2(amount * (Number(discountValue) / 100));
  if (discountType === 'fixed') return roundTo2(Math.min(Number(discountValue), amount));
  return 0;
}

const calculateTotals = (items, isInterState, taxMode = 'with_tax') => {
  const applyTax = taxMode !== 'without_tax';
  let subtotal = 0;
  let totalDiscount = 0;

  const processed = items.map(item => {
    const qty = Number(item.quantity) || 0;
    const rate = Number(item.rate) || 0;
    const gstRate = item.gstRate !== undefined ? Number(item.gstRate) : 18;
    const amount = roundTo2(qty * rate);
    const discountAmount = computeItemDiscount(amount, item.discountType, item.discountValue);
    const finalAmount = roundTo2(amount - discountAmount);
    let cgstAmount = 0, sgstAmount = 0, igstAmount = 0;
    if (applyTax) {
      if (isInterState) igstAmount = roundTo2(finalAmount * (gstRate / 100));
      else { cgstAmount = roundTo2(finalAmount * (gstRate / 2 / 100)); sgstAmount = roundTo2(finalAmount * (gstRate / 2 / 100)); }
    }
    subtotal += amount;
    totalDiscount += discountAmount;
    return { ...item, amount, discountAmount, finalAmount, cgstAmount, sgstAmount, igstAmount };
  });

  subtotal = roundTo2(subtotal);
  totalDiscount = roundTo2(totalDiscount);
  const taxableValue = roundTo2(subtotal - totalDiscount);
  let cgst = 0, sgst = 0, igst = 0;
  processed.forEach(i => { cgst += i.cgstAmount; sgst += i.sgstAmount; igst += i.igstAmount; });
  cgst = roundTo2(cgst); sgst = roundTo2(sgst); igst = roundTo2(igst);
  const totalTax = roundTo2(cgst + sgst + igst);
  const rawTotal = roundTo2(taxableValue + totalTax);
  const grandTotal = Math.round(rawTotal);
  const roundOff = roundTo2(grandTotal - rawTotal);
  return { subtotal, totalDiscount, taxableValue, cgst, sgst, igst, totalTax, rawTotal, roundOff, grandTotal };
};

const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const defaultItem = {
  productId: '', description: '', hsnSac: '', quantity: 1, unit: 'PCS',
  rate: 0, gstRate: 18, amount: 0,
  discountType: 'none', discountValue: 0,
  _product: null, _availableStock: undefined,
};

// ─── Inline Discount Control ──────────────────────────────────────────────────
const DiscountControl = ({ item, onChange }) => {
  const [open, setOpen] = useState(false);

  const handleTypeChange = (type) => {
    onChange('discountType', type);
    if (type === 'none') onChange('discountValue', 0);
  };

  const discountLabel = () => {
    if (item.discountType === 'percent') return `${item.discountValue}% off`;
    if (item.discountType === 'fixed') return `-₹${item.discountValue}`;
    return 'No Discount';
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 8px',
          borderRadius: '6px', border: '1px solid',
          borderColor: item.discountType !== 'none' ? '#fca5a5' : '#e5e7eb',
          background: item.discountType !== 'none' ? '#fef2f2' : '#f9fafb',
          color: item.discountType !== 'none' ? '#dc2626' : '#6b7280',
          cursor: 'pointer', fontSize: '11.5px', fontWeight: 600, whiteSpace: 'nowrap',
        }}
      >
        <Tag size={11} />
        {discountLabel()}
        <ChevronDown size={11} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', top: '100%', left: 0, zIndex: 50, marginTop: '4px',
            background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: '12px', width: '220px',
          }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', marginBottom: '8px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Discount Type</div>
            {[
              { val: 'none', label: 'No Discount' },
              { val: 'percent', label: '% Percentage' },
              { val: 'fixed', label: '₹ Fixed Amount' },
            ].map(opt => (
              <label key={opt.val} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 4px', cursor: 'pointer', borderRadius: '5px', fontSize: '13px', color: item.discountType === opt.val ? '#15527A' : '#374151', background: item.discountType === opt.val ? '#eff6ff' : 'transparent' }}>
                <input
                  type="radio"
                  name={`disc-type-${item.productId}`}
                  checked={item.discountType === opt.val}
                  onChange={() => handleTypeChange(opt.val)}
                  style={{ accentColor: '#15527A' }}
                />
                {opt.label}
              </label>
            ))}

            {item.discountType !== 'none' && (
              <div style={{ marginTop: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', marginBottom: '5px' }}>
                  {item.discountType === 'percent' ? 'Percentage (%)' : 'Amount (₹)'}
                </div>
                <input
                  type="number"
                  className="form-control"
                  style={{ fontSize: '13px', textAlign: 'right' }}
                  min={0}
                  max={item.discountType === 'percent' ? 100 : undefined}
                  step={0.01}
                  value={item.discountValue}
                  onChange={e => onChange('discountValue', Number(e.target.value))}
                  autoFocus
                />
              </div>
            )}

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn btn-primary full-width"
              style={{ marginTop: '10px', justifyContent: 'center', fontSize: '12px', padding: '7px' }}
            >
              Apply
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const CreateInvoicePage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [taxMode, setTaxMode] = useState('with_tax'); // 'with_tax' | 'without_tax'
  const [isInterState, setIsInterState] = useState(false);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentTerms, setPaymentTerms] = useState('Due on Receipt');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [buyersOrderNumber, setBuyersOrderNumber] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [dispatchDetails, setDispatchDetails] = useState('');
  const [destination, setDestination] = useState('');
  const [termsOfDelivery, setTermsOfDelivery] = useState('');
  const [items, setItems] = useState([{ ...defaultItem }]);
  const [sendEmail, setSendEmail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [stockErrors, setStockErrors] = useState({});

  // Modals
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    api.get('/products', { params: { isActive: true } }).then(r => setProducts(r.data.data)).catch(() => {});
  }, []);

  const handleCustomerReady = (customer) => {
    setSelectedCustomer(customer);
    toast.success(`Customer "${customer.name}" selected`);
  };

  const updateItem = (idx, field, value) => {
    setItems(prev => {
      const newItems = [...prev];
      newItems[idx] = { ...newItems[idx], [field]: value };

      if (field === 'productId') {
        const prod = products.find(p => p._id === value);
        if (prod) {
          newItems[idx].description = prod.name;
          newItems[idx].hsnSac = prod.hsnSac || '';
          newItems[idx].unit = prod.unit || 'PCS';
          newItems[idx].rate = prod.sellingRate || 0;
          newItems[idx].gstRate = prod.gstRate || 18;
          newItems[idx]._product = prod;
          newItems[idx]._availableStock = prod.quantity;
          newItems[idx].discountType = 'none';
          newItems[idx].discountValue = 0;
        }
      }

      // Recalculate amount
      if (['quantity', 'rate', 'discountType', 'discountValue'].includes(field)) {
        const qty = Number(newItems[idx].quantity) || 0;
        const rate = Number(newItems[idx].rate) || 0;
        newItems[idx].amount = roundTo2(qty * rate);

        // Stock validation
        if (field === 'quantity') {
          const availStock = newItems[idx]._availableStock;
          const errs = { ...stockErrors };
          if (availStock !== undefined && Number(value) > availStock) {
            errs[idx] = `Only ${availStock} ${newItems[idx].unit} available`;
          } else {
            delete errs[idx];
          }
          setStockErrors(errs);
        }
      }

      return newItems;
    });
  };

  const removeItem = (idx) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== idx));
    setStockErrors(prev => { const e = { ...prev }; delete e[idx]; return e; });
  };

  const totals = calculateTotals(items, isInterState, taxMode);
  const hasDiscount = totals.totalDiscount > 0;

  const validateBeforeSubmit = () => {
    if (!selectedCustomer) { toast.error('Please select a customer first'); return false; }
    if (items.some(i => !i.productId)) { toast.error('Please select a product for all items'); return false; }
    if (items.some(i => !i.quantity || Number(i.quantity) <= 0)) { toast.error('Quantity must be greater than 0'); return false; }
    if (Object.keys(stockErrors).length > 0) { toast.error('Please fix stock errors before creating the invoice'); return false; }
    return true;
  };

  const handlePreSubmit = (e) => {
    e.preventDefault();
    if (!validateBeforeSubmit()) return;
    setShowConfirmModal(true);
  };

  const handleSubmit = async () => {
    setShowConfirmModal(false);
    setSubmitting(true);
    try {
      const payload = {
        customerId: selectedCustomer._id,
        invoiceDate,
        isInterState,
        taxMode,
        paymentTerms,
        referenceNumber,
        buyersOrderNumber,
        deliveryNote,
        dispatchDetails,
        destination,
        termsOfDelivery,
        sendEmail: sendEmail && !!selectedCustomer?.email,
        items: items.map(i => ({
          productId: i.productId,
          description: i.description,
          hsnSac: i.hsnSac,
          quantity: Number(i.quantity),
          unit: i.unit,
          rate: Number(i.rate),
          gstRate: Number(i.gstRate),
          discountType: i.discountType || 'none',
          discountValue: Number(i.discountValue) || 0,
        })),
      };

      const res = await api.post('/invoices', payload);
      const inv = res.data.data;
      toast.success(res.data.message || 'Invoice generated successfully!');
      navigate(`/invoices/${inv._id}?new=1`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create invoice';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelPage = () => {
    const hasData = selectedCustomer || items.some(i => i.productId);
    if (!hasData) { navigate('/invoices'); return; }
    setShowCancelModal(true);
  };

  return (
    <AppLayout title="Create Invoice">
      <form onSubmit={handlePreSubmit}>
        <div className="page-header">
          <div>
            <h1>Create Invoice</h1>
            <p>Generate a professional GST tax invoice</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" className="btn btn-outline" onClick={handleCancelPage}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Generating...' : '⚡ Generate Invoice'}
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '20px' }}>
          {/* ───── Left Column ───── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Customer Card */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">Customer</div>
                {selectedCustomer && (
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    style={{ gap: '5px', fontSize: '12px' }}
                    onClick={() => setShowCustomerModal(true)}
                  >
                    <Edit2 size={12} /> Change
                  </button>
                )}
              </div>
              <div className="card-body">
                {!selectedCustomer ? (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                      <User size={28} color="#15527A" />
                    </div>
                    <div style={{ fontSize: '14px', color: '#374151', fontWeight: 500, marginBottom: '6px' }}>No customer selected</div>
                    <div style={{ fontSize: '12.5px', color: '#9ca3af', marginBottom: '16px' }}>Enter a mobile number to search or create a customer</div>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ gap: '8px' }}
                      onClick={() => setShowCustomerModal(true)}
                    >
                      <Phone size={15} /> Enter Mobile Number
                    </button>
                  </div>
                ) : (
                  <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '10px', padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <CheckCircle size={16} color="#16a34a" />
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Customer Selected</span>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '16px', color: '#111', marginBottom: '6px' }}>{selectedCustomer.name}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '12.5px', color: '#374151' }}>
                      {selectedCustomer.phone && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={11} color="#15527A" />{selectedCustomer.phone}</span>}
                      {selectedCustomer.email && <span style={{ color: '#6b7280' }}>{selectedCustomer.email}</span>}
                      {selectedCustomer.gstin && <span style={{ gridColumn: 'span 2', color: '#6b7280' }}>GSTIN: {selectedCustomer.gstin}</span>}
                      {selectedCustomer.address && <span style={{ gridColumn: 'span 2', color: '#6b7280' }}>{selectedCustomer.address.replace(/\n/g, ', ')}</span>}
                    </div>
                  </div>
                )}

                {/* Tax Option & Interstate Toggle */}
                <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
                  <label className="form-label" style={{ fontWeight: 700, marginBottom: '8px', color: '#15527A' }}>
                    Invoice Tax Mode <span className="required">*</span>
                  </label>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                    <label style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: `1.5px solid ${taxMode === 'with_tax' ? '#15527A' : '#e5e7eb'}`,
                      background: taxMode === 'with_tax' ? '#eff6ff' : '#fff',
                      cursor: 'pointer',
                      fontWeight: taxMode === 'with_tax' ? 700 : 500,
                      color: taxMode === 'with_tax' ? '#15527A' : '#4b5563',
                      transition: 'all 0.15s ease',
                    }}>
                      <input
                        type="radio"
                        name="taxMode"
                        value="with_tax"
                        checked={taxMode === 'with_tax'}
                        onChange={() => setTaxMode('with_tax')}
                        style={{ accentColor: '#15527A' }}
                      />
                      <span>With Tax (GST)</span>
                    </label>

                    <label style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: `1.5px solid ${taxMode === 'without_tax' ? '#d97706' : '#e5e7eb'}`,
                      background: taxMode === 'without_tax' ? '#fffbeb' : '#fff',
                      cursor: 'pointer',
                      fontWeight: taxMode === 'without_tax' ? 700 : 500,
                      color: taxMode === 'without_tax' ? '#92400e' : '#4b5563',
                      transition: 'all 0.15s ease',
                    }}>
                      <input
                        type="radio"
                        name="taxMode"
                        value="without_tax"
                        checked={taxMode === 'without_tax'}
                        onChange={() => setTaxMode('without_tax')}
                        style={{ accentColor: '#d97706' }}
                      />
                      <span>Without Tax</span>
                    </label>
                  </div>

                  {taxMode === 'with_tax' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                        <input type="checkbox" checked={isInterState} onChange={e => setIsInterState(e.target.checked)} />
                        Interstate Transaction (IGST instead of CGST+SGST)
                      </label>
                    </div>
                  ) : (
                    <div style={{ fontSize: '12px', color: '#92400e', background: '#fffbeb', padding: '6px 10px', borderRadius: '6px', border: '1px solid #fde68a' }}>
                      ℹ Tax will not be applied to this invoice (GST = ₹0).
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">Invoice Items</div>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => setItems([...items, { ...defaultItem }])}>
                  <Plus size={14} /> Add Item
                </button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                  <thead>
                    <tr>
                      {['#', 'Product', 'HSN/SAC', 'Qty', 'Unit', 'Rate (₹)', 'Discount', 'Amount (₹)', ''].map(h => (
                        <th key={h} style={{ padding: '10px', background: 'var(--bg-light)', borderBottom: '1px solid var(--border)', textAlign: h === 'Amount (₹)' ? 'right' : h === 'Qty' || h === 'Unit' ? 'center' : 'left', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => {
                      const prod = products.find(p => p._id === item.productId);
                      const discountAmt = computeItemDiscount(item.amount, item.discountType, item.discountValue);
                      const finalAmt = roundTo2(item.amount - discountAmt);
                      return (
                        <tr key={idx}>
                          <td style={{ padding: '8px 10px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', verticalAlign: 'top', paddingTop: '14px' }}>{idx + 1}</td>
                          <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', verticalAlign: 'top', minWidth: '200px' }}>
                            <select
                              className="form-control"
                              style={{ fontSize: '12px', minWidth: '190px' }}
                              value={item.productId}
                              onChange={e => updateItem(idx, 'productId', e.target.value)}
                            >
                              <option value="">— Select Product —</option>
                              {products.map(p => (
                                <option key={p._id} value={p._id} disabled={p.quantity === 0}>
                                  {p.name} | Stock: {p.quantity} {p.unit} | ₹{p.sellingRate}
                                </option>
                              ))}
                            </select>
                            {prod && (
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>
                                Available: <strong style={{ color: prod.quantity === 0 ? 'var(--red)' : prod.quantity <= prod.minimumStock ? 'var(--warning)' : 'var(--success)' }}>
                                  {prod.quantity} {prod.unit}
                                </strong>
                              </div>
                            )}
                            {stockErrors[idx] && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#dc2626', fontSize: '11px', marginTop: '3px' }}>
                                <AlertCircle size={11} /> {stockErrors[idx]}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', verticalAlign: 'top' }}>
                            <input className="form-control" style={{ width: '85px', fontSize: '12px' }} value={item.hsnSac} onChange={e => updateItem(idx, 'hsnSac', e.target.value)} placeholder="HSN" />
                          </td>
                          <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', verticalAlign: 'top' }}>
                            <input type="number" className="form-control" style={{ width: '68px', textAlign: 'center', fontSize: '12px' }} min="1" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} />
                          </td>
                          <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', verticalAlign: 'top', textAlign: 'center', paddingTop: '14px', fontSize: '12px' }}>{item.unit}</td>
                          <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', verticalAlign: 'top' }}>
                            <input type="number" className="form-control" style={{ width: '90px', textAlign: 'right', fontSize: '12px' }} min="0" step="0.01" value={item.rate} onChange={e => updateItem(idx, 'rate', e.target.value)} />
                            {prod && Number(item.rate) !== prod.sellingRate && (
                              <div style={{ fontSize: '10px', color: '#d97706', marginTop: '2px' }}>
                                MRP: ₹{prod.sellingRate}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', verticalAlign: 'top', paddingTop: '12px' }}>
                            {item.productId ? (
                              <DiscountControl
                                item={item}
                                onChange={(field, value) => updateItem(idx, field, value)}
                              />
                            ) : (
                              <span style={{ fontSize: '11px', color: '#d1d5db' }}>—</span>
                            )}
                          </td>
                          <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', verticalAlign: 'top', textAlign: 'right', paddingTop: '14px' }}>
                            <div style={{ fontWeight: 700, fontSize: '13px' }}>₹{fmt(finalAmt)}</div>
                            {discountAmt > 0 && (
                              <div style={{ fontSize: '10.5px', color: '#dc2626', textDecoration: 'line-through', textDecorationColor: '#fca5a5' }}>₹{fmt(item.amount)}</div>
                            )}
                          </td>
                          <td style={{ padding: '8px 6px', borderBottom: '1px solid var(--border)', verticalAlign: 'top', paddingTop: '12px' }}>
                            {items.length > 1 && (
                              <button type="button" className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--red)' }} onClick={() => removeItem(idx)}>
                                <Trash2 size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Invoice Details */}
            <div className="card">
              <div className="card-header"><div className="card-title">Invoice Details</div></div>
              <div className="card-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Invoice Date</label>
                    <input type="date" className="form-control" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Payment Terms</label>
                    <input className="form-control" value={paymentTerms} placeholder="e.g. Due on Receipt" onChange={e => setPaymentTerms(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Reference No.</label>
                    <input className="form-control" value={referenceNumber} placeholder="e.g. PO-2024-001" onChange={e => setReferenceNumber(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Buyer's Order No.</label>
                    <input className="form-control" value={buyersOrderNumber} placeholder="e.g. BO-0001" onChange={e => setBuyersOrderNumber(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Delivery Note</label>
                    <input className="form-control" value={deliveryNote} placeholder="Delivery note" onChange={e => setDeliveryNote(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Dispatch Details</label>
                    <input className="form-control" value={dispatchDetails} placeholder="Dispatch info" onChange={e => setDispatchDetails(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Destination</label>
                    <input className="form-control" value={destination} placeholder="e.g. Ahmedabad" onChange={e => setDestination(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Terms of Delivery</label>
                    <input className="form-control" value={termsOfDelivery} placeholder="e.g. Ex-Works" onChange={e => setTermsOfDelivery(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ───── Right Column - Summary ───── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="card" style={{ position: 'sticky', top: '0' }}>
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="card-title">Invoice Summary</div>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '99px',
                  fontSize: '11px',
                  fontWeight: 700,
                  background: taxMode === 'with_tax' ? '#dbeafe' : '#fef3c7',
                  color: taxMode === 'with_tax' ? '#1d4ed8' : '#b45309',
                }}>
                  {taxMode === 'with_tax' ? 'With Tax' : 'Without Tax'}
                </span>
              </div>
              <div className="card-body">
                <div className="invoice-totals">
                  {hasDiscount && (
                    <>
                      <div className="total-row">
                        <span>Subtotal (Before Discount)</span>
                        <span>₹{fmt(totals.subtotal)}</span>
                      </div>
                      <div className="total-row" style={{ color: '#dc2626', fontWeight: 600 }}>
                        <span>(-) Total Discount</span>
                        <span>-₹{fmt(totals.totalDiscount)}</span>
                      </div>
                    </>
                  )}
                  <div className="total-row">
                    <span>{hasDiscount ? 'Taxable Value' : 'Subtotal'}</span>
                    <span>₹{fmt(totals.taxableValue)}</span>
                  </div>
                  {taxMode === 'with_tax' ? (
                    <>
                      {!isInterState ? (
                        <>
                          <div className="total-row"><span>CGST</span><span>₹{fmt(totals.cgst)}</span></div>
                          <div className="total-row"><span>SGST</span><span>₹{fmt(totals.sgst)}</span></div>
                        </>
                      ) : (
                        <div className="total-row"><span>IGST</span><span>₹{fmt(totals.igst)}</span></div>
                      )}
                      <div className="total-row"><span>Total Tax</span><span>₹{fmt(totals.totalTax)}</span></div>
                    </>
                  ) : (
                    <div className="total-row" style={{ color: '#92400e' }}>
                      <span>Tax (Without Tax Mode)</span>
                      <span>₹0.00</span>
                    </div>
                  )}
                  <div className="total-row">
                    <span>Round Off</span>
                    <span style={{ color: totals.roundOff < 0 ? 'var(--red)' : 'var(--success)' }}>
                      {totals.roundOff < 0 ? '-' : '+'}₹{fmt(Math.abs(totals.roundOff))}
                    </span>
                  </div>
                  <div className="total-row grand">
                    <span>Grand Total</span>
                    <span>₹{fmt(totals.grandTotal)}</span>
                  </div>
                </div>

                {/* Email toggle */}
                <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                    <input
                      type="checkbox"
                      checked={sendEmail}
                      onChange={e => setSendEmail(e.target.checked)}
                      disabled={!selectedCustomer?.email}
                    />
                    <span>Send invoice by email</span>
                  </label>
                  {selectedCustomer && !selectedCustomer.email && (
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>Customer has no email address</div>
                  )}
                  {selectedCustomer?.email && (
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>To: {selectedCustomer.email}</div>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary full-width btn-lg"
                  style={{ marginTop: '16px', justifyContent: 'center' }}
                  disabled={submitting || !selectedCustomer}
                >
                  {submitting ? 'Generating...' : '⚡ Generate Invoice'}
                </button>

                {!selectedCustomer && (
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#9ca3af', textAlign: 'center' }}>
                    Select a customer to continue
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Customer Lookup Modal */}
      <CustomerLookupModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        onCustomerReady={handleCustomerReady}
      />

      {/* Confirm Invoice Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        variant="info"
        title="Create Invoice?"
        message={
          selectedCustomer ? (
            <div>
              <div><strong>Customer:</strong> {selectedCustomer.name}</div>
              <div><strong>Tax Mode:</strong> <span style={{ fontWeight: 700, color: taxMode === 'with_tax' ? '#15527A' : '#d97706' }}>{taxMode === 'with_tax' ? 'With Tax (GST)' : 'Without Tax'}</span></div>
              <div><strong>Items:</strong> {items.filter(i => i.productId).length} product(s)</div>
              {hasDiscount && <div><strong>Discount:</strong> ₹{fmt(totals.totalDiscount)}</div>}
              <div><strong>Grand Total:</strong> <span style={{ fontSize: '16px', fontWeight: 800, color: '#15527A' }}>₹{fmt(totals.grandTotal)}</span></div>
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>Stock will be deducted once confirmed.</div>
            </div>
          ) : ''
        }
        confirmText="Create Invoice"
        cancelText="Review Again"
        loading={submitting}
        onConfirm={handleSubmit}
        onCancel={() => setShowConfirmModal(false)}
      />

      {/* Cancel Page Modal */}
      <ConfirmModal
        isOpen={showCancelModal}
        variant="warning"
        title="Discard Invoice?"
        message="You have unsaved invoice data. Are you sure you want to go back? All entered data will be lost."
        confirmText="Yes, Discard"
        cancelText="Keep Editing"
        onConfirm={() => { setShowCancelModal(false); navigate('/invoices'); }}
        onCancel={() => setShowCancelModal(false)}
      />
    </AppLayout>
  );
};

export default CreateInvoicePage;
