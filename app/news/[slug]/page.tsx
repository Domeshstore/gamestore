'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import React from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { newsAPI } from '@/lib/api/client';
import AntProvider from '@/components/providers/AntProvider';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Loader2, ArrowLeft, Clock, Eye, Share2, Calendar, Tag } from 'lucide-react';
import toast from 'react-hot-toast';

// 🔥 TEMA SAMA DENGAN TRANSACTIONS PAGE - Coral Red + Amber
const THEME = {
  primary: '#ea5234',
  primaryDark: '#c23d22',
  secondary: '#f59e0b',
  gradient: 'linear-gradient(135deg, #ea5234, #f59e0b)',
  gradientReverse: 'linear-gradient(135deg, #f59e0b, #ea5234)',
  bgLight: 'rgba(234, 82, 52, 0.08)',
  bgMedium: 'rgba(234, 82, 52, 0.12)',
  border: 'rgba(234, 82, 52, 0.2)',
  shadow: 'rgba(234, 82, 52, 0.25)',
};

const CAT_COLORS: Record<string, string> = { 
  promo: '#f97316',      // orange
  update: '#3b82f6',     // blue  
  tips: '#10b981',       // emerald
  event: '#ec4899',      // pink
  general: THEME.primary 
};

const CAT_LABELS: Record<string, string> = { 
  promo: ' Promo', 
  update: ' Update', 
  tips: ' Tips', 
  event: ' Event', 
  general: ' Umum' 
};

export default function NewsDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [news, setNews] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedNews, setRelatedNews] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await newsAPI.getBySlug(slug);
        const data = res.data.data;
        setNews(data);
        
        // Fetch related news (same category)
        if (data?.category) {
          const related = await newsAPI.getAll({ 
            category: String(data.category), 
            limit: 3,
            exclude: data._id as string
          });
          setRelatedNews(related.data.data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, [slug]);

  const share = () => {
    if (navigator.share) {
      navigator.share({ 
        title: String(news?.title), 
        url: window.location.href 
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link disalin!');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-black to-gray-900">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: THEME.primary }} />
      </div>
    );
  }

  if (!news) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 flex flex-col items-center justify-center">
        <div className="text-6xl mb-4">📭</div>
        <p className="text-slate-400">Artikel tidak ditemukan</p>
        <Link href="/news" className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all hover:scale-105" 
          style={{ background: THEME.gradient, color: 'white', boxShadow: `0 4px 12px ${THEME.shadow}` }}>
          <ArrowLeft className="w-4 h-4" /> Kembali ke News
        </Link>
      </div>
    );
  }

  const cat = String(news.category || 'general');
  const tags = (news.tags as string[]) || [];

  return (
    <AntProvider>
      <div className="min-h-screen bg-gradient-to-b from-black to-gray-900">
        <Header />
        <main className="max-w-3xl mx-auto px-4 py-8">
          {/* Back Button */}
          <Link 
            href="/news" 
            className="inline-flex items-center gap-2 mb-8 text-sm font-semibold text-slate-400 hover:text-white transition-all hover:gap-3"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Berita
          </Link>

          {/* Cover Image with Animation */}
          {news.coverImage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <img 
                src={String(news.coverImage)} 
                alt={String(news.title)}
                className="w-full h-64 sm:h-80 object-cover rounded-2xl shadow-2xl"
                style={{ border: `1px solid ${THEME.border}` }}
              />
            </motion.div>
          )}

          {/* Meta Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-4 mb-6"
          >
            {/* Category & Tags */}
            <div className="flex items-center gap-3 flex-wrap">
              <span 
                className="px-3 py-1 rounded-full text-sm font-bold backdrop-blur-sm"
                style={{
                  background: `${CAT_COLORS[cat]}20`,
                  border: `1px solid ${CAT_COLORS[cat]}40`,
                  color: CAT_COLORS[cat]
                }}
              >
                {CAT_LABELS[cat] ?? cat}
              </span>
              {tags.map((tag: string) => (
                <span 
                  key={tag} 
                  className="px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1"
                  style={{ background: THEME.bgLight, border: `1px solid ${THEME.border}`, color: 'rgba(255,255,255,0.7)' }}
                >
                  <Tag className="w-3 h-3" /> #{tag}
                </span>
              ))}
              {news.isPinned && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  📌 Artikel Pinned
                </span>
              )}
            </div>

            {/* Title - Gradient Coral to Amber */}
            <h1 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-[#ea5234] to-[#f59e0b] bg-clip-text text-transparent mb-4">
              {String(news.title)}
            </h1>

            {/* Date, Views, Author */}
            <div className="flex items-center justify-between flex-wrap gap-4 py-4 border-t border-b border-white/10">
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {news.publishedAt 
                    ? new Date(String(news.publishedAt)).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })
                    : '—'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" /> 
                  {Number(news.viewCount).toLocaleString('id-ID')} views
                </span>
                {news.author && (
                  <span className="flex items-center gap-1.5">
                    oleh {(news.author as Record<string, unknown>).name as string}
                  </span>
                )}
              </div>
              
              {/* Share Button */}
              <button 
                onClick={share} 
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105"
                style={{
                  background: THEME.bgLight,
                  border: `1px solid ${THEME.border}`,
                  color: 'white'
                }}
              >
                <Share2 className="w-4 h-4" /> Share
              </button>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="prose prose-invert max-w-none mt-8"
            style={{
              color: 'rgba(255,255,255,0.85)',
              lineHeight: 1.9,
              fontSize: 16
            }}
            dangerouslySetInnerHTML={{ 
              __html: String(news.content).replace(/\n/g, '<br/>') 
            }}
          />

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-12 p-8 rounded-2xl text-center"
            style={{
              background: THEME.bgLight,
              border: `1px solid ${THEME.border}`
            }}
          >
            <p className="text-white font-bold text-lg mb-3">Siap top up dengan harga terbaik?</p>
            <p className="text-slate-400 text-sm mb-5">Ribuan voucher game, pulsa, dan e-money tersedia</p>
            <Link 
              href="/dashboard" 
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105 hover:shadow-lg"
              style={{
                background: THEME.gradient,
                color: 'white',
                boxShadow: `0 4px 15px ${THEME.shadow}`
              }}
            >
              ⚡ Top Up Sekarang
            </Link>
          </motion.div>

          {/* Related Articles */}
          {relatedNews.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-12"
            >
              <h3 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
                📖 Artikel Terkait
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {relatedNews.map((item: Record<string, unknown>, idx: number) => (
                  <Link key={idx} href={`/news/${item.slug}`}>
                    <div 
                      className="p-3 rounded-xl transition-all hover:-translate-y-1 hover:shadow-xl"
                      style={{
                        background: THEME.bgLight,
                        border: `1px solid ${THEME.border}`
                      }}
                    >
                      {item.coverImage && (
                        <img 
                          src={String(item.coverImage)} 
                          alt={String(item.title)}
                          className="w-full h-28 object-cover rounded-lg mb-2"
                        />
                      )}
                      <p className="text-white font-semibold text-sm line-clamp-2">
                        {String(item.title)}
                      </p>
                      <p className="text-xs mt-1 text-slate-500">
                        {new Date(String(item.publishedAt)).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </main>
        <Footer />
      </div>
    </AntProvider>
  );
}