import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import {
  GraduationCap, LayoutDashboard, Users, BookOpen, School,
  ClipboardCheck, DollarSign, FileText, Settings, LogOut,
  Menu, X, Sun, Moon, Bell, ChevronDown, Building2, UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import toast from 'react-hot-toast';

const schoolAdminLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/students', icon: Users, label: 'Students' },
  { to: '/teachers', icon: UserCheck, label: 'Teachers' },
  { to: '/classes', icon: BookOpen, label: 'Classes' },
  { to: '/attendance', icon: ClipboardCheck, label: 'Attendance' },
  { to: '/fees', icon: DollarSign, label: 'Fee Management' },
  { to: '/reports', icon: FileText, label: 'Report Cards' },
  { to: '/school-profile', icon: Settings, label: 'School Profile' },
];

const superAdminLinks = [
  { to: '/super/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/super/schools', icon: Building2, label: 'Schools' },
  { to: '/super/users', icon: Users, label: 'Users' },
];

export default function DashboardLayout({ role }) {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const links = role === 'super_admin' ? superAdminLinks : schoolAdminLinks;

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-surface-100 dark:border-surface-700/50">
        <Link to={role === 'super_admin' ? '/super/dashboard' : '/dashboard'} className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center shadow-glow flex-shrink-0">
            <GraduationCap size={19} className="text-white" />
          </div>
          <div>
            <p className="font-display font-bold text-sm leading-tight text-slate-800 dark:text-white">Smart School OS</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">
              {role === 'super_admin' ? 'Platform Admin' : 'School Admin'}
            </p>
          </div>
        </Link>
      </div>

      {/* School name badge (school admin only) */}
      {role === 'school_admin' && user?.schoolId && (
        <div className="mx-3 mt-3 px-3 py-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-100 dark:border-primary-800/30">
          <div className="flex items-center gap-2">
            <School size={13} className="text-primary-500 flex-shrink-0" />
            <span className="text-xs font-medium text-primary-700 dark:text-primary-400 truncate">
              {typeof user.schoolId === 'object' ? user.schoolId.name : 'Your School'}
            </span>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => isActive ? 'sidebar-link-active' : 'sidebar-link-idle'}
          >
            <Icon size={17} className="flex-shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User / Logout */}
      <div className="p-3 border-t border-surface-100 dark:border-surface-700/50">
        <button
          onClick={handleLogout}
          className="w-full sidebar-link-idle text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600"
        >
          <LogOut size={17} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-[var(--sidebar-width)] bg-white dark:bg-surface-900 border-r border-surface-200 dark:border-surface-700/50 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-72 bg-white dark:bg-surface-900 shadow-2xl flex flex-col animate-slide-in">
            <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 btn-icon text-slate-400">
              <X size={18} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="h-16 bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700/50 flex items-center justify-between px-4 md:px-6 flex-shrink-0 z-10">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden btn-icon text-slate-500">
            <Menu size={20} />
          </button>

          <div className="flex-1 lg:flex-none" />

          <div className="flex items-center gap-2">
            {/* Dark mode */}
            <button onClick={toggle} className="btn-icon text-slate-500 dark:text-slate-400 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg">
              {dark ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(o => !o)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-all"
              >
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                  {initials}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-tight">{user?.name}</p>
                  <p className="text-[11px] text-slate-400 leading-tight capitalize">{user?.role?.replace('_', ' ')}</p>
                </div>
                <ChevronDown size={14} className="text-slate-400 hidden md:block" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 card shadow-card-lg py-1 z-50 animate-fade-in">
                  <div className="px-3 py-2 border-b border-surface-100 dark:border-surface-700">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{user?.name}</p>
                    <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => { setProfileOpen(false); handleLogout(); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut size={15} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
