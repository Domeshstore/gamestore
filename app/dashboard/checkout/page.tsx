'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useCheckoutStore } from '@/lib/store/useCheckoutStore';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { transactionsAPI, settingsAPI, promoAPI } from '@/lib/api/client';
import apiClient from '@/lib/api/client';
import { formatCurrency, getErrorMessage } from '@/lib/utils/format';
import { AppSetting } from '@/types';
import AuthGuard from '@/components/auth/AuthGuard';
import {
  QrCode, Building2, Wallet, Coins, ArrowRight, Loader2,
  ChevronLeft, CheckCircle, XCircle, Tag, Phone, Mail,
  MessageCircle, AlertCircle, Info, Star,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

type PaymentMethod = 'qris' | 'bank_transfer' | 'e-wallet' | 'reward_points';

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: React.ElementType; desc: string }[] = [
  { value:'qris',         label:'QRIS',         icon:QrCode,    desc:'Scan QR — semua e-wallet & m-banking' },
  { value:'bank_transfer',label:'Transfer Bank', icon:Building2, desc:'BCA, Mandiri, BNI, BRI' },
  { value:'e-wallet',     label:'E-Wallet',       icon:Wallet,    desc:'GoPay, OVO, Dana, ShopeePay' },
  { value:'reward_points',label:'Reward Points',  icon:Coins,     desc:'Gunakan poin kamu' },
];

const ss = { 
  background: '#2a2a2a', 
  border: '1px solid rgba(234, 82, 52, 0.25)', 
  borderRadius: 20 
};

