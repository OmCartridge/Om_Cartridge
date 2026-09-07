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
    <div
      className="fixed inset-0 bg-black/50 z-[9000] flex items-center justify-center p-4 backdrop-blur-sm transition-opacity"
      onClick={(e) => { if (e.target === e.currentTarget && !importing) handleClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-[modal-pop_0.18s_ease-out]">
        {/* Header */}
        <div className="bg-gradient-to-r from-navy to-[#1a6fa6] px-5 py-4 flex items-center justify-between text-white flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <Upload size={18} className="text-white" />
            <span className="text-white font-bold text-base">Import {label} CSV</span>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {/* ===== UPLOAD STAGE ===== */}
          {stage === 'upload' && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5">
                <p className="text-[13.5px] text-gray-700 leading-snug">
                  Upload a CSV file to import {label.toLowerCase()}. Required columns: <strong>{requiredCols}</strong>.
                </p>
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="btn btn-outline btn-sm self-start sm:self-auto gap-1.5 whitespace-nowrap text-xs"
                >
                  <Download size={13} /> Template
                </button>
              </div>

              <div
                className={`border-2 border-dashed rounded-xl p-8 sm:p-10 text-center cursor-pointer transition-all ${
                  dragOver
                    ? 'border-navy bg-sky-50'
                    : 'border-gray-300 bg-gray-50 hover:bg-gray-100/50'
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload
                  size={36}
                  className={`mx-auto mb-3 ${dragOver ? 'text-navy' : 'text-gray-400'}`}
                />
                <div className="text-sm font-semibold text-gray-700">
                  {dragOver ? 'Drop CSV here' : 'Click to browse or drag & drop'}
                </div>
                <div className="text-xs text-gray-400 mt-1">Supports .csv files up to 5MB</div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              <div className="mt-4 p-3 bg-sky-50 border border-sky-200 rounded-lg text-xs text-sky-900 leading-relaxed">
                <strong>CSV Column Reference ({label}):</strong><br />
                <code className="text-[11px] text-gray-700 block mt-1 break-all bg-white/60 p-1.5 rounded font-mono">{templateCols}</code>
              </div>
            </div>
          )}

          {/* ===== PREVIEWING ===== */}
          {stage === 'previewing' && (
            <div className="text-center py-12">
              <RefreshCw size={36} className="text-navy animate-spin mx-auto mb-3" />
              <div className="text-sm font-semibold text-gray-800">Analysing CSV...</div>
              <div className="text-xs text-gray-400 mt-1">Validating rows and checking for duplicates</div>
            </div>
          )}

          {/* ===== PREVIEW STAGE ===== */}
          {stage === 'preview' && preview && (
            <div>
              <div className="text-sm text-gray-700 mb-3.5 font-semibold">
                Preview — {file?.name}
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4">
                {[
                  { label: 'New Records', count: preview.newCount, color: 'text-emerald-700', bg: 'bg-emerald-50' },
                  { label: 'Updates', count: preview.updateCount, color: 'text-blue-700', bg: 'bg-blue-50' },
                  { label: 'Errors', count: preview.errorCount, color: 'text-red-700', bg: 'bg-red-50' },
                ].map((s) => (
                  <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center border border-black/5`}>
                    <div className={`text-2xl font-black ${s.color}`}>{s.count}</div>
                    <div className="text-xs text-gray-500 font-medium mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Errors */}
              {preview.errors && preview.errors.length > 0 && (
                <div className="mb-3.5">
                  <div className="font-bold text-xs text-app-danger mb-1.5 flex items-center gap-1.5">
                    <AlertCircle size={14} /> Row Errors ({preview.errorCount})
                  </div>
                  <div className="max-h-40 overflow-y-auto border border-red-200 rounded-lg divide-y divide-red-100">
                    {preview.errors.map((err, i) => (
                      <div key={i} className="p-2 text-xs bg-red-50/50">
                        <span className="font-bold text-app-danger">Row {err.row}:</span>{' '}
                        <span className="text-gray-700">{Array.isArray(err.messages) ? err.messages.join('; ') : err.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview table */}
              {preview.preview && preview.preview.length > 0 && (
                <div>
                  <div className="font-bold text-xs text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <Eye size={14} /> Import Preview (first 10 rows)
                  </div>
                  <div className="overflow-x-auto border border-app-border rounded-lg max-h-52 overflow-y-auto">
                    <table className="w-full border-collapse text-xs">
                      <thead className="bg-gray-50 sticky top-0 border-b border-app-border">
                        <tr>
                          <th className="p-2 text-left font-bold text-gray-500">Row</th>
                          <th className="p-2 text-left font-bold text-gray-500">Action</th>
                          <th className="p-2 text-left font-bold text-gray-500">Name</th>
                          <th className="p-2 text-left font-bold text-gray-500">{isCustomers ? 'Phone' : 'SKU'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {preview.preview.slice(0, 10).map((row, i) => (
                          <tr key={i} className={row.action === 'error' ? 'bg-red-50/60' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}>
                            <td className="p-2 text-gray-500">{row.row}</td>
                            <td className="p-2">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                row.action === 'create'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : row.action === 'update'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {row.action === 'create' ? 'NEW' : row.action === 'update' ? 'UPDATE' : 'ERROR'}
                              </span>
                            </td>
                            <td className="p-2 font-medium text-gray-900">{row.name || '-'}</td>
                            <td className="p-2 text-gray-600">{isCustomers ? (row.phone || '-') : (row.sku || '-')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {preview.errorCount > 0 && preview.newCount + preview.updateCount === 0 && (
                <div className="mt-3 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-semibold flex items-center gap-2">
                  <AlertCircle size={16} /> All rows have errors. Fix the CSV and try again.
                </div>
              )}
            </div>
          )}

          {/* ===== IMPORTING ===== */}
          {stage === 'importing' && (
            <div className="text-center py-12">
              <RefreshCw size={36} className="text-navy animate-spin mx-auto mb-3" />
              <div className="text-sm font-semibold text-gray-800">Importing {label}...</div>
              <div className="text-xs text-gray-400 mt-1">Please wait, do not close this window</div>
            </div>
          )}

          {/* ===== DONE ===== */}
          {stage === 'done' && importResult && (
            <div className="text-center py-4">
              <CheckCircle size={48} className="text-emerald-600 mx-auto mb-3" />
              <h4 className="text-base font-extrabold text-gray-900 mb-1">Import Complete!</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 my-4">
                {[
                  { label: 'Created', count: importResult.newCount, color: 'text-emerald-700', bg: 'bg-emerald-50' },
                  { label: 'Updated', count: importResult.updateCount, color: 'text-blue-700', bg: 'bg-blue-50' },
                  { label: 'Skipped', count: importResult.errorCount, color: 'text-red-700', bg: 'bg-red-50' },
                ].map((s) => (
                  <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center border border-black/5`}>
                    <div className={`text-2xl font-black ${s.color}`}>{s.count}</div>
                    <div className="text-xs text-gray-500 font-medium mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 sm:px-5 border-t border-app-border flex gap-2.5 justify-end bg-gray-50 flex-shrink-0">
          {stage === 'upload' && (
            <button type="button" onClick={handleClose} className="btn btn-outline">Cancel</button>
          )}
          {stage === 'preview' && (
            <>
              <button type="button" onClick={reset} className="btn btn-outline">Choose Different File</button>
              {preview && (preview.newCount + preview.updateCount > 0) && (
                <button
                  type="button"
                  onClick={handleImport}
                  className="btn btn-primary gap-1.5"
                  disabled={importing}
                >
                  <Upload size={14} />
                  Import {(preview.newCount || 0) + (preview.updateCount || 0)} Records
                </button>
              )}
            </>
          )}
          {stage === 'done' && (
            <>
              <button type="button" onClick={reset} className="btn btn-outline gap-1.5">
                <Upload size={14} /> Import Another
              </button>
              <button type="button" onClick={handleClose} className="btn btn-primary">Done</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};


export default CSVImportModal;

