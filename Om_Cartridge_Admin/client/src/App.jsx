import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import StockPage from './pages/StockPage';
import CustomersPage from './pages/CustomersPage';
import CreateInvoicePage from './pages/CreateInvoicePage';
import InvoicesPage from './pages/InvoicesPage';
import InvoiceViewPage from './pages/InvoiceViewPage';
import SettingsPage from './pages/SettingsPage';

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 12px' }} />
          <div style={{ color: '#6b7280', fontSize: '14px' }}>Loading...</div>
        </div>
      </div>
    );
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Public Route - redirect if already logged in
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/stock" element={<ProtectedRoute><StockPage /></ProtectedRoute>} />
      <Route path="/customers" element={<ProtectedRoute><CustomersPage /></ProtectedRoute>} />
      <Route path="/invoices/create" element={<ProtectedRoute><CreateInvoicePage /></ProtectedRoute>} />
      <Route path="/invoices/:id" element={<ProtectedRoute><InvoiceViewPage /></ProtectedRoute>} />
      <Route path="/invoices" element={<ProtectedRoute><InvoicesPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: { fontSize: '13.5px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
            success: { iconTheme: { primary: '#16a34a', secondary: '#fff' } },
            error: { iconTheme: { primary: '#dc2626', secondary: '#fff' } },
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
