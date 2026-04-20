// app/dashboard/games/page.tsx
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { gamesAPI, settingsAPI } from '@/lib/api/client';
import { Game, Category, AppSetting } from '@/types';
import GameCard from '@/components/games/GameCard';
import BannerCarousel from '@/components/ui/BannerCarousel';
import { Search, Loader2, ChevronLeft, ChevronRight, SlidersHorizontal, Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils/format';
import { Button, Select, Space } from 'antd';

const LIMIT = 15;

// Product type options
const PRODUCT_TYPES = [
  { value: '', label: 'Semua Produk', icon: '📦' },
  { value: 'game', label: 'Game', icon: '🎮' },
  { value: 'pulsa', label: 'Pulsa', icon: '📱' },
  { value: 'paket_data', label: 'Paket Data', icon: '📶' },
  { value: 'pln', label: 'Token PLN', icon: '⚡' },
  { value: 'e_money', label: 'E-Money', icon: '💳' },
  { value: 'streaming', label: 'Streaming', icon: '🎬' },
  { value: 'voucher', label: 'Voucher', icon: '🎫' },
];

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<AppSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [productType, setProductType] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  
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

  // Fetch games function
  const fetchGames = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page, 
        limit: LIMIT,
        search: search || undefined,
      };
      
      // Add filters if selected
      if (category) params.category = category;
      if (productType) params.productType = productType;
      
      const res = await gamesAPI.getAll(params);
      setGames(res.data.data);
      setTotalPages(res.data.pagination.pages);
      setTotal(res.data.pagination.total);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally { 
      setLoading(false); 
    }
  }, [page, category, search, productType]);

  // Fetch when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchGames();
    }, search ? 400 : 0);
    
    return () => clearTimeout(timer);
  }, [fetchGames, search]);

  // Reset page when filters change
  useEffect(() => {
    if (!isInitialMount.current) {
      setPage(1);
    }
    isInitialMount.current = false;
  }, [category, search, productType]);

  const handleSearch = (v: string) => { 
    setSearch(v); 
  };
  
  const handleCategory = (v: string) => { 
    setCategory(v); 
  };
  
  const handleProductType = (v: string) => { 
    setProductType(v); 
    setCategory(''); // Reset category when product type changes
  };

  const handleReset = () => {
    setSearch('');
    setCategory('');
    setProductType('');
    setPage(1);
  };

  // Get product type icon
  const getProductTypeIcon = (type: string) => {
    const found = PRODUCT_TYPES.find(p => p.value === type);
    return found?.icon || '📦';
  };

  // Get product type label
  const getProductTypeLabel = (type: string) => {
    const found = PRODUCT_TYPES.find(p => p.value === type);
    return found?.label || 'Produk';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ea5234] to-[#c43a1f] flex items-center justify-center">
            <span className="text-xl">📦</span>
          </div>
          <h1 className="text-2xl font-black" style={{ color: '#ea5234' }}>Semua Produk</h1>
        </div>
        <p className="text-slate-400 mt-1 text-sm ml-14">{total} produk tersedia</p>
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
            placeholder="Cari game, pulsa, paket data, token PLN, e-money, streaming..." 
            className="w-full px-4 py-3 pl-11 rounded-xl bg-[#ea5234]/5 border border-[#ea5234]/20 text-white placeholder-slate-500 focus:outline-none focus:border-[#ea5234] transition-all"
          />
        </div>
        
        {/* Filter toggle button */}
        <Button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-300"
          style={{ 
            background: showFilters ? '#ea5234' : '#ea5234/10', 
            border: '1px solid rgba(234, 82, 52, 0.2)',
            color: showFilters ? 'white' : '#ea5234'
          }}
        >
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filter</span>
        </Button>
        
        {/* Reset button */}
        {(search || category || productType) && (
          <Button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-300"
            style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444' }}
          >
            <X className="w-4 h-4" />
            <span className="text-sm font-medium">Reset</span>
          </Button>
        )}
      </div>

      {/* ── Filter Panel ── */}
      {showFilters && (
        <div className="p-4 rounded-xl bg-[#ea5234]/5 border border-[#ea5234]/20 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold text-sm">Filter Produk</h3>
            <button onClick={() => setShowFilters(false)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Product Type Filter */}
            <div>
              <label className="block text-xs text-slate-400 mb-2 font-medium">Tipe Produk</label>
              <div className="flex flex-wrap gap-2">
                {PRODUCT_TYPES.map((type) => (
                  <Button
                    key={type.value}
                    onClick={() => handleProductType(type.value)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300",
                      productType === type.value
                        ? "text-white shadow-lg"
                        : "bg-[#ea5234]/10 border border-[#ea5234]/20 text-[#ea5234] hover:bg-[#ea5234]/20"
                    )}
                    style={productType === type.value ? { background: '#ea5234' } : {}}
                  >
                    <span>{type.icon}</span>
                    {type.label}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Category Filter - only show if productType is empty or game */}
            {(productType === '' || productType === 'game') && categories.length > 0 && (
              <div>
                <label className="block text-xs text-slate-400 mb-2 font-medium">Kategori Game</label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => handleCategory('')}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300",
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
                        "flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300",
                        category === cat.slug
                          ? "text-white shadow-lg"
                          : "bg-[#ea5234]/10 border border-[#ea5234]/20 text-[#ea5234] hover:bg-[#ea5234]/20"
                      )}
                      style={category === cat.slug ? { background: '#ea5234' } : {}}
                    >
                      <span>{cat.icon}</span>
                      {cat.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Active filters display */}
      {(category || productType) && (
        <div className="flex flex-wrap gap-2">
          {productType && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-[#ea5234]/20 border border-[#ea5234]/30 text-[#ea5234]">
              {getProductTypeIcon(productType)} {getProductTypeLabel(productType)}
              <button onClick={() => setProductType('')} className="hover:text-white">×</button>
            </span>
          )}
          {category && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-[#ea5234]/20 border border-[#ea5234]/30 text-[#ea5234]">
              📁 {categories.find(c => c.slug === category)?.name || category}
              <button onClick={() => setCategory('')} className="hover:text-white">×</button>
            </span>
          )}
        </div>
      )}

      {/* ── Products Grid ── */}
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
          {games.map(game => {
            // Tentukan variant berdasarkan productType
            let variant: 'default' | 'compact' | 'featured' = 'default';
            if (game.productType === 'game') variant = 'featured';
            if (['e_money', 'streaming', 'pln'].includes(game.productType || '')) variant = 'compact';
            
            return <GameCard key={game._id} game={game} variant={variant} />;
          })}
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