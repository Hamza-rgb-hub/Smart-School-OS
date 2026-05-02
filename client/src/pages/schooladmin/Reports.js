import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, FileText, Loader2, Eye, Globe } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Modal, ConfirmModal, Pagination, EmptyState, StatusBadge } from '../../components/common/LoadingSpinner';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const EMPTY_FORM = { studentId: '', classId: '', term: 'term1', academicYear: new Date().getFullYear().toString(), subjects: [{ name: '', marksObtained: '', totalMarks: 100 }], remarks: '' };

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [viewReport, setViewReport] = useState(null);
  const [editReport, setEditReport] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/reports?page=${page}&limit=10`);
      setReports(data.data); setPagination(data.pagination);
    } catch { toast.error('Failed to load reports'); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchReports(); }, [fetchReports]);
  useEffect(() => {
    Promise.all([api.get('/classes'), api.get('/students?limit=200')])
      .then(([c, s]) => { setClasses(c.data.data || []); setStudents(s.data.data || []); })
      .catch(() => {});
  }, []);

  const addSubject = () => setForm(f => ({ ...f, subjects: [...f.subjects, { name: '', marksObtained: '', totalMarks: 100 }] }));
  const removeSubject = (i) => setForm(f => ({ ...f, subjects: f.subjects.filter((_, idx) => idx !== i) }));
  const updateSubject = (i, field, value) => setForm(f => ({ ...f, subjects: f.subjects.map((s, idx) => idx === i ? { ...s, [field]: value } : s) }));

  const openCreate = () => { setEditReport(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (r) => {
    setEditReport(r);
    setForm({ studentId: r.studentId?._id || r.studentId, classId: r.classId?._id || r.classId, term: r.term, academicYear: r.academicYear, subjects: r.subjects.map(s => ({ name: s.name, marksObtained: s.marksObtained, totalMarks: s.totalMarks })), remarks: r.remarks || '' });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editReport) {
        const { data } = await api.put(`/reports/${editReport._id}`, form);
        setReports(prev => prev.map(r => r._id === editReport._id ? data.data : r));
        toast.success('Report updated');
      } else {
        await api.post('/reports', form);
        toast.success('Report card created');
        fetchReports();
      }
      setModalOpen(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
    finally { setSubmitting(false); }
  };

  const handlePublish = async (id) => {
    try {
      await api.put(`/reports/${id}/publish`);
      toast.success('Report card published');
      setReports(prev => prev.map(r => r._id === id ? { ...r, isPublished: true } : r));
    } catch { toast.error('Failed to publish'); }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await api.delete(`/reports/${deleteTarget._id}`);
      toast.success('Deleted'); setDeleteTarget(null); fetchReports();
    } catch { toast.error('Failed'); }
    finally { setSubmitting(false); }
  };

  const gradeColor = (g) => ({ 'A+': 'badge-green', 'A': 'badge-green', 'B+': 'badge-blue', 'B': 'badge-blue', 'C': 'badge-yellow', 'D': 'badge-yellow', 'F': 'badge-red' }[g] || 'badge-gray');

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Report Cards</h1>
          <p className="page-subtitle">{pagination?.total ?? 0} total reports</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus size={16} />Create Report</button>
      </div>

      <div className="table-wrapper">
        {loading ? <LoadingSpinner /> : reports.length === 0 ? (
          <EmptyState icon={FileText} title="No report cards yet" description="Create your first report card for a student" action={<button onClick={openCreate} className="btn-primary btn-sm"><Plus size={14} />Create Report</button>} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table">
                <thead><tr><th>Student</th><th>Class</th><th>Term</th><th>Year</th><th>Grade</th><th>Percentage</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {reports.map(r => (
                    <tr key={r._id}>
                      <td className="font-medium">{r.studentId?.name || '—'}</td>
                      <td>{r.classId?.name} {r.classId?.section}</td>
                      <td className="capitalize">{r.term?.replace('-', ' ')}</td>
                      <td>{r.academicYear}</td>
                      <td><span className={`badge ${gradeColor(r.grade)}`}>{r.grade || '—'}</span></td>
                      <td className="font-mono font-medium">{r.percentage}%</td>
                      <td><span className={`badge ${r.isPublished ? 'badge-green' : 'badge-gray'}`}>{r.isPublished ? 'Published' : 'Draft'}</span></td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setViewReport(r); setViewModal(true); }} className="btn-icon btn-ghost p-1.5 text-slate-500 hover:text-blue-600"><Eye size={14} /></button>
                          <button onClick={() => openEdit(r)} className="btn-icon btn-ghost p-1.5 text-slate-500 hover:text-primary-600"><Pencil size={14} /></button>
                          {!r.isPublished && <button onClick={() => handlePublish(r._id)} className="btn-icon btn-ghost p-1.5 text-slate-500 hover:text-emerald-600"><Globe size={14} /></button>}
                          <button onClick={() => setDeleteTarget(r)} className="btn-icon btn-ghost p-1.5 text-slate-500 hover:text-red-600"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination pagination={pagination} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editReport ? 'Edit Report Card' : 'Create Report Card'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Student *</label>
              <select className="input" required value={form.studentId} onChange={e => setForm(f => ({...f, studentId: e.target.value}))}>
                <option value="">Select student</option>
                {students.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Class *</label>
              <select className="input" required value={form.classId} onChange={e => setForm(f => ({...f, classId: e.target.value}))}>
                <option value="">Select class</option>
                {classes.map(c => <option key={c._id} value={c._id}>{c.name} {c.section}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Term *</label>
              <select className="input" value={form.term} onChange={e => setForm(f => ({...f, term: e.target.value}))}>
                {['term1','term2','term3','mid-term','final'].map(t => <option key={t} value={t}>{t.replace('-', ' ').toUpperCase()}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Academic Year</label>
              <input className="input" value={form.academicYear} onChange={e => setForm(f => ({...f, academicYear: e.target.value}))} placeholder="2024" />
            </div>
          </div>
          {/* Subjects */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Subjects & Marks</label>
              <button type="button" onClick={addSubject} className="text-xs text-primary-600 hover:text-primary-700 font-medium">+ Add Subject</button>
            </div>
            <div className="space-y-2">
              {form.subjects.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input className="input flex-1" placeholder="Subject name" value={s.name} onChange={e => updateSubject(i, 'name', e.target.value)} required />
                  <input type="number" className="input w-20" placeholder="Marks" min="0" value={s.marksObtained} onChange={e => updateSubject(i, 'marksObtained', e.target.value)} required />
                  <span className="text-slate-400 text-sm">/</span>
                  <input type="number" className="input w-20" placeholder="Total" min="1" value={s.totalMarks} onChange={e => updateSubject(i, 'totalMarks', e.target.value)} />
                  {form.subjects.length > 1 && <button type="button" onClick={() => removeSubject(i)} className="text-red-400 hover:text-red-600 text-xs">✕</button>}
                </div>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="label">Remarks</label>
            <input className="input" placeholder="Optional teacher remarks" value={form.remarks} onChange={e => setForm(f => ({...f, remarks: e.target.value}))} />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary" disabled={submitting}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? <Loader2 size={15} className="animate-spin" /> : editReport ? 'Update' : 'Create Report'}</button>
          </div>
        </form>
      </Modal>

      {/* View Report Modal */}
      <Modal isOpen={viewModal} onClose={() => setViewModal(false)} title="Report Card Details" size="md">
        {viewReport && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
              <div>
                <p className="font-display font-bold text-lg text-slate-800 dark:text-white">{viewReport.studentId?.name}</p>
                <p className="text-sm text-slate-500">{viewReport.classId?.name} {viewReport.classId?.section} · {viewReport.term?.toUpperCase()} · {viewReport.academicYear}</p>
              </div>
              <div className="text-right">
                <p className={`text-3xl font-display font-bold badge ${gradeColor(viewReport.grade)} px-3 py-1`}>{viewReport.grade}</p>
                <p className="text-sm text-slate-500 mt-1">{viewReport.percentage}%</p>
              </div>
            </div>
            <table className="table">
              <thead><tr><th>Subject</th><th>Marks</th><th>Total</th><th>Grade</th></tr></thead>
              <tbody>
                {(viewReport.subjects || []).map((s, i) => (
                  <tr key={i}>
                    <td>{s.name}</td>
                    <td className="font-mono font-medium text-slate-800 dark:text-white">{s.marksObtained}</td>
                    <td className="font-mono text-slate-400">{s.totalMarks}</td>
                    <td><span className={`badge ${gradeColor(s.grade)} text-xs`}>{s.grade}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-between text-sm text-slate-500 pt-2 border-t border-surface-100 dark:border-surface-700">
              <span>Total: {viewReport.obtainedMarks}/{viewReport.totalMarks}</span>
              <span>Percentage: {viewReport.percentage}%</span>
            </div>
            {viewReport.remarks && <p className="text-sm text-slate-500 italic">"{viewReport.remarks}"</p>}
          </div>
        )}
      </Modal>

      <ConfirmModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Report Card" message="Are you sure you want to delete this report card? This cannot be undone." loading={submitting} />
    </div>
  );
}
