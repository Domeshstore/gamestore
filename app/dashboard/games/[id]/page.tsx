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
  ChevronLeft, ShoppingCart, Star, Tag, Layers, Ticket, Info,
  UserCheck, Shield, AlertTriangle, Sparkles
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { cn } from '@/lib/utils/format';
import { motion, AnimatePresence } from 'framer-motion';

const GAME_EMOJI: Record<string, string> = {
  'mobile-legends': '⚔️', 'free-fire': '🔥', 'pubg-mobile': '🪖', 'genshin-impact': '🌊',
  'valorant': '🎯', 'netflix': '🎬', 'spotify': '🎵', 'youtube-premium': '▶️',
  'nordvpn': '🛡️', 'disney-hotstar': '✨',
};
// Di bagian atas file, tambahkan interface
interface CheckDetails {
  status?: string;
  rc?: string;
  customer_name?: string;
  username?: string;
  message?: string;
  [key: string]: unknown;
}
type CheckState = 'idle' | 'loading' | 'found' | 'not_found' | 'error';

export default function GameDetailPage() {
  const { id: slug } = useParams<{ id: string }>();
  const router = useRouter();
  const [game, setGame] = useState<Game | null>(null);
  const [settings, setSettings] = useState<AppSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [userId, setUserId] = useState('');
  const [serverId, setServerId] = useState('');
  const [checkError, setCheckError] = useState('');
  // Username check state
  const [checkState, setCheckState] = useState<CheckState>('idle');
  const [checkedUsername, setCheckedUsername] = useState('');
  const [checkMessage, setCheckMessage] = useState('');
  const [checkDetails, setCheckDetails] = useState<CheckDetails | null>(null);

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
    setPromo,
    clearPromo,
  } = useCheckoutStore();
  
  const [recentTransaction, setRecentTransaction] = useState<{
    refId: string;
    status: string;
    message?: string;
  } | null>(null);

  const isML = game?.slug === 'mobile-legends';

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

  // Reset check state when userId/serverId changes
  useEffect(() => {
    if (checkState !== 'idle') {
      setCheckState('idle');
      setCheckedUsername('');
      setCheckMessage('');
      setCheckDetails(null);
    }
  }, [userId, serverId]);

  const handleCheckUsernameML = async () => {
    if (!userId.trim()) {
      toast.error('Masukkan User ID Mobile Legends');
      return;
    }
    
    if (isML && !serverId.trim()) {
      toast.error('Masukkan Zone ID Mobile Legends');
      return;
    }
    
    setCheckState('loading');
    setCheckedUsername('');
    setCheckMessage('');
    setCheckDetails(null);

    try {
      const response = await digiflazzAPI.cekUsernameML(
        userId.trim(),
        serverId.trim() || undefined
      );
      
      const result = response.data;
      console.log('ML Check Response:', result);
      
      if (result.success) {
        const found = result.data?.found === true;
        const username = result.data?.username || result.data?.customer_name || '';
        const message = result.data?.message || '';
        const status = result.data?.status;
        const rc = result.data?.rc;
        
        if (found && username) {
          setCheckState('found');
          setCheckedUsername(username);
          setCheckMessage(message || `Username: ${username}`);
          setCheckDetails(result.data);
          toast.success(`✅ ${username}`);
        } else {
          setCheckState('not_found');
          let errorMsg = message || 'Akun tidak ditemukan';
          
          if (status === 'Pending') {
            errorMsg = 'Pengecekan sedang diproses, Anda bisa melanjutkan pesanan';
          } else if (rc === '03') {
            errorMsg = 'Pengecekan membutuhkan waktu, silakan coba lagi';
          } else if (rc === '14') {
            errorMsg = 'User ID atau Zone ID salah format';
          } else if (rc === '43') {
            errorMsg = 'Akun tidak ditemukan di server';
          }
          
          setCheckMessage(errorMsg);
          setCheckDetails(result.data);
          
          if (status !== 'Pending') {
            toast.error(errorMsg);
          }
        }
      } else {
        setCheckState('error');
        const errorMsg = result.message || 'Gagal mengecek akun';
        setCheckMessage(errorMsg);
        toast.error(errorMsg);
      }
      
    } catch (err: any) {
      console.error('Check error:', err);
      setCheckState('error');
      const errorMsg = err?.response?.data?.message || err?.message || 'Gagal mengecek akun';
      setCheckMessage(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleCheckUsernameGeneric = async () => {
    if (!userId.trim()) {
      toast.error(`Masukkan ${game?.userIdLabel || 'ID'}`);
      return;
    }
    
    setCheckState('loading');
    setCheckedUsername('');
    setCheckMessage('');
    setCheckDetails(null);
    
    try {
      const res = await digiflazzAPI.cekUsernameML(userId, serverId || undefined);
      const d = res.data.data;
      if (d?.username || d?.name) { 
        setCheckState('found');
        setCheckedUsername(d.username || d.name); 
        setCheckMessage(`Username: ${d.username || d.name}`);
        toast.success('Akun ditemukan!');
      } else {
        setCheckState('not_found');
        setCheckError('Akun tidak ditemukan');
        toast.error('Akun tidak ditemukan');
      }
    } catch {
      setCheckState('error');
      setCheckMessage('Gagal mengecek akun. Coba lagi.');
      toast.error('Gagal mengecek akun');
    }
  };

  const handleCheckUsername = () => {
    if (isML) {
      handleCheckUsernameML();
    } else {
      handleCheckUsernameGeneric();
    }
  };

  const handleSkipCheck = () => {
    setCheckState('found');
    setCheckedUsername(userId.trim());
    toast.loading('Melanjutkan tanpa verifikasi username');
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
    setTargetUsername(checkedUsername || userId);
    
    if (promoApplied) {
      setPromo(
        promoCode,
        promoApplied.promoId,
        promoApplied.discount,
        selectedVoucher.price,
        promoApplied.finalPrice
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
              {game.platform?.map(p => (
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
          {/* Account input with ML-specific check */}
          <div className="p-5 rounded-2xl bg-[#ea5234]/10 border border-[#ea5234]/20 backdrop-blur-sm">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black text-white bg-[#ea5234]">1</div>
              Masukkan Data Akun
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">{game.userIdLabel}</label>
                <input 
                  value={userId} 
                  onChange={e => { setUserId(e.target.value); }} 
                  placeholder={isML ? 'Contoh: 12345678' : `Masukkan ${game.userIdLabel}`} 
                  className="w-full px-4 py-2 rounded-xl bg-[#ea5234]/5 border border-[#ea5234]/20 text-white focus:outline-none focus:border-[#ea5234] font-mono" 
                />
              </div>
              {game.requiresServerId && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">{game.serverIdLabel}</label>
                  <input 
                    value={serverId} 
                    onChange={e => { setServerId(e.target.value); }} 
                    placeholder={isML ? 'Zone ID: 1234' : `Masukkan ${game.serverIdLabel}`} 
                    className="w-full px-4 py-2 rounded-xl bg-[#ea5234]/5 border border-[#ea5234]/20 text-white focus:outline-none focus:border-[#ea5234] font-mono" 
                  />
                </div>
              )}
            </div>

            {/* Info hint for ML */}
            {isML && (
              <div className="mt-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 mt-0.5 text-blue-400 shrink-0" />
                  <div className="text-xs text-slate-300">
                    <p className="font-semibold text-blue-400 mb-1">Cara mendapatkan User ID & Zone ID:</p>
                    <ol className="list-decimal list-inside space-y-0.5 ml-1">
                      <li>Buka game Mobile Legends</li>
                      <li>Klik profil/avatar di pojok kiri atas</li>
                      <li>Lihat angka di bawah nama karakter</li>
                      <li>User ID (8-10 digit) dan Zone ID (3-4 digit)</li>
                    </ol>
                    <p className="mt-2 text-slate-400">Contoh: <code className="text-[#ea5234]">12345678</code> (User ID) dan <code className="text-[#ea5234]">1234</code> (Zone ID)</p>
                  </div>
                </div>
              </div>
            )}

            {/* Check button */}
            <div className="mt-4">
              <button 
                onClick={handleCheckUsername} 
                disabled={!userId.trim() || checkState === 'loading' || (isML && !serverId.trim())}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#ea5234] text-white disabled:opacity-50 hover:bg-[#ea5234]/90 transition-all"
              >
                {checkState === 'loading' ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Mengecek...</>
                ) : (
                  <><Search className="w-4 h-4" /> {isML ? 'Cek Username ML' : 'Cek Akun'}</>
                )}
              </button>
            </div>

            {/* Check result for ML */}
            <AnimatePresence>
              {checkState === 'found' && checkedUsername && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 p-4 rounded-xl bg-green-500/10 border border-green-500/20"
                >
                  <div className="flex items-start gap-3">
                    <UserCheck className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-green-400 font-semibold">Akun Ditemukan!</p>
                      <p className="text-white font-bold text-lg mt-1">{checkedUsername}</p>
                      {checkMessage && (
                        <p className="text-slate-400 text-xs mt-1">{checkMessage}</p>
                      )}
                     {checkDetails && (
  <div className="mt-2 text-xs text-slate-400 space-x-2">
    {checkDetails.status && typeof checkDetails.status === 'string' && (
      <span>Status: {checkDetails.status}</span>
    )}
    {checkDetails.rc && typeof checkDetails.rc === 'string' && (
      <span>• RC: {checkDetails.rc}</span>
    )}
  </div>
)}
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
                  </div>
                </motion.div>
              )}

              {checkState === 'not_found' && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20"
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-yellow-400 font-semibold">Akun Tidak Ditemukan</p>
                      <p className="text-slate-300 text-sm mt-1">{checkMessage || 'Periksa kembali User ID dan Zone ID Anda'}</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleSkipCheck}
                    className="mt-3 w-full py-2 rounded-lg text-sm font-medium bg-[#ea5234]/20 text-[#ea5234] hover:bg-[#ea5234]/30 transition-all"
                  >
                    Lanjutkan Pesanan Tanpa Verifikasi
                  </button>
                </motion.div>
              )}

              {checkState === 'error' && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20"
                >
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-red-400 font-semibold">Gagal Mengecek Akun</p>
                      <p className="text-slate-300 text-sm mt-1">{checkMessage}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
          {selectedVoucher && userId && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-2xl bg-gradient-to-r from-[#ea5234]/20 to-[#ea5234]/10 border border-[#ea5234]/30 backdrop-blur-sm"
            >
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black text-white bg-[#ea5234]">3</div>
                Konfirmasi Pesanan
              </h3>
              <div className="space-y-2 text-sm mb-4">
                {[
                  ['Game', game.name],
                  ['Voucher', selectedVoucher.name],
                  ['ID Akun', `${userId}${serverId ? ` (Zone: ${serverId})` : ''}`],
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
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}