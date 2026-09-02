import { useEffect } from 'react';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

/**
 * Professional Confirmation/Alert Modal
 *
 * Props:
 *   isOpen       — boolean
 *   variant      — 'danger' | 'warning' | 'info'  (default: 'danger')
 *   title        — string
 *   message      — string | ReactNode
 *   warning      — string (optional extra warning text)
 *   confirmText  — string (default: 'Confirm')
 *   cancelText   — string (default: 'Cancel')
 *   onConfirm    — function
 *   onCancel     — function
 *   loading      — boolean (disables confirm btn while processing)
 */
const ConfirmModal = ({
  isOpen,
  variant = 'danger',
  title,
  message,
  warning,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  loading = false,
}) => {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape' && !loading) onCancel?.(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, loading, onCancel]);

  if (!isOpen) return null;

  const colors = {
    danger:  { bg: '#fef2f2', border: '#fecaca', icon: '#dc2626', btn: '#dc2626', btnHover: '#b91c1c', iconComp: <AlertTriangle size={22} color="#dc2626" /> },
    warning: { bg: '#fffbeb', border: '#fde68a', icon: '#d97706', btn: '#d97706', btnHover: '#b45309', iconComp: <AlertTriangle size={22} color="#d97706" /> },
    info:    { bg: '#eff6ff', border: '#bfdbfe', icon: '#2563eb', btn: '#15527A', btnHover: '#0e3a57', iconComp: <Info size={22} color="#2563eb" /> },
  };
  const c = colors[variant] || colors.danger;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, padding: '20px', backdropFilter: 'blur(2px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onCancel?.(); }}
    >
      <div style={{
        background: '#fff', borderRadius: '12px', maxWidth: '440px', width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden',
        animation: 'modal-pop 0.18s ease-out',
      }}>
        {/* Icon Header */}
        <div style={{
          background: c.bg, borderBottom: `1px solid ${c.border}`,
          padding: '20px 24px 16px', display: 'flex', alignItems: 'flex-start', gap: '14px',
        }}>
          <div style={{ flexShrink: 0, marginTop: '2px' }}>{c.iconComp}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '16px', color: '#111', lineHeight: 1.3 }}>{title}</div>
            {message && (
              <div style={{ marginTop: '6px', fontSize: '13.5px', color: '#374151', lineHeight: 1.55 }}>
                {message}
              </div>
            )}
          </div>
          {!loading && (
            <button
              onClick={onCancel}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '2px', flexShrink: 0 }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Warning box */}
        {warning && (
          <div style={{
            background: '#fffbeb', borderBottom: '1px solid #fde68a',
            padding: '10px 24px', display: 'flex', alignItems: 'flex-start', gap: '8px',
          }}>
            <AlertCircle size={14} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span style={{ fontSize: '12.5px', color: '#92400e', lineHeight: 1.5 }}>{warning}</span>
          </div>
        )}

        {/* Actions */}
        <div style={{
          padding: '16px 24px', display: 'flex', gap: '10px', justifyContent: 'flex-end',
        }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: '9px 20px', borderRadius: '8px', border: '1.5px solid #d1d5db',
              background: '#fff', color: '#374151', cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '13.5px', fontWeight: 600, transition: 'all 0.15s',
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: '9px 22px', borderRadius: '8px', border: 'none',
              background: loading ? '#9ca3af' : c.btn, color: '#fff',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '13.5px', fontWeight: 700, transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            {loading ? (
              <>
                <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                Processing...
              </>
            ) : confirmText}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modal-pop {
          from { opacity: 0; transform: scale(0.94) translateY(-8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ConfirmModal;
