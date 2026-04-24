'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { transactionsAPI, settingsAPI, paymentAPI } from '@/lib/api/client';
import { Transaction, AppSetting } from '@/types';
import {
  formatCurrency, formatDate, getStatusColor, getStatusLabel, getPaymentMethodLabel,
  cn,
} from '@/lib/utils/format';
import AuthGuard from '@/components/auth/AuthGuard';
import {
  CheckCircle, XCircle, Clock, Loader2, Upload, RefreshCw,
  Copy, Check, MessageCircle, Send, Star, ChevronDown, ChevronUp,
  CreditCard, Shield, AlertTriangle,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';

/* ── Star Rating dengan Hover Effect ── */
function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(n => (
        <button
          key={n}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          className="transition-transform hover:scale-110"
        >
          <Star className={cn('w-7 h-7 transition-all',
            (hover || value) >= n
              ? 'text-yellow-400 fill-yellow-400'
              : 'text-slate-600'
          )} />
        </button>
      ))}
    </div>
  );
}

/* ── Countdown dengan Progress Bar (versi visual lebih baik) ── */
function Countdown({ expiresAt }: { expiresAt: string }) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    const tick = () => setSecs(Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [expiresAt]);

  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  const pct = Math.min(100, (secs / (24 * 3600)) * 100);
  const isUrgent = secs < 600;

  if (secs === 0) {
    return <p className="text-red-400 font-bold text-center">⏰ Waktu pembayaran habis</p>;
  }

  return (
    <div className="text-center">
      <p className="text-slate-400 text-xs mb-2">Batas waktu pembayaran</p>
      <div className="flex items-center justify-center gap-2 mb-2">
        {[
          { val: h, label: 'Jam' },
          { val: m, label: 'Menit' },
          { val: s, label: 'Detik' },
        ].map(({ val, label }) => (
          <div key={label} className="flex flex-col items-center">
            <div className={cn(
              'w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-black',
              isUrgent ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-white'
            )}>
              {String(val).padStart(2, '0')}
            </div>
            <span className="text-slate-500 text-[10px] mt-1">{label}</span>
          </div>
        ))}
      </div>
      <div className="w-full bg-white/10 rounded-full h-1.5">
        <div
          className={cn('h-1.5 rounded-full transition-all duration-1000', isUrgent ? 'bg-red-500' : 'bg-orange-500')}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ── Inner Component dengan Midtrans Support ── */
function PaymentPageInner() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlStatus = searchParams.get('status');

  const [tx, setTx] = useState<Transaction | null>(null);
  const [settings, setSettings] = useState<AppSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [copied, setCopied] = useState('');
  const [showBanks, setShowBanks] = useState(false);
  const [snapLoading, setSnapLoading] = useState(false);
  const [snapToken, setSnapToken] = useState('');
  // Review
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const snapScriptLoaded = useRef(false);

  const fetchTx = useCallback(async () => {
    const res = await transactionsAPI.getById(id);
    setTx(res.data.data);
    if (res.data.settings) setSettings(res.data.settings);
  }, [id]);

  // Initial load
  useEffect(() => {
    Promise.all([
      transactionsAPI.getById(id),
      settingsAPI.getApp(),
    ]).then(([txRes, sRes]) => {
      setTx(txRes.data.data);
      setSettings(sRes.data.data);
    }).catch(() => {
      toast.error('Transaksi tidak ditemukan');
      router.replace('/dashboard/transactions');
    }).finally(() => setLoading(false));
  }, [id, router]);

  // Auto-poll for processing orders
  useEffect(() => {
    if (tx && ['paid', 'processing'].includes(tx.status)) {
      const interval = setInterval(async () => {
        const res = await transactionsAPI.checkStatus(id).catch(() => null);
        if (res) setTx(res.data.data);
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [tx?.status, id]);

  // Load Midtrans Snap.js script
  useEffect(() => {
    if (snapScriptLoaded.current) return;
    const isSandbox = process.env.NEXT_PUBLIC_MIDTRANS_ENV !== 'production';
    const script = document.createElement('script');
    script.src = isSandbox
      ? 'https://app.sandbox.midtrans.com/snap/snap.js'
      : 'https://app.midtrans.com/snap/snap.js';
    script.setAttribute('data-client-key', process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '');
    script.async = true;
    document.head.appendChild(script);
    snapScriptLoaded.current = true;
  }, []);

  // Handle Midtrans payment
  const handlePayWithMidtrans = async () => {
    if (!tx) return;
    setSnapLoading(true);
    try {
      let token = snapToken;
      if (!token) {
        const res = await paymentAPI.createSnap(id);
        token = res.data.data.token;
        setSnapToken(token);
      }
      if (!(window as any).snap) {
        toast.error('Midtrans Snap belum siap, coba lagi');
        return;
      }
      (window as any).snap.pay(token, {
        onSuccess: () => {
          toast.success('Pembayaran berhasil!');
          fetchTx();
        },
        onPending: () => {
          toast('Pembayaran pending');
          fetchTx();
        },
        onError: () => {
          toast.error('Pembayaran gagal');
          fetchTx();
        },
        onClose: () => fetchTx(),
      });
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat pembayaran');
    } finally {
      setSnapLoading(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !tx) return;
    setUploading(true);
    try {
      const res = await transactionsAPI.uploadProof(id, file);
      setTx(res.data.data);
      toast.success('Bukti pembayaran diterima!');
    } catch {
      toast.error('Gagal upload. Coba lagi.');
    } finally { setUploading(false); }
  };

  const handleCheckStatus = async () => {
    setChecking(true);
    try {
      const res = await transactionsAPI.checkStatus(id);
      setTx(res.data.data);
      toast.success(`Status: ${getStatusLabel(res.data.data.status)}`);
    } catch { toast.error('Gagal cek status'); }
    finally { setChecking(false); }
  };

  const handleSubmitReview = async () => {
    if (!rating) { toast.error('Pilih rating dulu'); return; }
    setSubmittingReview(true);
    try {
      const res = await transactionsAPI.submitReview(id, { rating, comment });
      setTx(res.data.data);
      toast.success('Review berhasil dikirim! 🎉');
    } catch { toast.error('Gagal kirim review'); }
    finally { setSubmittingReview(false); }
  };

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
    </div>
  );
  if (!tx) return null;

  const isWaiting = tx.status === 'waiting_payment';
  const isPaid = tx.status === 'paid';
  const isProcessing = tx.status === 'processing';
  const isSuccess = tx.status === 'success';
  const isFailed = ['failed', 'cancelled'].includes(tx.status);
  const isQris = tx.paymentMethod === 'qris';
  const isBank = tx.paymentMethod === 'bank_transfer';
  const alreadyReviewed = !!tx.review?.rating;

  return (
    <AuthGuard>
      <div className="max-w-xl mx-auto px-4 py-8 space-y-4">

        {/* ── Status Card ── */}
        <div className={cn('glass-card p-6 text-center', {
          'border-orange-500/30 bg-orange-500/5': isWaiting,
          'border-blue-500/30 bg-blue-500/5': isPaid,
          'border-yellow-500/30 bg-yellow-500/5': isProcessing,
          'border-green-500/30 bg-green-500/5': isSuccess,
          'border-red-500/30 bg-red-500/5': isFailed,
        })}>
          <div className="mb-3 flex justify-center">
            {isSuccess && <CheckCircle className="w-14 h-14 text-green-400" />}
            {isFailed && <XCircle className="w-14 h-14 text-red-400" />}
            {(isWaiting || isPaid || isProcessing) && (
              <div className="relative">
                <Clock className="w-14 h-14 text-yellow-400" />
                {isProcessing && <Loader2 className="absolute inset-0 w-14 h-14 text-yellow-300 animate-spin opacity-40" />}
              </div>
            )}
          </div>
          <h1 className="text-white font-bold text-xl">{getStatusLabel(tx.status)}</h1>
          <p className="text-slate-400 text-xs mt-1">Ref: {tx.refId}</p>

          {isWaiting && <div className="mt-4"><Countdown expiresAt={tx.expiresAt} /></div>}

          {isProcessing && settings?.processingNote && (
            <p className="mt-3 text-yellow-300 text-sm bg-yellow-400/10 rounded-xl px-4 py-2">
              {settings.processingNote}
            </p>
          )}
          {isSuccess && settings?.successNote && (
            <p className="mt-3 text-green-300 text-sm bg-green-400/10 rounded-xl px-4 py-2">
              {settings.successNote}
            </p>
          )}
          {isSuccess && tx.providerSN && (
            <div className="mt-3 bg-white/5 rounded-xl px-4 py-2">
              <p className="text-slate-400 text-xs">Serial Number</p>
              <div className="flex items-center justify-center gap-2">
                <p className="text-white font-mono text-sm font-bold">{tx.providerSN}</p>
                <button onClick={() => handleCopy(tx.providerSN as string, 'sn')}>
                  {copied === 'sn' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Order Detail ── */}
        <div className="glass-card p-5">
          <h3 className="text-white font-semibold mb-3">📋 Detail Pesanan</h3>
          <div className="space-y-2 text-sm">
            {[
              ['Game', tx.gameName],
              ['Voucher', tx.voucherName],
              ['ID Akun', `${tx.targetId}${tx.serverId ? '/' + tx.serverId : ''}`],
              ['Username', tx.targetUsername || '-'],
              ['Pembayaran', getPaymentMethodLabel(tx.paymentMethod)],
              ['Tanggal', formatDate(tx.createdAt)],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between">
                <span className="text-slate-400">{l}</span>
                <span className="text-white font-medium text-right">{v as string}</span>
              </div>
            ))}
            <div className="border-t border-white/5 pt-2 flex justify-between font-bold">
              <span className="text-slate-300">Total</span>
              <span className="text-blue-400 text-base">{formatCurrency(tx.price)}</span>
            </div>
            {isSuccess && tx.rewardPointsEarned > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-400">Reward Points</span>
                <span className="text-yellow-400 font-semibold">+{tx.rewardPointsEarned} pts</span>
              </div>
            )}
          </div>
        </div>

        {/* ── MIDTRANS PAYMENT BUTTON (NEW) ── */}
        {isWaiting && (
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-orange-400" />
              <h3 className="text-white font-semibold">Pilih Metode Pembayaran</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                Midtrans
              </span>
            </div>

            <button
              onClick={handlePayWithMidtrans}
              disabled={snapLoading}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-base transition-all hover:scale-[1.01] disabled:opacity-60 bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25"
            >
              {snapLoading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Memuat...</>
              ) : (
                <><CreditCard className="w-5 h-5" /> Bayar Sekarang — {formatCurrency(tx.price)}</>
              )}
            </button>

            <p className="text-center mt-3 text-xs text-slate-500">
              QRIS · Transfer Bank · GoPay · OVO · ShopeePay · Kartu Kredit · Alfamart · Indomaret
            </p>

            <div className="mt-3 p-3 rounded-xl bg-blue-500/5 border border-blue-500/15 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
              <p className="text-slate-400 text-xs">
                Setelah klik "Bayar Sekarang", jendela pembayaran Midtrans akan muncul.
                Jangan tutup halaman ini hingga pembayaran selesai.
              </p>
            </div>
          </div>
        )}

        {/* ── QRIS Payment (fallback jika admin setting ada) ── */}
        {isWaiting && isQris && settings?.qrisImage && (
          <div className="glass-card p-5 text-center">
            <h3 className="text-white font-semibold mb-1">📱 Bayar via QRIS</h3>
            <p className="text-slate-400 text-xs mb-4">{settings.qrisNote || 'Scan QRIS untuk membayar'}</p>
            <div className="bg-white rounded-2xl p-3 inline-block mx-auto mb-4">
              <img src={settings.qrisImage} alt="QRIS" className="w-52 h-52 object-contain" />
            </div>
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-2">
              <p className="text-slate-400 text-xs">Nominal pembayaran</p>
              <p className="text-orange-400 font-black text-2xl">{formatCurrency(tx.price)}</p>
            </div>
          </div>
        )}

        {/* ── Bank Transfer List ── */}
        {isWaiting && isBank && settings?.bankAccounts && settings.bankAccounts.length > 0 && (
          <div className="glass-card p-5">
            <button className="w-full flex items-center justify-between" onClick={() => setShowBanks(!showBanks)}>
              <h3 className="text-white font-semibold">🏦 Rekening Tujuan</h3>
              {showBanks ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
            {showBanks && (
              <div className="mt-4 space-y-3">
                <p className="text-slate-400 text-sm">Transfer tepat <span className="text-white font-bold">{formatCurrency(tx.price)}</span></p>
                {settings.bankAccounts.filter(b => b.isActive).map((b, idx) => (
                  <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-blue-400 font-bold text-sm">{b.bankName}</span>
                      <button onClick={() => handleCopy(b.accountNumber, b.bankName)} className="flex items-center gap-1 text-xs text-slate-400 hover:text-white">
                        {copied === b.bankName ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                        {copied === b.bankName ? 'Tersalin' : 'Salin'}
                      </button>
                    </div>
                    <p className="text-white font-mono font-bold">{b.accountNumber}</p>
                    <p className="text-slate-400 text-xs">{b.accountName}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Upload Proof ── */}
        {isWaiting && (
          <div className="glass-card p-5">
            <h3 className="text-white font-semibold mb-1">📤 Upload Bukti Pembayaran</h3>
            <p className="text-slate-400 text-xs mb-4">Upload screenshot setelah transfer berhasil.</p>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
            {tx.paymentProof ? (
              <div className="flex items-center gap-2 text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-xl p-3">
                <CheckCircle className="w-4 h-4" /> Bukti sudah dikirim — menunggu konfirmasi
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()} disabled={uploading} className="btn-secondary w-full flex items-center justify-center gap-2">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading ? 'Mengupload...' : 'Pilih & Upload Bukti'}
              </button>
            )}
          </div>
        )}

        {/* ── Paid Status ── */}
        {isPaid && (
          <div className="glass-card p-5 border-blue-500/30 bg-blue-500/5 text-center">
            <CheckCircle className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <p className="text-blue-300 font-semibold">Pembayaran dikonfirmasi!</p>
            <p className="text-slate-400 text-sm mt-1">Pesananmu sedang menunggu diproses oleh admin.</p>
          </div>
        )}

        {/* ── Check Status Button ── */}
        {['paid', 'processing'].includes(tx.status) && (
          <button onClick={handleCheckStatus} disabled={checking} className="btn-secondary w-full flex items-center justify-center gap-2">
            {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Cek Status Pesanan
          </button>
        )}

        {/* ── Review Section ── */}
        {isSuccess && (
          <div className="glass-card p-5">
            <h3 className="text-white font-semibold mb-4">⭐ Beri Rating & Ulasan</h3>
            {alreadyReviewed ? (
              <div className="text-center">
                <div className="flex justify-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <Star key={n} className={cn('w-6 h-6', (tx.review?.rating ?? 0) >= n ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600')} />
                  ))}
                </div>
                <p className="text-white text-sm">{tx.review?.comment || 'Tidak ada komentar'}</p>
                <p className="text-slate-500 text-xs mt-1">Review telah dikirim ✓</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-center">
                  <StarRating value={rating} onChange={setRating} />
                </div>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Ceritakan pengalamanmu (opsional)..."
                  rows={3}
                  className="input-field resize-none text-sm"
                />
                <button onClick={handleSubmitReview} disabled={submittingReview || !rating} className="btn-primary w-full flex items-center justify-center gap-2">
                  {submittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : '⭐'} Kirim Ulasan
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Contact Support ── */}
        {settings && (settings.whatsappNumber || settings.telegramUsername) && (
          <div className="glass-card p-5">
            <p className="text-slate-400 text-sm text-center mb-3">Ada kendala? Hubungi kami:</p>
            <div className="flex gap-3">
              {settings.whatsappNumber && (
                <a href={`https://wa.me/${settings.whatsappNumber}?text=Halo, saya butuh bantuan untuk transaksi ${tx.refId}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500/20 text-green-400 rounded-xl py-2.5 text-sm font-semibold transition-colors">
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </a>
              )}
              {settings.telegramUsername && (
                <a href={`https://t.me/${settings.telegramUsername}`} target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/20 text-blue-400 rounded-xl py-2.5 text-sm font-semibold transition-colors">
                  <Send className="w-4 h-4" /> Telegram
                </a>
              )}
            </div>
          </div>
        )}

        {/* ── Bottom Actions ── */}
        <div className="flex gap-3">
          <Link href="/dashboard/transactions" className="btn-secondary flex-1 text-center py-2.5 text-sm">
            Riwayat Transaksi
          </Link>
          {(isSuccess || isFailed) && (
            <Link href="/dashboard" className="btn-primary flex-1 text-center py-2.5 text-sm">
              🎮 Top Up Lagi
            </Link>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}

/* ── Main Export dengan Suspense ── */
export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    }>
      <PaymentPageInner />
    </Suspense>
  );
}