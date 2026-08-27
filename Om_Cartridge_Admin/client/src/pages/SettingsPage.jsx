import { useEffect, useState } from 'react';
import { Save, Building2, CreditCard, FileText, Mail } from 'lucide-react';
import AppLayout from '../layouts/AppLayout';
import api from '../services/api';
import toast from 'react-hot-toast';

const GST_RATES = [0, 5, 12, 18, 28];

const SettingsPage = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('business');

  useEffect(() => {
    api.get('/settings')
      .then(r => setSettings(r.data.data))
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/settings', settings);
      toast.success('Settings updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally { setSaving(false); }
  };

  const updateBusiness = (field, value) => setSettings(s => ({ ...s, business: { ...s.business, [field]: value } }));
  const updateBank = (field, value) => setSettings(s => ({ ...s, bank: { ...s.bank, [field]: value } }));
  const updateInvoice = (field, value) => setSettings(s => ({ ...s, invoice: { ...s.invoice, [field]: value } }));
  const updateSmtp = (field, value) => setSettings(s => ({ ...s, smtp: { ...s.smtp, [field]: value } }));

  const tabs = [
    { id: 'business', label: 'Business Details', icon: Building2 },
    { id: 'bank', label: 'Bank Details', icon: CreditCard },
    { id: 'invoice', label: 'Invoice Settings', icon: FileText },
    { id: 'smtp', label: 'SMTP / Email', icon: Mail },
  ];

  if (loading) return <AppLayout title="Settings"><div className="loading-spinner"><div className="spinner" /></div></AppLayout>;

  return (
    <AppLayout title="Settings">
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p>Configure business details and application settings</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          <Save size={15} /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '20px' }}>
        {/* Tabs */}
        <div className="card" style={{ alignSelf: 'start' }}>
          <div style={{ padding: '8px' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 12px',
                  background: activeTab === tab.id ? 'var(--bg-light)' : 'transparent', borderRadius: 'var(--radius)',
                  border: 'none', cursor: 'pointer', color: activeTab === tab.id ? 'var(--navy)' : 'var(--text-muted)',
                  fontWeight: activeTab === tab.id ? 600 : 400, fontSize: '13.5px', textAlign: 'left',
                  borderLeft: activeTab === tab.id ? '3px solid var(--navy)' : '3px solid transparent',
                  marginBottom: '2px', transition: 'all 0.15s',
                }}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="card">
          <div className="card-body">
            {activeTab === 'business' && settings?.business && (
              <div>
                <h3 style={{ marginBottom: '20px' }}>Business Details</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Legal Business Name</label>
                    <input className="form-control" value={settings.business.name} onChange={e => updateBusiness('name', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Brand Name</label>
                    <input className="form-control" value={settings.business.brandName} onChange={e => updateBusiness('brandName', e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <textarea className="form-control" rows={4} value={settings.business.address} onChange={e => updateBusiness('address', e.target.value)} />
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">GSTIN/UIN</label>
                    <input className="form-control" value={settings.business.gstin} onChange={e => updateBusiness('gstin', e.target.value.toUpperCase())} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">State</label>
                    <input className="form-control" value={settings.business.state} onChange={e => updateBusiness('state', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">State Code</label>
                    <input className="form-control" value={settings.business.stateCode} onChange={e => updateBusiness('stateCode', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone 1</label>
                    <input className="form-control" value={settings.business.phone1} onChange={e => updateBusiness('phone1', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone 2</label>
                    <input className="form-control" value={settings.business.phone2} onChange={e => updateBusiness('phone2', e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'bank' && settings?.bank && (
              <div>
                <h3 style={{ marginBottom: '20px' }}>Bank Details</h3>
                <div className="form-group">
                  <label className="form-label">Bank Name</label>
                  <input className="form-control" value={settings.bank.bankName} onChange={e => updateBank('bankName', e.target.value)} />
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Account Number</label>
                    <input className="form-control" value={settings.bank.accountNo} onChange={e => updateBank('accountNo', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Branch</label>
                    <input className="form-control" value={settings.bank.branch} onChange={e => updateBank('branch', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">IFSC Code</label>
                    <input className="form-control" value={settings.bank.ifsc} onChange={e => updateBank('ifsc', e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'invoice' && settings?.invoice && (
              <div>
                <h3 style={{ marginBottom: '20px' }}>Invoice Settings</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Invoice Number Prefix</label>
                    <input className="form-control" value={settings.invoice.prefix} onChange={e => updateInvoice('prefix', e.target.value)} placeholder="OM" />
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>
                      Example: {settings.invoice.prefix || 'OM'}/1/2026-27
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Default GST Rate</label>
                    <select className="form-control" value={settings.invoice.defaultGstRate} onChange={e => updateInvoice('defaultGstRate', Number(e.target.value))}>
                      {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Default Payment Terms</label>
                    <input className="form-control" value={settings.invoice.defaultPaymentTerms} onChange={e => updateInvoice('defaultPaymentTerms', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Jurisdiction</label>
                    <input className="form-control" value={settings.invoice.jurisdiction} onChange={e => updateInvoice('jurisdiction', e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Declaration Text</label>
                  <textarea className="form-control" rows={3} value={settings.invoice.declaration} onChange={e => updateInvoice('declaration', e.target.value)} />
                </div>
              </div>
            )}

            {activeTab === 'smtp' && settings?.smtp && (
              <div>
                <h3 style={{ marginBottom: '4px' }}>SMTP / Email Settings</h3>
                <div style={{ background: 'var(--info-bg)', border: '1px solid var(--info)', borderRadius: 'var(--radius)', padding: '10px 14px', fontSize: '12.5px', color: 'var(--info)', marginBottom: '20px' }}>
                  SMTP settings are used to send invoices by email. For Gmail, use App Password instead of your account password.
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">SMTP Host</label>
                    <input className="form-control" value={settings.smtp.host} onChange={e => updateSmtp('host', e.target.value)} placeholder="smtp.gmail.com" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">SMTP Port</label>
                    <input type="number" className="form-control" value={settings.smtp.port} onChange={e => updateSmtp('port', Number(e.target.value))} placeholder="587" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Username / Email</label>
                    <input className="form-control" value={settings.smtp.user} onChange={e => updateSmtp('user', e.target.value)} placeholder="your@gmail.com" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Password / App Password</label>
                    <input type="password" className="form-control" value={settings.smtp.password} onChange={e => updateSmtp('password', e.target.value)} placeholder="••••••••" />
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '3px' }}>Password is never shown after saving</div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">From Email</label>
                    <input className="form-control" value={settings.smtp.from} onChange={e => updateSmtp('from', e.target.value)} placeholder="OM ENTERPRISE &lt;noreply@omcartridge.local&gt;" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
