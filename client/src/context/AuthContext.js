import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sso_user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem('sso_token');
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.data);
      localStorage.setItem('sso_user', JSON.stringify(data.data));
    } catch {
      localStorage.removeItem('sso_token');
      localStorage.removeItem('sso_user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('sso_token', data.token);
    localStorage.setItem('sso_user', JSON.stringify(data.data));
    setUser(data.data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('sso_token');
    localStorage.removeItem('sso_user');
    setUser(null);
  };

  const updateUser = (updates) => {
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem('sso_user', JSON.stringify(updated));
  };

  const isSuperAdmin = user?.role === 'super_admin';
  const isSchoolAdmin = user?.role === 'school_admin';

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, isSuperAdmin, isSchoolAdmin, fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
