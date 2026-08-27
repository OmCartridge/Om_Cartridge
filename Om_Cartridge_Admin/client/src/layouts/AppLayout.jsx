import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Users, FileText, PlusCircle, Settings, LogOut, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import OMLogo from '../components/OMLogo';
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

  const handleLogout = async () => {
    if (!window.confirm('Are you sure you want to logout?')) return;
    await logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <OMLogo variant="compact" />
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              end={to === '/dashboard'}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item" onClick={handleLogout} style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left' }}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="main-area">
        <header className="top-header">
          <div className="header-title">{title || 'OM Cartridge Management'}</div>
          <div className="header-right">
            <div className="header-user">
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--navy)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>
                {user?.name?.[0]?.toUpperCase() || 'A'}
              </div>
              <span>{user?.name || 'Admin'}</span>
            </div>
          </div>
        </header>

        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
