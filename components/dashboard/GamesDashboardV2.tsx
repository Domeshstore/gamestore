'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { gamesAPI, digiflazzAPI, settingsAPI } from '@/lib/api/client';
import { Game, Voucher, AppSetting } from '@/types';
import GameVouchers from '@/components/vouchers/GameVouchers';
import BannerCarousel from '@/components/ui/BannerCarousel';
import { useCheckoutStore } from '@/lib/store/useCheckoutStore';
import { useAuthStore } from '@/lib/store/useAuthStore';
import {
  Loader2, Search, CheckCircle, XCircle, ArrowRight,
  ChevronLeft, ShoppingCart, Star, Tag, Layers,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { cn } from '@/lib/utils/format';

const CAT_GRADIENT: Record<string, string> = {
  mobile: 'from-blue-600 to-purple-700', pc: 'from-green-600 to-teal-700',
  console: 'from-orange-600 to-red-700', streaming: 'from-red-600 to-pink-700', other: 'from-slate-600 to-slate-700',
};
const GAME_EMOJI: Record<string, string> = {
  'mobile-legends': '⚔️', 'free-fire': '🔥', 'pubg-mobile': '🪖', 'genshin-impact': '🌊',
  'valorant': '🎯', 'netflix': '🎬', 'spotify': '🎵', 'youtube-premium': '▶️',
  'nordvpn': '🛡️', 'disney-hotstar': '✨',
};

export default function GameDetailPage() {
  const { id: slug } = useParams<{ id: string }>();
  const router = useRouter();
  const [game, setGame]                   = useState<Game | null>(null);
  const [settings, setSettings]           = useState<AppSetting | null>(null);
  const [loading, setLoading]             = useState(true);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [userId, setUserId]               = useState('');
  const [serverId, setServerId]           = useState('');
  const [checking, setChecking]           = useState(false);
  const [checkedUsername, setCheckedUsername] = useState('');
  const [checkError, setCheckError]       = useState('');
  const {
    setGame: storeSetGame, setVoucher, setTargetId,
    setServerId: setStoreServerId, setTargetUsername,
  } = useCheckoutStore();
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);

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
      if (d?.username || d?.name) { setCheckedUsername(d.username || d.name); toast.success('Akun ditemukan!'); }
      else setCheckError('Akun tidak ditemukan');
    } catch { setCheckError('Gagal mengecek akun. Coba lagi.'); }
    finally { setChecking(false); }
  };

  const handleBuy = () => {
    if (!game || !selectedVoucher) { toast.error('Pilih voucher terlebih dahulu'); return; }
    if (!userId) { toast.error(`Masukkan ${game.userIdLabel}`); return; }
    if (!isAuthenticated) { toast.error('Silakan login terlebih dahulu'); router.push('/auth/login'); return; }
    storeSetGame(game);
    setVoucher(selectedVoucher);
    setTargetId(userId);
    setStoreServerId(serverId);
    setTargetUsername(checkedUsername);
    router.push('/dashboard/checkout');
  };

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
    </div>
  );
  if (!game) return null;

  const gradient  = CAT_GRADIENT[game.category] ?? CAT_GRADIENT.other;
  const emoji     = GAME_EMOJI[game.slug] ?? '🎮';
  const isDigital = game.category === 'streaming';

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Back */}
      <Link href="/dashboard/games"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors">
        <ChevronLeft className="w-4 h-4" /> Kembali ke Games
      </Link>

      {/* ── Banner for this game (reuse global banners that link to this game) ── */}
      {settings?.banners && settings.banners.filter(b => b.isActive && b.linkUrl?.includes(game.slug)).length > 0 && (
        <BannerCarousel
          banners={settings.banners.filter(b => b.linkUrl?.includes(game.slug))}
          autoPlay={false}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: Game info ── */}
        <div className="lg:col-span-1 space-y-4">
          {/* Cover */}
          <div className={cn('relative rounded-2xl overflow-hidden h-52 bg-gradient-to-br flex items-center justify-center', gradient)}>
            {game.banner ? (
              <img src={game.banner} alt={game.name} className="absolute inset-0 w-full h-full object-cover" />
            ) : game.image ? (
              <img src={game.image} alt={game.name} className="w-32 h-32 object-contain drop-shadow-2xl" />
            ) : (
              <span className="text-7xl drop-shadow-2xl animate-float">{emoji}</span>
            )}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.6) 100%)' }} />
            {isDigital && (
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-xs font-bold text-white"
                style={{ background: 'rgba(239,68,68,0.8)', backdropFilter: 'blur(8px)' }}>
                Digital Product
              </div>
            )}
          </div>

          {/* Info card */}
          <div className="p-5 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)' }}>
            <h1 className="text-white font-black text-xl mb-1">{game.name}</h1>
            <p className="text-slate-400 text-sm">{game.publisher}</p>
            {game.description && (
              <p className="text-slate-400 text-sm mt-3 leading-relaxed">{game.description}</p>
            )}
            <div className="flex flex-wrap gap-2 mt-4">
              {game.platform.map(p => (
                <span key={p} className="chip text-slate-300 text-xs">{p}</span>
              ))}
            </div>
            <div className="mt-4 pt-4 space-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
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

        {/* ── Right: Voucher selection ── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Account input */}
          <div className="p-5 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)' }}>
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black text-white"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>1</div>
              Masukkan Data Akun
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-semibold uppercase tracking-wide">{game.userIdLabel}</label>
                <input value={userId}
                  onChange={e => { setUserId(e.target.value); setCheckedUsername(''); setCheckError(''); }}
                  placeholder={`Masukkan ${game.userIdLabel}`} className="input-field text-sm" />
              </div>
              {game.requiresServerId && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-semibold uppercase tracking-wide">{game.serverIdLabel}</label>
                  <input value={serverId}
                    onChange={e => { setServerId(e.target.value); setCheckedUsername(''); setCheckError(''); }}
                    placeholder={`Masukkan ${game.serverIdLabel}`} className="input-field text-sm" />
                </div>
              )}
            </div>
            <button onClick={handleCheckUsername} disabled={!userId || checking}
              className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: 'white' }}>
              {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Cek Username
            </button>
            {checkedUsername && (
              <div className="mt-3 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm"
                style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399' }}>
                <CheckCircle className="w-4 h-4" />
                Username: <strong>{checkedUsername}</strong>
              </div>
            )}
            {checkError && (
              <div className="mt-3 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                <XCircle className="w-4 h-4" /> {checkError}
              </div>
            )}
          </div>

          {/* Vouchers */}
          <div className="p-5 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)' }}>
            <h3 className="text-white font-bold mb-5 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black text-white"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>2</div>
              Pilih Voucher
            </h3>
            <GameVouchers
              game={game}
              vouchers={game.vouchers || []}
              selectedVoucher={selectedVoucher}
              onSelect={setSelectedVoucher}
            />
          </div>

          {/* Summary + Buy */}
          {selectedVoucher && (
            <div className="p-5 rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(79,70,229,0.06))',
                border: '1px solid rgba(124,58,237,0.25)',
                boxShadow: '0 8px 32px rgba(124,58,237,0.1)',
              }}>
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black text-white"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>3</div>
                Konfirmasi Pesanan
              </h3>
              <div className="space-y-2 text-sm mb-4">
                {[
                  ['Game',    game.name],
                  ['Voucher', selectedVoucher.name],
                  ['ID Akun', `${userId}${serverId ? `/${serverId}` : ''}`],
                  ...(checkedUsername ? [['Username', checkedUsername]] : []),
                ].map(([l, v]) => (
                  <div key={l} className="flex justify-between">
                    <span className="text-slate-400">{l}</span>
                    <span className="text-white font-medium">{v}</span>
                  </div>
                ))}
                <div className="flex justify-between font-black text-base pt-2"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <span className="text-slate-300">Total</span>
                  <span className="text-white">{formatCurrency(selectedVoucher.price)}</span>
                </div>
              </div>
              <button onClick={handleBuy} className="btn-primary w-full flex items-center justify-center gap-2">
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
