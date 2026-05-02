import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Layouts
import DashboardLayout from './components/layout/DashboardLayout';
import AuthLayout from './components/layout/AuthLayout';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// School Admin pages
import SchoolDashboard from './pages/schooladmin/Dashboard';
import StudentsPage from './pages/schooladmin/Students';
import TeachersPage from './pages/schooladmin/Teachers';
import ClassesPage from './pages/schooladmin/Classes';
import AttendancePage from './pages/schooladmin/Attendance';
import FeesPage from './pages/schooladmin/Fees';
import ReportsPage from './pages/schooladmin/Reports';
import SchoolProfilePage from './pages/schooladmin/SchoolProfile';

// Super Admin pages
import SuperDashboard from './pages/superadmin/Dashboard';
import SchoolsPage from './pages/superadmin/Schools';
import UsersPage from './pages/superadmin/Users';

import LoadingSpinner from './components/common/LoadingSpinner';

// Route guards
const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner fullscreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner fullscreen />;
  if (user) return <Navigate to={user.role === 'super_admin' ? '/super/dashboard' : '/dashboard'} replace />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      </Route>

      {/* School Admin */}
      <Route element={
        <ProtectedRoute roles={['school_admin']}>
          <DashboardLayout role="school_admin" />
        </ProtectedRoute>
      }>
        <Route path="/dashboard" element={<SchoolDashboard />} />
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/teachers" element={<TeachersPage />} />
        <Route path="/classes" element={<ClassesPage />} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/fees" element={<FeesPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/school-profile" element={<SchoolProfilePage />} />
      </Route>

      {/* Super Admin */}
      <Route element={
        <ProtectedRoute roles={['super_admin']}>
          <DashboardLayout role="super_admin" />
        </ProtectedRoute>
      }>
        <Route path="/super/dashboard" element={<SuperDashboard />} />
        <Route path="/super/schools" element={<SchoolsPage />} />
        <Route path="/super/users" element={<UsersPage />} />
      </Route>

      <Route path="/unauthorized" element={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-display font-bold text-slate-800 dark:text-white mb-2">403</h1>
            <p className="text-slate-500">You are not authorized to view this page.</p>
          </div>
        </div>
      } />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: '14px',
                borderRadius: '10px',
                padding: '12px 16px',
              },
              success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
