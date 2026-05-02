import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Users, Loader2, UserPlus } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Modal, ConfirmModal, Pagination, SearchInput, EmptyState, StatusBadge, Avatar } from '../../components/common/LoadingSpinner';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const EMPTY_FORM = { name: '', email: '', phone: '', rollNumber: '', gender: '', dateOfBirth: '', classId: '', bloodGroup: 'unknown', fatherName: '', guardianPhone: '', city: '', country: '' };

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10, search });
      if (filterClass) params.append('classId', filterClass);
      const { data } = await api.get(`/students?${params}`);
      setStudents(data.data);
      setPagination(data.pagination);
    } catch (e) {
      toast.error('Failed to load students');
    } finally { setLoading(false); }
  }, [page, search, filterClass]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  useEffect(() => {
    api.get('/classes').then(r => setClasses(r.data.data || [])).catch(() => {});
  }, []);

  const openCreate = () => { setEditStudent(null); setForm(EMPTY_FORM); setImageFile(null); setImagePreview(''); setModalOpen(true); };
  const openEdit = (s) => {
    setEditStudent(s);
    setForm({ name: s.name, email: s.email || '', phone: s.phone || '', rollNumber: s.rollNumber || '', gender: s.gender || '', dateOfBirth: s.dateOfBirth ? s.dateOfBirth.split('T')[0] : '', classId: s.classId?._id || '', bloodGroup: s.bloodGroup || 'unknown', fatherName: s.parentInfo?.fatherName || '', guardianPhone: s.parentInfo?.guardianPhone || '', city: s.address?.city || '', country: s.address?.country || '' });
    setImagePreview(s.profileImage || '');
    setImageFile(null);
    setModalOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Student name is required'); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      if (imageFile) fd.append('profileImage', imageFile);

      if (editStudent) {
        const { data } = await api.put(`/students/${editStudent._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setStudents(prev => prev.map(s => s._id === editStudent._id ? data.data : s));
        toast.success('Student updated');
      } else {
        await api.post('/students', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Student added');
        fetchStudents();
      }
      setModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save student');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await api.delete(`/students/${deleteTarget._id}`);
      toast.success('Student deleted');
      setDeleteTarget(null);
      fetchStudents();
    } catch { toast.error('Failed to delete student'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Students</h1>
          <p className="page-subtitle">{pagination?.total ?? 0} total students enrolled</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><UserPlus size={16} />Add Student</button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search students..." className="flex-1" />
        <select value={filterClass} onChange={e => { setFilterClass(e.target.value); setPage(1); }} className="input sm:w-48">
          <option value="">All Classes</option>
          {classes.map(c => <option key={c._id} value={c._id}>{c.name} {c.section}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        {loading ? <LoadingSpinner /> : students.length === 0 ? (
          <EmptyState icon={Users} title="No students found" description={search ? 'Try a different search term' : 'Add your first student to get started'} action={<button onClick={openCreate} className="btn-primary btn-sm"><Plus size={14} />Add Student</button>} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table">
                <thead><tr>
                  <th>Student</th>
                  <th>Roll No.</th>
                  <th>Class</th>
                  <th>Gender</th>
                  <th>Fee Status</th>
                  <th>Actions</th>
                </tr></thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s._id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <Avatar src={s.profileImage} name={s.name} size={9} />
                          <div>
                            <p className="font-medium text-slate-800 dark:text-slate-100">{s.name}</p>
                            <p className="text-xs text-slate-400">{s.email || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="font-mono text-xs">{s.rollNumber || '—'}</td>
                      <td>{s.classId ? `${s.classId.name} ${s.classId.section || ''}` : <span className="text-slate-400">Not assigned</span>}</td>
                      <td className="capitalize">{s.gender || '—'}</td>
                      <td><StatusBadge status={s.feeStatus} /></td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(s)} className="btn-icon btn-ghost p-1.5 text-slate-500 hover:text-primary-600"><Pencil size={14} /></button>
                          <button onClick={() => setDeleteTarget(s)} className="btn-icon btn-ghost p-1.5 text-slate-500 hover:text-red-600"><Trash2 size={14} /></button>
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
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editStudent ? 'Edit Student' : 'Add New Student'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Profile image */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-100 dark:bg-surface-700 flex items-center justify-center flex-shrink-0">
              {imagePreview ? <img src={imagePreview} alt="preview" className="w-full h-full object-cover" /> : <Users size={24} className="text-slate-400" />}
            </div>
            <div>
              <label className="btn-secondary cursor-pointer text-xs">
                <span>Upload Photo</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
              <p className="text-xs text-slate-400 mt-1">JPEG, PNG, WebP • Max 5MB</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-group sm:col-span-2">
              <label className="label">Full Name *</label>
              <input className="input" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Student's full name" required />
            </div>
            <div className="form-group">
              <label className="label">Email</label>
              <input type="email" className="input" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} placeholder="student@email.com" />
            </div>
            <div className="form-group">
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} placeholder="Contact number" />
            </div>
            <div className="form-group">
              <label className="label">Roll Number</label>
              <input className="input" value={form.rollNumber} onChange={e => setForm(f => ({...f, rollNumber: e.target.value}))} placeholder="e.g. 2024-001" />
            </div>
            <div className="form-group">
              <label className="label">Class</label>
              <select className="input" value={form.classId} onChange={e => setForm(f => ({...f, classId: e.target.value}))}>
                <option value="">Select class</option>
                {classes.map(c => <option key={c._id} value={c._id}>{c.name} {c.section}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Gender</label>
              <select className="input" value={form.gender} onChange={e => setForm(f => ({...f, gender: e.target.value}))}>
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label">Date of Birth</label>
              <input type="date" className="input" value={form.dateOfBirth} onChange={e => setForm(f => ({...f, dateOfBirth: e.target.value}))} />
            </div>
            <div className="form-group">
              <label className="label">Father's Name</label>
              <input className="input" value={form.fatherName} onChange={e => setForm(f => ({...f, fatherName: e.target.value}))} placeholder="Father's name" />
            </div>
            <div className="form-group">
              <label className="label">Guardian Phone</label>
              <input className="input" value={form.guardianPhone} onChange={e => setForm(f => ({...f, guardianPhone: e.target.value}))} placeholder="Guardian contact" />
            </div>
            <div className="form-group">
              <label className="label">City</label>
              <input className="input" value={form.city} onChange={e => setForm(f => ({...f, city: e.target.value}))} placeholder="City" />
            </div>
            <div className="form-group">
              <label className="label">Country</label>
              <input className="input" value={form.country} onChange={e => setForm(f => ({...f, country: e.target.value}))} placeholder="Country" />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary" disabled={submitting}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? <Loader2 size={15} className="animate-spin" /> : editStudent ? 'Update Student' : 'Add Student'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Student"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        loading={submitting}
      />
    </div>
  );
}
