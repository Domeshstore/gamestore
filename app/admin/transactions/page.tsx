// app/admin/transactions/page.tsx
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { adminAPI } from '@/lib/api/client';
import { Transaction } from '@/types';
import {
  formatCurrency, formatDate, getStatusColor, getStatusLabel, getErrorMessage,
} from '@/lib/utils/format';
import {
  CheckCircle, XCircle, Zap, Eye, X, Loader2, Bell, BellOff, Volume2,
} from 'lucide-react';
import { cn } from '@/lib/utils/format';
import toast from 'react-hot-toast';

const TABS = [
  { value: '', label: 'Semua' },
  { value: 'waiting_payment', label: '⏳ Menunggu Bayar' },
  { value: 'paid',            label: '💰 Sudah Bayar' },
  { value: 'processing',      label: '⚙️ Diproses' },
  { value: 'success',         label: '✅ Sukses' },
  { value: 'failed',          label: '❌ Gagal' },
];

type ActionKey = 'mark-paid'|'process'|'mark-success'|'mark-failed';

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading]           = useState(true);
  const [status, setStatus]             = useState('');
  const [page, setPage]                 = useState(1);
  const [totalPages, setTotalPages]     = useState(1);
  const [total, setTotal]               = useState(0);
  const [selectedTx, setSelectedTx]     = useState<Transaction | null>(null);
  const [actionLoading, setActionLoading] = useState<ActionKey|null>(null);
  const [notesInput, setNotesInput]     = useState('');
  const [soundOn, setSoundOn]           = useState(true);
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [audioAllowed, setAudioAllowed] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Gunakan proxy SSE, bukan langsung ke backend
  const SSE_URL = '/api/notifications';

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
      // Fallback ke Web Audio jika file tidak ada
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

  // Enable audio on first user interaction
  const enableAudio = useCallback(async () => {
    if (!audioRef.current) return;
    
    try {
      // Coba play dan langsung pause untuk "unlock" audio
      await audioRef.current.play();
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      console.log('[Audio] Enabled successfully');
    } catch (err) {
      console.warn('[Audio] Enable failed:', err);
    }
  }, []);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (!soundOn) return;
    
    const play = async () => {
      try {
        if (audioRef.current && audioAllowed) {
          audioRef.current.currentTime = 0;
          await audioRef.current.play();
        } else {
          // Fallback ke Web Audio
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

  // Test sound
  const testSound = () => {
    playNotificationSound();
    toast.success('🔊 Test suara! Apakah kamu mendengar?');
  };

  // Enable audio on first click anywhere
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

  /* ── SSE notification listener via proxy ── */
  useEffect(() => {
    console.log('[SSE] Connecting to:', SSE_URL);
    
    const es = new EventSource(SSE_URL);
    
    es.onopen = () => {
      console.log('[SSE] ✅ Connection established');
    };
    
    es.onerror = (err) => {
      console.error('[SSE] ❌ Connection error:', err);
      // Auto reconnect after 5 seconds
      setTimeout(() => {
        console.log('[SSE] Reconnecting...');
      }, 5000);
    };
    
    es.addEventListener('connected', (e) => {
      console.log('[SSE] Connected event:', e.data);
    });
    
    es.addEventListener('heartbeat', (e) => {
      console.log('[SSE] Heartbeat:', e.data);
    });
    
    es.addEventListener('new_order', (e) => {
      console.log('[SSE] New order received:', e.data);
      try {
        const data = JSON.parse(e.data);
        setNewOrderCount(c => c + 1);
        playNotificationSound();
        
        toast.custom((t) => (
          <div className={cn('glass-card px-4 py-3 flex items-center gap-3 max-w-sm border-blue-500/30 bg-blue-500/10', t.visible ? 'animate-enter' : 'animate-leave')}>
            <Bell className="w-5 h-5 text-blue-400 shrink-0" />
            <div>
              <p className="text-white font-semibold text-sm">Pesanan Baru!</p>
              <p className="text-slate-400 text-xs">{data.gameName} — {data.voucherName}</p>
              <p className="text-blue-400 text-xs font-bold">{formatCurrency(data.price)}</p>
            </div>
          </div>
        ), { duration: 6000 });
        
        fetchTransactions();
      } catch (err) {
        console.error('[SSE] Parse error:', err);
      }
    });
    
    es.addEventListener('proof_uploaded', (e) => {
      console.log('[SSE] Proof uploaded:', e.data);
      try {
        const data = JSON.parse(e.data);
        playNotificationSound();
        toast.success(`💳 Bukti bayar diterima: ${data.gameName}`);
        fetchTransactions();
      } catch (err) {
        console.error('[SSE] Parse error:', err);
      }
    });
    
    es.addEventListener('payment_confirmed', () => {
      console.log('[SSE] Payment confirmed');
      fetchTransactions();
    });
    
    es.addEventListener('status_updated', (e) => {
      console.log('[SSE] Status updated:', e.data);
      fetchTransactions();
    });
    
    return () => {
      console.log('[SSE] Closing connection');
      es.close();
    };
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
    } finally { 
      setLoading(false); 
    }
  }, [page, status]);

  useEffect(() => { 
    fetchTransactions(); 
  }, [fetchTransactions]);

  const handleAction = async (action: ActionKey) => {
    if (!selectedTx) return;
    setActionLoading(action);
    try {
      let res;
      if (action === 'mark-paid')     res = await adminAPI.markPaid(selectedTx._id);
      if (action === 'process')       res = await adminAPI.processProvider(selectedTx._id);
      if (action === 'mark-success')  res = await adminAPI.markSuccess(selectedTx._id, notesInput);
      if (action === 'mark-failed')   res = await adminAPI.markFailed(selectedTx._id, notesInput);
      if (res) {
        setSelectedTx(res.data.data);
        toast.success('Status diperbarui');
        fetchTransactions();
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally { 
      setActionLoading(null); 
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            📋 Kelola Transaksi
            {newOrderCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                +{newOrderCount}
              </span>
            )}
          </h1>
          <p className="text-slate-400 text-sm mt-1">{total} total</p>
          {!audioAllowed && (
            <p className="text-yellow-400 text-xs mt-1 flex items-center gap-1">
              <Volume2 className="w-3 h-3" />
              Klik halaman untuk mengaktifkan suara notifikasi
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Tombol Test Sound */}
          <button
            onClick={testSound}
            className="p-2 rounded-xl border bg-green-500/20 border-green-500/30 text-green-400 hover:bg-green-500/30 transition-colors"
            title="Test suara"
          >
            <Volume2 className="w-4 h-4" />
          </button>
          
          {/* Tombol Toggle Sound */}
          <button
            onClick={() => {
              setSoundOn(!soundOn);
              toast(soundOn ? '🔕 Notifikasi suara dimatikan' : '🔔 Notifikasi suara dinyalakan');
              if (!soundOn) testSound();
            }}
            className={cn('p-2 rounded-xl border transition-colors', 
              soundOn
                ? 'bg-blue-500/20 border-blue-500/30 text-blue-400'
                : 'bg-white/5 border-white/10 text-slate-400'
            )}
            title={soundOn ? 'Matikan suara notifikasi' : 'Nyalakan suara notifikasi'}
          >
            {soundOn ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          </button>
          
          <button onClick={() => { setNewOrderCount(0); fetchTransactions(); }}
            className="btn-secondary text-sm py-2">
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap bg-white/5 rounded-xl p-1 mb-6">
        {TABS.map(t => (
          <button key={t.value}
            onClick={() => { setStatus(t.value); setPage(1); }}
            className={cn('px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap',
              status === t.value ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            )}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Table - same as before */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-slate-400 text-xs font-semibold uppercase px-3 py-3">Ref ID</th>
                  <th className="text-left text-slate-400 text-xs font-semibold uppercase px-3 py-3">User</th>
                  <th className="text-left text-slate-400 text-xs font-semibold uppercase px-3 py-3">Game / Voucher</th>
                  <th className="text-left text-slate-400 text-xs font-semibold uppercase px-3 py-3">Harga</th>
                  <th className="text-left text-slate-400 text-xs font-semibold uppercase px-3 py-3">Bayar</th>
                  <th className="text-left text-slate-400 text-xs font-semibold uppercase px-3 py-3">Status</th>
                  <th className="text-left text-slate-400 text-xs font-semibold uppercase px-3 py-3">Tgl</th>
                  <th className="text-left text-slate-400 text-xs font-semibold uppercase px-3 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {transactions.map(tx => (
                  <tr key={tx._id} className="hover:bg-white/5 transition-colors">
                    <td className="px-3 py-3 text-slate-300 text-xs font-mono">{tx.refId.slice(-12)}</td>
                    <td className="px-3 py-3 text-slate-300 text-xs">
                      {typeof tx.userId === 'object' && tx.userId ? (tx.userId as { name: string }).name : '-'}
                    </td>
                    <td className="px-3 py-3">
                      <p className="text-white text-xs font-medium">{tx.gameName}</p>
                      <p className="text-slate-500 text-xs">{tx.voucherName}</p>
                    </td>
                    <td className="px-3 py-3 text-white text-sm font-bold">{formatCurrency(tx.price)}</td>
                    <td className="px-3 py-3 text-slate-300 text-xs capitalize">{tx.paymentMethod.replace('_', ' ')}</td>
                    <td className="px-3 py-3">
                      <span className={cn('status-badge text-xs', getStatusColor(tx.status))}>
                        {getStatusLabel(tx.status)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-slate-400 text-xs">{formatDate(tx.createdAt).slice(0, 12)}</td>
                    <td className="px-3 py-3">
                      <button 
                        onClick={() => { setSelectedTx(tx); setNotesInput(''); }}
                        className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400">
                      Tidak ada transaksi
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button 
            onClick={() => setPage(p => p-1)} 
            disabled={page === 1} 
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white disabled:opacity-30"
          >
            ← Prev
          </button>
          <span className="px-4 py-2 text-slate-400 text-sm">{page}/{totalPages}</span>
          <button 
            onClick={() => setPage(p => p+1)} 
            disabled={page === totalPages} 
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white disabled:opacity-30"
          >
            Next →
          </button>
        </div>
      )}

      {/* Detail & Action Modal - same as before */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-bold text-lg">Detail & Aksi</h3>
              <button onClick={() => setSelectedTx(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <span className={cn('status-badge', getStatusColor(selectedTx.status))}>
                {getStatusLabel(selectedTx.status)}
              </span>
            </div>

            <div className="space-y-2 text-sm mb-5">
              <div className="flex justify-between">
                <span className="text-slate-400">Ref ID</span>
                <span className="text-white font-medium text-right ml-2 break-all">{selectedTx.refId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Game</span>
                <span className="text-white font-medium text-right ml-2 break-all">{selectedTx.gameName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Voucher</span>
                <span className="text-white font-medium text-right ml-2 break-all">{selectedTx.voucherName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Target ID</span>
                <span className="text-white font-medium text-right ml-2 break-all">
                  {selectedTx.targetId}{selectedTx.serverId ? '/' + selectedTx.serverId : ''}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Username</span>
                <span className="text-white font-medium text-right ml-2 break-all">{selectedTx.targetUsername || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Harga</span>
                <span className="text-white font-medium text-right ml-2 break-all">{formatCurrency(selectedTx.price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Pembayaran</span>
                <span className="text-white font-medium text-right ml-2 break-all">{selectedTx.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tanggal</span>
                <span className="text-white font-medium text-right ml-2 break-all">{formatDate(selectedTx.createdAt)}</span>
              </div>
              {selectedTx.providerSN && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Serial No.</span>
                  <span className="text-white font-medium text-right ml-2 break-all">{selectedTx.providerSN}</span>
                </div>
              )}
              {selectedTx.adminNotes && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Catatan Admin</span>
                  <span className="text-white font-medium text-right ml-2 break-all">{selectedTx.adminNotes}</span>
                </div>
              )}
            </div>

            {selectedTx.paymentProof && (
              <div className="mb-5">
                <p className="text-slate-400 text-xs mb-2">Bukti Pembayaran:</p>
                <img
                  src={selectedTx.paymentProof}
                  alt="Bukti" 
                  className="w-full rounded-xl border border-white/10 max-h-64 object-contain bg-white/5"
                />
              </div>
            )}

            {['paid', 'processing'].includes(selectedTx.status) && (
              <div className="mb-4">
                <label className="block text-xs text-slate-300 mb-1">Catatan (opsional)</label>
                <textarea 
                  value={notesInput} 
                  onChange={e => setNotesInput(e.target.value)}
                  placeholder="Contoh: SN 1234567890..." 
                  rows={2}
                  className="input-field text-sm resize-none" 
                />
              </div>
            )}

            <div className="space-y-2">
              {selectedTx.status === 'waiting_payment' && (
                <button 
                  onClick={() => handleAction('mark-paid')} 
                  disabled={!!actionLoading}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  {actionLoading === 'mark-paid' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  ✅ Konfirmasi Pembayaran Diterima
                </button>
              )}

              {selectedTx.status === 'paid' && (
                <button 
                  onClick={() => handleAction('process')} 
                  disabled={!!actionLoading}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  {actionLoading === 'process' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  ⚡ Proses via {selectedTx.provider === 'digiflazz' ? 'Digiflazz' : 'Apigames'}
                </button>
              )}

              {['paid', 'processing'].includes(selectedTx.status) && (
                <>
                  <button 
                    onClick={() => handleAction('mark-success')} 
                    disabled={!!actionLoading}
                    className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                    {actionLoading === 'mark-success' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    ✅ Tandai Sukses (Manual)
                  </button>
                  <button 
                    onClick={() => handleAction('mark-failed')} 
                    disabled={!!actionLoading}
                    className="w-full bg-red-600/80 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                    {actionLoading === 'mark-failed' ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                    ❌ Tandai Gagal
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}