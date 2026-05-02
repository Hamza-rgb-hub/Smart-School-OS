import React, { useState, useEffect } from 'react';
import { Users, UserCheck, BookOpen, DollarSign, UserX, Calendar, TrendingUp, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import api from '../../services/api';
import { StatCard, Avatar } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function SchoolDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/school')
      .then(r => setData(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = data?.stats || {};
  const attendance = data?.attendance || {};
  const attendancePct = attendance.total ? Math.round((attendance.presentToday / attendance.total) * 100) : 0;

  const feeChartData = (data?.feeStats || []).map(f => ({
    name: MONTHS[f._id.month - 1],
    collected: f.total,
    count: f.count
  }));

  const trendData = (data?.attendanceTrend || []).map(t => ({
    date: format(new Date(t.date), 'EEE'),
    Present: t.present,
    Absent: t.absent,
  }));

  const schoolName = typeof user?.schoolId === 'object' ? user?.schoolId?.name : 'Your School';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">
          {schoolName} · {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Students" value={stats.totalStudents} color="primary" loading={loading} />
        <StatCard icon={UserCheck} label="Total Teachers" value={stats.totalTeachers} color="green" loading={loading} />
        <StatCard icon={BookOpen} label="Total Classes" value={stats.totalClasses} color="blue" loading={loading} />
        <StatCard icon={DollarSign} label="Pending Fees" value={stats.pendingFees} color="yellow" loading={loading} />
      </div>

      {/* Attendance summary + chart row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Today's attendance */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-slate-800 dark:text-white">Today's Attendance</h3>
            <Calendar size={16} className="text-slate-400" />
          </div>
          {loading ? (
            <div className="h-20 bg-surface-100 dark:bg-surface-700 rounded-lg animate-pulse" />
          ) : (
            <>
              <div className="flex items-end gap-2 mb-3">
                <span className="text-4xl font-display font-bold text-slate-800 dark:text-white">{attendancePct}%</span>
                <span className="text-sm text-slate-400 pb-1">attendance rate</span>
              </div>
              <div className="w-full bg-surface-100 dark:bg-surface-700 rounded-full h-2.5 mb-3 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full transition-all duration-700" style={{ width: `${attendancePct}%` }} />
              </div>
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />Present: {attendance.presentToday || 0}</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />Absent: {attendance.absentToday || 0}</span>
              </div>
            </>
          )}
        </div>

        {/* Attendance trend chart */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-slate-800 dark:text-white">7-Day Attendance Trend</h3>
            <TrendingUp size={16} className="text-slate-400" />
          </div>
          {loading ? (
            <div className="h-36 bg-surface-100 dark:bg-surface-700 rounded-lg animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={trendData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="presentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                <Area type="monotone" dataKey="Present" stroke="#6366f1" fill="url(#presentGrad)" strokeWidth={2} dot={{ r: 3 }} />
                <Area type="monotone" dataKey="Absent" stroke="#f87171" fill="none" strokeWidth={2} strokeDasharray="4 2" dot={{ r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Fee chart + Recent students */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Fee collection bar chart */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-slate-800 dark:text-white">Fee Collection (6 Months)</h3>
            <DollarSign size={16} className="text-slate-400" />
          </div>
          {loading ? (
            <div className="h-40 bg-surface-100 dark:bg-surface-700 rounded-lg animate-pulse" />
          ) : feeChartData.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-sm text-slate-400">No fee data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={feeChartData} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                <Bar dataKey="collected" fill="#6366f1" radius={[4,4,0,0]} name="Collected ($)" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent students */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-slate-800 dark:text-white">Recent Admissions</h3>
            <Clock size={16} className="text-slate-400" />
          </div>
          {loading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-9 h-9 rounded-lg bg-surface-200 dark:bg-surface-700" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-3/4 bg-surface-200 dark:bg-surface-700 rounded" />
                  <div className="h-2.5 w-1/2 bg-surface-200 dark:bg-surface-700 rounded" />
                </div>
              </div>
            ))}</div>
          ) : (data?.recentStudents || []).length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No students yet</p>
          ) : (
            <div className="space-y-3">
              {(data.recentStudents || []).map(s => (
                <div key={s._id} className="flex items-center gap-3">
                  <Avatar src={s.profileImage} name={s.name} size={9} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{s.name}</p>
                    <p className="text-xs text-slate-400 truncate">{s.classId?.name || 'No class'} · {s.classId?.section || ''}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
