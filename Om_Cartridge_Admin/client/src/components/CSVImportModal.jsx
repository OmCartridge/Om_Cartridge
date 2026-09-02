import { useState, useRef } from 'react';
import { Upload, X, AlertCircle, CheckCircle, RefreshCw, Download, Eye } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

/**
 * CSV Import Modal for Customers or Products/Inventory
 *
 * Props:
 *   isOpen   — boolean
 *   onClose  — function
 *   type     — 'customers' | 'products'
 *   onImportComplete — function() called after successful import
 */
const CSVImportModal = ({ isOpen, onClose, type = 'customers', onImportComplete }) => {
  const [stage, setStage] = useState('upload'); // upload | previewing | preview | importing | done
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState(null); // { newCount, updateCount, errorCount, errors, preview }
  const [csvContent, setCsvContent] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  const isCustomers = type === 'customers';
  const endpoint = isCustomers ? '/customers/import-csv' : '/products/import-csv';
  const label = isCustomers ? 'Customers' : 'Inventory';

  const templateCols = isCustomers
    ? 'name,phone,email,gstin,address,state,statecode,contactperson,notes'
    : 'name,sku,hsnsac,description,quantity,unit,purchaserate,sellingrate,gstrate,minimumstock';

  const requiredCols = isCustomers ? 'name, phone' : 'name, sku';

  const reset = () => {
    setStage('upload');
    setFile(null);
    setDragOver(false);
    setPreview(null);
    setCsvContent('');
    setImporting(false);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => { reset(); onClose(); };

  const processFile = (f) => {
    if (!f) return;
    if (!f.name.endsWith('.csv')) {
      toast.error('Please select a .csv file');
      return;
    }
    if (f.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('File is too large. Maximum size is 5MB.');
      return;
    }
    setFile(f);
    setStage('previewing');
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const content = evt.target.result;
      setCsvContent(content);
      try {
        const res = await api.post(endpoint, { csvContent: content, dryRun: true });
        setPreview(res.data.data);
        setStage('preview');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to parse CSV');
        setStage('upload');
      }
    };
    reader.readAsText(f);
  };

  const handleFileChange = (e) => processFile(e.target.files?.[0]);
  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); processFile(e.dataTransfer.files?.[0]); };

  const handleImport = async () => {
    setImporting(true);
    setStage('importing');
    try {
      const res = await api.post(endpoint, { csvContent, dryRun: false });
      setImportResult(res.data.data);
      setStage('done');
      toast.success(res.data.message);
      onImportComplete?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Import failed');
      setStage('preview');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([templateCols + '\n'], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${type}_template.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9000, padding: '20px', backdropFilter: 'blur(2px)',
    }}>
      <div style={{
        background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '600px',
        maxHeight: '88vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 64px rgba(0,0,0,0.22)', overflow: 'hidden',
        animation: 'modal-pop 0.18s ease-out',
      }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #15527A, #1a6fa6)', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Upload size={18} color="#fff" />
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '15px' }}>Import {label} CSV</span>
          </div>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.8)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

          {/* ===== UPLOAD STAGE ===== */}
          {stage === 'upload' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ fontSize: '13.5px', color: '#374151' }}>
                  Upload a CSV file to import {label.toLowerCase()}. Required columns: <strong>{requiredCols}</strong>.
                </div>
                <button onClick={downloadTemplate} className="btn btn-outline btn-sm" style={{ gap: '5px', fontSize: '12px', whiteSpace: 'nowrap', marginLeft: '10px' }}>
                  <Download size={13} /> Template
                </button>
              </div>

              <div
                style={{
                  border: `2px dashed ${dragOver ? '#15527A' : '#d1d5db'}`,
                  borderRadius: '12px', padding: '40px 20px', textAlign: 'center',
                  background: dragOver ? '#eff6ff' : '#f9fafb', cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={36} color={dragOver ? '#15527A' : '#9ca3af'} style={{ marginBottom: '12px' }} />
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                  {dragOver ? 'Drop CSV here' : 'Click to browse or drag & drop'}
                </div>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>Supports .csv files up to 5MB</div>
                <input ref={fileInputRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleFileChange} />
              </div>

              <div style={{ marginTop: '16px', padding: '12px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', fontSize: '12px', color: '#0c4a6e', lineHeight: 1.6 }}>
                <strong>CSV Column Reference ({label}):</strong><br />
                <code style={{ fontSize: '11px', color: '#374151' }}>{templateCols}</code>
              </div>
            </div>
          )}

          {/* ===== PREVIEWING ===== */}
          {stage === 'previewing' && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <RefreshCw size={36} color="#15527A" style={{ animation: 'spin 1s linear infinite', marginBottom: '12px' }} />
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Analysing CSV...</div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>Validating rows and checking for duplicates</div>
            </div>
          )}

          {/* ===== PREVIEW STAGE ===== */}
          {stage === 'preview' && preview && (
            <div>
              <div style={{ fontSize: '13.5px', color: '#374151', marginBottom: '14px', fontWeight: 600 }}>
                Preview — {file?.name}
              </div>

              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
                {[
                  { label: 'New Records', count: preview.newCount, color: '#16a34a', bg: '#f0fdf4' },
                  { label: 'Updates', count: preview.updateCount, color: '#2563eb', bg: '#eff6ff' },
                  { label: 'Errors', count: preview.errorCount, color: '#dc2626', bg: '#fef2f2' },
                ].map(s => (
                  <div key={s.label} style={{ background: s.bg, borderRadius: '8px', padding: '10px 12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '22px', fontWeight: 900, color: s.color }}>{s.count}</div>
                    <div style={{ fontSize: '11.5px', color: '#6b7280' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Errors */}
              {preview.errors && preview.errors.length > 0 && (
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: '#dc2626', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <AlertCircle size={14} /> Row Errors ({preview.errorCount})
                  </div>
                  <div style={{ maxHeight: '160px', overflowY: 'auto', border: '1px solid #fecaca', borderRadius: '8px' }}>
                    {preview.errors.map((err, i) => (
                      <div key={i} style={{ padding: '7px 12px', borderBottom: '1px solid #fecaca', fontSize: '12px', background: i % 2 === 0 ? '#fef2f2' : '#fff5f5' }}>
                        <span style={{ fontWeight: 700, color: '#dc2626' }}>Row {err.row}:</span>{' '}
                        <span style={{ color: '#374151' }}>{Array.isArray(err.messages) ? err.messages.join('; ') : err.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview table */}
              {preview.preview && preview.preview.length > 0 && (
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: '#374151', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Eye size={14} /> Import Preview (first 10 rows)
                  </div>
                  <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead style={{ background: '#f9fafb', position: 'sticky', top: 0 }}>
                        <tr>
                          <th style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Row</th>
                          <th style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Action</th>
                          <th style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Name</th>
                          <th style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>{isCustomers ? 'Phone' : 'SKU'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.preview.slice(0, 10).map((row, i) => (
                          <tr key={i} style={{ background: row.action === 'error' ? '#fef2f2' : i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                            <td style={{ padding: '6px 10px', borderBottom: '1px solid #f3f4f6', color: '#6b7280' }}>{row.row}</td>
                            <td style={{ padding: '6px 10px', borderBottom: '1px solid #f3f4f6' }}>
                              <span style={{
                                display: 'inline-block', padding: '2px 8px', borderRadius: '99px', fontSize: '11px', fontWeight: 700,
                                background: row.action === 'create' ? '#dcfce7' : row.action === 'update' ? '#dbeafe' : '#fee2e2',
                                color: row.action === 'create' ? '#15803d' : row.action === 'update' ? '#1d4ed8' : '#dc2626',
                              }}>
                                {row.action === 'create' ? 'NEW' : row.action === 'update' ? 'UPDATE' : 'ERROR'}
                              </span>
                            </td>
                            <td style={{ padding: '6px 10px', borderBottom: '1px solid #f3f4f6', fontWeight: 500 }}>{row.name || '-'}</td>
                            <td style={{ padding: '6px 10px', borderBottom: '1px solid #f3f4f6' }}>{isCustomers ? (row.phone || '-') : (row.sku || '-')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {preview.errorCount > 0 && preview.newCount + preview.updateCount === 0 && (
                <div style={{ marginTop: '12px', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '13px', color: '#dc2626', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <AlertCircle size={16} /> All rows have errors. Fix the CSV and try again.
                </div>
              )}
            </div>
          )}

          {/* ===== IMPORTING ===== */}
          {stage === 'importing' && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <RefreshCw size={36} color="#15527A" style={{ animation: 'spin 1s linear infinite', marginBottom: '12px' }} />
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Importing {label}...</div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>Please wait, do not close this window</div>
            </div>
          )}

          {/* ===== DONE ===== */}
          {stage === 'done' && importResult && (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <CheckCircle size={48} color="#16a34a" style={{ marginBottom: '12px' }} />
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#111', marginBottom: '6px' }}>Import Complete!</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', margin: '16px 0' }}>
                {[
                  { label: 'Created', count: importResult.newCount, color: '#16a34a', bg: '#f0fdf4' },
                  { label: 'Updated', count: importResult.updateCount, color: '#2563eb', bg: '#eff6ff' },
                  { label: 'Skipped', count: importResult.errorCount, color: '#dc2626', bg: '#fef2f2' },
                ].map(s => (
                  <div key={s.label} style={{ background: s.bg, borderRadius: '8px', padding: '10px 12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '22px', fontWeight: 900, color: s.color }}>{s.count}</div>
                    <div style={{ fontSize: '11.5px', color: '#6b7280' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '10px', justifyContent: 'flex-end', flexShrink: 0, background: '#f9fafb' }}>
          {stage === 'upload' && (
            <button onClick={handleClose} className="btn btn-outline">Cancel</button>
          )}
          {stage === 'preview' && (
            <>
              <button onClick={reset} className="btn btn-outline">Choose Different File</button>
              {preview && (preview.newCount + preview.updateCount > 0) && (
                <button
                  onClick={handleImport}
                  className="btn btn-primary"
                  disabled={importing}
                  style={{ gap: '6px' }}
                >
                  <Upload size={14} />
                  Import {(preview.newCount || 0) + (preview.updateCount || 0)} Records
                </button>
              )}
            </>
          )}
          {(stage === 'done') && (
            <>
              <button onClick={reset} className="btn btn-outline" style={{ gap: '5px' }}>
                <Upload size={14} /> Import Another
              </button>
              <button onClick={handleClose} className="btn btn-primary">Done</button>
            </>
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
};

export default CSVImportModal;
