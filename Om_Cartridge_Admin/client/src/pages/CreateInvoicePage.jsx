import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, ChevronDown, AlertCircle, CheckCircle } from 'lucide-react';
import AppLayout from '../layouts/AppLayout';
import api from '../services/api';
import toast from 'react-hot-toast';

const roundTo2 = (n) => Math.round(n * 100) / 100;

const calculateTotals = (items, isInterState) => {
  let subtotal = 0;
  const processed = items.map(item => {
    const qty = Number(item.quantity) || 0;
    const rate = Number(item.rate) || 0;
    const gstRate = Number(item.gstRate) || 18;
    const amount = roundTo2(qty * rate);
    let cgstAmount = 0, sgstAmount = 0, igstAmount = 0;
    if (isInterState) igstAmount = roundTo2(amount * (gstRate / 100));
    else { cgstAmount = roundTo2(amount * (gstRate / 2 / 100)); sgstAmount = roundTo2(amount * (gstRate / 2 / 100)); }
    subtotal += amount;
    return { ...item, amount, cgstAmount, sgstAmount, igstAmount };
  });
  subtotal = roundTo2(subtotal);
  let cgst = 0, sgst = 0, igst = 0;
  processed.forEach(i => { cgst += i.cgstAmount; sgst += i.sgstAmount; igst += i.igstAmount; });
  cgst = roundTo2(cgst); sgst = roundTo2(sgst); igst = roundTo2(igst);
  const totalTax = roundTo2(cgst + sgst + igst);
  const rawTotal = roundTo2(subtotal + totalTax);
  const grandTotal = Math.round(rawTotal);
  const roundOff = roundTo2(grandTotal - rawTotal);
  return { subtotal, cgst, sgst, igst, totalTax, rawTotal, roundOff, grandTotal };
};

const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const defaultItem = { productId: '', description: '', hsnSac: '', quantity: 1, unit: 'PCS', rate: 0, gstRate: 18, amount: 0 };

