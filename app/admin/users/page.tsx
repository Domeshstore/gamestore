'use client';

import { useEffect, useState } from 'react';
import { adminAPI } from '@/lib/api/client';
import { User } from '@/types';
import { formatDate, getErrorMessage } from '@/lib/utils/format';
import { Loader2, UserCheck, UserX } from 'lucide-react';
import { cn } from '@/lib/utils/format';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getUsers({ page, limit: 20 });
      setUsers(res.data.data);
      setTotalPages(Math.ceil(res.data.pagination.total / 20));
      setTotal(res.data.pagination.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [page]);

  const handleToggle = async (user: User) => {
    try {
      await adminAPI.toggleUser(user.id);
      toast.success(`User ${user.isActive ? 'dinonaktifkan' : 'diaktifkan'}`);
      fetchUsers();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">👥 Kelola Users</h1>
          <p className="text-slate-400 text-sm mt-1">{total} pengguna terdaftar</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-purple-500 animate-spin" /></div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {['Nama', 'Email', 'Role', 'Points', 'Status', 'Bergabung', 'Aksi'].map((h) => (
                    <th key={h} className="text-left text-slate-400 text-xs font-semibold uppercase tracking-wide px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {user.name[0]?.toUpperCase()}
                        </div>
                        <span className="text-white text-sm font-medium">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-xs">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={cn('text-xs px-2 py-1 rounded-full font-semibold', user.role === 'admin' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400')}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-yellow-400 text-sm font-semibold">{user.rewardPoints}</td>
                    <td className="px-4 py-3">
                      <span className={cn('text-xs px-2 py-1 rounded-full font-semibold', user.isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400')}>
                        {user.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(user.createdAt)}</td>
                    <td className="px-4 py-3">
                      {user.role !== 'admin' && (
                        <button
                          onClick={() => handleToggle(user)}
                          className={cn('p-1.5 rounded-lg transition-colors', user.isActive ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400' : 'bg-green-500/10 hover:bg-green-500/20 text-green-400')}
                          title={user.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                        >
                          {user.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-10 text-slate-400">Belum ada pengguna</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button onClick={() => setPage((p) => p - 1)} disabled={page === 1} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white disabled:opacity-30">← Prev</button>
          <span className="px-4 py-2 text-slate-400 text-sm">{page}/{totalPages}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={page === totalPages} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white disabled:opacity-30">Next →</button>
        </div>
      )}
    </div>
  );
}
