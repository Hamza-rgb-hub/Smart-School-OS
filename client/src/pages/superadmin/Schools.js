import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2, CheckCircle, XCircle, Pause, Trash2,
  ChevronDown, Loader2, Eye, Search, X
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { ConfirmModal, Pagination, StatusBadge, Modal } from '../../components/common/LoadingSpinner';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { format } from 'date-fns';

const STATUS_FILTERS = ['', 'pending', 'approved', 'rejected', 'suspended'];

export default function SchoolsPage() {
  const [schools, setSchools] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [confirmModal, setConfirmModal] = useState({ open: false, action: null, school: null });
  const [rejectModal, setRejectModal] = useState({ open: false, school: null });
  const [rejectReason, setRejectReason] = useState('');
  const [viewModal, setViewModal] = useState({ open: false, school: null });
  const [viewDetail, setViewDetail] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  const fetchSchools = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10, search });
      if (statusFilter) params.append('status', statusFilter);
      const { data } = await api.get(`/super-admin/schools?${params}`);
      setSchools(data.data);
      setPagination(data.pagination);
    } catch { toast.error('Failed to load schools'); }
    finally { setLoading(false); }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchSchools(); }, [fetchSchools]);

  const viewSchool = async (school) => {
    setViewModal({ open: true, school });
    setViewLoading(true);
    try {
      const { data } = await api.get(`/schools/${school._id}`);
      setViewDetail(data.data);
    } catch { toast.error('Failed to load school details'); }
    finally { setViewLoading(false); }
  };

  const performAction = async (action, school, extra = {}) => {
    setActionLoading(school._id + action);
    try {
      let res;
      if (action === 'approve') {
        res = await api.put(`/super-admin/schools/${school._id}/approve`);
        toast.success(`"${school.name}" approved`);
      } else if (action === 'reject') {
        res = await api.put(`/super-admin/schools/${school._id}/reject`, { reason: extra.reason });
        toast.success(`"${school.name}" rejected`);
      } else if (action === 'suspend') {
        res = await api.put(`/super-admin/schools/${school._id}/suspend`);
        toast.success(`"${school.name}" suspended`);
      } else if (action === 'delete') {
        await api.delete(`/super-admin/schools/${school._id}`);
        toast.success(`"${school.name}" permanently deleted`);
        fetchSchools();
        return;
      }
      // Update in list
      setSchools(prev => prev.map(s => s._id === school._id ? { ...s, status: res.data.data.status } : s));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(null);
      setConfirmModal({ open: false, action: null, school: null });
      setRejectModal({ open: false, school: null });
    }
  };

  const openConfirm = (action, school) => setConfirmModal({ open: true, action, school });

  const pendingCount = schools.filter(s => s.status === 'pending').length;

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Schools</h1>
          <p className="page-subtitle">
            {pagination?.total ?? 0} total schools
            {pendingCount > 0 && <span className="ml-2 badge badge-yellow">{pendingCount} pending</span>}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search schools..." className="input pl-9 pr-8"
          />
          {search && <button onClick={() => { setSearch(''); setPage(1); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"><X size={14} /></button>}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_FILTERS.map(s => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${statusFilter === s ? 'bg-primary-600 text-white border-primary-600' : 'bg-white dark:bg-surface-800 text-slate-500 border-surface-200 dark:border-surface-700 hover:border-primary-300'}`}
            >
              {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        {loading ? <LoadingSpinner /> : schools.length === 0 ? (
          <div className="py-16 text-center">
            <Building2 size={36} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <p className="text-slate-400">No schools found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>School</th>
                    <th>Students</th>
                    <th>Teachers</th>
                    <th>Registered</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {schools.map(school => {
                    const isActing = actionLoading?.startsWith(school._id);
                    return (
                      <tr key={school._id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {school.logo
                                ? <img src={school.logo} alt={school.name} className="w-full h-full object-cover" />
                                : <Building2 size={17} className="text-primary-500" />}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-slate-800 dark:text-slate-100 truncate max-w-[180px]">{school.name}</p>
                              <p className="text-xs text-slate-400 truncate">{school.email}</p>
                              {school.adminId && (
                                <p className="text-xs text-slate-400 truncate">Admin: {school.adminId.name}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="font-medium text-slate-700 dark:text-slate-300">{school.studentCount ?? 0}</span>
                        </td>
                        <td>
                          <span className="font-medium text-slate-700 dark:text-slate-300">{school.teacherCount ?? 0}</span>
                        </td>
                        <td className="text-xs text-slate-400 whitespace-nowrap">
                          {format(new Date(school.createdAt), 'MMM d, yyyy')}
                        </td>
                        <td>
                          <StatusBadge status={school.status} />
                        </td>
                        <td>
                          <div className="flex items-center gap-1">
                            {/* View */}
                            <button
                              onClick={() => viewSchool(school)}
                              className="btn-icon btn-ghost p-1.5 text-slate-400 hover:text-blue-600"
                              title="View Details"
                            >
                              <Eye size={14} />
                            </button>

                            {/* Approve (pending/rejected/suspended) */}
                            {['pending', 'rejected', 'suspended'].includes(school.status) && (
                              <button
                                onClick={() => openConfirm('approve', school)}
                                disabled={isActing}
                                className="btn-icon btn-ghost p-1.5 text-slate-400 hover:text-emerald-600"
                                title="Approve"
                              >
                                {isActing && actionLoading === school._id + 'approve'
                                  ? <Loader2 size={14} className="animate-spin" />
                                  : <CheckCircle size={14} />}
                              </button>
                            )}

                            {/* Reject (pending/approved) */}
                            {['pending', 'approved'].includes(school.status) && (
                              <button
                                onClick={() => { setRejectModal({ open: true, school }); setRejectReason(''); }}
                                disabled={isActing}
                                className="btn-icon btn-ghost p-1.5 text-slate-400 hover:text-red-600"
                                title="Reject"
                              >
                                <XCircle size={14} />
                              </button>
                            )}

                            {/* Suspend (approved) */}
                            {school.status === 'approved' && (
                              <button
                                onClick={() => openConfirm('suspend', school)}
                                disabled={isActing}
                                className="btn-icon btn-ghost p-1.5 text-slate-400 hover:text-amber-600"
                                title="Suspend"
                              >
                                <Pause size={14} />
                              </button>
                            )}

                            {/* Delete */}
                            <button
                              onClick={() => openConfirm('delete', school)}
                              disabled={isActing}
                              className="btn-icon btn-ghost p-1.5 text-slate-400 hover:text-red-600"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination pagination={pagination} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* Approve / Suspend confirm */}
      <ConfirmModal
        isOpen={confirmModal.open && confirmModal.action !== 'delete'}
        onClose={() => setConfirmModal({ open: false, action: null, school: null })}
        onConfirm={() => performAction(confirmModal.action, confirmModal.school)}
        title={confirmModal.action === 'approve' ? 'Approve School' : 'Suspend School'}
        message={
          confirmModal.action === 'approve'
            ? `Approve "${confirmModal.school?.name}"? The school admin will be able to log in.`
            : `Suspend "${confirmModal.school?.name}"? All associated users will be deactivated.`
        }
        confirmLabel={confirmModal.action === 'approve' ? 'Approve' : 'Suspend'}
        confirmClass={confirmModal.action === 'approve' ? 'btn-success' : 'btn-danger'}
        loading={!!actionLoading}
      />

      {/* Delete confirm */}
      <ConfirmModal
        isOpen={confirmModal.open && confirmModal.action === 'delete'}
        onClose={() => setConfirmModal({ open: false, action: null, school: null })}
        onConfirm={() => performAction('delete', confirmModal.school)}
        title="Delete School"
        message={`Permanently delete "${confirmModal.school?.name}" and ALL associated data (students, teachers, classes)? This cannot be undone.`}
        confirmLabel="Delete Permanently"
        confirmClass="btn-danger"
        loading={!!actionLoading}
      />

      {/* Reject modal with reason */}
      <Modal
        isOpen={rejectModal.open}
        onClose={() => setRejectModal({ open: false, school: null })}
        title="Reject School"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            You are rejecting <strong className="text-slate-700 dark:text-slate-200">{rejectModal.school?.name}</strong>. The school admin will not be able to log in.
          </p>
          <div className="form-group">
            <label className="label">Rejection Reason (optional)</label>
            <textarea
              className="input resize-none"
              rows={3}
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Provide a reason for rejection..."
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setRejectModal({ open: false, school: null })} className="btn-secondary">Cancel</button>
            <button
              onClick={() => performAction('reject', rejectModal.school, { reason: rejectReason })}
              className="btn-danger"
              disabled={!!actionLoading}
            >
              {actionLoading ? <Loader2 size={15} className="animate-spin" /> : 'Reject School'}
            </button>
          </div>
        </div>
      </Modal>

      {/* View detail modal */}
      <Modal
        isOpen={viewModal.open}
        onClose={() => { setViewModal({ open: false, school: null }); setViewDetail(null); }}
        title="School Details"
        size="lg"
      >
        {viewLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={24} className="animate-spin text-primary-500" />
          </div>
        ) : viewDetail ? (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center gap-4 p-4 bg-surface-50 dark:bg-surface-800 rounded-xl">
              <div className="w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                {viewDetail.logo
                  ? <img src={viewDetail.logo} alt={viewDetail.name} className="w-full h-full object-cover" />
                  : <Building2 size={28} className="text-primary-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white">{viewDetail.name}</h3>
                  <StatusBadge status={viewDetail.status} />
                </div>
                <p className="text-sm text-slate-500">{viewDetail.email}</p>
                {viewDetail.phone && <p className="text-xs text-slate-400">{viewDetail.phone}</p>}
              </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Registered', value: format(new Date(viewDetail.createdAt), 'MMM d, yyyy') },
                { label: 'Status', value: viewDetail.status },
                { label: 'Website', value: viewDetail.website || '—' },
                { label: 'Academic Year', value: viewDetail.settings?.academicYear || '—' },
              ].map(({ label, value }) => (
                <div key={label} className="p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                  <p className="text-xs text-slate-400 mb-0.5">{label}</p>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200 capitalize">{value}</p>
                </div>
              ))}
            </div>

            {/* Address */}
            {viewDetail.address && Object.values(viewDetail.address).some(Boolean) && (
              <div className="p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                <p className="text-xs text-slate-400 mb-1">Address</p>
                <p className="text-sm text-slate-700 dark:text-slate-200">
                  {[viewDetail.address.street, viewDetail.address.city, viewDetail.address.state, viewDetail.address.country].filter(Boolean).join(', ')}
                </p>
              </div>
            )}

            {/* Admin */}
            {viewDetail.adminId && (
              <div className="p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                <p className="text-xs text-slate-400 mb-1">School Admin</p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{viewDetail.adminId.name}</p>
                <p className="text-xs text-slate-400">{viewDetail.adminId.email}</p>
                {viewDetail.adminId.lastLogin && (
                  <p className="text-xs text-slate-400 mt-1">Last login: {format(new Date(viewDetail.adminId.lastLogin), 'MMM d, yyyy h:mm a')}</p>
                )}
              </div>
            )}

            {/* Description */}
            {viewDetail.description && (
              <p className="text-sm text-slate-500 italic border-l-2 border-primary-200 pl-3">"{viewDetail.description}"</p>
            )}

            {/* Rejection reason */}
            {viewDetail.rejectionReason && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-lg">
                <p className="text-xs text-red-500 mb-1 font-medium">Rejection Reason</p>
                <p className="text-sm text-red-700 dark:text-red-300">{viewDetail.rejectionReason}</p>
              </div>
            )}

            {/* Quick actions */}
            <div className="flex gap-2 pt-2 border-t border-surface-100 dark:border-surface-700">
              {['pending', 'rejected', 'suspended'].includes(viewDetail.status) && (
                <button
                  onClick={() => {
                    performAction('approve', viewDetail);
                    setViewModal({ open: false, school: null });
                  }}
                  className="btn-success btn-sm"
                >
                  <CheckCircle size={14} /> Approve
                </button>
              )}
              {viewDetail.status === 'approved' && (
                <button
                  onClick={() => {
                    performAction('suspend', viewDetail);
                    setViewModal({ open: false, school: null });
                  }}
                  className="btn-danger btn-sm"
                >
                  <Pause size={14} /> Suspend
                </button>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
