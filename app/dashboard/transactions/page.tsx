'use client';

import { useEffect, useState } from 'react';
import { transactionsAPI } from '@/lib/api/client';
import { Transaction } from '@/types';
import TransactionList from '@/components/transactions/TransactionList';
import AuthGuard from '@/components/auth/AuthGuard';
import { Loader2, Filter, ChevronLeft, ChevronRight, Calendar, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils/format';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_FILTERS = [
  { value: '', label: 'Semua', icon: <Filter size={14} />, color: '#ea5234' },
  { value: 'pending', label: 'Menunggu', icon: <Clock size={14} />, color: '#f59e0b' },
  { value: 'processing', label: 'Diproses', icon: <TrendingUp size={14} />, color: '#3b82f6' },
  { value: 'success', label: 'Berhasil', icon: <CheckCircle size={14} />, color: '#10b981' },
  { value: 'failed', label: 'Gagal', icon: <XCircle size={14} />, color: '#ef4444' },
  { value: 'cancelled', label: 'Dibatalkan', icon: <AlertCircle size={14} />, color: '#6b7280' },
];

const STATUS_STATS = {
  total: { label: 'Total', icon: <Calendar size={18} />, color: '#ea5234' },
  pending: { label: 'Menunggu', icon: <Clock size={18} />, color: '#f59e0b' },
  processing: { label: 'Diproses', icon: <TrendingUp size={18} />, color: '#3b82f6' },
  success: { label: 'Berhasil', icon: <CheckCircle size={18} />, color: '#10b981' },
  failed: { label: 'Gagal', icon: <XCircle size={18} />, color: '#ef4444' },
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<Record<string, number>>({});

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await transactionsAPI.getAll({ page, limit: 10, status: status || undefined });
      setTransactions(res.data.transactions);
      setTotalPages(res.data.pagination.pages);
      setTotal(res.data.pagination.total);
      
      // Calculate stats
      const statsData: Record<string, number> = {
        total: res.data.pagination.total,
        pending: 0,
        processing: 0,
        success: 0,
        failed: 0,
      };
      res.data.transactions.forEach((t: Transaction) => {
        if (statsData[t.status] !== undefined) statsData[t.status]++;
      });
      setStats(statsData);
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
      <div className="min-h-screen bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
          {/* Header Section */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-[#ea5234] to-[#f59e0b] bg-clip-text text-transparent">
                  History Transactions
                </h1>
                <p className="text-slate-400 mt-2 text-sm">
                  Manage and monitor all your transactions
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 rounded-xl" style={{ background: '#ea5234/10', border: '1px solid rgba(234, 82, 52, 0.2)' }}>
                  <span className="text-2xl font-bold text-[#ea5234]">{total}</span>
                  <span className="text-slate-400 text-sm ml-1">Total Transaksi</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8"
          >
            {Object.entries(STATUS_STATS).map(([key, stat]) => (
              <div
                key={key}
                className="relative overflow-hidden rounded-xl p-4 transition-all duration-300 hover:scale-105 cursor-pointer"
                style={{ 
                  background: '#ea5234/10', 
                  border: `1px solid ${status === key ? '#ea5234' : 'rgba(234, 82, 52, 0.2)'}`,
                  boxShadow: status === key ? `0 0 20px rgba(234, 82, 52, 0.2)` : 'none'
                }}
                onClick={() => handleStatusChange(key === 'total' ? '' : key)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-2xl">{stat.icon}</div>
                  <div className="text-2xl font-bold" style={{ color: stat.color }}>
                    {stats[key] || 0}
                  </div>
                </div>
                <div className="text-sm font-medium" style={{ color: stat.color }}>
                  {stat.label}
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#ea5234] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            ))}
          </motion.div>

          {/* Filter Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <div className="flex items-center gap-2 mb-3">
              <Filter size={16} className="text-[#ea5234]" />
              <span className="text-sm font-medium text-slate-400">Filter Status</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {STATUS_FILTERS.map((f) => (
                <motion.button
                  key={f.value}
                  onClick={() => handleStatusChange(f.value)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    'px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2',
                    status === f.value 
                      ? 'text-white shadow-lg' 
                      : 'text-slate-400 hover:text-white'
                  )}
                  style={status === f.value ? { background: '#ea5234' } : { background: '#ea5234/10', border: '1px solid rgba(234, 82, 52, 0.2)' }}
                >
                  {f.icon}
                  {f.label}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Content Section */}
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-center py-20"
              >
                <div className="relative">
                  <Loader2 className="w-12 h-12 animate-spin" style={{ color: '#ea5234' }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-black/50" />
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {transactions.length === 0 ? (
                  <div className="text-center py-16 rounded-2xl" style={{ background: '#ea5234/10', border: '1px solid rgba(234, 82, 52, 0.2)' }}>
                    <div className="text-6xl mb-4">📭</div>
                    <h3 className="text-xl font-semibold text-white mb-2">Belum Ada Transaksi</h3>
                    <p className="text-slate-400">Mulai top up dan lihat riwayat transaksi Anda di sini</p>
                  </div>
                ) : (
                  <TransactionList transactions={transactions} onRefresh={fetchTransactions} />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-center gap-3 mt-8"
            >
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="group relative px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed overflow-hidden"
                style={{ 
                  background: '#ea5234/10', 
                  border: '1px solid rgba(234, 82, 52, 0.2)',
                  color: '#ea5234'
                }}
              >
                <span className="relative z-10 flex items-center gap-2">
                  <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                  Sebelumnya
                </span>
              </button>
              
              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={cn(
                        'w-10 h-10 rounded-xl text-sm font-medium transition-all duration-300',
                        page === pageNum
                          ? 'text-white shadow-lg'
                          : 'text-slate-400 hover:text-white'
                      )}
                      style={page === pageNum ? { background: '#ea5234' } : { background: '#ea5234/10', border: '1px solid rgba(234, 82, 52, 0.2)' }}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="group relative px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed overflow-hidden"
                style={{ 
                  background: '#ea5234/10', 
                  border: '1px solid rgba(234, 82, 52, 0.2)',
                  color: '#ea5234'
                }}
              >
                <span className="relative z-10 flex items-center gap-2">
                  Berikutnya
                  <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}