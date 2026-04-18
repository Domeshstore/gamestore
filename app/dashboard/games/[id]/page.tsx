// app/dashboard/games/[id]/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { gamesAPI, settingsAPI, digiflazzAPI, promoAPI } from '@/lib/api/client';
import { Game, Voucher, AppSetting } from '@/types';
import GameVouchers from '@/components/vouchers/GameVouchers';
import BannerCarousel from '@/components/ui/BannerCarousel';
import { useCheckoutStore } from '@/lib/store/useCheckoutStore';
import { useAuthStore } from '@/lib/store/useAuthStore';
import {
  Loader2, Search, CheckCircle, XCircle, ArrowRight,
  ChevronLeft, ShoppingCart, Star, Tag, Layers, Ticket,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { cn } from '@/lib/utils/format';

const GAME_EMOJI: Record<string, string> = {
  'mobile-legends': '', 'free-fire': '', 'pubg-mobile': '', 'genshin-impact': '',
  'valorant': '', 'netflix': '', 'spotify': '', 'youtube-premium': '',
  'nordvpn': '', 'disney-hotstar': '',
};

export default function GameDetailPage() {
  const { id: slug } = useParams<{ id: string }>();
  const router = useRouter();
  const [game, setGame] = useState<Game | null>(null);
  const [settings, setSettings] = useState<AppSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [userId, setUserId] = useState('');
  const [serverId, setServerId] = useState('');
  const [checking, setChecking] = useState(false);
  const [checkedUsername, setCheckedUsername] = useState('');
  const [checkError, setCheckError] = useState('');
  
  // Promo states
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState<{
    promoId: string;
    promoName: string;
    discount: number;
    finalPrice: number;
  } | null>(null);
  const [checkingPromo, setCheckingPromo] = useState(false);
  const [promoError, setPromoError] = useState('');
  
  const { user } = useAuthStore();
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  
const {
  setGame: storeSetGame, 
  setVoucher, 
  setTargetId,
  setServerId: setStoreServerId, 
  setTargetUsername,
  setPromo,      // Gunakan satu fungsi untuk semua promo
  clearPromo,
} = useCheckoutStore();
  
  const [recentTransaction, setRecentTransaction] = useState<{
    refId: string;
    status: string;
    message?: string;
  } | null>(null);

  useEffect(() => {
    Promise.all([
      gamesAPI.getBySlug(slug),
      settingsAPI.getApp(),
    ]).then(([gRes, sRes]) => {
      setGame(gRes.data.data);
      setSettings(sRes.data.data);
    }).catch(() => {
      toast.error('Game tidak ditemukan');
      router.push('/dashboard/games');
    }).finally(() => setLoading(false));
  }, [slug]);

  const handleCheckUsername = async () => {
    if (!game || !userId) return;
    setChecking(true); setCheckedUsername(''); setCheckError('');
    try {
      const res = await digiflazzAPI.checkUsername(game.gameCode, userId, serverId || undefined);
      const d = res.data.data;
      if (d?.username || d?.name) { 
        setCheckedUsername(d.username || d.name); 
        toast.success('Akun ditemukan!'); 
      } else setCheckError('Akun tidak ditemukan');
    } catch { 
      setCheckError('Gagal mengecek akun. Coba lagi.'); 
    } finally { 
      setChecking(false); 
    }
  };

  // Apply promo code
  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      toast.error('Masukkan kode promo');
      return;
    }
    if (!selectedVoucher) {
      toast.error('Pilih voucher terlebih dahulu');
      return;
    }
    if (!isAuthenticated) {
      toast.error('Login terlebih dahulu untuk menggunakan promo');
      return;
    }
    
    setCheckingPromo(true);
    setPromoError('');
    
    try {
      const res = await promoAPI.validate({
        code: promoCode,
        userId: user?.id,
        amount: selectedVoucher.price,
        category: game?.category,
        productId: game?._id,
      });
      
      const data = res.data.data;
      if (data.valid) {
        setPromoApplied({
          promoId: data.promoId,
          promoName: data.promoName,
          discount: data.discount,
          finalPrice: data.finalPrice,
        });
        toast.success(`Promo berhasil! Diskon ${formatCurrency(data.discount)}`);
        setPromoError('');
      }
    } catch (err: any) {
      setPromoError(err.response?.data?.message || 'Kode promo tidak valid');
      setPromoApplied(null);
    } finally {
      setCheckingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setPromoApplied(null);
    setPromoCode('');
    toast.success('Promo dihapus');
  };

// Update handleBuy function
const handleBuy = () => {
  if (!game || !selectedVoucher) { 
    toast.error('Pilih voucher terlebih dahulu'); 
    return; 
  }
  if (!userId) { 
    toast.error(`Masukkan ${game.userIdLabel}`); 
    return; 
  }
  if (!isAuthenticated) { 
    toast.error('Silakan login terlebih dahulu'); 
    router.push('/auth/login'); 
    return; 
  }
  
  storeSetGame(game);
  setVoucher(selectedVoucher);
  setTargetId(userId);
  setStoreServerId(serverId);
  setTargetUsername(checkedUsername);
  
  // Set promo if applied (pakai satu fungsi)
  if (promoApplied) {
    setPromo(
      promoCode,                    // promoCode
      promoApplied.promoId,         // promoId
      promoApplied.discount,        // discountAmount
      selectedVoucher.price,        // originalPrice
      promoApplied.finalPrice       // finalPrice
    );
  } else {
    clearPromo();
  }
  
  router.push('/dashboard/checkout');
};

  // Listen for transaction updates
  useEffect(() => {
    const handleTransactionUpdate = (event: CustomEvent) => {
      const data = event.detail;
      if (data.gameCode === game?.gameCode) {
        setRecentTransaction(data);
        setTimeout(() => setRecentTransaction(null), 10000);
      }
    };

    window.addEventListener('transaction_update', handleTransactionUpdate as EventListener);
    return () => {
      window.removeEventListener('transaction_update', handleTransactionUpdate as EventListener);
    };
  }, [game?.gameCode]);

  const currentPrice = promoApplied ? promoApplied.finalPrice : (selectedVoucher?.price || 0);
  const discountAmount = promoApplied ? promoApplied.discount : 0;

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#ea5234' }} />
    </div>
  );
  if (!game) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Back button */}
      <Link href="/dashboard/games"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-[#ea5234] text-sm transition-all duration-300 hover:gap-3">
        <ChevronLeft className="w-4 h-4" /> Kembali ke Games
      </Link>

      {/* Recent Transaction Status */}
      {recentTransaction && (
        <div className={`p-4 rounded-xl border ${
          recentTransaction.status === 'success' 
            ? 'bg-green-500/10 border-green-500/30' 
            : 'bg-red-500/10 border-red-500/30'
        }`}>
          <div className="flex items-center gap-3">
            {recentTransaction.status === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
            <div className="flex-1">
              <p className="text-white font-medium">
                {recentTransaction.status === 'success' ? 'Transaksi Berhasil!' : 'Transaksi Gagal'}
              </p>
              <p className="text-sm text-slate-400">
                Ref ID: {recentTransaction.refId} • {recentTransaction.message}
              </p>
            </div>
            <button onClick={() => setRecentTransaction(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
        </div>
      )}

      {/* Banner */}
      {settings?.banners && settings.banners.filter(b => b.isActive && b.linkUrl?.includes(game.slug)).length > 0 && (
        <BannerCarousel banners={settings.banners.filter(b => b.linkUrl?.includes(game.slug))} autoPlay={false} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Game info */}
        <div className="lg:col-span-1 space-y-4">
          <div className="relative h-56 rounded-2xl overflow-hidden bg-[#2a2418]">
            <img src={game.image || `/assets/games/${game.slug}.jpg`} alt={game.name} className="object-cover w-full h-full" />
          </div>

               {/* Info card */}
          <div className="p-5 rounded-2xl bg-[#ea5234]/10 border border-[#ea5234]/20 backdrop-blur-sm">
            <h1 className="text-white font-black text-xl mb-1">{game.name}</h1>
            <p className="text-slate-400 text-sm">{game.publisher}</p>
            {game.description && (
              <p className="text-slate-400 text-sm mt-3 leading-relaxed">{game.description}</p>
            )}
            <div className="flex flex-wrap gap-2 mt-4">
              {game.platform.map(p => (
                <span key={p} className="px-2 py-1 rounded-lg text-xs" style={{ background: '#ea523420', color: '#ea5234' }}>
                  {p}
                </span>
              ))}
            </div>
            <div className="mt-4 pt-4 space-y-2" style={{ borderTop: '1px solid rgba(234, 82, 52, 0.2)' }}>
              {[
                ['Kategori', game.category],
                ['Provider', game.provider],
                ['Game Code', game.gameCode],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between text-sm">
                  <span className="text-slate-500">{l}</span>
                  <span className="text-slate-300 capitalize font-medium">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>


        {/* Right: Voucher selection */}
        <div className="lg:col-span-2 space-y-5">
          {/* Account input */}
          <div className="p-5 rounded-2xl bg-[#ea5234]/10 border border-[#ea5234]/20 backdrop-blur-sm">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black text-white bg-[#ea5234]">1</div>
              Masukkan Data Akun
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">{game.userIdLabel}</label>
                <input value={userId} onChange={e => { setUserId(e.target.value); setCheckedUsername(''); setCheckError(''); }}
                  placeholder={`Masukkan ${game.userIdLabel}`} 
                  className="w-full px-4 py-2 rounded-xl bg-[#ea5234]/5 border border-[#ea5234]/20 text-white focus:outline-none focus:border-[#ea5234]" />
              </div>
              {game.requiresServerId && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">{game.serverIdLabel}</label>
                  <input value={serverId} onChange={e => { setServerId(e.target.value); setCheckedUsername(''); setCheckError(''); }}
                    placeholder={`Masukkan ${game.serverIdLabel}`} 
                    className="w-full px-4 py-2 rounded-xl bg-[#ea5234]/5 border border-[#ea5234]/20 text-white focus:outline-none focus:border-[#ea5234]" />
                </div>
              )}
            </div>
            {/* <button onClick={handleCheckUsername} disabled={!userId || checking}
              className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[#ea5234] text-white disabled:opacity-50">
              {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Cek Username
            </button>
            {checkedUsername && (
              <div className="mt-3 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm bg-green-500/10 border border-green-500/20 text-green-400">
                <CheckCircle className="w-4 h-4" /> Username: <strong>{checkedUsername}</strong>
              </div>
            )} */}
          </div>

          {/* Vouchers */}
          <div className="p-5 rounded-2xl bg-[#ea5234]/10 border border-[#ea5234]/20 backdrop-blur-sm">
            <h3 className="text-white font-bold mb-5 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black text-white bg-[#ea5234]">2</div>
              Pilih Voucher
            </h3>
            <GameVouchers game={game} vouchers={game.vouchers || []} selectedVoucher={selectedVoucher} onSelect={setSelectedVoucher} />
          </div>

          {/* Promo Code Section */}
          {selectedVoucher && (
            <div className="p-5 rounded-2xl bg-[#ea5234]/10 border border-[#ea5234]/20 backdrop-blur-sm">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-[#ea5234]" />
                Kode Promo
              </h3>
              
              {!promoApplied ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="Masukkan kode promo"
                    className="flex-1 px-4 py-2 rounded-xl bg-[#ea5234]/5 border border-[#ea5234]/20 text-white placeholder-slate-500 focus:outline-none focus:border-[#ea5234] uppercase"
                  />
                  <button
                    onClick={handleApplyPromo}
                    disabled={checkingPromo || !promoCode}
                    className="px-6 py-2 rounded-xl font-semibold bg-[#ea5234] text-white disabled:opacity-50"
                  >
                    {checkingPromo ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Pakai'}
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                  <div>
                    <p className="text-green-400 font-semibold">{promoApplied.promoName}</p>
                    <p className="text-sm text-slate-400">Diskon {formatCurrency(promoApplied.discount)}</p>
                  </div>
                  <button onClick={handleRemovePromo} className="text-red-400 hover:text-red-300 text-sm">Batalkan</button>
                </div>
              )}
              
              {promoError && (
                <div className="mt-3 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm bg-red-500/10 border border-red-500/20 text-red-400">
                  <XCircle className="w-4 h-4" /> {promoError}
                </div>
              )}
            </div>
          )}

          {/* Summary + Buy */}
          {selectedVoucher && (
            <div className="p-5 rounded-2xl bg-[#ea5234]/10 border border-[#ea5234]/30 backdrop-blur-sm">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black text-white bg-[#ea5234]">3</div>
                Konfirmasi Pesanan
              </h3>
              <div className="space-y-2 text-sm mb-4">
                {[
                  ['Game', game.name],
                  ['Voucher', selectedVoucher.name],
                  ['ID Akun', `${userId}${serverId ? `/${serverId}` : ''}`],
                  ...(checkedUsername ? [['Username', checkedUsername]] : []),
                ].map(([l, v]) => (
                  <div key={l} className="flex justify-between">
                    <span className="text-slate-400">{l}</span>
                    <span className="text-white font-medium">{v}</span>
                  </div>
                ))}
                
                {discountAmount > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Harga Asli</span>
                      <span className="text-white line-through">{formatCurrency(selectedVoucher.price)}</span>
                    </div>
                    <div className="flex justify-between text-green-400">
                      <span>Diskon Promo</span>
                      <span>-{formatCurrency(discountAmount)}</span>
                    </div>
                  </>
                )}
                
                <div className="flex justify-between font-black text-base pt-2 border-t border-[#ea5234]/20">
                  <span className="text-slate-300">Total</span>
                  <span className="text-[#ea5234] text-xl">{formatCurrency(currentPrice)}</span>
                </div>
              </div>
              <button onClick={handleBuy} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-[#ea5234] text-white hover:scale-105 transition-all">
                <ShoppingCart className="w-4 h-4" />
                Beli Sekarang
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}