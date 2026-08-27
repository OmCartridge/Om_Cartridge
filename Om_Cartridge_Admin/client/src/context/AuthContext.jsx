import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('om_token');
    const storedUser = localStorage.getItem('om_user');
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('om_token');
        localStorage.removeItem('om_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user: userData } = response.data.data;
    localStorage.setItem('om_token', token);
    localStorage.setItem('om_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {}
    localStorage.removeItem('om_token');
    localStorage.removeItem('om_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
