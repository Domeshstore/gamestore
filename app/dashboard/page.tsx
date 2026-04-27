'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { gamesAPI, settingsAPI, promoAPI, authAPI, reviewsPublicAPI, treasureAPI } from '@/lib/api/client';
import { Game, AppSetting, Category, Voucher } from '@/types';
import BannerCarousel from '@/components/ui/Banner3';
import { useCheckoutStore } from '@/lib/store/useCheckoutStore';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils/format';
import { 
  Loader2, ArrowRight, Search, X, Zap, Shield, Clock, Gift, 
  Flame, Star, Crown, Tv, Gamepad, Wallet, Ticket,
} from 'lucide-react';
import MarqueeVoucherCards from '@/components/MarqueeVoucherCards';
import ReviewsSection from '@/components/reviews/ReviewsSection';
import { 
  ProductSection, 
  filterProductsByType,
  getGameProducts,
  getPulsaProducts,
  getPaketDataProducts,
  getPlnProducts,
  getEmoneyProducts,
  getStreamingProducts
} from '@/components/cards/ProductCard';
import PromoBanner from '@/components/ui/PromoBanner';
import TreasureRedeemEnhanced from '@/components/TreasureRedeemEnhanced';
import axios from 'axios';

const CATEGORY_ICONS: Record<string, string> = {
  game: '', 
  pulsa: '', 
  'e-money': '', 
  streaming: '', 
  'paket-data': '',
  voucher: '',
  pln: '',
};

