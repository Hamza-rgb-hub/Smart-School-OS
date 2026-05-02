import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, UserCheck, Loader2 } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Modal, ConfirmModal, Pagination, SearchInput, EmptyState, Avatar } from '../../components/common/LoadingSpinner';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const EMPTY = { name: '', email: '', phone: '', employeeId: '', subjects: '', qualification: '', experience: '', gender: '', joinDate: '' };

export default function TeachersPage() {
  const [teachers, setTeachers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTeacher, setEditTeacher] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/teachers?page=${page}&limit=10&search=${search}`);
      setTeachers(data.data);
      setPagination(data.pagination);
    } catch { toast.error('Failed to load teachers'); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchTeachers(); }, [fetchTeachers]);

  const openCreate = () => { setEditTeacher(null); setForm(EMPTY); setModalOpen(true); };
  const openEdit = (t) => {
    setEditTeacher(t);
    setForm({ name: t.name, email: t.email, phone: t.phone || '', employeeId: t.employeeId || '', subjects: (t.subjects || []).join(', '), qualification: t.qualification || '', experience: t.experience || '', gender: t.gender || '', joinDate: t.joinDate ? t.joinDate.split('T')[0] : '' });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) { toast.error('Name and email are required'); return; }
    setSubmitting(true);
    try {
      if (editTeacher) {
        const { data } = await api.put(`/teachers/${editTeacher._id}`, form);
        setTeachers(prev => prev.map(t => t._id === editTeacher._id ? data.data : t));
        toast.success('Teacher updated');
      } else {
        await api.post('/teachers', form);
        toast.success('Teacher added');
        fetchTeachers();
      }
      setModalOpen(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await api.delete(`/teachers/${deleteTarget._id}`);
      toast.success('Teacher deleted');
      setDeleteTarget(null);
      fetchTeachers();
    } catch { toast.error('Failed to delete'); }
    finally { setSubmitting(false); }
  };

  const F = (k) => ({ value: form[k], onChange: e => setForm(f => ({...f, [k]: e.target.value})) });

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Teachers</h1>
          <p className="page-subtitle">{pagination?.total ?? 0} total teachers</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus size={16} />Add Teacher</button>
      </div>

      <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search teachers..." className="max-w-xs" />

      <div className="table-wrapper">
        {loading ? <LoadingSpinner /> : teachers.length === 0 ? (
          <EmptyState icon={UserCheck} title="No teachers found" description="Add your first teacher to get started" action={<button onClick={openCreate} className="btn-primary btn-sm"><Plus size={14} />Add Teacher</button>} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table">
                <thead><tr><th>Teacher</th><th>Employee ID</th><th>Subjects</th><th>Qualification</th><th>Experience</th><th>Actions</th></tr></thead>
                <tbody>
                  {teachers.map(t => (
                    <tr key={t._id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <Avatar src={t.profileImage} name={t.name} size={9} />
                          <div>
                            <p className="font-medium text-slate-800 dark:text-slate-100">{t.name}</p>
                            <p className="text-xs text-slate-400">{t.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="font-mono text-xs">{t.employeeId || '—'}</td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {(t.subjects || []).slice(0, 3).map(s => (
                            <span key={s} className="badge badge-purple text-[10px]">{s}</span>
                          ))}
                          {(t.subjects || []).length > 3 && <span className="badge badge-gray text-[10px]">+{t.subjects.length - 3}</span>}
                          {(t.subjects || []).length === 0 && <span className="text-slate-400 text-xs">—</span>}
                        </div>
                      </td>
                      <td>{t.qualification || '—'}</td>
                      <td>{t.experience != null ? `${t.experience} yrs` : '—'}</td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(t)} className="btn-icon btn-ghost p-1.5 text-slate-500 hover:text-primary-600"><Pencil size={14} /></button>
                          <button onClick={() => setDeleteTarget(t)} className="btn-icon btn-ghost p-1.5 text-slate-500 hover:text-red-600"><Trash2 size={14} /></button>
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editTeacher ? 'Edit Teacher' : 'Add New Teacher'} size="lg">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="form-group sm:col-span-2">
            <label className="label">Full Name *</label>
            <input className="input" placeholder="Teacher's full name" required {...F('name')} />
          </div>
          <div className="form-group">
            <label className="label">Email *</label>
            <input type="email" className="input" placeholder="email@school.com" required {...F('email')} />
          </div>
          <div className="form-group">
            <label className="label">Phone</label>
            <input className="input" placeholder="Contact number" {...F('phone')} />
          </div>
          <div className="form-group">
            <label className="label">Employee ID</label>
            <input className="input" placeholder="e.g. EMP-001" {...F('employeeId')} />
          </div>
          <div className="form-group">
            <label className="label">Gender</label>
            <select className="input" {...F('gender')}>
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="form-group sm:col-span-2">
            <label className="label">Subjects (comma-separated)</label>
            <input className="input" placeholder="e.g. Mathematics, Physics, Chemistry" {...F('subjects')} />
          </div>
          <div className="form-group">
            <label className="label">Qualification</label>
            <input className="input" placeholder="e.g. M.Sc Mathematics" {...F('qualification')} />
          </div>
          <div className="form-group">
            <label className="label">Experience (years)</label>
            <input type="number" min="0" className="input" placeholder="5" {...F('experience')} />
          </div>
          <div className="form-group">
            <label className="label">Join Date</label>
            <input type="date" className="input" {...F('joinDate')} />
          </div>
          <div className="sm:col-span-2 flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary" disabled={submitting}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? <Loader2 size={15} className="animate-spin" /> : editTeacher ? 'Update' : 'Add Teacher'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Teacher" message={`Delete "${deleteTarget?.name}"? This cannot be undone.`} loading={submitting} />
    </div>
  );
}
