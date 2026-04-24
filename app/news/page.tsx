// app/news/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { newsAPI } from '@/lib/api/client';
import AntProvider from '@/components/providers/AntProvider';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { Loader2, Search, Clock, Eye, Newspaper  } from 'lucide-react';

interface NewsItem { 
  _id: string; 
  title: string; 
  slug: string; 
  excerpt: string; 
  coverImage: string; 
  category: string; 
  isPinned: boolean; 
  viewCount: number; 
  publishedAt: string; 
  author?: { name: string } 
}

// 🔥 TEMA SAMA DENGAN TRANSACTIONS PAGE - Coral Red + Amber
const THEME = {
  primary: '#ea5234',      // Coral Red
  primaryDark: '#c23d22',  // Darker Coral
  secondary: '#f59e0b',    // Amber
  gradient: 'linear-gradient(135deg, #ea5234, #f59e0b)',
  gradientReverse: 'linear-gradient(135deg, #f59e0b, #ea5234)',
  bgLight: 'rgba(234, 82, 52, 0.08)',
  bgMedium: 'rgba(234, 82, 52, 0.12)',
  border: 'rgba(234, 82, 52, 0.2)',
  shadow: 'rgba(234, 82, 52, 0.25)',
};

const CAT = { 
  promo: ' Promo', 
  update: ' Update', 
  tips: ' Tips', 
  event: ' Event', 
  general: ' Umum' 
};

const CAT_COLORS: Record<string, string> = { 
  promo: '#f97316',      // orange
  update: '#3b82f6',     // blue  
  tips: '#10b981',       // emerald
  event: '#ec4899',      // pink
  general: THEME.primary 
};

function NewsPageInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(Number(sp.get('page') || 1));
  const [cat, setCat] = useState(sp.get('category') || '');
  const [search, setSearch] = useState(sp.get('search') || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    newsAPI.getAll({ page, limit: 9, ...(cat && { category: cat }), ...(search && { search }) })
      .then(r => { setNews(r.data.data ?? []); setTotal(r.data.pagination?.total ?? 0); })
      .finally(() => setLoading(false));
  }, [page, cat, search]);

  return (
    <AntProvider>
      <div className="min-h-screen bg-gradient-to-b from-black to-gray-900">
        <Header />
        <main className="max-w-5xl mx-auto px-4 py-10 space-y-8">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-[#fffefe]  bg-clip-text text-transparent">
             <Newspaper className="w-8 h-8 inline-block mr-2" />  Berita & Update
            </h1>
            <p className="text-slate-400 mt-2">
              Tips, promo, dan update terbaru dari Domesh Store
            </p>
          </motion.div>

          {/* Search + category */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-52">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                value={search} 
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Cari artikel..." 
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-[#ea5234] transition"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {[{ k: '', l: 'Semua' }, ...Object.entries(CAT).map(([k, l]) => ({ k, l }))].map(({ k, l }) => (
                <button 
                  key={k} 
                  onClick={() => { setCat(k); setPage(1); }}
                  className="px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105"
                  style={cat === k 
                    ? { background: THEME.gradient, color: 'white', boxShadow: `0 4px 12px ${THEME.shadow}` }
                    : { background: THEME.bgLight, border: `1px solid ${THEME.border}`, color: 'rgba(255,255,255,0.7)' }}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: THEME.primary }} />
            </div>
          ) : news.length === 0 ? (
            <div className="text-center py-16 rounded-2xl" style={{ background: THEME.bgLight, border: `1px solid ${THEME.border}` }}>
              <div className="text-5xl mb-4">📭</div>
              <p className="text-slate-400">Belum ada artikel{search ? ` untuk "${search}"` : ''}.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {news.map((n, i) => (
                <motion.div 
                  key={n._id} 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -8 }}
                >
                  <Link href={`/news/${n.slug}`}>
                    <div className="group rounded-2xl overflow-hidden cursor-pointer h-full flex flex-col transition-all duration-300 hover:shadow-2xl"
                      style={{ background: THEME.bgLight, border: `1px solid ${THEME.border}` }}>
                      <div className="relative h-44 overflow-hidden">
                        {n.coverImage
                          ? <img src={n.coverImage} alt={n.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          : <div className="w-full h-full flex items-center justify-center text-4xl bg-black/30">{(CAT as Record<string, string>)[n.category]?.[0] ?? '📰'}</div>}
                        <div className="absolute top-3 left-3">
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-sm"
                            style={{ background: `${CAT_COLORS[n.category]}20`, border: `1px solid ${CAT_COLORS[n.category]}40`, color: CAT_COLORS[n.category] }}>
                            {(CAT as Record<string, string>)[n.category] ?? n.category}
                          </span>
                        </div>
                        {n.isPinned && <div className="absolute top-3 right-3 text-base drop-shadow-lg">📌</div>}
                      </div>
                      <div className="p-5 flex flex-col flex-1">
                        <h2 className="text-white font-bold text-lg line-clamp-2 mb-2">{n.title}</h2>
                        <p className="text-slate-400 text-sm line-clamp-2 flex-1">
                          {n.excerpt || 'Klik untuk baca selengkapnya...'}
                        </p>
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Clock className="w-3 h-3" />
                            {n.publishedAt ? new Date(n.publishedAt).toLocaleDateString('id-ID') : '—'}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Eye className="w-3 h-3" /> {n.viewCount.toLocaleString('id-ID')}
                          </div>
                        </div>
                      </div>
                      {/* Bottom gradient bar on hover */}
                      <div className="h-0.5 bg-gradient-to-r from-[#ea5234] to-[#f59e0b] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {Math.ceil(total / 9) > 1 && (
            <div className="flex gap-2 justify-center pt-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105"
                style={{ background: THEME.bgLight, border: `1px solid ${THEME.border}`, color: 'white' }}
              >
                ← Prev
              </button>
              
              {Array.from({ length: Math.ceil(total / 9) }, (_, i) => i + 1).map(p => (
                <button 
                  key={p} 
                  onClick={() => setPage(p)}
                  className="w-10 h-10 rounded-xl font-bold text-sm transition-all hover:scale-105"
                  style={page === p
                    ? { background: THEME.gradient, color: 'white', boxShadow: `0 4px 12px ${THEME.shadow}` }
                    : { background: THEME.bgLight, border: `1px solid ${THEME.border}`, color: 'rgba(255,255,255,0.7)' }}
                >
                  {p}
                </button>
              ))}
              
              <button
                onClick={() => setPage(p => Math.min(Math.ceil(total / 9), p + 1))}
                disabled={page === Math.ceil(total / 9)}
                className="px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105"
                style={{ background: THEME.bgLight, border: `1px solid ${THEME.border}`, color: 'white' }}
              >
                Next →
              </button>
            </div>
          )}
        </main>
        <Footer />
      </div>
    </AntProvider>
  );
}

export default function NewsPage() {
  return <Suspense fallback={<div className="min-h-screen bg-black" />}><NewsPageInner /></Suspense>;
}