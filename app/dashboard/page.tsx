// app/dashboard/page.tsx
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { gamesAPI, settingsAPI, promoAPI, authAPI,  reviewsPublicAPI } from '@/lib/api/client';
import { Game, AppSetting, Category, Voucher } from '@/types';
import BannerCarousel from '@/components/ui/Banner3';
import { useCheckoutStore } from '@/lib/store/useCheckoutStore';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils/format';
import { 
  Loader2, ArrowRight, Search, X, Zap, Shield, Clock, Gift, 
  Flame, Star, Crown, Tv, Gamepad,
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
 // app/dashboard/page.tsx - bagian fetchReviews


// Fetch user data - PERBAIKAN menggunakan authAPI
useEffect(() => {
  const fetchUser = async () => {
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
  };
  
  fetchUser();
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
    <div className="min-h-screen relative bg-gradient-to-b from-[rgb(10,10,10)] to-[#0d0d0d] overflow-hidden">
     <div className="absolute top-0 left-0 w-[400px] h-[400px] blur-[120px] opacity-30" />
      <div className="absolute top-20 right-0 w-[400px] h-[400px] blur-[120px] opacity-20" />

      <div className="relative max-w-7xl mx-auto pt-6 md:pt-10 pb-10 space-y-14">


      {/* 🎬 CAROUSEL */}
        {settings?.banners && (
          <section className="relative overflow-hidden">

            {/* glow behind carousel */}
            <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#ea5234]/10 to-transparent blur-3xl opacity-40" />

            <BannerCarousel
              banners={settings.banners}
              interval={5000}
              className="px-2 md:px-0"
            />

            {/* bottom fade */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none" />
          </section>
        )}
        
        {/* ── SEARCH BAR ── */}
        <div className="max-w-2xl mx-auto">
          {/* search input component tetap sama */}
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
            {/* search dropdown - tetap sama */}
            {searchOpen && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                className="absolute top-full mt-2 left-0 right-0 rounded-2xl overflow-hidden z-50 shadow-2xl bg-[#1a1a1a] border border-[#ea5234]/20"
              >
                {/* search results - tetap sama */}
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* ── FEATURES GRID ── */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="bg-[#ea5234]/10 border border-[#ea5234]/20 p-5 rounded-2xl text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: `${color}20`, border: `1px solid ${color}30` }}>
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
          <section>
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1.5 rounded-full bg-gradient-to-b from-[#ea5234] to-[#ea5234]/50" />
                <span className="text-2xl">🔥</span>
                <div>
                  <h2 className="text-white font-black text-xl">Voucher Terlaris</h2>
                  <p className="text-slate-500 text-xs mt-1">Pilihan paling populer</p>
                </div>
              </div>
              <Link href="/dashboard/games" className="flex items-center gap-1 text-sm font-bold text-[#f8d9b9] transition-all hover:gap-2">
                Lihat semua <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <MarqueeVoucherCards vouchers={featured} onSelect={handleVoucherSelect} />
          </section>
        )}

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
    </div>
  );
}