const CreateInvoicePage = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
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

  useEffect(() => {
    api.get('/customers').then(r => setCustomers(r.data.data)).catch(() => {});
    api.get('/products', { params: { isActive: true } }).then(r => setProducts(r.data.data)).catch(() => {});
  }, []);

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    (c.gstin && c.gstin.toLowerCase().includes(customerSearch.toLowerCase()))
  );

  const selectCustomer = (c) => {
    setSelectedCustomer(c._id);
    setCustomerSearch(c.name);
    setShowCustomerDropdown(false);
  };

  const selectedCustomerObj = customers.find(c => c._id === selectedCustomer);

  const updateItem = (idx, field, value) => {
    const newItems = [...items];
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
      }
    }

    if (field === 'quantity' || field === 'rate') {
      const qty = field === 'quantity' ? Number(value) : Number(newItems[idx].quantity);
      const rate = field === 'rate' ? Number(value) : Number(newItems[idx].rate);
      newItems[idx].amount = roundTo2(qty * rate);

      // Stock validation
      const availStock = newItems[idx]._availableStock;
      if (field === 'quantity' && availStock !== undefined) {
        const errs = { ...stockErrors };
        if (Number(value) > availStock) {
          errs[idx] = `Insufficient stock. Available: ${availStock} ${newItems[idx].unit}`;
        } else {
          delete errs[idx];
        }
        setStockErrors(errs);
      }
    }

    setItems(newItems);
  };

  const removeItem = (idx) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== idx));
    const errs = { ...stockErrors };
    delete errs[idx];
    setStockErrors(errs);
  };

  const totals = calculateTotals(items, isInterState);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedCustomer) { toast.error('Please select a customer'); return; }
    if (items.some(i => !i.productId)) { toast.error('Please select a product for all items'); return; }
    if (items.some(i => !i.quantity || Number(i.quantity) <= 0)) { toast.error('Quantity must be greater than 0'); return; }
    if (Object.keys(stockErrors).length > 0) { toast.error('Please fix stock errors before submitting'); return; }

    setSubmitting(true);
    try {
      const payload = {
        customerId: selectedCustomer,
        invoiceDate,
        isInterState,
        paymentTerms,
        referenceNumber,
        buyersOrderNumber,
        deliveryNote,
        dispatchDetails,
        destination,
        termsOfDelivery,
        sendEmail: sendEmail && !!selectedCustomerObj?.email,
        items: items.map(i => ({
          productId: i.productId,
          description: i.description,
          hsnSac: i.hsnSac,
          quantity: Number(i.quantity),
          unit: i.unit,
          rate: Number(i.rate),
          gstRate: Number(i.gstRate),
        })),
      };

      const res = await api.post('/invoices', payload);
      const inv = res.data.data;
      toast.success(res.data.message || 'Invoice generated successfully!');
      navigate(`/invoices/${inv._id}?new=1`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create invoice');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout title="Create Invoice">
      <form onSubmit={handleSubmit}>
        <div className="page-header">
          <div>
            <h1>Create Invoice</h1>
            <p>Generate a professional GST tax invoice</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" className="btn btn-outline" onClick={() => navigate('/invoices')}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Generating...' : 'Generate Invoice'}
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '20px' }}>
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Customer Selection */}
            <div className="card">
              <div className="card-header"><div className="card-title">Customer</div></div>
              <div className="card-body">
                <div className="form-group" style={{ position: 'relative' }}>
                  <label className="form-label">Select Customer <span className="required">*</span></label>
                  <input
                    id="customer-select"
                    className="form-control"
                    placeholder="Search customer name or GSTIN..."
                    value={customerSearch}
                    onChange={e => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true); setSelectedCustomer(''); }}
                    onFocus={() => setShowCustomerDropdown(true)}
                    autoComplete="off"
                  />
                  {showCustomerDropdown && filteredCustomers.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-md)', zIndex: 100, maxHeight: '200px', overflowY: 'auto' }}>
                      {filteredCustomers.map(c => (
                        <div key={c._id} onClick={() => selectCustomer(c)} style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-light)'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                          <div style={{ fontWeight: 600, fontSize: '13px' }}>{c.name}</div>
                          {c.gstin && <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>GSTIN: {c.gstin}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selectedCustomerObj && (
                  <div style={{ background: 'var(--bg-light)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px', fontSize: '13px' }}>
                    <div style={{ fontWeight: 600 }}>{selectedCustomerObj.name}</div>
                    <div style={{ color: 'var(--text-muted)', marginTop: '4px' }}>{selectedCustomerObj.address}</div>
                    {selectedCustomerObj.gstin && <div style={{ marginTop: '4px' }}>GSTIN: <strong>{selectedCustomerObj.gstin}</strong></div>}
                  </div>
                )}

                <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                    <input type="checkbox" checked={isInterState} onChange={e => setIsInterState(e.target.checked)} />
                    Interstate Transaction (IGST instead of CGST+SGST)
                  </label>
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
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '10px', background: 'var(--bg-light)', borderBottom: '1px solid var(--border)', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>#</th>
                      <th style={{ padding: '10px', background: 'var(--bg-light)', borderBottom: '1px solid var(--border)', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', minWidth: '200px' }}>Product</th>
                      <th style={{ padding: '10px', background: 'var(--bg-light)', borderBottom: '1px solid var(--border)', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', minWidth: '100px' }}>HSN/SAC</th>
                      <th style={{ padding: '10px', background: 'var(--bg-light)', borderBottom: '1px solid var(--border)', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', width: '90px' }}>Qty</th>
                      <th style={{ padding: '10px', background: 'var(--bg-light)', borderBottom: '1px solid var(--border)', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', width: '70px' }}>Unit</th>
                      <th style={{ padding: '10px', background: 'var(--bg-light)', borderBottom: '1px solid var(--border)', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', width: '100px' }}>Rate (₹)</th>
                      <th style={{ padding: '10px', background: 'var(--bg-light)', borderBottom: '1px solid var(--border)', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', width: '60px' }}>GST%</th>
                      <th style={{ padding: '10px', background: 'var(--bg-light)', borderBottom: '1px solid var(--border)', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', width: '110px' }}>Amount (₹)</th>
                      <th style={{ padding: '10px', background: 'var(--bg-light)', borderBottom: '1px solid var(--border)', width: '40px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => {
                      const prod = products.find(p => p._id === item.productId);
                      return (
                        <tr key={idx}>
                          <td style={{ padding: '8px 10px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>{idx + 1}</td>
                          <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>
                            <select
                              className="form-control"
                              style={{ fontSize: '12.5px', minWidth: '190px' }}
                              value={item.productId}
                              onChange={e => updateItem(idx, 'productId', e.target.value)}
                            >
                              <option value="">-- Select Product --</option>
                              {products.map(p => (
                                <option key={p._id} value={p._id} disabled={p.quantity === 0}>
                                  {p.name} | Stock: {p.quantity} {p.unit} | ₹{p.sellingRate}
                                </option>
                              ))}
                            </select>
                            {prod && (
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>
                                Available: <strong style={{ color: prod.quantity === 0 ? 'var(--red)' : 'var(--success)' }}>{prod.quantity} {prod.unit}</strong>
                              </div>
                            )}
                            {stockErrors[idx] && (
                              <div style={{ fontSize: '11px', color: 'var(--red)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <AlertCircle size={11} /> {stockErrors[idx]}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>
                            <input className="form-control" style={{ fontSize: '12.5px', width: '100px' }} value={item.hsnSac} onChange={e => updateItem(idx, 'hsnSac', e.target.value)} placeholder="HSN" />
                          </td>
                          <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>
                            <input type="number" className="form-control" style={{ fontSize: '12.5px', width: '80px', textAlign: 'center' }} min="1" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} />
                          </td>
                          <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', textAlign: 'center', fontSize: '12px' }}>{item.unit}</td>
                          <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>
                            <input type="number" className="form-control" style={{ fontSize: '12.5px', width: '90px', textAlign: 'right' }} min="0" step="0.01" value={item.rate} onChange={e => updateItem(idx, 'rate', e.target.value)} />
                          </td>
                          <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', textAlign: 'center', fontSize: '12px' }}>{item.gstRate}%</td>
                          <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', textAlign: 'right', fontWeight: 600 }}>
                            ₹{fmt(item.amount)}
                          </td>
                          <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>
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
                    <input className="form-control" value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Reference No.</label>
                    <input className="form-control" value={referenceNumber} onChange={e => setReferenceNumber(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Buyer's Order No.</label>
                    <input className="form-control" value={buyersOrderNumber} onChange={e => setBuyersOrderNumber(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Delivery Note</label>
                    <input className="form-control" value={deliveryNote} onChange={e => setDeliveryNote(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Dispatch Details</label>
                    <input className="form-control" value={dispatchDetails} onChange={e => setDispatchDetails(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Destination</label>
                    <input className="form-control" value={destination} onChange={e => setDestination(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Terms of Delivery</label>
                    <input className="form-control" value={termsOfDelivery} onChange={e => setTermsOfDelivery(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Totals */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="card" style={{ position: 'sticky', top: '0' }}>
              <div className="card-header"><div className="card-title">Invoice Summary</div></div>
              <div className="card-body">
                <div className="invoice-totals">
                  <div className="total-row">
                    <span>Taxable Value</span>
                    <span>₹{fmt(totals.subtotal)}</span>
                  </div>
                  {!isInterState ? (
                    <>
                      <div className="total-row">
                        <span>CGST @ 9%</span>
                        <span>₹{fmt(totals.cgst)}</span>
                      </div>
                      <div className="total-row">
                        <span>SGST @ 9%</span>
                        <span>₹{fmt(totals.sgst)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="total-row">
                      <span>IGST @ 18%</span>
                      <span>₹{fmt(totals.igst)}</span>
                    </div>
                  )}
                  <div className="total-row">
                    <span>Total Tax</span>
                    <span>₹{fmt(totals.totalTax)}</span>
                  </div>
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

                <div style={{ marginTop: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                    <input
                      type="checkbox"
                      checked={sendEmail}
                      onChange={e => setSendEmail(e.target.checked)}
                      disabled={!selectedCustomerObj?.email}
                    />
                    <span>Send invoice by email</span>
                  </label>
                  {selectedCustomerObj && !selectedCustomerObj.email && (
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Customer has no email address
                    </div>
                  )}
                  {selectedCustomerObj?.email && (
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      To: {selectedCustomerObj.email}
                    </div>
                  )}
                </div>

                <button type="submit" className="btn btn-primary full-width btn-lg" style={{ marginTop: '16px', justifyContent: 'center' }} disabled={submitting}>
                  {submitting ? 'Generating...' : '⚡ Generate Invoice'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </AppLayout>
  );
};

export default CreateInvoicePage;
