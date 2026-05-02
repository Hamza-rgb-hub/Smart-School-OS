import React, { useState, useEffect, useCallback } from 'react';
import { DollarSign, Plus, Pencil, Loader2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Modal, Pagination, SearchInput, StatusBadge, Avatar } from '../../components/common/LoadingSpinner';
import LoadingSpinner, { StatCard } from '../../components/common/LoadingSpinner';
import { format } from 'date-fns';

export default function FeesPage() {
  const [tab, setTab] = useState('payments');
  const [payments, setPayments] = useState([]);
  const [structures, setStructures] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [structureModal, setStructureModal] = useState(false);
  const [editStructure, setEditStructure] = useState(null);
  const [students, setStudents] = useState([]);
  const [payForm, setPayForm] = useState({ studentId: '', amount: '', paidAmount: '', dueDate: '', status: 'pending', paymentMethod: 'cash', month: '', year: new Date().getFullYear(), remarks: '' });
  const [structForm, setStructForm] = useState({ name: '', amount: '', frequency: 'monthly', description: '' });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [p, s, sum] = await Promise.all([
        api.get(`/fees/payments?page=${page}&limit=10&status=${filterStatus}`),
        api.get('/fees/structures'),
        api.get('/fees/summary')
      ]);
      setPayments(p.data.data); setPagination(p.data.pagination);
      setStructures(s.data.data); setSummary(sum.data.data);
    } catch { toast.error('Failed to load fee data'); }
    finally { setLoading(false); }
  }, [page, filterStatus]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => {
    api.get('/students?limit=100').then(r => setStudents(r.data.data || [])).catch(() => {});
  }, []);

  const handlePaySubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/fees/payments', payForm);
      toast.success('Payment recorded');
      setModalOpen(false);
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const handleStructSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editStructure) { await api.put(`/fees/structures/${editStructure._id}`, structForm); toast.success('Updated'); }
      else { await api.post('/fees/structures', structForm); toast.success('Created'); }
      setStructureModal(false); setEditStructure(null);
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const PF = (k) => ({ value: payForm[k], onChange: e => setPayForm(f => ({...f, [k]: e.target.value})) });
  const SF = (k) => ({ value: structForm[k], onChange: e => setStructForm(f => ({...f, [k]: e.target.value})) });

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Fee Management</h1>
          <p className="page-subtitle">Track payments and fee structures</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setStructureModal(true); setEditStructure(null); setStructForm({ name: '', amount: '', frequency: 'monthly', description: '' }); }} className="btn-secondary"><Plus size={16} />Fee Structure</button>
          <button onClick={() => setModalOpen(true)} className="btn-primary"><Plus size={16} />Record Payment</button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CheckCircle} label="Total Collected" value={summary ? `$${summary.totalCollected.toLocaleString()}` : undefined} color="green" loading={loading} />
        <StatCard icon={DollarSign} label="Total Due" value={summary ? `$${summary.totalDue.toLocaleString()}` : undefined} color="primary" loading={loading} />
        <StatCard icon={Clock} label="Pending" value={summary?.pendingCount} color="yellow" loading={loading} />
        <StatCard icon={AlertCircle} label="Overdue" value={summary?.overdueCount} color="red" loading={loading} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-100 dark:bg-surface-800 rounded-lg w-fit">
        {['payments', 'structures'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${tab === t ? 'bg-white dark:bg-surface-900 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{t}</button>
        ))}
      </div>

      {tab === 'payments' && (
        <div className="table-wrapper">
          <div className="p-4 border-b border-surface-100 dark:border-surface-700 flex gap-3">
            <select className="input w-40" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="partial">Partial</option>
            </select>
          </div>
          {loading ? <LoadingSpinner /> : (
            <>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead><tr><th>Student</th><th>Amount</th><th>Paid</th><th>Due Date</th><th>Method</th><th>Status</th></tr></thead>
                  <tbody>
                    {payments.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-10 text-slate-400">No payments found</td></tr>
                    ) : payments.map(p => (
                      <tr key={p._id}>
                        <td>
                          <div>
                            <p className="font-medium text-slate-800 dark:text-slate-100">{p.studentId?.name || '—'}</p>
                            <p className="text-xs text-slate-400">{p.studentId?.classId?.name} {p.studentId?.classId?.section}</p>
                          </div>
                        </td>
                        <td className="font-mono font-medium">${p.amount.toLocaleString()}</td>
                        <td className="font-mono text-emerald-600 dark:text-emerald-400">${p.paidAmount.toLocaleString()}</td>
                        <td className="text-xs">{format(new Date(p.dueDate), 'MMM d, yyyy')}</td>
                        <td className="capitalize text-xs">{p.paymentMethod?.replace('_', ' ')}</td>
                        <td><StatusBadge status={p.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination pagination={pagination} onPageChange={setPage} />
            </>
          )}
        </div>
      )}

      {tab === 'structures' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? <LoadingSpinner /> : structures.length === 0 ? (
            <div className="col-span-3 card py-16 text-center text-slate-400">No fee structures yet</div>
          ) : structures.map(s => (
            <div key={s._id} className="card-hover p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center">
                  <DollarSign size={18} className="text-emerald-600" />
                </div>
                <button onClick={() => { setEditStructure(s); setStructForm({ name: s.name, amount: s.amount, frequency: s.frequency, description: s.description || '' }); setStructureModal(true); }} className="btn-icon btn-ghost p-1.5 text-slate-400"><Pencil size={13} /></button>
              </div>
              <h3 className="font-semibold text-slate-800 dark:text-white">{s.name}</h3>
              <p className="text-2xl font-display font-bold text-slate-800 dark:text-white mt-1">${Number(s.amount).toLocaleString()}</p>
              <p className="text-xs text-slate-400 capitalize mt-0.5">{s.frequency}</p>
              {s.description && <p className="text-xs text-slate-500 mt-2 line-clamp-2">{s.description}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Payment Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Record Fee Payment" size="md">
        <form onSubmit={handlePaySubmit} className="space-y-4">
          <div className="form-group">
            <label className="label">Student *</label>
            <select className="input" required {...PF('studentId')}>
              <option value="">Select student</option>
              {students.map(s => <option key={s._id} value={s._id}>{s.name} ({s.rollNumber || 'no roll'})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Total Amount *</label>
              <input type="number" min="0" className="input" placeholder="500" required {...PF('amount')} />
            </div>
            <div className="form-group">
              <label className="label">Paid Amount</label>
              <input type="number" min="0" className="input" placeholder="0" {...PF('paidAmount')} />
            </div>
            <div className="form-group">
              <label className="label">Due Date *</label>
              <input type="date" className="input" required {...PF('dueDate')} />
            </div>
            <div className="form-group">
              <label className="label">Status</label>
              <select className="input" {...PF('status')}>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label">Payment Method</label>
              <select className="input" {...PF('paymentMethod')}>
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="online">Online</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label">Month</label>
              <input className="input" placeholder="January" {...PF('month')} />
            </div>
          </div>
          <div className="form-group">
            <label className="label">Remarks</label>
            <input className="input" placeholder="Optional notes" {...PF('remarks')} />
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary" disabled={submitting}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? <Loader2 size={15} className="animate-spin" /> : 'Record Payment'}</button>
          </div>
        </form>
      </Modal>

      {/* Structure Modal */}
      <Modal isOpen={structureModal} onClose={() => setStructureModal(false)} title={editStructure ? 'Edit Fee Structure' : 'Create Fee Structure'}>
        <form onSubmit={handleStructSubmit} className="space-y-4">
          <div className="form-group">
            <label className="label">Name *</label>
            <input className="input" placeholder="e.g. Monthly Tuition Fee" required {...SF('name')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Amount *</label>
              <input type="number" min="0" className="input" placeholder="500" required {...SF('amount')} />
            </div>
            <div className="form-group">
              <label className="label">Frequency</label>
              <select className="input" {...SF('frequency')}>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annually">Annually</option>
                <option value="one-time">One-time</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="label">Description</label>
            <input className="input" placeholder="Optional description" {...SF('description')} />
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setStructureModal(false)} className="btn-secondary" disabled={submitting}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? <Loader2 size={15} className="animate-spin" /> : editStructure ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
