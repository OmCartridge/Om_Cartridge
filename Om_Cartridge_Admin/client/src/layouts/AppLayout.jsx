import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Users, FileText, PlusCircle, Settings, LogOut, Menu, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import OMLogo from '../components/OMLogo';
import ConfirmModal from '../components/ConfirmModal';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/stock', label: 'Stock', icon: Package },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/invoices/create', label: 'Create Invoice', icon: PlusCircle },
  { to: '/invoices', label: 'Invoices', icon: FileText },
  { to: '/settings', label: 'Settings', icon: Settings },
];

const AppLayout = ({ children, title }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } finally {
      setLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-surface-bg font-sans">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - Desktop (static w-60) & Mobile Drawer (fixed off-canvas w-64) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-navy text-white flex flex-col transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none lg:static lg:translate-x-0 lg:w-60 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <OMLogo variant="compact" />
          <button
            type="button"
            className="lg:hidden p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 py-3 px-2.5 space-y-1 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] font-medium transition-all ${
                  isActive
                    ? 'bg-white/15 text-white font-semibold shadow-sm border-l-4 border-red-brand pl-2'
                    : 'text-white/75 hover:bg-white/10 hover:text-white border-l-4 border-transparent pl-2'
                }`
              }
            >
              <Icon size={18} className="flex-shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-2.5 border-t border-white/10">
          <button
            type="button"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] font-medium text-white/75 hover:bg-red-brand/20 hover:text-white transition-colors border-l-4 border-transparent pl-2 text-left"
            onClick={() => {
              setMobileMenuOpen(false);
              setShowLogoutConfirm(true);
            }}
          >
            <LogOut size={18} className="flex-shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Shell */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-[60px] bg-surface-white border-b border-app-border flex items-center justify-between px-4 sm:px-6 flex-shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              className="lg:hidden p-2 -ml-2 text-app-text-dark hover:bg-surface-bg rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(true)}
              title="Open Navigation"
              aria-label="Open Navigation"
            >
              <Menu size={22} />
            </button>
            <h1 className="text-base sm:text-lg font-semibold text-app-text-dark tracking-tight truncate">
              {title || 'OM Cartridge Management'}
            </h1>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-bg rounded-full border border-app-border">
              <div className="w-7 h-7 rounded-full bg-navy text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                {user?.name?.[0]?.toUpperCase() || 'A'}
              </div>
              <span className="hidden sm:inline text-xs font-medium text-app-text-dark">
                {user?.name || 'Admin'}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-surface-bg focus:outline-none">
          {children}
        </main>
      </div>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        variant="warning"
        title="Logout?"
        message="Are you sure you want to log out of the system?"
        confirmText="Logout"
        cancelText="Stay"
        loading={loggingOut}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
};

export default AppLayout;

