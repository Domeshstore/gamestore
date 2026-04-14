'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCheckoutStore } from '@/lib/store/useCheckoutStore';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { transactionsAPI, settingsAPI } from '@/lib/api/client';
import { formatCurrency, getErrorMessage } from '@/lib/utils/format';
import { PaymentMethod, AppSetting } from '@/types';
import AuthGuard from '@/components/auth/AuthGuard';
import { QrCode, Building2, Wallet, Coins, ArrowRight, Loader2, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils/format';
import Link from 'next/link';
import toast from 'react-hot-toast';

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: React.ElementType; desc: string }[] = [
  { value: 'qris',          label: 'QRIS',         icon: QrCode,    desc: 'Scan QR — semua e-wallet & m-banking' },
  { value: 'bank_transfer', label: 'Transfer Bank', icon: Building2, desc: 'BCA, Mandiri, BNI, BRI' },
  { value: 'e-wallet',      label: 'E-Wallet',      icon: Wallet,    desc: 'GoPay, OVO, Dana, ShopeePay' },
  { value: 'reward_points', label: 'Reward Points', icon: Coins,     desc: 'Gunakan poin kamu' },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { game, voucher, targetId, serverId, targetUsername, paymentMethod, setPaymentMethod, clear } = useCheckoutStore();
  const user = useAuthStore(s => s.user);
  const [loading, setLoading]   = useState(false);
  const [settings, setSettings] = useState<AppSetting | null>(null);

  useEffect(() => {
    if (!game || !voucher || !targetId) {
      toast.error('Pilih voucher terlebih dahulu');
      router.replace('/dashboard/games');
      return;
    }
    settingsAPI.getApp().then(r => setSettings(r.data.data)).catch(() => {});
  }, []);

  if (!game || !voucher || !targetId) return null;

  const canUsePoints = (user?.rewardPoints ?? 0) >= voucher.price;
  const discount     = voucher.originalPrice > voucher.price ? voucher.originalPrice - voucher.price : 0;

  const handleOrder = async () => {
    setLoading(true);
    try {
      const res = await transactionsAPI.create({
        provider:        voucher.provider,
        gameCode:        game.gameCode,
        gameName:        game.name,
        voucherCode:     voucher.providerCode,
        voucherName:     voucher.name,
        targetId,
        targetUsername,
        serverId,
        price:           voucher.price,
        originalPrice:   voucher.originalPrice,
        paymentMethod,
        rewardPointsUsed: paymentMethod === 'reward_points' ? voucher.price : 0,
      });
      const txId = res.data.data._id;
      clear();
      router.push(`/dashboard/payment/${txId}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href={`/dashboard/games/${game.slug}`}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Kembali
        </Link>
        <h1 className="page-title mb-8">🛒 Checkout</h1>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Left */}
          <div className="md:col-span-3 space-y-4">
            {/* Payment method */}
            <div className="glass-card p-5">
              <h3 className="text-white font-semibold mb-4">💳 Metode Pembayaran</h3>
              <div className="space-y-3">
                {PAYMENT_METHODS.map(({ value, label, icon: Icon, desc }) => {
                  const disabled = value === 'reward_points' && !canUsePoints;
                  return (
                    <button key={value}
                      onClick={() => !disabled && setPaymentMethod(value)}
                      disabled={disabled}
                      className={cn(
                        'w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left',
                        paymentMethod === value ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 bg-white/3 hover:border-white/20',
                        disabled && 'opacity-40 cursor-not-allowed'
                      )}>
                      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                        paymentMethod === value ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-slate-400')}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium text-sm">{label}</p>
                        <p className="text-slate-500 text-xs mt-0.5">
                          {value === 'reward_points'
                            ? `Saldo: ${user?.rewardPoints ?? 0} pts${!canUsePoints ? ' (tidak cukup)' : ''}`
                            : desc}
                        </p>
                      </div>
                      {paymentMethod === value && (
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shrink-0">
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* QRIS preview */}
            {paymentMethod === 'qris' && settings?.qrisImage && (
              <div className="glass-card p-5 text-center border-blue-500/20">
                <p className="text-slate-400 text-xs mb-3">{settings.qrisNote}</p>
                <div className="bg-white rounded-2xl p-3 inline-block">
                  <img src={settings.qrisImage} alt="QRIS" className="w-84 h-84 object-contain" />
                </div>
                <p className="text-slate-400 text-xs mt-2">{settings.qrisName}</p>
              </div>
            )}

            {/* Buyer info */}
            <div className="glass-card p-5">
              <h3 className="text-white font-semibold mb-3">👤 Info Pembeli</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Nama</span>
                  <span className="text-white">{user?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Email</span>
                  <span className="text-white">{user?.email}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: summary */}
          <div className="md:col-span-2">
            <div className="glass-card p-5 sticky top-20">
              <h3 className="text-white font-semibold mb-4">📋 Ringkasan</h3>
              <div className="space-y-3 text-sm">
                <div className="bg-white/3 rounded-xl p-3">
                  <p className="text-slate-400 text-xs mb-1">Game</p>
                  <p className="text-white font-medium">{game.name}</p>
                </div>
                <div className="bg-white/3 rounded-xl p-3">
                  <p className="text-slate-400 text-xs mb-1">Voucher</p>
                  <p className="text-white font-medium">{voucher.name}</p>
                </div>
                <div className="bg-white/3 rounded-xl p-3">
                  <p className="text-slate-400 text-xs mb-1">ID Akun</p>
                  <p className="text-white font-medium font-mono">{targetId}{serverId ? `/${serverId}` : ''}</p>
                  {targetUsername && <p className="text-green-400 text-xs mt-0.5">{targetUsername} ✓</p>}
                </div>

                <div className="border-t border-white/5 pt-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Harga</span>
                    <span className="text-white">{formatCurrency(voucher.originalPrice || voucher.price)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Diskon</span>
                      <span className="text-green-400">-{formatCurrency(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base pt-2 border-t border-white/5">
                    <span className="text-slate-300">Total</span>
                    <span className="text-blue-400">{formatCurrency(voucher.price)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Reward Points</span>
                    <span className="text-yellow-400">+{voucher.rewardPoints} pts</span>
                  </div>
                </div>

                <button onClick={handleOrder} disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</>
                    : <>Konfirmasi Pesanan <ArrowRight className="w-4 h-4" /></>
                  }
                </button>

                <p className="text-slate-500 text-xs text-center">
                  {paymentMethod === 'qris'
                    ? 'Kamu akan diarahkan ke halaman pembayaran QRIS'
                    : paymentMethod === 'bank_transfer'
                    ? 'Kamu akan mendapat instruksi transfer bank'
                    : 'Proses berlangsung otomatis'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
