import React from 'react';
import { Loader2, AlertTriangle, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';

// Loading Spinner
export const LoadingSpinner = ({ fullscreen, size = 24, text = 'Loading...' }) => {
  if (fullscreen) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface-50 dark:bg-surface-950">
      <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center mb-4 shadow-glow animate-pulse-soft">
        <Loader2 size={22} className="text-white animate-spin" />
      </div>
      <p className="text-sm text-slate-400">{text}</p>
    </div>
  );
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 size={size} className="text-primary-500 animate-spin" />
    </div>
  );
};
export default LoadingSpinner;

// Empty State
export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="w-16 h-16 bg-surface-100 dark:bg-surface-800 rounded-2xl flex items-center justify-center mb-4">
      {Icon && <Icon size={28} className="text-slate-400" />}
    </div>
    <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-1">{title}</h3>
    {description && <p className="text-sm text-slate-400 dark:text-slate-500 max-w-xs mb-4">{description}</p>}
    {action}
  </div>
);

// Confirmation Modal
export const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Delete', confirmClass = 'btn-danger', loading }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card p-6 w-full max-w-sm shadow-card-lg animate-slide-up">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={20} className="text-red-500" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-white">{title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{message}</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="btn-secondary" disabled={loading}>Cancel</button>
          <button onClick={onConfirm} className={confirmClass} disabled={loading}>
            {loading ? <Loader2 size={14} className="animate-spin" /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// Pagination
export const Pagination = ({ pagination, onPageChange }) => {
  if (!pagination || pagination.pages <= 1) return null;
  const { page, pages, total, limit } = pagination;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-surface-100 dark:border-surface-700">
      <p className="text-xs text-slate-400">Showing {from}–{to} of {total}</p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!pagination.hasPrev}
          className="btn-icon btn-secondary disabled:opacity-40 p-1.5"
        >
          <ChevronLeft size={15} />
        </button>
        {Array.from({ length: Math.min(5, pages) }, (_, i) => {
          let p;
          if (pages <= 5) p = i + 1;
          else if (page <= 3) p = i + 1;
          else if (page >= pages - 2) p = pages - 4 + i;
          else p = page - 2 + i;
          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${p === page ? 'bg-primary-600 text-white' : 'btn-secondary px-0'}`}
            >
              {p}
            </button>
          );
        })}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!pagination.hasNext}
          className="btn-icon btn-secondary disabled:opacity-40 p-1.5"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
};

// Search Input
export const SearchInput = ({ value, onChange, placeholder = 'Search...', className = '' }) => (
  <div className={`relative ${className}`}>
    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="input pl-9 pr-8"
    />
    {value && (
      <button onClick={() => onChange('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
        <X size={14} />
      </button>
    )}
  </div>
);

// Modal wrapper
export const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-3xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative card w-full ${sizes[size]} shadow-card-lg animate-slide-up max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between p-5 border-b border-surface-100 dark:border-surface-700 flex-shrink-0">
          <h2 className="font-display font-semibold text-lg text-slate-800 dark:text-white">{title}</h2>
          <button onClick={onClose} className="btn-icon text-slate-400 hover:text-slate-600 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-5">{children}</div>
      </div>
    </div>
  );
};

// Status badge helper
export const StatusBadge = ({ status }) => {
  const map = {
    approved: 'badge-green', active: 'badge-green', paid: 'badge-green', present: 'badge-green', published: 'badge-green',
    pending: 'badge-yellow', partial: 'badge-yellow', late: 'badge-yellow',
    rejected: 'badge-red', suspended: 'badge-red', overdue: 'badge-red', absent: 'badge-red', inactive: 'badge-red',
    draft: 'badge-gray', excused: 'badge-blue',
  };
  return <span className={map[status] || 'badge-gray'}>{status}</span>;
};

// Avatar
export const Avatar = ({ src, name, size = 8 }) => {
  const initials = name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  if (src) return (
    <img
      src={src}
      alt={name}
      className={`w-${size} h-${size} rounded-lg object-cover flex-shrink-0`}
    />
  );
  return (
    <div className={`w-${size} h-${size} rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0`}>
      <span className="text-primary-600 dark:text-primary-400 font-semibold text-xs">{initials}</span>
    </div>
  );
};

// Stat card
export const StatCard = ({ icon: Icon, label, value, color = 'primary', trend, loading }) => {
  const colors = {
    primary: 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400',
    green: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    yellow: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  };
  return (
    <div className="stat-card">
      <div className={`stat-icon ${colors[color]}`}>
        <Icon size={22} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{label}</p>
        {loading
          ? <div className="h-7 w-16 bg-surface-200 dark:bg-surface-700 rounded animate-pulse mt-0.5" />
          : <p className="text-2xl font-display font-bold text-slate-800 dark:text-white">{value ?? '—'}</p>
        }
        {trend && <p className="text-xs text-slate-400 mt-0.5">{trend}</p>}
      </div>
    </div>
  );
};
