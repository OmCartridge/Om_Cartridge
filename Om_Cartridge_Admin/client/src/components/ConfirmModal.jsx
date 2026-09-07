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

  const variantStyles = {
    danger: {
      headerBg: 'bg-red-50 border-red-200',
      icon: <AlertTriangle size={22} className="text-app-danger flex-shrink-0 mt-0.5" />,
      btn: 'bg-app-danger hover:bg-app-danger-dark text-white',
    },
    warning: {
      headerBg: 'bg-amber-50 border-amber-200',
      icon: <AlertTriangle size={22} className="text-app-warning flex-shrink-0 mt-0.5" />,
      btn: 'bg-app-warning hover:bg-app-warning-dark text-white',
    },
    info: {
      headerBg: 'bg-blue-50 border-blue-200',
      icon: <Info size={22} className="text-app-info flex-shrink-0 mt-0.5" />,
      btn: 'bg-navy hover:bg-navy-dark text-white',
    },
  };
  const c = variantStyles[variant] || variantStyles.danger;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm transition-opacity"
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onCancel?.(); }}
    >
      <div className="bg-white rounded-xl max-w-md w-full shadow-2xl overflow-hidden animate-[modal-pop_0.18s_ease-out]">
        {/* Icon Header */}
        <div className={`p-5 sm:p-6 border-b flex items-start gap-3.5 ${c.headerBg}`}>
          {c.icon}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base text-gray-900 leading-snug">{title}</h3>
            {message && (
              <div className="mt-1.5 text-[13.5px] text-gray-600 leading-relaxed">
                {message}
              </div>
            )}
          </div>
          {!loading && (
            <button
              type="button"
              onClick={onCancel}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-black/5 transition-colors flex-shrink-0"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Warning box */}
        {warning && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-start gap-2 text-amber-900 text-xs leading-normal">
            <AlertCircle size={14} className="text-app-warning flex-shrink-0 mt-0.5" />
            <span>{warning}</span>
          </div>
        )}

        {/* Actions */}
        <div className="p-4 sm:px-6 flex gap-2.5 justify-end bg-white">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-[13.5px] font-semibold hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-5 py-2 rounded-lg text-[13.5px] font-bold shadow-sm transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed ${
              loading ? 'bg-gray-400 text-white' : c.btn
            }`}
          >
            {loading ? (
              <>
                <span className="inline-block w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;