export default function DashboardPage() {
  const router = useRouter();
  const { setGame, setVoucher } = useCheckoutStore();
  
  const [settings, setSettings] = useState<AppSetting | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Product states - DIPISAHKAN berdasarkan productType
  const [allProducts, setAllProducts] = useState<Game[]>([]);
  const [featured, setFeatured] = useState<(Voucher & { gameId: Game })[]>([]);
  const [gameProducts, setGameProducts] = useState<Game[]>([]);
  const [pulsaProducts, setPulsaProducts] = useState<Game[]>([]);
  const [paketDataProducts, setPaketDataProducts] = useState<Game[]>([]);
  const [plnProducts, setPlnProducts] = useState<Game[]>([]);
  const [emoneyProducts, setEmoneyProducts] = useState<Game[]>([]);
  const [streamingProducts, setStreamingProducts] = useState<Game[]>([]);
  
  // Reviews & other states
  const [reviews, setReviews] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [commentReview, setCommentReview] = useState('');

  // ============ TREASURE / DELTA COINS STATES ============
  const [deltaCoins, setDeltaCoins] = useState(0);
  const [treasureModalOpen, setTreasureModalOpen] = useState(false);
  const [loadingCoins, setLoadingCoins] = useState(false);

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

  // ============ FETCH DELTA COINS ============
  const fetchDeltaCoins = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      setLoadingCoins(true);
      const res = await treasureAPI.getMyCoins();
      if (res.data?.success) {
        setDeltaCoins(res.data.data.deltaCoins);
      }
    } catch (error) {
      console.error('Failed to fetch delta coins:', error);
    } finally {
      setLoadingCoins(false);
    }
  }, []);

  // Handle treasure redeem success
  const handleTreasureSuccess = (coins: number) => {
    setDeltaCoins(prev => prev + coins);
    // Refresh user data to update total earned
    fetchUser();
  };

  // Fetch user data - PERBAIKAN menggunakan authAPI
  const fetchUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setUser(null);
        return;
      }
      
      const response = await authAPI.getMe();
      if (response.data?.success && response.data?.data) {
        setUser(response.data.data);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setUser(null);
      // Jika error 401, token mungkin expired
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  // Fetch reviews function
  const fetchReviews = useCallback(async () => {
    try {
      setLoadingReviews(true);
      const response = await reviewsPublicAPI.get();
      
      // Response structure: { success: true, data: [...] }
      const reviewsData = response.data.data || [];
      
      console.log('Reviews fetched:', reviewsData);
      
      setReviews(reviewsData);
      
      // Hitung average rating dari data yang ada
      const totalRating = reviewsData.reduce((sum: number, r: any) => sum + (r.review?.rating || 0), 0);
      const avgRating = reviewsData.length > 0 ? totalRating / reviewsData.length : 0;
      setAverageRating(avgRating);
      setTotalReviews(reviewsData.length);
      
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoadingReviews(false);
    }
  }, []);
  
  // Fetch all data
  useEffect(() => {
    Promise.all([
      settingsAPI.getApp(),
      gamesAPI.getAll({ limit: 200, isActive: true }),
      gamesAPI.getFeaturedVouchers(),
      reviewsPublicAPI.get(),
    ]).then(([sRes, gRes, vRes, rRes]) => {
      setSettings(sRes.data.data);
      const allGames = gRes.data.data || [];
      setAllProducts(allGames);
      setFeatured(vRes.data.data ?? []);
      
      // Separate products by productType
      setGameProducts(getGameProducts(allGames));
      setPulsaProducts(getPulsaProducts(allGames));
      setPaketDataProducts(getPaketDataProducts(allGames));
      setPlnProducts(getPlnProducts(allGames));
      setEmoneyProducts(getEmoneyProducts(allGames));
      setStreamingProducts(getStreamingProducts(allGames));
      
      // Set reviews data - langsung dari response
      const reviewsData = rRes.data.data || [];
      setReviews(reviewsData);
      
      // Hitung average rating
      const totalRating = reviewsData.reduce((sum: number, r: any) => sum + (r.review?.rating || 0), 0);
      const avgRating = reviewsData.length > 0 ? totalRating / reviewsData.length : 0;
      setAverageRating(avgRating);
      setTotalReviews(reviewsData.length);
      
      setLoadingReviews(false);
    }).catch((err) => {
      console.error('Failed to load dashboard data:', err);
      setLoadingReviews(false);
    }).finally(() => setLoading(false));
  }, []);

  // Fetch user and delta coins after login
  useEffect(() => {
    fetchUser();
    fetchDeltaCoins();
  }, [fetchUser, fetchDeltaCoins]);

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
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[400px] h-[400px] blur-[120px] opacity-30" />
      <div className="absolute top-20 right-0 w-[400px] h-[400px] blur-[120px] opacity-20" />

      <div className="relative max-w-7xl mx-auto pt-6 md:pt-10 pb-10 space-y-14">

        {/* ============ DELTA COINS CARD ============ */}
        {user && (
          <motion.section
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="px-2 md:px-0"
          >
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 border border-amber-500/20">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-500/20 to-orange-600/20 rounded-full blur-3xl translate-x-32 -translate-y-32" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-yellow-500/20 to-amber-600/20 rounded-full blur-3xl -translate-x-32 translate-y-32" />
              
              <div className="relative p-5 md:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
                      <Wallet className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-white font-bold text-lg">Delta Coins</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          Eksklusif
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm mt-0.5">
                        Kumpulkan koin untuk berbagai keuntungan
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="text-right">
                      <div className="text-slate-400 text-xs font-medium">Saldo Anda</div>
                      <div className="flex items-center gap-1">
                        <span className="text-3xl md:text-4xl font-black text-amber-400">
                          {loadingCoins ? '...' : deltaCoins.toLocaleString()}
                        </span>
                        <span className="text-amber-500 text-sm font-bold">Δ</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => setTreasureModalOpen(true)}
                      className="group relative px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl" />
                      <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-orange-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute inset-0 rounded-xl ring-2 ring-amber-500/50 group-hover:ring-amber-400/70 transition-all" />
                      <span className="relative flex items-center gap-2 text-white z-10">
                        <Gift className="w-4 h-4" />
                        Buka Harta Karun
                      </span>
                    </button>
                  </div>
                </div>
                
                {/* Tips kecil */}
                <div className="mt-4 pt-3 border-t border-amber-500/10">
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Ticket className="w-3 h-3" />
                    💡 Gunakan kode rahasia untuk mendapatkan Delta Coins gratis!
                  </p>
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* 🎬 CAROUSEL */}
        {settings?.banners && (
          <section className="relative overflow-hidden">
            <div className=" inset-0 -z-10 blur-3xl" />
            <BannerCarousel
              banners={settings.banners}
              interval={5000}
              className="px-2 md:px-0"
            />
            <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none" />
          </section>
        )}
        
        {/* ── FEATURED VOUCHERS (Marquee) ── */}
        {featured.length > 0 && (
          <section>
            <MarqueeVoucherCards vouchers={featured} onSelect={handleVoucherSelect} />
          </section>
        )}
        
        {/* ── SEARCH BAR ── */}
        <div className="max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="relative">
            <div className="relative flex items-center rounded-2xl overflow-hidden bg-[#1a1a1a] border-2 border-[#ea5234]/30">
              <Search className="absolute left-4 w-5 h-5 text-slate-500" />
              <input
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Cari game, pulsa, paket data, token PLN, e-money, streaming..."
                className="flex-1 bg-transparent py-4 pl-12 pr-12 text-white text-sm outline-none"
                style={{ caretColor: '#ea5234' }}
              />
              {searchQuery && (
                <button onClick={clearSearch} className="absolute right-4">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              )}
            </div>
            {/* search dropdown */}
            {searchOpen && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                className="absolute top-full mt-2 left-0 right-0 rounded-2xl overflow-hidden z-50 shadow-2xl bg-[#1a1a1a] border border-[#ea5234]/20"
              >
                {searching ? (
                  <div className="p-8 text-center">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-slate-500" />
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">Tidak ditemukan</div>
                ) : (
                  <div>
                    {searchResults.map(game => (
                      <Link
                        key={game._id}
                        href={`/dashboard/games/${game.slug}`}
                        onClick={() => clearSearch()}
                        className="flex items-center gap-3 p-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                      >
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-[#ea5234]/20 to-[#ea5234]/5 flex items-center justify-center">
                          {game.image ? (
                            <img src={game.image} alt={game.name} className="w-full h-full object-cover" />
                          ) : (
                            <Gamepad className="w-5 h-5 text-[#ea5234]" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="text-white font-medium text-sm">{game.name}</div>
                          <div className="text-slate-500 text-xs">{game.category || 'Game'}</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-500" />
                      </Link>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* ── FEATURES GRID ── Dikomentari dulu biar lebih fokus ke produk */}

        {/* ── PULSA SECTION ── */}
        {pulsaProducts.length > 0 && (
          <ProductSection
            games={pulsaProducts}
            title="Pulsa Reguler & Paket Data"
            subtitle="Isi ulang pulsa semua operator"
            icon=""
            seeAllLink="/dashboard/topup?type=pulsa"
            variant="default"
          />
        )}

        {/* ── PAKET DATA SECTION ── */}
        {paketDataProducts.length > 0 && (
          <ProductSection
            games={paketDataProducts}
            title="Paket Data"
            subtitle="Kuota internet murah"
            icon=""
            seeAllLink="/dashboard/topup?type=paket_data"
            variant="default"
          />
        )}

        {/* ── GAME TOP UP SECTION ── */}
        {gameProducts.length > 0 && (
          <ProductSection
            games={gameProducts}
            title="Game Top Up"
            subtitle="Mobile Legends, Free Fire, PUBG & lainnya"
            icon=""
            seeAllLink="/dashboard/games"
            variant="featured"
          />
        )}

        {/* ── TOKEN PLN SECTION ── */}
        {plnProducts.length > 0 && (
          <ProductSection
            games={plnProducts}
            title="Token Listrik PLN"
            subtitle="Beli token listrik praktis"
            icon=""
            seeAllLink="/dashboard/topup?type=pln"
            variant="compact"
          />
        )}

        {/* ── E-MONEY SECTION ── */}
        {emoneyProducts.length > 0 && (
          <ProductSection
            games={emoneyProducts}
            title="E-Money & Dompet Digital"
            subtitle="GoPay, OVO, Dana, ShopeePay & lainnya"
            icon=""
            seeAllLink="/dashboard/topup?type=e-money"
            variant="compact"
          />
        )}

        {/* ── STREAMING SECTION ── */}
        {streamingProducts.length > 0 && (
          <ProductSection
            games={streamingProducts}
            title="Streaming & Hiburan"
            subtitle="Netflix, Spotify, YouTube Premium & lainnya"
            icon=""
            seeAllLink="/dashboard/topup?type=streaming"
            variant="compact"
          />
        )}

        {/* ── REVIEWS ── */}
        {reviews.length > 0 && (
          <ReviewsSection
            reviews={reviews}
            averageRating={averageRating}
            totalReviews={totalReviews}
            productId="all"
            canWriteReview={!!user}
            onReviewSubmitted={() => {
              fetchReviews();
            }}
          />
        )}

        {/* ── PROMO BANNER ── */}
        <PromoBanner />
        
      </div>
      
      <div>
        <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none" />
      </div>

      {/* ============ TREASURE REDEEM MODAL ============ */}
      <TreasureRedeemEnhanced
        visible={treasureModalOpen}
        onClose={() => setTreasureModalOpen(false)}
        onSuccess={handleTreasureSuccess}
      />
    </div>
  );
}