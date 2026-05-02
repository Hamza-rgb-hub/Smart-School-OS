import React, { useState, useEffect } from 'react';
import { Building2, Users, GraduationCap, UserCheck, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../../services/api';
import { StatCard, StatusBadge } from '../../components/common/LoadingSpinner';
import { format } from 'date-fns';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const PIE_COLORS = { approved: '#10b981', pending: '#f59e0b', rejected: '#ef4444', suspended: '#94a3b8' };

export default function SuperDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/super-admin/analytics')
      .then(r => setData(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = data?.stats || {};

  const registrationChartData = (data?.monthlyRegistrations || []).map(r => ({
    name: MONTHS[r._id.month - 1],
    Schools: r.count
  }));

  const pieData = (data?.schoolsByStatus || []).map(s => ({
    name: s.status.charAt(0).toUpperCase() + s.status.slice(1),
    value: s.count,
    fill: PIE_COLORS[s.status] || '#94a3b8'
  })).filter(s => s.value > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Platform Overview</h1>
        <p className="page-subtitle">Smart School OS · {format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Building2} label="Total Schools" value={stats.totalSchools} color="primary" loading={loading} />
        <StatCard icon={CheckCircle} label="Approved" value={stats.approvedSchools} color="green" loading={loading} />
        <StatCard icon={Clock} label="Pending" value={stats.pendingSchools} color="yellow" loading={loading} />
        <StatCard icon={AlertTriangle} label="Suspended" value={stats.suspendedSchools} color="red" loading={loading} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={Users} label="School Admins" value={stats.totalUsers} color="blue" loading={loading} />
        <StatCard icon={GraduationCap} label="Total Students" value={stats.totalStudents} color="primary" loading={loading} />
        <StatCard icon={UserCheck} label="Total Teachers" value={stats.totalTeachers} color="green" loading={loading} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly registrations */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-display font-semibold text-slate-800 dark:text-white mb-4">School Registrations (6 Months)</h3>
          {loading ? (
            <div className="h-44 bg-surface-100 dark:bg-surface-700 rounded-lg animate-pulse" />
          ) : registrationChartData.length === 0 ? (
            <div className="h-44 flex items-center justify-center text-sm text-slate-400">No registration data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={registrationChartData} margin={{ top: 5, right: 5, bottom: 0, left: -15 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                <Bar dataKey="Schools" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Status pie chart */}
        <div className="card p-5">
          <h3 className="font-display font-semibold text-slate-800 dark:text-white mb-4">Schools by Status</h3>
          {loading ? (
            <div className="h-44 bg-surface-100 dark:bg-surface-700 rounded-lg animate-pulse" />
          ) : pieData.length === 0 ? (
            <div className="h-44 flex items-center justify-center text-sm text-slate-400">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent schools */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-100 dark:border-surface-700 flex items-center justify-between">
          <h3 className="font-display font-semibold text-slate-800 dark:text-white">Recently Registered Schools</h3>
          <a href="/super/schools" className="text-xs text-primary-600 hover:text-primary-700 font-medium">View all →</a>
        </div>
        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-9 h-9 bg-surface-200 dark:bg-surface-700 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-1/2 bg-surface-200 dark:bg-surface-700 rounded" />
                  <div className="h-2.5 w-1/3 bg-surface-200 dark:bg-surface-700 rounded" />
                </div>
                <div className="h-5 w-16 bg-surface-200 dark:bg-surface-700 rounded-full" />
              </div>
            ))}
          </div>
        ) : (data?.recentSchools || []).length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">No schools registered yet</div>
        ) : (
          <div className="divide-y divide-surface-100 dark:divide-surface-700/50">
            {(data.recentSchools || []).map(s => (
              <div key={s._id} className="flex items-center justify-between px-5 py-3.5 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {s.logo
                      ? <img src={s.logo} alt={s.name} className="w-full h-full object-cover" />
                      : <Building2 size={16} className="text-primary-500" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{s.name}</p>
                    <p className="text-xs text-slate-400">{s.email} · {format(new Date(s.createdAt), 'MMM d, yyyy')}</p>
                  </div>
                </div>
                <StatusBadge status={s.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
