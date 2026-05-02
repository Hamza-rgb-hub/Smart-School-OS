import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export default function AuthLayout() {
  const { dark, toggle } = useTheme();

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 via-primary-50/30 to-indigo-50/50 dark:from-surface-950 dark:via-surface-900 dark:to-primary-950/30 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center shadow-glow">
            <GraduationCap size={20} className="text-white" />
          </div>
          <span className="font-display font-bold text-lg text-slate-800 dark:text-white">Smart School OS</span>
        </Link>
        <button onClick={toggle} className="btn-icon text-slate-500 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-surface-800 rounded-lg transition-all">
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-slide-up">
          <Outlet />
        </div>
      </div>

      <footer className="text-center py-4 text-xs text-slate-400 dark:text-slate-600">
        © {new Date().getFullYear()} Smart School OS — Built for modern education
      </footer>
    </div>
  );
}
