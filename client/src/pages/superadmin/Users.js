import React, { useState, useEffect, useCallback } from 'react';
import { Users, ToggleLeft, ToggleRight, Loader2, ShieldCheck } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Pagination, SearchInput, StatusBadge } from '../../components/common/LoadingSpinner';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { format } from 'date-fns';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/super-admin/users?page=${page}&limit=12&search=${search}`);
      setUsers(data.data);
      setPagination(data.pagination);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleToggle = async (user) => {
    setToggling(user._id);
    try {
      const { data } = await api.put(`/super-admin/users/${user._id}/toggle`);
      setUsers(prev => prev.map(u => u._id === user._id ? { ...u, isActive: data.data.isActive } : u));
      toast.success(`User ${data.data.isActive ? 'activated' : 'deactivated'}`);
    } catch { toast.error('Failed to toggle user status'); }
    finally { setToggling(null); }
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">{pagination?.total ?? 0} school administrators</p>
        </div>
      </div>

      <SearchInput
        value={search}
        onChange={v => { setSearch(v); setPage(1); }}
        placeholder="Search by name or email..."
        className="max-w-sm"
      />

      <div className="table-wrapper">
        {loading ? <LoadingSpinner /> : users.length === 0 ? (
          <div className="py-16 text-center">
            <Users size={36} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <p className="text-slate-400 text-sm">No users found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>School</th>
                    <th>School Status</th>
                    <th>Last Login</th>
                    <th>Account</th>
                    <th>Toggle</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user._id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                            <span className="text-primary-600 dark:text-primary-400 font-bold text-xs">
                              {user.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-slate-800 dark:text-slate-100">{user.name}</p>
                            <p className="text-xs text-slate-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        {user.schoolId ? (
                          <div>
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{user.schoolId.name}</p>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                      <td>
                        {user.schoolId?.status
                          ? <StatusBadge status={user.schoolId.status} />
                          : <span className="text-slate-400 text-xs">—</span>}
                      </td>
                      <td className="text-xs text-slate-400 whitespace-nowrap">
                        {user.lastLogin
                          ? format(new Date(user.lastLogin), 'MMM d, yyyy h:mm a')
                          : 'Never'}
                      </td>
                      <td>
                        <span className={`badge ${user.isActive ? 'badge-green' : 'badge-red'}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => handleToggle(user)}
                          disabled={toggling === user._id}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            user.isActive
                              ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100'
                              : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100'
                          }`}
                          title={user.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {toggling === user._id ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : user.isActive ? (
                            <><ToggleRight size={14} /> Deactivate</>
                          ) : (
                            <><ToggleLeft size={14} /> Activate</>
                          )}
                        </button>
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
    </div>
  );
}
