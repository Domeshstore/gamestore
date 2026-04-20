//dashboard/games/page.tsx - Halaman utama untuk menampilkan daftar game dengan fitur pencarian, filter, dan pagination
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { gamesAPI, settingsAPI } from '@/lib/api/client';
import { Game, Category, AppSetting } from '@/types';
import GameCard from '@/components/games/GameCard';
import BannerCarousel from '@/components/ui/BannerCarousel';
import { Search, Loader2, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils/format';
import { Button } from 'antd';

const LIMIT = 15;

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<AppSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Ref to track initial load
  const isInitialMount = useRef(true);

  // Load settings & categories once
  useEffect(() => {
    Promise.all([settingsAPI.getApp(), settingsAPI.getCategories()])
      .then(([sRes, cRes]) => {
        setSettings(sRes.data.data);
        setCategories(cRes.data.data);
      })
      .catch(err => console.error('Failed to load settings/categories:', err));
  }, []);

  // Fetch games function - will be called directly
  const fetchGames = useCallback(async () => {
    setLoading(true);
    try {
      const res = await gamesAPI.getAll({
        page, 
        limit: LIMIT,
        category: category || undefined,
        search: search || undefined,
      });
      setGames(res.data.data);
      setTotalPages(res.data.pagination.pages);
      setTotal(res.data.pagination.total);
    } catch (err) {
      console.error('Failed to fetch games:', err);
    } finally { 
      setLoading(false); 
    }
  }, [page, category, search]);

  // Fetch when page, category, or search changes
  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      fetchGames();
    }, search ? 400 : 0);
    
    return () => clearTimeout(timer);
  }, [fetchGames, search]);

  // Reset page when category or search changes
  useEffect(() => {
    if (!isInitialMount.current) {
      setPage(1);
    }
    isInitialMount.current = false;
  }, [category, search]);

  const handleSearch = (v: string) => { 
    setSearch(v); 
  };
  
  const handleCategory = (v: string) => { 
    setCategory(v); 
  };

  // Manual refresh handler
  const handleReset = () => {
    setSearch('');
    setCategory('');
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black" style={{ color: '#ea5234' }}>🎮 Games & Layanan Digital</h1>
        <p className="text-slate-400 mt-1 text-sm">{total} produk tersedia</p>
      </div>

      {/* ── Banner Carousel ── */}
      {settings?.banners && settings.banners.length > 0 && (
        <BannerCarousel banners={settings.banners} interval={5000} />
      )}

      {/* ── Search + Filter ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#ea5234' }} />
          <input 
            value={search} 
            onChange={e => handleSearch(e.target.value)}
            placeholder="Cari game atau layanan..." 
            className="w-full px-4 py-3 pl-11 rounded-xl bg-[#ea5234]/5 border border-[#ea5234]/20 text-white placeholder-slate-500 focus:outline-none focus:border-[#ea5234] transition-all"
          />
        </div>
        {/* Filter icon */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#ea5234]/10 border border-[#ea5234]/20">
          <SlidersHorizontal className="w-4 h-4" style={{ color: '#ea5234' }} />
          <span className="text-slate-400 text-sm">Filter:</span>
        </div>
      </div>

      {/* ── Category Pills ── */}
      <div className="flex gap-2 flex-wrap">
        <Button
          onClick={() => handleCategory('')}
          className={cn(
            "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-300",
            category === '' 
              ? "text-white shadow-lg" 
              : "bg-[#ea5234]/10 border border-[#ea5234]/20 text-[#ea5234] hover:bg-[#ea5234]/20"
          )}
          style={category === '' ? { background: '#ea5234' } : {}}
        >
          Semua
        </Button>
        {categories.map(cat => (
          <Button 
            key={cat._id} 
            onClick={() => handleCategory(cat.slug)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-300",
              category === cat.slug 
                ? "text-white shadow-lg" 
                : "bg-[#ea5234]/10 border border-[#ea5234]/20 text-[#ea5234] hover:bg-[#ea5234]/20"
            )}
            style={category === cat.slug ? { 
              background: '#ea5234',
              boxShadow: `0 4px 12px rgba(234, 82, 52, 0.35)`
            } : {}}
          >
            <span>{cat.icon}</span>
            {cat.name}
          </Button>
        ))}
      </div>

      {/* ── Games Grid ── */}
      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#ea5234' }} />
        </div>
      ) : games.length === 0 ? (
        <div className="text-center py-20 rounded-2xl bg-[#ea5234]/10 border border-[#ea5234]/20 backdrop-blur-sm">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-white font-bold">Tidak ada hasil</p>
          <p className="text-slate-400 text-sm mt-1">Coba kata kunci lain atau reset filter</p>
          <Button 
            onClick={handleReset}
            className="mt-4 text-sm py-2 px-5 rounded-xl font-semibold transition-all duration-300 hover:scale-105"
            style={{ background: '#ea5234', color: 'white' }}
          >
            Reset Filter
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {games.map(game => <GameCard key={game._id} game={game} />)}
        </div>
      )}

      {/* ── Pagination ── */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button 
            onClick={() => setPage(p => p - 1)} 
            disabled={page === 1}
            className="w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-300 disabled:opacity-30 hover:scale-105"
            style={{ background: '#ea5234/10', border: '1px solid rgba(234, 82, 52, 0.2)', color: '#ea5234' }}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let p = page - 2 + i;
            if (totalPages <= 5) p = i + 1;
            else if (page <= 3) p = i + 1;
            else if (page >= totalPages - 2) p = totalPages - 4 + i;
            else p = page - 2 + i;
            
            if (p < 1 || p > totalPages) return null;
            
            return (
              <Button 
                key={p} 
                onClick={() => setPage(p)}
                className={cn(
                  "w-9 h-9 text-sm rounded-xl font-bold transition-all duration-300 hover:scale-105",
                  page === p
                    ? "text-white shadow-lg"
                    : "bg-[#ea5234]/10 border border-[#ea5234]/20 text-[#ea5234] hover:bg-[#ea5234]/20"
                )}
                style={page === p ? { background: '#ea5234' } : {}}
              >
                {p}
              </Button>
            );
          })}

          <Button 
            onClick={() => setPage(p => p + 1)} 
            disabled={page === totalPages}
            className="w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-300 disabled:opacity-30 hover:scale-105"
            style={{ background: '#ea5234/10', border: '1px solid rgba(234, 82, 52, 0.2)', color: '#ea5234' }}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}