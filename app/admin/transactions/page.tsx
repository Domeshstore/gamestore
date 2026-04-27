'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { adminAPI } from '@/lib/api/client';
import { Transaction } from '@/types';
import {
  formatCurrency, formatDate, getStatusColor, getStatusLabel, getErrorMessage,
} from '@/lib/utils/format';
import {
  CheckCircle, XCircle, Zap, Eye, X, Loader2, Bell, BellOff, Volume2,
  Search, Filter, ChevronLeft, ChevronRight, TrendingUp, Clock,
  CreditCard, User, Package, Calendar, MessageSquare, Image as ImageIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils/format';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================
// THEME CONSTANTS
// ============================================================
const THEME = {
  primary: '#ea5234',
  primaryDark: '#c23d22',
  secondary: '#f59e0b',
  gradient: 'linear-gradient(135deg, #ea5234, #f59e0b)',
  gradientReverse: 'linear-gradient(135deg, #f59e0b, #ea5234)',
  bgLight: 'rgba(234, 82, 52, 0.08)',
  bgMedium: 'rgba(234, 82, 52, 0.12)',
  border: 'rgba(234, 82, 52, 0.2)',
  shadow: 'rgba(234, 82, 52, 0.25)',
};

const STATUS_STATS = [
  { key: 'waiting_payment', label: 'Menunggu Bayar', icon: Clock, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
  { key: 'paid', label: 'Sudah Bayar', icon: CreditCard, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
  { key: 'processing', label: 'Diproses', icon: Zap, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
  { key: 'success', label: 'Sukses', icon: CheckCircle, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
  { key: 'failed', label: 'Gagal', icon: XCircle, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
];

const TABS = [
  { value: '', label: 'Semua', icon: Search },
  { value: 'waiting_payment', label: 'Menunggu Bayar', icon: Clock, color: '#f59e0b' },
  { value: 'paid', label: 'Sudah Bayar', icon: CreditCard, color: '#3b82f6' },
  { value: 'processing', label: 'Diproses', icon: Zap, color: '#8b5cf6' },
  { value: 'success', label: 'Sukses', icon: CheckCircle, color: '#10b981' },
  { value: 'failed', label: 'Gagal', icon: XCircle, color: '#ef4444' },
];

type ActionKey = 'mark-paid' | 'process' | 'mark-success' | 'mark-failed';

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [actionLoading, setActionLoading] = useState<ActionKey | null>(null);
  const [notesInput, setNotesInput] = useState('');
  const [soundOn, setSoundOn] = useState(true);
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [audioAllowed, setAudioAllowed] = useState(false);
  const [stats, setStats] = useState<Record<string, number>>({});

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const SSE_URL = '/api/notifications';

  // Hitung stats dari transaksi
  useEffect(() => {
    const newStats: Record<string, number> = {
      waiting_payment: 0, paid: 0, processing: 0, success: 0, failed: 0
    };
    transactions.forEach(tx => {
      if (newStats[tx.status] !== undefined) newStats[tx.status]++;
    });
    setStats(newStats);
  }, [transactions]);

  // Inisialisasi audio element
  useEffect(() => {
    const audio = new Audio('/sounds/notif.mp3');
    audio.preload = 'auto';
    audio.volume = 0.5;
    
    audio.addEventListener('canplaythrough', () => {
      console.log('[Audio] Ready to play');
      setAudioAllowed(true);
    });
    
    audio.addEventListener('error', (e) => {
      console.warn('[Audio] Failed to load:', e);
      setAudioAllowed(false);
    });
    
    audioRef.current = audio;
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const enableAudio = useCallback(async () => {
    if (!audioRef.current) return;
    try {
      await audioRef.current.play();
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    } catch (err) {
      console.warn('[Audio] Enable failed:', err);
    }
  }, []);

  const playNotificationSound = useCallback(() => {
    if (!soundOn) return;
    
    const play = async () => {
      try {
        if (audioRef.current && audioAllowed) {
          audioRef.current.currentTime = 0;
          await audioRef.current.play();
        } else {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtx) {
            const ctx = new AudioCtx();
            await ctx.resume();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 880;
            gain.gain.value = 0.2;
            osc.start();
            gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5);
            osc.stop(ctx.currentTime + 0.3);
            setTimeout(() => ctx.close(), 500);
          }
        }
      } catch (err) {
        console.warn('[Audio] Play failed:', err);
      }
    };
    play();
  }, [soundOn, audioAllowed]);

  const testSound = () => {
    playNotificationSound();
    toast.success('🔊 Test suara! Apakah kamu mendengar?');
  };

  useEffect(() => {
    const handleFirstInteraction = () => {
      enableAudio();
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };
    
    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);
    document.addEventListener('touchstart', handleFirstInteraction);
    
    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, [enableAudio]);

  // SSE notification listener
  useEffect(() => {
    console.log('[SSE] Connecting to:', SSE_URL);
    const es = new EventSource(SSE_URL);
    
    es.onopen = () => console.log('[SSE] ✅ Connection established');
    es.onerror = (err) => {
      console.error('[SSE] ❌ Connection error:', err);
      setTimeout(() => console.log('[SSE] Reconnecting...'), 5000);
    };
    
    es.addEventListener('connected', (e) => console.log('[SSE] Connected:', e.data));
    es.addEventListener('heartbeat', (e) => console.log('[SSE] Heartbeat:', e.data));
    
    es.addEventListener('new_order', (e) => {
      try {
        const data = JSON.parse(e.data);
        setNewOrderCount(c => c + 1);
        playNotificationSound();
        
        toast.custom((t) => (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="bg-gradient-to-r from-[#ea5234] to-[#f59e0b] text-white rounded-xl px-4 py-3 shadow-xl max-w-sm"
          >
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5" />
              <div>
                <p className="font-bold text-sm">Pesanan Baru!</p>
                <p className="text-xs opacity-90">{data.gameName} — {data.voucherName}</p>
                <p className="text-xs font-bold">{formatCurrency(data.price)}</p>
              </div>
            </div>
          </motion.div>
        ), { duration: 5000 });
        
        fetchTransactions();
      } catch (err) { console.error('[SSE] Parse error:', err); }
    });
    
    es.addEventListener('proof_uploaded', (e) => {
      try {
        const data = JSON.parse(e.data);
        playNotificationSound();
        toast.success(`💳 Bukti bayar diterima: ${data.gameName}`);
        fetchTransactions();
      } catch (err) { console.error('[SSE] Parse error:', err); }
    });
    
    es.addEventListener('payment_confirmed', () => fetchTransactions());
    es.addEventListener('status_updated', () => fetchTransactions());
    
    return () => es.close();
  }, [playNotificationSound]);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getAllTransactions({ page, limit: 20, status: status || undefined });
      setTransactions(res.data.transactions);
      setTotalPages(res.data.pagination.pages);
      setTotal(res.data.pagination.total);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  }, [page, status]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const handleAction = async (action: ActionKey) => {
    if (!selectedTx) return;
    setActionLoading(action);
    try {
      let res;
      if (action === 'mark-paid') res = await adminAPI.markPaid(selectedTx._id);
      if (action === 'process') res = await adminAPI.processProvider(selectedTx._id);
      if (action === 'mark-success') res = await adminAPI.markSuccess(selectedTx._id, notesInput);
      if (action === 'mark-failed') res = await adminAPI.markFailed(selectedTx._id, notesInput);
      if (res) {
        setSelectedTx(res.data.data);
        toast.success('Status diperbarui');
        fetchTransactions();
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally { setActionLoading(null); }
  };

  return (
    <div className="space-y-6">
      {/* Header Section with Gradient */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-[#ea5234]/20 to-[#f59e0b]/20 rounded-2xl blur-3xl" />
        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-[#ea5234] to-[#f59e0b] bg-clip-text text-transparent flex items-center gap-3">
              📋 Kelola Transaksi
              {newOrderCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg"
                >
                  +{newOrderCount}
                </motion.span>
              )}
            </h1>
            <p className="text-slate-400 mt-1 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              {total} total transaksi
            </p>
            {!audioAllowed && (
              <p className="text-amber-400 text-xs mt-2 flex items-center gap-1 animate-pulse">
                <Volume2 className="w-3 h-3" />
                Klik halaman untuk mengaktifkan suara notifikasi
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={testSound}
              className="p-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 transition-all"
              title="Test suara"
            >
              <Volume2 className="w-4 h-4" />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setSoundOn(!soundOn);
                toast(soundOn ? '🔕 Notifikasi suara dimatikan' : '🔔 Notifikasi suara dinyalakan');
                if (!soundOn) testSound();
              }}
              className={cn('p-2.5 rounded-xl transition-all', 
                soundOn
                  ? 'bg-[#ea5234]/20 border border-[#ea5234]/30 text-[#ea5234]'
                  : 'bg-white/5 border border-white/10 text-slate-400'
              )}
              title={soundOn ? 'Matikan suara' : 'Nyalakan suara'}
            >
              {soundOn ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { setNewOrderCount(0); fetchTransactions(); }}
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 4v6h-6M1 20v-6h6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Refresh
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {STATUS_STATS.map((stat, idx) => (
          <motion.div
            key={stat.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + idx * 0.05 }}
            onClick={() => { setStatus(stat.key); setPage(1); }}
            className={cn(
              'rounded-xl p-4 cursor-pointer transition-all duration-300 hover:scale-105',
              status === stat.key ? 'ring-2 ring-[#ea5234] shadow-lg' : ''
            )}
            style={{ background: stat.bg, border: `1px solid ${status === stat.key ? THEME.primary : 'rgba(255,255,255,0.08)'}` }}
          >
            <div className="flex items-center justify-between mb-2">
              <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
              <span className="text-2xl font-bold" style={{ color: stat.color }}>
                {stats[stat.key as keyof typeof stats] || 0}
              </span>
            </div>
            <p className="text-xs text-slate-400">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Tabs with Animation */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="flex gap-1 flex-wrap bg-white/5 rounded-xl p-1">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatus(tab.value); setPage(1); }}
            className={cn(
              'px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2',
              status === tab.value
                ? 'text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            )}
            style={status === tab.value ? { background: THEME.gradient } : {}}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Table Section */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex justify-center py-20">
            <div className="relative">
              <Loader2 className="w-12 h-12 animate-spin" style={{ color: THEME.primary }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-black/50" />
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="rounded-2xl overflow-hidden border" style={{ background: THEME.bgLight, borderColor: THEME.border }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: THEME.border }}>
                    <th className="text-left text-slate-400 text-xs font-semibold uppercase px-4 py-4">Ref ID</th>
                    <th className="text-left text-slate-400 text-xs font-semibold uppercase px-4 py-4">User</th>
                    <th className="text-left text-slate-400 text-xs font-semibold uppercase px-4 py-4">Produk</th>
                    <th className="text-left text-slate-400 text-xs font-semibold uppercase px-4 py-4">Harga</th>
                    <th className="text-left text-slate-400 text-xs font-semibold uppercase px-4 py-4">Metode</th>
                    <th className="text-left text-slate-400 text-xs font-semibold uppercase px-4 py-4">Status</th>
                    <th className="text-left text-slate-400 text-xs font-semibold uppercase px-4 py-4">Tanggal</th>
                    <th className="text-left text-slate-400 text-xs font-semibold uppercase px-4 py-4">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: THEME.border }}>
                  {transactions.map((tx, idx) => (
                    <motion.tr
                      key={tx._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <code className="text-slate-300 text-xs font-mono bg-white/5 px-2 py-1 rounded-lg">
                          {tx.refId.slice(-12)}
                        </code>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-r from-[#ea5234]/20 to-[#f59e0b]/20 flex items-center justify-center">
                            <User className="w-3.5 h-3.5 text-[#ea5234]" />
                          </div>
                          <span className="text-slate-300 text-sm">
                            {typeof tx.userId === 'object' && tx.userId ? (tx.userId as { name: string }).name : '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-white text-sm font-medium">{tx.gameName}</p>
                          <p className="text-slate-500 text-xs">{tx.voucherName}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-white font-bold text-sm">{formatCurrency(tx.price)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-slate-400 text-xs capitalize px-2 py-1 rounded-lg bg-white/5">
                          {tx.paymentMethod.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('px-2 py-1 rounded-lg text-xs font-semibold', getStatusColor(tx.status))}>
                          {getStatusLabel(tx.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(tx.createdAt).slice(0, 10)}</td>
                      <td className="px-4 py-3">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => { setSelectedTx(tx); setNotesInput(''); }}
                          className="p-1.5 rounded-lg transition-all"
                          style={{ background: `${THEME.primary}20`, color: THEME.primary }}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-16 text-slate-400">
                        <div className="flex flex-col items-center gap-2">
                          <div className="text-5xl">📭</div>
                          <p>Tidak ada transaksi</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-3 mt-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
            style={{ background: THEME.bgLight, border: `1px solid ${THEME.border}`, color: THEME.primary }}
          >
            <ChevronLeft className="w-4 h-4" /> Sebelumnya
          </motion.button>
          
          <span className="px-4 py-2 text-slate-300 text-sm bg-white/5 rounded-lg">
            Halaman {page} dari {totalPages}
          </span>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
            style={{ background: THEME.bgLight, border: `1px solid ${THEME.border}`, color: THEME.primary }}
          >
            Selanjutnya <ChevronRight className="w-4 h-4" />
          </motion.button>
        </motion.div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedTx && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setSelectedTx(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6"
              style={{ background: '#1a1a2e', border: `1px solid ${THEME.border}` }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-white font-bold text-xl flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-gradient-to-r from-[#ea5234] to-[#f59e0b] flex items-center justify-center">
                    <Package className="w-4 h-4 text-white" />
                  </span>
                  Detail Transaksi
                </h3>
                <button onClick={() => setSelectedTx(null)} className="text-slate-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-5">
                <span className={cn('px-3 py-1.5 rounded-xl text-sm font-bold', getStatusColor(selectedTx.status))}>
                  {getStatusLabel(selectedTx.status)}
                </span>
              </div>

              <div className="space-y-3 text-sm mb-6">
                <div className="flex justify-between items-center p-3 rounded-xl bg-white/5">
                  <span className="text-slate-400 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#ea5234]" />Ref ID</span>
                  <code className="text-white font-mono text-xs bg-white/10 px-2 py-1 rounded-lg">{selectedTx.refId}</code>
                </div>
                {[
                  { icon: GameIcon, label: 'Game', value: selectedTx.gameName },
                  { icon: Package, label: 'Voucher', value: selectedTx.voucherName },
                  { icon: User, label: 'Target ID', value: `${selectedTx.targetId}${selectedTx.serverId ? '/' + selectedTx.serverId : ''}` },
                  { icon: User, label: 'Username', value: selectedTx.targetUsername || '-' },
                  { icon: TrendingUp, label: 'Harga', value: formatCurrency(selectedTx.price), highlight: true },
                  { icon: CreditCard, label: 'Pembayaran', value: selectedTx.paymentMethod.replace('_', ' ') },
                  { icon: Calendar, label: 'Tanggal', value: formatDate(selectedTx.createdAt) },
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2">
                    <span className="text-slate-400 flex items-center gap-2">
                      <item.icon className="w-3.5 h-3.5 opacity-60" /> {item.label}
                    </span>
                    <span className={cn('text-white font-medium', item.highlight && 'text-[#ea5234] font-bold text-base')}>
                      {item.value}
                    </span>
                  </div>
                ))}
                {selectedTx.providerSN && (
                  <div className="flex justify-between items-center p-2 bg-green-500/10 rounded-xl">
                    <span className="text-green-400 flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5" /> Serial Number</span>
                    <code className="text-green-400 font-mono text-xs">{selectedTx.providerSN}</code>
                  </div>
                )}
              </div>

              {selectedTx.paymentProof && (
                <div className="mb-5">
                  <p className="text-slate-400 text-xs mb-2 flex items-center gap-2"><ImageIcon className="w-3 h-3" /> Bukti Pembayaran:</p>
                  <img src={selectedTx.paymentProof} alt="Bukti" className="w-full rounded-xl border border-white/10 max-h-48 object-contain bg-white/5" />
                </div>
              )}

              {['paid', 'processing'].includes(selectedTx.status) && (
                <div className="mb-5">
                  <label className=" text-xs text-slate-300 mb-2 flex items-center gap-2"><MessageSquare className="w-3 h-3" /> Catatan Admin</label>
                  <textarea 
                    value={notesInput} 
                    onChange={e => setNotesInput(e.target.value)}
                    placeholder="Contoh: SN 1234567890..." 
                    rows={2}
                    className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white resize-none focus:outline-none focus:border-[#ea5234] transition-all"
                  />
                </div>
              )}

              <div className="space-y-2">
                {selectedTx.status === 'waiting_payment' && (
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => handleAction('mark-paid')} disabled={!!actionLoading}
                    className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all"
                    style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 4px 15px rgba(59,130,246,0.3)' }}>
                    {actionLoading === 'mark-paid' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Konfirmasi Pembayaran Diterima
                  </motion.button>
                )}

                {selectedTx.status === 'paid' && (
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => handleAction('process')} disabled={!!actionLoading}
                    className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all"
                    style={{ background: THEME.gradient, boxShadow: `0 4px 15px ${THEME.shadow}` }}>
                    {actionLoading === 'process' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    Proses via {selectedTx.provider === 'digiflazz' ? 'Digiflazz' : 'Apigames'}
                  </motion.button>
                )}

                {['paid', 'processing'].includes(selectedTx.status) && (
                  <div className="flex gap-3">
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={() => handleAction('mark-success')} disabled={!!actionLoading}
                      className="flex-1 py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 transition-all">
                      {actionLoading === 'mark-success' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      Sukses
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={() => handleAction('mark-failed')} disabled={!!actionLoading}
                      className="flex-1 py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 transition-all">
                      {actionLoading === 'mark-failed' ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                      Gagal
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper icon component
function GameIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 11h4M7 8v6M15 11h4M16 8v6M12 17v4M8 21h8" stroke="currentColor" strokeLinecap="round"/>
      <rect x="2" y="6" width="20" height="11" rx="2" stroke="currentColor"/>
    </svg>
  );
}