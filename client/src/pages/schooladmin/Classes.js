import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, BookOpen, Loader2, Users } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Modal, ConfirmModal, EmptyState } from '../../components/common/LoadingSpinner';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const EMPTY = { name: '', section: 'A', grade: '', maxStudents: 40, classTeacher: '', academicYear: new Date().getFullYear().toString() };

export default function ClassesPage() {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editClass, setEditClass] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const [c, t] = await Promise.all([api.get('/classes'), api.get('/teachers/all')]);
      setClasses(c.data.data || []);
      setTeachers(t.data.data || []);
    } catch { toast.error('Failed to load classes'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const openCreate = () => { setEditClass(null); setForm(EMPTY); setModalOpen(true); };
  const openEdit = (c) => {
    setEditClass(c);
    setForm({ name: c.name, section: c.section || 'A', grade: c.grade || '', maxStudents: c.maxStudents || 40, classTeacher: c.classTeacher?._id || '', academicYear: c.academicYear || new Date().getFullYear().toString() });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editClass) {
        const { data } = await api.put(`/classes/${editClass._id}`, form);
        setClasses(prev => prev.map(c => c._id === editClass._id ? { ...data.data, studentCount: c.studentCount } : c));
        toast.success('Class updated');
      } else {
        await api.post('/classes', form);
        toast.success('Class created');
        fetch();
      }
      setModalOpen(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save class'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await api.delete(`/classes/${deleteTarget._id}`);
      toast.success('Class deleted');
      setClasses(prev => prev.filter(c => c._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete'); }
    finally { setSubmitting(false); }
  };

  const F = (k) => ({ value: form[k], onChange: e => setForm(f => ({...f, [k]: e.target.value})) });

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Classes</h1>
          <p className="page-subtitle">{classes.length} classes configured</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus size={16} />Add Class</button>
      </div>

      {loading ? <LoadingSpinner /> : classes.length === 0 ? (
        <div className="card">
          <EmptyState icon={BookOpen} title="No classes yet" description="Create your first class to start organizing students" action={<button onClick={openCreate} className="btn-primary btn-sm"><Plus size={14} />Create Class</button>} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {classes.map(c => (
            <div key={c._id} className="card-hover p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 bg-primary-50 dark:bg-primary-900/20 rounded-xl flex items-center justify-center">
                  <BookOpen size={20} className="text-primary-600 dark:text-primary-400" />
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(c)} className="btn-icon btn-ghost p-1.5 text-slate-400 hover:text-primary-600"><Pencil size={13} /></button>
                  <button onClick={() => setDeleteTarget(c)} className="btn-icon btn-ghost p-1.5 text-slate-400 hover:text-red-600"><Trash2 size={13} /></button>
                </div>
              </div>
              <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white">{c.name} <span className="text-slate-400 font-normal text-sm">({c.section})</span></h3>
              {c.grade && <p className="text-xs text-slate-500 mb-3">Grade {c.grade}</p>}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-surface-100 dark:border-surface-700">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Users size={13} />
                  <span>{c.studentCount || 0} / {c.maxStudents} students</span>
                </div>
                <div className="w-16 h-1.5 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                  <div className="h-full bg-primary-500 rounded-full" style={{ width: `${Math.min(100, ((c.studentCount || 0) / c.maxStudents) * 100)}%` }} />
                </div>
              </div>
              {c.classTeacher && (
                <p className="text-xs text-slate-400 mt-2 truncate">Teacher: {c.classTeacher.name}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editClass ? 'Edit Class' : 'Create Class'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Class Name *</label>
              <input className="input" placeholder="e.g. Grade 5" required {...F('name')} />
            </div>
            <div className="form-group">
              <label className="label">Section</label>
              <input className="input" placeholder="A" {...F('section')} />
            </div>
            <div className="form-group">
              <label className="label">Grade</label>
              <input className="input" placeholder="5" {...F('grade')} />
            </div>
            <div className="form-group">
              <label className="label">Max Students</label>
              <input type="number" min="1" max="200" className="input" {...F('maxStudents')} />
            </div>
            <div className="form-group col-span-2">
              <label className="label">Class Teacher</label>
              <select className="input" {...F('classTeacher')}>
                <option value="">Select teacher (optional)</option>
                {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
            </div>
            <div className="form-group col-span-2">
              <label className="label">Academic Year</label>
              <input className="input" placeholder="2024" {...F('academicYear')} />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary" disabled={submitting}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? <Loader2 size={15} className="animate-spin" /> : editClass ? 'Update Class' : 'Create Class'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Class" message={`Delete "${deleteTarget?.name} ${deleteTarget?.section}"? This cannot be undone.`} loading={submitting} />
    </div>
  );
}