function StepBadge({ n, label, done }: { n: number; label: string; done?: boolean }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-7 h-7 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0"
        style={{ background: done ? '#10b981' : '#ea5234', color: done ? 'white' : 'white' }}>
        {done ? '✓' : n}
      </div>
      <span style={{ color: '#f8d9b9', fontWeight: 800, fontSize: 15 }}>{label}</span>
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { game, voucher, targetId, serverId, targetUsername, paymentMethod, setPaymentMethod, clear } = useCheckoutStore();
  const user = useAuthStore(s => s.user);
  const [loading,    setLoading]    = useState(false);
  const [settings,   setSettings]   = useState<AppSetting | null>(null);

  // Contact info
  const [whatsapp,   setWhatsapp]   = useState(user?.phone || '');
  const [email,      setEmail]      = useState(user?.email || '');

  // Promo
  const [promoCode,  setPromoCode]  = useState('');
  const [promoResult,setPromoResult]= useState<{ valid:boolean; promoId:string; promoName:string; discount:number; finalPrice:number } | null>(null);
  const [promoLoading,setPromoLoading]=useState(false);
  const [promoError,  setPromoError] = useState('');

  useEffect(() => {
    if (!game || !voucher || !targetId) {
      toast.error('Pilih voucher terlebih dahulu');
      router.replace('/dashboard/games');
      return;
    }
    settingsAPI.getApp().then(r => setSettings(r.data.data)).catch(() => {});
    // Pre-fill auto-apply promo for new users
    promoAPI.getPublic().then(r => {
      const auto = (r.data.data || []).find((p: { isAutoApply:boolean; type:string }) => p.isAutoApply && p.type === 'first_transaction');
      if (auto) setPromoCode(auto.code);
    }).catch(() => {});
  }, []);

  if (!game || !voucher || !targetId) return null;

  const basePrice  = voucher.price;
  const finalPrice = promoResult ? promoResult.finalPrice : basePrice;
  const discount   = promoResult ? promoResult.discount : 0;
  const canUsePoints = (user?.rewardPoints ?? 0) >= finalPrice;

  // ── Validate promo ─────────────────────────────────────
  const handleValidatePromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoError('');
    setPromoResult(null);
    try {
      // Ambil userId dari user object (gunakan properti yang tersedia)
      const userId = (user as any)?._id || (user as any)?.id || (user as any)?.userId;
      
      const res = await promoAPI.validate({
        code:      promoCode.trim(),
        userId:    userId,
        amount:    basePrice,
        category:  game.category,
        productId: game._id,
      });
      setPromoResult(res.data.data);
      toast.success(`✅ Promo "${res.data.data.promoName}" berhasil! Hemat ${formatCurrency(res.data.data.discount)}`);
    } catch (err) {
      setPromoError(getErrorMessage(err));
    } finally {
      setPromoLoading(false);
    }
  };

  const removePromo = () => { setPromoResult(null); setPromoCode(''); setPromoError(''); };

  // ── Submit order ───────────────────────────────────────
  const handleOrder = async () => {
    if (!whatsapp && !email) {
      toast.error('Isi nomor WhatsApp atau email untuk notifikasi');
      return;
    }
    setLoading(true);
    try {
      const res = await transactionsAPI.create({
        provider:       voucher.provider,
        productType:    game.productType || 'game',
        gameCode:       game.gameCode,
        gameName:       game.name,
        voucherCode:    voucher.providerCode,
        voucherName:    voucher.name,
        targetId,
        targetUsername,
        serverId,
        price:          finalPrice,
        originalPrice:  basePrice,
        discountAmount: discount,
        promoId:        promoResult?.promoId,
        promoCode:      promoResult ? promoCode : '',
        paymentMethod,
        rewardPointsUsed: paymentMethod === 'reward_points' ? finalPrice : 0,
        contactWhatsapp: whatsapp,
        contactEmail:    email,
      });
      clear();
      toast.success('Pesanan dibuat! Lanjutkan pembayaran.');
      router.push(`/dashboard/payment/${res.data.data._id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen" style={{ background: '#1a1a1a' }}>
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
          {/* Back */}
          <button onClick={() => router.back()}
            className="flex items-center gap-2 text-sm font-semibold transition-colors"
            style={{ color: '#b4b4b4' }}>
            <ChevronLeft className="w-4 h-4" /> Kembali
          </button>

          <h1 style={{ color: '#f8d9b9', fontWeight: 900, fontSize: 26 }}>Konfirmasi Pesanan</h1>

          {/* ── RINGKASAN PRODUK ── */}
          <div className="p-5 rounded-2xl" style={ss}>
            <StepBadge n={1} label="Ringkasan Pembelian" done />
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                style={{ background: 'rgba(234, 82, 52, 0.12)', border: '1px solid rgba(234, 82, 52, 0.22)' }}>
                {game.productType === 'game' ? '🎮' : game.productType === 'pulsa' ? '📱' : game.productType === 'e_money' ? '💳' : game.productType === 'streaming' ? '🎬' : '⚡'}
              </div>
              <div className="flex-1 min-w-0">
                <div style={{ color: '#f8d9b9', fontWeight: 800, fontSize: 16 }}>{game.name}</div>
                <div style={{ color: '#b4b4b4', fontSize: 14 }}>{voucher.name}</div>
                <div style={{ color: '#b4b4b4', fontSize: 13 }}>
                  Untuk: <strong style={{ color: '#f8d9b9' }}>{targetId}{serverId ? `/${serverId}` : ''}</strong>
                  {targetUsername && <> · <span style={{ color: '#ea5234' }}>{targetUsername}</span></>}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div style={{ color: '#ea5234', fontWeight: 900, fontSize: 18 }}>{formatCurrency(basePrice)}</div>
                {voucher.originalPrice > basePrice && (
                  <div style={{ color: '#b4b4b4', fontSize: 12, textDecoration: 'line-through' }}>
                    {formatCurrency(voucher.originalPrice)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── KONTAK UNTUK NOTIFIKASI ── */}
          <div className="p-5 rounded-2xl" style={ss}>
            <StepBadge n={2} label="Kontak untuk Notifikasi" />
            <div className="p-3 rounded-xl mb-4 flex items-start gap-2"
              style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.18)' }}>
              <Info className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#3b82f6' }} />
              <p style={{ color: '#b4b4b4', fontSize: 13, lineHeight: 1.6 }}>
                Kami akan mengirim notifikasi status transaksi (sukses/gagal) ke nomor WhatsApp atau email yang kamu isi. Isi salah satu atau keduanya.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#b4b4b4' }}>
                  <MessageCircle className="w-3.5 h-3.5 inline mr-1.5" />Nomor WhatsApp
                </label>
                <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)}
                  placeholder="08xxxxxxxxxx" type="tel" 
                  className="w-full px-4 py-3 rounded-xl bg-[#242424] border border-[#ea5234]/25 text-white focus:outline-none focus:border-[#ea5234]/50" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#b4b4b4' }}>
                  <Mail className="w-3.5 h-3.5 inline mr-1.5" />Email
                </label>
                <input value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="email@contoh.com" type="email" 
                  className="w-full px-4 py-3 rounded-xl bg-[#242424] border border-[#ea5234]/25 text-white focus:outline-none focus:border-[#ea5234]/50" />
              </div>
            </div>
            {!whatsapp && !email && (
              <p className="mt-2 text-xs" style={{ color: '#ef4444' }}>
                ⚠️ Isi minimal satu kontak agar kami bisa mengirim notifikasi
              </p>
            )}
          </div>

          {/* ── KODE PROMO ── */}
          <div className="p-5 rounded-2xl" style={ss}>
            <StepBadge n={3} label="Kode Promo (Opsional)" />

            {promoResult ? (
              <motion.div initial={{ opacity:0, scale:0.97 }} animate={{ opacity:1, scale:1 }}
                className="flex items-center justify-between p-4 rounded-xl"
                style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 shrink-0" style={{ color: '#10b981' }} />
                  <div>
                    <div style={{ color: '#f8d9b9', fontWeight: 700 }}>Promo "{promoResult.promoName}"</div>
                    <div style={{ color: '#10b981', fontSize: 13, fontWeight: 700 }}>
                      Hemat {formatCurrency(promoResult.discount)}
                    </div>
                  </div>
                </div>
                <button onClick={removePromo} className="text-xs font-bold px-3 py-1.5 rounded-lg"
                  style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)' }}>
                  Hapus
                </button>
              </motion.div>
            ) : (
              <div>
                <div className="flex gap-2">
                  <input value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key==='Enter' && handleValidatePromo()}
                    placeholder="Masukkan kode promo (cth: NEWUSER33)" 
                    className="flex-1 px-4 py-3 rounded-xl bg-[#242424] border border-[#ea5234]/25 text-white focus:outline-none focus:border-[#ea5234]/50"
                    style={{ fontFamily: 'monospace', letterSpacing: '0.04em' }} />
                  <button onClick={handleValidatePromo} disabled={!promoCode.trim() || promoLoading}
                    className="px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all disabled:opacity-50"
                    style={{ background: '#ea5234', color: 'white' }}>
                    {promoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Tag className="w-4 h-4" />}
                    Pakai
                  </button>
                </div>
                {promoError && (
                  <div className="flex items-center gap-2 mt-2 text-sm" style={{ color: '#ef4444' }}>
                    <XCircle className="w-4 h-4 shrink-0" /> {promoError}
                  </div>
                )}
                <p className="text-xs mt-2" style={{ color: '#b4b4b4' }}>
                  Pengguna baru? Coba kode <button onClick={() => setPromoCode('NEWUSER33')} className="font-mono font-bold hover:underline" style={{ color: '#ea5234' }}>NEWUSER33</button> untuk diskon 33%
                </p>
              </div>
            )}
          </div>

          {/* ── METODE PEMBAYARAN ── */}
          <div className="p-5 rounded-2xl" style={ss}>
            <StepBadge n={4} label="Metode Pembayaran" />
            <div className="grid grid-cols-2 gap-2.5">
              {PAYMENT_METHODS.map(({ value, label, icon: Icon, desc }) => {
                const disabled = value === 'reward_points' && !canUsePoints;
                const active   = paymentMethod === value;
                return (
                  <button key={value} disabled={disabled}
                    onClick={() => setPaymentMethod(value)}
                    className="flex items-center gap-3 p-3.5 rounded-xl text-left transition-all disabled:opacity-40"
                    style={{
                      background: active ? 'rgba(234, 82, 52, 0.12)' : '#242424',
                      border: `1px solid ${active ? 'rgba(234, 82, 52, 0.40)' : 'rgba(234, 82, 52, 0.25)'}`,
                      boxShadow: active ? '0 0 12px rgba(234, 82, 52, 0.15)' : 'none',
                    }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: active ? 'rgba(234, 82, 52, 0.20)' : '#2a2a2a' }}>
                      <Icon className="w-4 h-4" style={{ color: active ? '#ea5234' : '#b4b4b4' }} />
                    </div>
                    <div className="min-w-0">
                      <div style={{ color: active ? '#f8d9b9' : '#b4b4b4', fontWeight: 700, fontSize: 13 }}>{label}</div>
                      <div style={{ color: '#b4b4b4', fontSize: 11 }}>
                        {value === 'reward_points' ? `${user?.rewardPoints ?? 0} pts` : desc}
                      </div>
                    </div>
                    {active && (
                      <div className="ml-auto shrink-0">
                        <CheckCircle className="w-4 h-4" style={{ color: '#ea5234' }} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── RINCIAN HARGA ── */}
          <div className="p-5 rounded-2xl" style={ss}>
            <p style={{ color: '#b4b4b4', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
              Rincian Pembayaran
            </p>
            <div className="space-y-2.5 text-sm">
              {[
                ['Harga Voucher',    formatCurrency(basePrice)],
                ...(voucher.originalPrice > basePrice ? [['Diskon Produk',`-${formatCurrency(voucher.originalPrice - basePrice)}`]] : []),
                ...(discount > 0 ? [[`Promo (${promoCode})`, `-${formatCurrency(discount)}`]] : []),
                ...(paymentMethod === 'reward_points' ? [['Reward Points Digunakan', `-${formatCurrency(finalPrice)}`]] : []),
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between">
                  <span style={{ color: '#b4b4b4' }}>{l}</span>
                  <span style={{ color: v.startsWith('-') ? '#10b981' : '#f8d9b9', fontWeight: 600 }}>{v}</span>
                </div>
              ))}
              <div className="flex justify-between font-black text-base pt-2"
                style={{ borderTop: '1px solid rgba(234, 82, 52, 0.25)' }}>
                <span style={{ color: '#f8d9b9' }}>Total Bayar</span>
                <span style={{ color: '#ea5234', fontSize: 20 }}>
                  {paymentMethod === 'reward_points' ? 'Gratis' : formatCurrency(finalPrice)}
                </span>
              </div>
            </div>
          </div>

          {/* ── CTA ── */}
          <button onClick={handleOrder} disabled={loading || (!whatsapp && !email)}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-base transition-all disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #ea5234, #c13e22)',
              color: 'white',
              boxShadow: '0 8px 24px rgba(234, 82, 52, 0.35)',
            }}>
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Memproses...</> : <>Buat Pesanan <ArrowRight className="w-5 h-5" /></>}
          </button>
          <p className="text-center text-xs" style={{ color: '#b4b4b4' }}>
            Dengan menekan tombol, kamu menyetujui syarat & ketentuan Domesh Store
          </p>
        </div>
      </div>
    </AuthGuard>
  );
}