// app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { gamesAPI, settingsAPI } from '@/lib/api/client';
import { Game, Voucher, AppSetting, Category } from '@/types';
import GameCard from '@/components/games/GameCardV2';
import BannerCarousel from '@/components/ui/BannerCarousel';
import { useCheckoutStore } from '@/lib/store/useCheckoutStore';
import { useRouter } from 'next/navigation';
import { Zap, Shield, Clock, Gift, ArrowRight, Loader2, Flame, Star, Crown, Tv, Gamepad } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { Button, Card } from 'antd';
import MarqueeVoucherCards from '@/components/MarqueeVoucherCards';


export default function DashboardPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [featured, setFeatured] = useState<(Voucher & { gameId: Game })[]>([]);
  const [settings, setSettings] = useState<AppSetting | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selCat, setSelCat] = useState('');
  const [loading, setLoading] = useState(true);
  const { setGame, setVoucher } = useCheckoutStore();
  const router = useRouter();

  useEffect(() => {
    Promise.all([
      gamesAPI.getAll({ limit: 12 }),
      gamesAPI.getFeaturedVouchers(),
      settingsAPI.getApp(),
      settingsAPI.getCategories(),
    ]).then(([gRes, vRes, sRes, cRes]) => {
      setGames(gRes.data.data);
      setFeatured(vRes.data.data);
      setSettings(sRes.data.data);
      setCategories(cRes.data.data);
    }).finally(() => setLoading(false));
  }, []);

  const filteredGames = selCat ? games.filter(g => g.category === selCat) : games;

  const FEATURES = [
    { icon: Zap, title: 'Proses Instan', desc: 'Top up langsung diproses' },
    { icon: Shield, title: '100% Aman', desc: 'Transaksi terenkripsi' },
    { icon: Clock, title: '24/7 Aktif', desc: 'Layanan tersedia setiap saat' },
    { icon: Gift, title: 'Reward Points', desc: 'Poin setiap pembelian' },
  ];

  return (
    <div className="space-y-12 pb-12">
      {/* ── HERO ── */}

      {/* ── BANNER CAROUSEL ── */}
      {settings?.banners && settings.banners.length > 0 && (
        <section className="max-w-7xl mx-auto px-4">
          <BannerCarousel banners={settings.banners} interval={5000} />
        </section>
      )}

      {/* ── FEATURES ── */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div 
              key={title} 
              className="bg-[#ea5234]/10 border border-[#ea5234]/20 p-5 rounded-2xl text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              style={{ backdropFilter: 'blur(12px)' }}
            >
              <div 
                className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-3"
                style={{ 
                  background: '#ea523420', 
                  border: '1px solid #ea523430' 
                }}
              >
                <Icon className="w-5 h-5" style={{ color: '#ea5234' }} />
              </div>
              <p className="text-white font-bold text-sm">{title}</p>
              <p className="text-slate-400 text-xs mt-1">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURED VOUCHERS ── */}
      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-1.5 rounded-full bg-gradient-to-b from-[#ea5234] to-[#ea5234]/50" />
              <Flame className="w-5 h-5" style={{ color: '#ea5234' }} />
              <div>
                <h2 className="text-xl font-black" style={{ color: '#f8d9b9' }}>Voucher Terlaris</h2>
                <p className="text-slate-500 text-xs">Pilihan paling populer</p>
              </div>
            </div>
            <Link href="/dashboard/games" className="flex items-center gap-1 text-sm font-semibold transition-colors hover:gap-2"
              style={{ color: '#f8d9b9' }}>
              Lihat semua <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featured.slice(0, 8).map(v => (
              <button key={v._id}
                className="group bg-[#ea5234]/10 border border-[#ea5234]/20 p-4 rounded-2xl text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                style={{ backdropFilter: 'blur(16px)' }}
                onClick={() => {
                  if (v.gameId && typeof v.gameId === 'object') {
                    setGame(v.gameId);
                    setVoucher(v);
                    router.push('/dashboard/checkout');
                  }
                }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                    style={{ background: '#ea523420', border: '1px solid #ea5234' }}>
                    {v.type === 'subscription' ? '👑' : '💎'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-xs font-bold truncate">
                      {typeof v.gameId === 'object' ? (v.gameId as Game).name : ''}
                    </p>
                    <p className="text-slate-400 text-xs truncate">{v.name}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white font-black text-sm">{formatCurrency(v.price)}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: '#ea5234', color: '#f8d9b9' }}>
                    +{v.rewardPoints} pts
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── GAMES GRID ── */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1.5 rounded-full bg-gradient-to-b from-[#ea5234] to-[#ea5234]/50" />
            <div>
              <h2 className="text-xl font-bold" style={{ color: '#fcdfc2' }}>Game & Layanan</h2>
              <p className="text-[#b4b4b4] text-xs">Top up game favoritmu</p>
            </div>
          </div>
          <Link href="/dashboard/games" className="flex items-center gap-1 text-sm font-semibold transition-colors hover:gap-2" style={{ color: '#fcdfc2' }}>
            Lihat semua <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Category filter pills */}
        {categories.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-5">
            <button 
              onClick={() => setSelCat('')}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                selCat === '' 
                  ? 'bg-[#ea5234] text-white shadow-lg' 
                  : 'bg-[#ea5234]/10 border border-[#ea5234]/20 text-[#ffdebd] hover:bg-[#ea5234]/20'
              }`}
            >
              Semua
            </button>
            {categories.map(cat => (
              <button 
                key={cat._id} 
                onClick={() => setSelCat(cat.slug)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  selCat === cat.slug
                    ? 'bg-[#ea5234] text-white shadow-lg'
                    : 'bg-[#ea5234]/10 border border-[#ea5234]/20 text-[#b4b4b4] hover:text-white hover:bg-[#ea5234]/20'
                }`}
              >
                <span>{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#ea5234' }} />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredGames.map(game => (
              <GameCard key={game._id} game={game} />
            ))}
          </div>
        )}
      </section>

      {/* ── MARQUEE VOUCHER TERLARIS ── */}
      <section className="max-w-full mx-auto px-4">
        <MarqueeVoucherCards 
          vouchers={featured}
          onSelect={(voucher) => {
            if (voucher.gameId && typeof voucher.gameId === 'object') {
              setGame(voucher.gameId as Game);
              setVoucher(voucher);
              router.push('/dashboard/checkout');
            }
          }}
        />
      </section>
    </div>
  );
}