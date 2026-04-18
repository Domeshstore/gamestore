/// app/dashboard/page.tsx
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { gamesAPI, settingsAPI, promoAPI } from '@/lib/api/client';
import { Game, AppSetting, Category, Voucher } from '@/types';
import GameCard from '@/components/games/GameCardV2';
import BannerCarousel from '@/components/ui/Banner2';
import { useCheckoutStore } from '@/lib/store/useCheckoutStore';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils/format';
import { 
  Loader2, ArrowRight, Search, X, Zap, Shield, Clock, Gift, 
  Flame, Star, Crown, Tv, Gamepad 
} from 'lucide-react';
import MarqueeVoucherCards from '@/components/MarqueeVoucherCards';

const CATEGORY_ICONS: Record<string, string> = {
  game: '🎮', 
  pulsa: '📱', 
  'e-money': '💳', 
  streaming: '🎬', 
  'paket-data': '🎁',
  voucher: '🎫',
};

function SectionHeader({ icon, title, sub, href }: { icon: string; title: string; sub?: string; href?: string }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-3">
        <div className="h-8 w-1.5 rounded-full bg-gradient-to-b from-[#ea5234] to-[#ea5234]/50" />
        <span className="text-2xl">{icon}</span>
        <div>
          <h2 className="text-white font-black text-xl">{title}</h2>
          {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
        </div>
      </div>
      {href && (
        <Link href={href} className="flex items-center gap-1 text-sm font-bold text-[#f8d9b9] transition-all hover:gap-2">
          Lihat semua <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { setGame, setVoucher } = useCheckoutStore();
  
  // State dari kedua versi
  const [settings, setSettings] = useState<AppSetting | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [promos, setPromos] = useState<{ code: string; name: string; description: string; type: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Product states
  const [games, setGames] = useState<Game[]>([]);
  const [featured, setFeatured] = useState<(Voucher & { gameId: Game })[]>([]);
  const [gameProducts, setGameProducts] = useState<Game[]>([]);
  const [pulsaProducts, setPulsaProducts] = useState<Game[]>([]);
  const [emoneyProducts, setEmoneyProducts] = useState<Game[]>([]);
  const [streamingProducts, setStreamingProducts] = useState<Game[]>([]);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Game[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchDebounce = useRef<ReturnType<typeof setTimeout>>();

  const FEATURES = [
    { icon: Zap, title: 'Proses Instan', desc: 'Top up langsung diproses', color: '#ea5234' },
    { icon: Shield, title: '100% Aman', desc: 'Transaksi terenkripsi', color: '#10b981' },
    { icon: Clock, title: '24/7 Aktif', desc: 'Layanan tersedia setiap saat', color: '#3b82f6' },
    { icon: Gift, title: 'Reward Points', desc: 'Poin setiap pembelian', color: '#f59e0b' },
  ];

  useEffect(() => {
    Promise.all([
      settingsAPI.getApp(),
      settingsAPI.getCategories(),
      promoAPI.getPublic(),
      gamesAPI.getAll({ limit: 12, isActive: true }),
      gamesAPI.getFeaturedVouchers(),
      gamesAPI.getAll({ limit: 8, category: 'game', isActive: true }),
      gamesAPI.getAll({ limit: 6, category: 'pulsa', isActive: true }),
      gamesAPI.getAll({ limit: 6, category: 'e-money', isActive: true }),
      gamesAPI.getAll({ limit: 6, category: 'streaming', isActive: true }),
    ]).then(([sRes, cRes, pRes, gRes, vRes, gameRes, pulRes, emRes, stRes]) => {
      setSettings(sRes.data.data);
      setCategories(cRes.data.data ?? []);
      setPromos(pRes.data.data ?? []);
      setGames(gRes.data.data ?? []);
      setFeatured(vRes.data.data ?? []);
      setGameProducts(gameRes.data.data ?? []);
      setPulsaProducts(pulRes.data.data ?? []);
      setEmoneyProducts(emRes.data.data ?? []);
      setStreamingProducts(stRes.data.data ?? []);
    }).catch((err) => {
      console.error('Failed to load dashboard data:', err);
    }).finally(() => setLoading(false));
  }, []);

  // Live search
  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q);
    clearTimeout(searchDebounce.current);
    if (!q.trim()) { 
      setSearchResults([]); 
      setSearchOpen(false); 
      return; 
    }
    setSearchOpen(true);
    setSearching(true);
    searchDebounce.current = setTimeout(async () => {
      try {
        const res = await gamesAPI.getAll({ search: q, limit: 10 });
        setSearchResults(res.data.data ?? []);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setSearching(false);
      }
    }, 350);
  }, []);

  const clearSearch = () => { 
    setSearchQuery(''); 
    setSearchResults([]); 
    setSearchOpen(false); 
  };

  const handleVoucherSelect = (voucher: Voucher & { gameId: Game }) => {
    if (voucher.gameId && typeof voucher.gameId === 'object') {
      setGame(voucher.gameId);
      setVoucher(voucher);
      router.push('/dashboard/checkout');
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#ea5234' }} />
    </div>
  );

  return (
    <div className="space-y-12 pb-16">


      {/* ── BANNER CAROUSEL ── */}
      {settings?.banners && settings.banners.length > 0 && (
        <section className="max-w-7xl mx-auto px-4">
          <BannerCarousel banners={settings.banners} interval={5000} />
        </section>
      )}
          {/* Search Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.25 }}
            className="relative max-w-xl mx-auto"
          >
            <div className="relative flex items-center rounded-2xl overflow-hidden bg-[#1a1a1a] border-2 border-[#ea5234]/30">
              <Search className="absolute left-4 w-5 h-5 text-slate-500" />
              <input
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Cari game, pulsa, e-money, streaming..."
                className="flex-1 bg-transparent py-4 pl-12 pr-12 text-white text-sm outline-none"
                style={{ caretColor: '#ea5234' }}
              />
              {searchQuery && (
                <button onClick={clearSearch} className="absolute right-4">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              )}
            </div>

            {/* Search Dropdown */}
            {searchOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 4 }} 
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-full mt-2 left-0 right-0 rounded-2xl overflow-hidden z-50 shadow-2xl bg-[#1a1a1a] border border-[#ea5234]/20"
              >
                {searching ? (
                  <div className="flex items-center justify-center py-6 gap-2 text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin" /> Mencari...
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="py-6 text-center text-slate-500 text-sm">
                    Tidak ada hasil untuk "{searchQuery}"
                  </div>
                ) : (
                  <div>
                    {searchResults.map(g => (
                      <Link key={g._id} href={`/dashboard/games/${g.slug}`} onClick={clearSearch}
                        className="flex items-center gap-3 px-4 py-3 transition-all border-b border-white/5 hover:bg-white/5"
                      >
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg bg-[#ea5234]/20 border border-[#ea5234]/30">
                          {CATEGORY_ICONS[g.category] ?? '⚡'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-bold text-sm">{g.name}</div>
                          <div className="text-slate-500 text-xs">{g.publisher}</div>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold capitalize bg-white/5 text-slate-400 border border-white/10">
                          {g.category}
                        </span>
                      </Link>
                    ))}
                    <Link href={`/dashboard/games?search=${encodeURIComponent(searchQuery)}`} onClick={clearSearch}
                      className="flex items-center justify-center gap-2 py-3 text-sm font-bold text-[#ea5234] border-t border-white/10"
                    >
                      Lihat semua hasil → "{searchQuery}"
                    </Link>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
      

      {/* ── FEATURES ── */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {FEATURES.map(({ icon: Icon, title, desc, color }) => (
            <div 
              key={title} 
              className="bg-[#ea5234]/10 border border-[#ea5234]/20 p-5 rounded-2xl text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              style={{ backdropFilter: 'blur(12px)' }}
            >
              <div 
                className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-3"
                style={{ background: `${color}20`, border: `1px solid ${color}30` }}
              >
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <p className="text-white font-bold text-sm">{title}</p>
              <p className="text-slate-400 text-xs mt-1">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURED VOUCHERS (Marquee) ── */}
      {featured.length > 0 && (
        <section className="max-w-full mx-auto px-4">
          <SectionHeader icon="🔥" title="Voucher Terlaris" sub="Pilihan paling populer" href="/dashboard/games" />
          <MarqueeVoucherCards 
            vouchers={featured}
            onSelect={handleVoucherSelect}
          />
        </section>
      )}

      {/* ── GAME TOP UP ── */}
      {gameProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4">
          <SectionHeader icon="🎮" title="Game Top Up" sub="Mobile Legends, Free Fire, PUBG & lainnya" href="/dashboard/games?category=game" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {gameProducts.map(game => <GameCard key={game._id} game={game} />)}
          </div>
        </section>
      )}

      {/* ── PULSA & DATA ── */}
      {pulsaProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4">
          <SectionHeader icon="📱" title="Pulsa & Paket Data" sub="Telkomsel, XL, Indosat, Tri & lainnya" href="/dashboard/games?category=pulsa" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {pulsaProducts.map(game => <PulsaCard key={game._id} game={game} />)}
          </div>
        </section>
      )}

      {/* ── E-MONEY ── */}
      {emoneyProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4">
          <SectionHeader icon="💳" title="Top Up E-Money" sub="GoPay, OVO, Dana, ShopeePay & lainnya" href="/dashboard/games?category=e-money" />
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {emoneyProducts.map(game => <EmoneyCard key={game._id} game={game} />)}
          </div>
        </section>
      )}

      {/* ── STREAMING ── */}
      {streamingProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4">
          <SectionHeader icon="🎬" title="Streaming & Hiburan" sub="Netflix, Spotify, YouTube Premium & lainnya" href="/dashboard/games?category=streaming" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {streamingProducts.map(game => <StreamingCard key={game._id} game={game} />)}
          </div>
        </section>
      )}

      {/* ── PROMO BANNER ── */}
      <section className="max-w-3xl mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.97 }} 
          whileInView={{ opacity: 1, scale: 1 }} 
          viewport={{ once: true }}
          className="relative overflow-hidden p-8 rounded-3xl text-center bg-gradient-to-r from-[#ea5234]/20 to-[#ea5234]/5 border border-[#ea5234]/30"
        >
          <div className="relative">
            {/* ── PROMO STRIP ── */}
      {promos.length > 0 && (
        <section className="max-w-7xl mx-auto px-4">
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
            {promos.map((p, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl shrink-0 cursor-pointer transition-all hover:scale-105 bg-gradient-to-r from-[#ea5234]/20 to-[#ea5234]/5 border border-[#ea5234]/30"
              >
                <span className="text-xl">🏷️</span>
                <div>
                  <div className="text-[#ea5234] font-black text-sm">{p.name}</div>
                  <div className="text-slate-500 text-xs">Kode: <strong className="text-white">{p.code}</strong></div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}
            <div className="text-4xl mb-3 animate-float">🎁</div>
            <h2 className="text-2xl font-black text-white mb-2">Pengguna Baru? Dapat Diskon!</h2>
            <p className="text-slate-400 mb-4 text-sm">
              Transaksi pertamamu dapat diskon hingga Rp 50.000
            </p>
            
            <Link href="/dashboard/games">
              <button className="px-6 py-3 rounded-xl font-bold text-white bg-[#ea5234] hover:bg-[#ea5234]/80 transition-all">
                Mulai Belanja →
              </button>
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}

// ── Mini card components ──────────────────────────────────────
function PulsaCard({ game }: { game: Game }) {
  const OPERATOR_COLORS: Record<string, string> = {
    telkomsel: '#e4002b', xl: '#0072bc', indosat: '#f7941d',
    tri: '#f7941d', smartfren: '#e30613', byu: '#e30613',
  };
  const color = OPERATOR_COLORS[game.slug] ?? '#6b7280';
  return (
    <Link href={`/dashboard/games/${game.slug}`}>
      <motion.div whileHover={{ y: -3, scale: 1.03 }} whileTap={{ scale: 0.97 }}
        className="flex flex-col items-center gap-2 p-4 rounded-2xl cursor-pointer text-center bg-[#1a1a1a] border border-white/10 hover:border-[#ea5234]/50 transition-all"
      >
        <div className="w-11 h-11 rounded-full flex items-center justify-center text-xl font-black text-white shrink-0"
          style={{ background: color, boxShadow: `0 4px 12px ${color}40` }}>
          {game.name[0]}
        </div>
        <span className="text-white font-bold text-xs line-clamp-2">{game.name}</span>
      </motion.div>
    </Link>
  );
}

function EmoneyCard({ game }: { game: Game }) {
  const EMONEY_COLORS: Record<string, { bg: string; emoji: string }> = {
    gopay: { bg: '#00AAD4', emoji: '💚' },
    ovo: { bg: '#4C3494', emoji: '💜' },
    dana: { bg: '#118EEA', emoji: '🔵' },
    shopeepay: { bg: '#EE4D2D', emoji: '🛒' },
    linkaja: { bg: '#E82529', emoji: '❤️' },
    brizzi: { bg: '#023FA5', emoji: '💙' },
  };
  const style = EMONEY_COLORS[game.slug] ?? { bg: '#6b7280', emoji: '💰' };
  return (
    <Link href={`/dashboard/games/${game.slug}`}>
      <motion.div whileHover={{ y: -3, scale: 1.04 }} whileTap={{ scale: 0.97 }}
        className="flex flex-col items-center gap-2 p-3 rounded-2xl cursor-pointer text-center bg-[#1a1a1a] border border-white/10 hover:border-[#ea5234]/50 transition-all"
      >
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
          style={{ background: style.bg, boxShadow: `0 4px 12px ${style.bg}40` }}>
          {style.emoji}
        </div>
        <span className="text-white font-bold text-xs line-clamp-2">{game.name}</span>
      </motion.div>
    </Link>
  );
}

function StreamingCard({ game }: { game: Game }) {
  const STREAMING: Record<string, { bg: string; emoji: string }> = {
    netflix: { bg: '#E50914', emoji: '🎬' },
    spotify: { bg: '#1DB954', emoji: '🎵' },
    'youtube-premium': { bg: '#FF0000', emoji: '▶️' },
    'disney-hotstar': { bg: '#113CCF', emoji: '✨' },
    nordvpn: { bg: '#4687c7', emoji: '🛡️' },
  };
  const style = STREAMING[game.slug] ?? { bg: '#8b5cf6', emoji: '🎭' };
  return (
    <Link href={`/dashboard/games/${game.slug}`}>
      <motion.div whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.97 }}
        className="flex flex-col items-center gap-2 p-4 rounded-2xl cursor-pointer text-center bg-[#1a1a1a] border border-white/10 hover:border-[#ea5234]/50 transition-all"
      >
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
          style={{ background: style.bg, boxShadow: `0 4px 12px ${style.bg}40` }}>
          {style.emoji}
        </div>
        <span className="text-white font-bold text-xs line-clamp-2">{game.name}</span>
      </motion.div>
    </Link>
  );
}