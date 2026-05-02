import React, { useState, useEffect } from 'react';
import { ClipboardCheck, Save, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Avatar } from '../../components/common/LoadingSpinner';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const STATUS_OPTIONS = [
  { value: 'present', label: 'P', color: 'bg-emerald-500 text-white' },
  { value: 'absent', label: 'A', color: 'bg-red-500 text-white' },
  { value: 'late', label: 'L', color: 'bg-amber-500 text-white' },
  { value: 'excused', label: 'E', color: 'bg-blue-500 text-white' },
];

export default function AttendancePage() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [date, setDate] = useState(new Date());
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/classes').then(r => {
      setClasses(r.data.data || []);
      if (r.data.data?.length > 0) setSelectedClass(r.data.data[0]._id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    setLoading(true);
    const dateStr = format(date, 'yyyy-MM-dd');
    api.get(`/attendance/class/${selectedClass}?date=${dateStr}`)
      .then(r => setRecords(r.data.data || []))
      .catch(() => toast.error('Failed to load attendance'))
      .finally(() => setLoading(false));
  }, [selectedClass, date]);

  const toggleStatus = (studentId, status) => {
    setRecords(prev => prev.map(r => r.studentId === studentId ? { ...r, status } : r));
  };

  const markAll = (status) => {
    setRecords(prev => prev.map(r => ({ ...r, status })));
  };

  const handleSave = async () => {
    if (!selectedClass || records.length === 0) return;
    setSaving(true);
    try {
      await api.post('/attendance/mark', {
        classId: selectedClass,
        date: format(date, 'yyyy-MM-dd'),
        records: records.map(r => ({ studentId: r.studentId, status: r.status === 'not_marked' ? 'present' : r.status }))
      });
      toast.success('Attendance saved successfully');
    } catch { toast.error('Failed to save attendance'); }
    finally { setSaving(false); }
  };

  const summary = {
    present: records.filter(r => r.status === 'present').length,
    absent: records.filter(r => r.status === 'absent').length,
    late: records.filter(r => r.status === 'late').length,
    excused: records.filter(r => r.status === 'excused').length,
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="page-subtitle">Mark and track daily student attendance</p>
        </div>
        <button onClick={handleSave} disabled={saving || records.length === 0} className="btn-primary">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save Attendance
        </button>
      </div>

      {/* Controls */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="form-group flex-1">
            <label className="label">Select Class</label>
            <select className="input" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
              <option value="">Choose class...</option>
              {classes.map(c => <option key={c._id} value={c._id}>{c.name} {c.section}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Date</label>
            <div className="flex items-center gap-2">
              <button onClick={() => setDate(d => subDays(d, 1))} className="btn-secondary p-2"><ChevronLeft size={16} /></button>
              <input type="date" className="input w-36" value={format(date, 'yyyy-MM-dd')} onChange={e => setDate(new Date(e.target.value + 'T00:00:00'))} max={format(new Date(), 'yyyy-MM-dd')} />
              <button onClick={() => setDate(d => addDays(d, 1))} className="btn-secondary p-2" disabled={format(date, 'yyyy-MM-dd') >= format(new Date(), 'yyyy-MM-dd')}><ChevronRight size={16} /></button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary strip */}
      {records.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {[['present','emerald',summary.present],['absent','red',summary.absent],['late','amber',summary.late],['excused','blue',summary.excused]].map(([s, color, count]) => (
            <div key={s} className="card p-3 text-center">
              <p className={`text-2xl font-display font-bold text-${color}-600 dark:text-${color}-400`}>{count}</p>
              <p className="text-xs text-slate-500 capitalize">{s}</p>
            </div>
          ))}
        </div>
      )}

      {/* Attendance list */}
      <div className="card overflow-hidden">
        {loading ? <LoadingSpinner /> : !selectedClass ? (
          <div className="py-16 text-center text-slate-400">
            <ClipboardCheck size={32} className="mx-auto mb-3 opacity-30" />
            <p>Select a class to take attendance</p>
          </div>
        ) : records.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <p>No students found in this class</p>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-surface-100 dark:border-surface-700 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{records.length} Students</p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Mark all:</span>
                {STATUS_OPTIONS.map(s => (
                  <button key={s.value} onClick={() => markAll(s.value)} className={`px-2.5 py-1 rounded text-xs font-semibold ${s.color} opacity-80 hover:opacity-100 transition-opacity`}>{s.label}</button>
                ))}
              </div>
            </div>
            <div className="divide-y divide-surface-100 dark:divide-surface-700/50">
              {records.map((r, i) => (
                <div key={r.studentId} className={`flex items-center justify-between px-4 py-3 ${i % 2 === 0 ? '' : 'bg-surface-50/50 dark:bg-surface-800/30'}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 w-5 text-right">{i + 1}</span>
                    <Avatar src={r.profileImage} name={r.name} size={8} />
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{r.name}</p>
                      {r.rollNumber && <p className="text-xs text-slate-400">Roll: {r.rollNumber}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {STATUS_OPTIONS.map(s => (
                      <button
                        key={s.value}
                        onClick={() => toggleStatus(r.studentId, s.value)}
                        className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${r.status === s.value ? s.color + ' shadow-sm scale-105' : 'bg-surface-100 dark:bg-surface-700 text-slate-400 hover:bg-surface-200'}`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
