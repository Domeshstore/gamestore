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
import { Loader2, ArrowLeft, Clock, Eye, Share2, Calendar, Tag, Heart, BookOpen, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

// TEMA - #f8d9b9 (Beige/Krem) + #ea5234 (Coral Red)
const THEME = {
  primary: '#ea5234',
  primaryDark: '#c13e22',
  secondary: '#f8d9b9',
  gradient: 'linear-gradient(135deg, #ea5234, #f8d9b9)',
  gradientReverse: 'linear-gradient(135deg, #f8d9b9, #ea5234)',
  bgLight: 'rgba(234, 82, 52, 0.08)',
  bgMedium: 'rgba(234, 82, 52, 0.12)',
  bgGlass: 'rgba(42, 42, 42, 0.8)',
  border: 'rgba(234, 82, 52, 0.25)',
  shadow: 'rgba(234, 82, 52, 0.3)',
};

const CAT_COLORS: Record<string, string> = { 
  promo: '#ea5234',
  update: '#3b82f6',
  tips: '#10b981',
  event: '#ec4899',
  general: '#f8d9b9'
};

const CAT_LABELS: Record<string, string> = { 
  promo: 'Promo Spesial',
  update: 'Update Terbaru',
  tips: 'Tips & Trik',
  event: 'Event & Giveaway',
  general: 'Informasi'
};

interface NewsAuthor {
  name: string;
  email?: string;
}

interface NewsItem {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  tags: string[];
  isPublished: boolean;
  isPinned: boolean;
  viewCount: number;
  publishedAt: string;
  createdAt: string;
  author?: NewsAuthor;
}

export default function NewsDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [news, setNews] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedNews, setRelatedNews] = useState<NewsItem[]>([]);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await newsAPI.getBySlug(slug);
        const data = res.data.data as NewsItem;
        setNews(data);
        
        if (data?.category) {
          const related = await newsAPI.getAll({ 
            category: String(data.category), 
            limit: 3,
            exclude: data._id
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

  const handleLike = () => {
    setLiked(!liked);
    toast.success(liked ? 'Batal suka' : 'Terima kasih! 👍');
  };

  const share = () => {
    if (navigator.share) {
      navigator.share({ 
        title: news?.title || '', 
        url: window.location.href 
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link artikel disalin!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d]">
        <Header />
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4" style={{ color: THEME.primary }} />
            <p style={{ color: '#b4b4b4' }}>Memuat artikel...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!news) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d]">
        <Header />
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="text-8xl mb-6">📭</div>
          <p className="text-2xl font-bold" style={{ color: '#f8d9b9' }}>Artikel Tidak Ditemukan</p>
          <p className="text-[#b4b4b4] mt-2 mb-8">Maaf, artikel yang Anda cari tidak tersedia</p>
          <Link href="/news" 
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all hover:scale-105"
            style={{ background: THEME.gradient, color: 'white', boxShadow: `0 4px 15px ${THEME.shadow}` }}>
            <ArrowLeft className="w-4 h-4" /> Kembali ke Berita
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const cat = news.category || 'general';
  const tags = news.tags || [];

  return (
    <AntProvider>
      <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d]">
        <Header />
        
        {/* Hero Section dengan Cover Image */}
        <div className="relative overflow-hidden">
          {/* Background gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#1a1a1a] z-10" />
          
          {news.coverImage && (
            <motion.div
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.6 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0"
            >
              <img 
                src={news.coverImage} 
                alt={news.title}
                className="w-full h-[50vh] object-cover"
              />
            </motion.div>
          )}
          
          <div className="relative z-20 max-w-4xl mx-auto px-4 py-16 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Category Badge */}
              <span 
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold mb-5 backdrop-blur-sm"
                style={{
                  background: `${CAT_COLORS[cat]}20`,
                  border: `1px solid ${CAT_COLORS[cat]}50`,
                  color: CAT_COLORS[cat]
                }}
              >
                {CAT_LABELS[cat] ?? cat}
              </span>
              
              {/* Title */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-4"
                style={{ color: '#f8d9b9' }}>
                {news.title}
              </h1>
              
              {/* Meta Info - Updated */}
              <div className="flex flex-wrap items-center justify-center gap-5 text-sm text-[#b4b4b4] mt-6">
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" style={{ color: THEME.primary }} />
                  {news.publishedAt 
                    ? new Date(news.publishedAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })
                    : '—'}
                </span>
                <span className="flex items-center gap-2">
                  <Eye className="w-4 h-4" style={{ color: THEME.primary }} />
                  {news.viewCount.toLocaleString('id-ID')} views
                </span>
                {news.author && (
                  <span className="flex items-center gap-2">
                    📝 oleh <span style={{ color: '#f8d9b9' }}>{news.author.name}</span>
                  </span>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        <main className="max-w-3xl mx-auto px-4 py-10">
          {/* Tags Section */}
          {tags.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-wrap items-center gap-2 mb-8 pb-4 border-b border-[#ea5234]/15"
            >
              <span className="text-sm font-medium text-[#b4b4b4] mr-2">🏷️ Tags:</span>
              {tags.map((tag: string) => (
                <span 
                  key={tag} 
                  className="px-3 py-1 rounded-full text-xs font-medium transition-all hover:scale-105"
                  style={{ background: THEME.bgLight, border: `1px solid ${THEME.border}`, color: '#f8d9b9' }}
                >
                  #{tag}
                </span>
              ))}
              {news.isPinned && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold ml-auto"
                  style={{ background: 'rgba(245, 158, 11, 0.2)', border: '1px solid rgba(245, 158, 11, 0.4)', color: '#fbbf24' }}>
                  📌 Artikel Pinned
                </span>
              )}
            </motion.div>
          )}

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="prose prose-invert max-w-none"
            style={{
              color: '#d4d4d4',
              lineHeight: 1.9,
              fontSize: 17
            }}
          >
            <div 
              className="news-content"
              dangerouslySetInnerHTML={{ 
                __html: news.content.replace(/\n/g, '<br/>') 
              }}
            />
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-4 mt-10 pt-6 border-t border-[#ea5234]/15"
          >
            <button 
              onClick={handleLike}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all hover:scale-105"
              style={{
                background: liked ? 'rgba(234, 82, 52, 0.2)' : THEME.bgLight,
                border: `1px solid ${liked ? THEME.primary : THEME.border}`,
                color: liked ? THEME.primary : '#b4b4b4'
              }}
            >
              <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
              {liked ? 'Suka' : 'Suka Artikel'}
            </button>
            <button 
              onClick={share}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all hover:scale-105"
              style={{
                background: THEME.bgLight,
                border: `1px solid ${THEME.border}`,
                color: '#f8d9b9'
              }}
            >
              <Share2 className="w-4 h-4" /> Bagikan
            </button>
          </motion.div>

          {/* CTA Section - Enhanced */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-12 p-8 rounded-2xl text-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(234, 82, 52, 0.15), rgba(248, 217, 185, 0.05))',
              border: `1px solid ${THEME.border}`
            }}
          >
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 text-8xl opacity-5 pointer-events-none">🎮</div>
            <div className="absolute bottom-0 left-0 text-8xl opacity-5 pointer-events-none">⚡</div>
            
            <p className="text-2xl font-black mb-3" style={{ color: '#f8d9b9' }}>✨ Siap Top Up dengan Harga Terbaik?</p>
            <p className="text-[#b4b4b4] text-sm mb-6">Ribuan voucher game, pulsa, e-money, dan paket data tersedia</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link 
                href="/dashboard/games" 
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105 hover:shadow-lg"
                style={{
                  background: THEME.gradient,
                  color: 'white',
                  boxShadow: `0 4px 15px ${THEME.shadow}`
                }}
              >
                Top Up Sekarang <ChevronRight className="w-4 h-4" />
              </Link>
              <Link 
                href="/dashboard/topup" 
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105"
                style={{
                  background: THEME.bgLight,
                  border: `1px solid ${THEME.border}`,
                  color: '#f8d9b9'
                }}
              >
                Beli Pulsa & Data
              </Link>
            </div>
          </motion.div>

          {/* Related Articles - Enhanced */}
          {relatedNews.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-12"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: '#f8d9b9' }}>
                  <BookOpen className="w-5 h-5" style={{ color: THEME.primary }} />
                  Artikel Terkait
                </h3>
                <Link href="/news" className="text-sm flex items-center gap-1 transition-all hover:gap-2"
                  style={{ color: THEME.primary }}>
                  Lihat semua <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {relatedNews.map((item: NewsItem, idx: number) => (
                  <Link key={idx} href={`/news/${item.slug}`}>
                    <motion.div 
                      whileHover={{ y: -5, scale: 1.02 }}
                      className="group overflow-hidden rounded-xl transition-all duration-300"
                      style={{
                        background: THEME.bgGlass,
                        border: `1px solid ${THEME.border}`,
                        backdropFilter: 'blur(10px)'
                      }}
                    >
                      {item.coverImage && (
                        <div className="relative h-32 overflow-hidden">
                          <img 
                            src={item.coverImage} 
                            alt={item.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        </div>
                      )}
                      <div className="p-3">
                        <p className="text-white font-semibold text-sm line-clamp-2 group-hover:color-[#f8d9b9] transition-colors">
                          {item.title}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-[10px] text-[#b4b4b4]">
                          <Calendar className="w-3 h-3" />
                          {new Date(item.publishedAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                          <span className="flex items-center gap-1 ml-auto">
                            <Eye className="w-3 h-3" /> {item.viewCount}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </main>
        
        <Footer />
      </div>
      
      {/* Custom styles for news content */}
      <style jsx global>{`
        .news-content {
          color: #d4d4d4;
        }
        .news-content h1, .news-content h2, .news-content h3 {
          color: #f8d9b9;
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          font-weight: 700;
        }
        .news-content h1 { font-size: 1.8rem; }
        .news-content h2 { font-size: 1.5rem; }
        .news-content h3 { font-size: 1.3rem; }
        .news-content p {
          margin-bottom: 1.2em;
          line-height: 1.9;
        }
        .news-content a {
          color: #ea5234;
          text-decoration: none;
          border-bottom: 1px solid rgba(234, 82, 52, 0.3);
          transition: all 0.2s;
        }
        .news-content a:hover {
          color: #f8d9b9;
          border-bottom-color: #f8d9b9;
        }
        .news-content ul, .news-content ol {
          margin: 1em 0;
          padding-left: 1.5em;
        }
        .news-content li {
          margin: 0.5em 0;
        }
        .news-content blockquote {
          border-left: 3px solid #ea5234;
          padding-left: 1.5em;
          margin: 1.5em 0;
          font-style: italic;
          color: #b4b4b4;
        }
        .news-content img {
          border-radius: 12px;
          margin: 1.5em 0;
          max-width: 100%;
          height: auto;
        }
        .news-content code {
          background: rgba(234, 82, 52, 0.1);
          padding: 0.2em 0.4em;
          border-radius: 6px;
          font-size: 0.9em;
          color: #ea5234;
        }
      `}</style>
    </AntProvider>
  );
}