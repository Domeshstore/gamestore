'use client';

import { useEffect, useState } from 'react';
import { transactionsAPI } from '@/lib/api/client';
import { Transaction } from '@/types';
import TransactionList from '@/components/transactions/TransactionList';
import AuthGuard from '@/components/auth/AuthGuard';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/format';

const STATUS_FILTERS = [
  { value: '', label: 'Semua' },
  { value: 'pending', label: 'Menunggu' },
  { value: 'processing', label: 'Diproses' },
  { value: 'success', label: 'Berhasil' },
  { value: 'failed', label: 'Gagal' },
  { value: 'cancelled', label: 'Dibatalkan' },
];

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await transactionsAPI.getAll({ page, limit: 10, status: status || undefined });
      setTransactions(res.data.transactions);
      setTotalPages(res.data.pagination.pages);
      setTotal(res.data.pagination.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, status]);

  const handleStatusChange = (s: string) => {
    setStatus(s);
    setPage(1);
  };

  return (
    <AuthGuard>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-black" style={{ color: '#ea5234' }}>📋 Riwayat Transaksi</h1>
          <p className="text-slate-400 mt-1">{total} transaksi total</p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-1 bg-[#ea5234]/10 border border-[#ea5234]/20 rounded-xl p-1 mb-6 overflow-x-auto backdrop-blur-sm">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => handleStatusChange(f.value)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 whitespace-nowrap',
                status === f.value 
                  ? 'text-white shadow-lg' 
                  : 'text-slate-400 hover:text-white hover:bg-[#ea5234]/20'
              )}
              style={status === f.value ? { background: '#ea5234' } : {}}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#ea5234' }} />
          </div>
        ) : (
          <TransactionList transactions={transactions} onRefresh={fetchTransactions} />
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 disabled:opacity-30 hover:gap-2"
              style={{ 
                background: '#ea5234/10', 
                border: '1px solid rgba(234, 82, 52, 0.2)',
                color: '#ea5234'
              }}
            >
              ← Sebelumnya
            </button>
            <span className="text-slate-400 text-sm px-4 py-2 rounded-xl" style={{ background: '#ea5234/10', border: '1px solid rgba(234, 82, 52, 0.2)' }}>
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 disabled:opacity-30 hover:gap-2"
              style={{ 
                background: '#ea5234/10', 
                border: '1px solid rgba(234, 82, 52, 0.2)',
                color: '#ea5234'
              }}
            >
              Berikutnya →
            </button>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}