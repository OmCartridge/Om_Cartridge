import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import OMLogo from '../components/OMLogo';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { login } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const errs = {};
    if (!email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Enter a valid email';
    if (!password) errs.password = 'Password is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      await login(email.trim(), password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed. Please check connection.';
      toast.error(msg);
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white font-sans">
      {/* Left Brand Panel (Desktop) */}
      <div className="hidden lg:flex flex-col items-center justify-center p-12 bg-navy relative overflow-hidden text-white select-none">
        <div className="absolute -top-24 -right-20 w-80 h-80 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-16 -left-10 w-64 h-64 rounded-full bg-red-brand/10 pointer-events-none" />

        <div className="relative z-10 max-w-sm text-center flex flex-col items-center">
          <OMLogo variant="full" />
          <p className="text-sm text-white/80 mt-4 leading-relaxed max-w-[300px]">
            Professional Stock &amp; Billing Management for your Printer Cartridge Business
          </p>

          <div className="mt-12 space-y-3.5 text-left w-full max-w-[280px]">
            {['Track Inventory & Stock', 'Generate GST & Non-Tax Invoices', 'Manage Customers Seamlessly', 'Download & Print Canonical Bills'].map((f) => (
              <div key={f} className="flex items-center gap-3 text-[13px] text-white/85">
                <span className="w-2 h-2 rounded-full bg-red-brand flex-shrink-0" />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Form Panel (Mobile, Tablet & Desktop) */}
      <div className="flex flex-col items-center justify-center p-6 sm:p-12 bg-surface-bg min-h-screen lg:min-h-0">
        {/* Mobile Header Logo */}
        <div className="lg:hidden mb-6 flex justify-center">
          <OMLogo variant="compact" />
        </div>

        <div className="w-full max-w-md bg-white rounded-2xl p-6 sm:p-10 shadow-lg border border-app-border">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Sign In</h2>
          <p className="text-sm text-gray-500 mt-1 mb-6">Enter your credentials to access the system</p>

          {errors.general && (
            <div className="bg-red-50 text-app-danger p-3 rounded-lg text-xs font-semibold mb-4 border border-red-200">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-group mb-0">
              <label className="form-label" htmlFor="login-email">
                Email Address <span className="required">*</span>
              </label>
              <input
                id="login-email"
                type="email"
                className={`form-control ${errors.email ? 'error' : ''}`}
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
              {errors.email && <div className="form-error">{errors.email}</div>}
            </div>

            <div className="form-group mb-0">
              <label className="form-label" htmlFor="login-password">
                Password <span className="required">*</span>
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className={`form-control pr-11 ${errors.password ? 'error' : ''}`}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <div className="form-error">{errors.password}</div>}
            </div>

            <button
              id="login-submit"
              type="submit"
              className="btn btn-primary w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
              disabled={loading}
            >
              <LogIn size={16} />
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="text-center mt-6 text-xs text-gray-400 font-medium tracking-wide">
            OM ENTERPRISE • OM CARTRIDGE Management System
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

