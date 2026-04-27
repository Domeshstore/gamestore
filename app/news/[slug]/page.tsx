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
import { Loader2, ArrowLeft, Calendar, Eye, Share2, Heart, BookOpen, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

// TEMA
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

  // Format konten agar aman untuk HTML
  const formatContent = (content: string) => {
    if (!content) return '';
    // Konversi markdown list ke HTML jika perlu
    let formatted = content
      .replace(/\n/g, '<br/>')
      .replace(/^-\s/gm, '• ')
      .replace(/^✅\s/gm, '✅ ');
    return formatted;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d]">
        <Header />
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin mx-auto mb-4" style={{ color: THEME.primary }} />
            <p className="text-sm sm:text-base" style={{ color: '#b4b4b4' }}>Memuat artikel...</p>
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
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <div className="text-6xl sm:text-8xl mb-6">📭</div>
          <p className="text-xl sm:text-2xl font-bold text-center" style={{ color: '#f8d9b9' }}>Artikel Tidak Ditemukan</p>
          <p className="text-sm sm:text-base text-[#b4b4b4] mt-2 mb-8 text-center">Maaf, artikel yang Anda cari tidak tersedia</p>
          <Link href="/news" 
            className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl font-bold text-sm sm:text-base transition-all hover:scale-105"
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
        
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#1a1a1a] z-10" />
          
          {news.coverImage && (
            <motion.div
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.5 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0"
            >
              <img 
                src={news.coverImage} 
                alt={news.title}
                className="w-full h-[30vh] sm:h-[40vh] lg:h-[50vh] object-cover"
              />
            </motion.div>
          )}
          
          <div className="relative z-20 max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-12 lg:py-16 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Category Badge */}
              <span 
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-xs sm:text-sm font-bold mb-4 sm:mb-5 backdrop-blur-sm"
                style={{
                  background: `${CAT_COLORS[cat]}20`,
                  border: `1px solid ${CAT_COLORS[cat]}50`,
                  color: CAT_COLORS[cat]
                }}
              >
                {CAT_LABELS[cat] ?? cat}
              </span>
              
              {/* Title */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black leading-tight mb-3 sm:mb-4 px-2"
                style={{ color: '#f8d9b9' }}>
                {news.title}
              </h1>
              
              {/* Meta Info */}
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 text-xs sm:text-sm text-[#b4b4b4] mt-4 sm:mt-6">
                <span className="flex items-center gap-1.5 sm:gap-2">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: THEME.primary }} />
                  <span className="text-xs sm:text-sm">
                    {news.publishedAt 
                      ? new Date(news.publishedAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })
                      : new Date(news.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                  </span>
                </span>
                <span className="flex items-center gap-1.5 sm:gap-2">
                  <Eye className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: THEME.primary }} />
                  <span className="text-xs sm:text-sm">{news.viewCount.toLocaleString('id-ID')} views</span>
                </span>
                {news.author && (
                  <span className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                    📝 oleh <span style={{ color: '#f8d9b9' }} className="truncate max-w-[100px] sm:max-w-none">{news.author.name}</span>
                  </span>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Main Content - FIXED untuk offside */}
        <main className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 lg:py-10 overflow-x-hidden">
          
          {/* Tags Section */}
          {tags.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-6 sm:mb-8 pb-3 sm:pb-4 border-b border-[#ea5234]/15"
            >
              <span className="text-xs sm:text-sm font-medium text-[#b4b4b4] mr-1 sm:mr-2">🏷️ Tags:</span>
              {tags.map((tag: string) => (
                <span 
                  key={tag} 
                  className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium transition-all hover:scale-105"
                  style={{ background: THEME.bgLight, border: `1px solid ${THEME.border}`, color: '#f8d9b9' }}
                >
                  #{tag}
                </span>
              ))}
              {news.isPinned && (
                <span className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold ml-0 sm:ml-auto"
                  style={{ background: 'rgba(245, 158, 11, 0.2)', border: '1px solid rgba(245, 158, 11, 0.4)', color: '#fbbf24' }}>
                  📌 Pinned
                </span>
              )}
            </motion.div>
          )}

          {/* CONTENT - FIXED: Tidak offside ke kanan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full"
          >
            <div 
              className="news-content prose prose-invert max-w-none"
              style={{
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                wordBreak: 'break-word',
                whiteSpace: 'normal',
                maxWidth: '100%',
                width: '100%',
                overflowX: 'hidden'
              }}
              dangerouslySetInnerHTML={{ 
                __html: formatContent(news.content)
              }}
            />
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-3 sm:gap-4 mt-8 sm:mt-10 pt-5 sm:pt-6 border-t border-[#ea5234]/15"
          >
            <button 
              onClick={handleLike}
              className="flex items-center gap-1.5 sm:gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all hover:scale-105"
              style={{
                background: liked ? 'rgba(234, 82, 52, 0.2)' : THEME.bgLight,
                border: `1px solid ${liked ? THEME.primary : THEME.border}`,
                color: liked ? THEME.primary : '#b4b4b4'
              }}
            >
              <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${liked ? 'fill-current' : ''}`} />
              {liked ? 'Suka' : 'Suka Artikel'}
            </button>
            <button 
              onClick={share}
              className="flex items-center gap-1.5 sm:gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all hover:scale-105"
              style={{
                background: THEME.bgLight,
                border: `1px solid ${THEME.border}`,
                color: '#f8d9b9'
              }}
            >
              <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Bagikan
            </button>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-10 sm:mt-12 p-5 sm:p-6 md:p-8 rounded-2xl text-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(234, 82, 52, 0.15), rgba(248, 217, 185, 0.05))',
              border: `1px solid ${THEME.border}`
            }}
          >
            <div className="absolute top-0 right-0 text-6xl sm:text-7xl md:text-8xl opacity-5 pointer-events-none">🎮</div>
            <div className="absolute bottom-0 left-0 text-6xl sm:text-7xl md:text-8xl opacity-5 pointer-events-none">⚡</div>
            
            <p className="text-lg sm:text-xl md:text-2xl font-black mb-2 sm:mb-3 px-2" style={{ color: '#f8d9b9' }}>
              ✨ Siap Top Up dengan Harga Terbaik?
            </p>
            <p className="text-xs sm:text-sm text-[#b4b4b4] mb-4 sm:mb-6 px-2">Ribuan voucher game, pulsa, e-money, dan paket data tersedia</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
              <Link 
                href="/dashboard/games" 
                className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl font-bold text-sm transition-all hover:scale-105 w-full sm:w-auto justify-center"
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
                className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl font-bold text-sm transition-all hover:scale-105 w-full sm:w-auto justify-center"
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

          {/* Related Articles */}
          {relatedNews.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-10 sm:mt-12"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-5">
                <h3 className="text-base sm:text-lg md:text-xl font-bold flex items-center gap-2" style={{ color: '#f8d9b9' }}>
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: THEME.primary }} />
                  Artikel Terkait
                </h3>
                <Link href="/news" className="text-xs sm:text-sm flex items-center gap-1 transition-all hover:gap-2"
                  style={{ color: THEME.primary }}>
                  Lihat semua <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {relatedNews.map((item: NewsItem, idx: number) => (
                  <Link key={idx} href={`/news/${item.slug}`}>
                    <motion.div 
                      whileHover={{ y: -5, scale: 1.02 }}
                      className="group overflow-hidden rounded-xl transition-all duration-300 h-full"
                      style={{
                        background: THEME.bgGlass,
                        border: `1px solid ${THEME.border}`,
                        backdropFilter: 'blur(10px)'
                      }}
                    >
                      {item.coverImage && (
                        <div className="relative h-36 sm:h-32 md:h-36 overflow-hidden">
                          <img 
                            src={item.coverImage} 
                            alt={item.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        </div>
                      )}
                      <div className="p-3">
                        <p className="text-white font-semibold text-sm line-clamp-2 group-hover:text-[#f8d9b9] transition-colors">
                          {item.title}
                        </p>
                        <div className="flex items-center justify-between mt-2 text-[10px] text-[#b4b4b4]">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3" />
                            {new Date(item.publishedAt || item.createdAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short'
                            })}
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3" /> {item.viewCount}
                          </div>
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
      
      {/* Global CSS untuk mencegah overflow */}
      <style jsx global>{`
        /* Reset untuk semua elemen di news-content */
        .news-content {
          color: #d4d4d4;
          word-wrap: break-word !important;
          overflow-wrap: break-word !important;
          word-break: break-word !important;
          white-space: normal !important;
          max-width: 100% !important;
          width: 100% !important;
          overflow-x: hidden !important;
        }
        
        /* Semua child harus mengikuti */
        .news-content * {
          max-width: 100% !important;
          word-wrap: break-word !important;
          overflow-wrap: break-word !important;
          word-break: break-word !important;
          white-space: normal !important;
        }
        
        /* Heading */
        .news-content h1, 
        .news-content h2, 
        .news-content h3, 
        .news-content h4,
        .news-content h5,
        .news-content h6 {
          color: #f8d9b9;
          margin-top: 1.2em;
          margin-bottom: 0.5em;
          font-weight: 700;
          word-wrap: break-word;
        }
        
        .news-content h1 { font-size: 1.6rem; }
        .news-content h2 { font-size: 1.4rem; }
        .news-content h3 { font-size: 1.2rem; }
        
        /* Paragraph */
        .news-content p {
          margin-bottom: 1em;
          line-height: 1.7;
          word-wrap: break-word;
        }
        
        /* Lists - JANGAN GUNAKAN white-space: nowrap */
        .news-content ul,
        .news-content ol {
          margin: 0.8em 0;
          padding-left: 1.5em;
          word-wrap: break-word;
          white-space: normal;
        }
        
        .news-content li {
          margin: 0.3em 0;
          word-wrap: break-word;
          white-space: normal;
        }
        
        /* Links */
        .news-content a {
          color: #ea5234;
          text-decoration: none;
          border-bottom: 1px solid rgba(234, 82, 52, 0.3);
          word-wrap: break-word;
        }
        
        .news-content a:hover {
          color: #f8d9b9;
          border-bottom-color: #f8d9b9;
        }
        
        /* Blockquote */
        .news-content blockquote {
          border-left: 3px solid #ea5234;
          padding-left: 1em;
          margin: 1em 0;
          font-style: italic;
          color: #b4b4b4;
          word-wrap: break-word;
        }
        
        /* Images */
        .news-content img {
          max-width: 100%;
          height: auto;
          border-radius: 12px;
          margin: 1em 0;
        }
        
        /* Code blocks */
        .news-content pre,
        .news-content code {
          white-space: pre-wrap;
          word-wrap: break-word;
          max-width: 100%;
          overflow-x: auto;
        }
        
        /* Tables */
        .news-content table {
          display: block;
          overflow-x: auto;
          max-width: 100%;
        }
        
        /* Iframes / Videos */
        .news-content iframe,
        .news-content video {
          max-width: 100%;
          height: auto;
        }
        
        /* List items with checkmarks */
        .news-content ul li,
        .news-content ol li {
          margin: 0.3em 0;
        }
        
        /* Mobile specific */
        @media (max-width: 640px) {
          .news-content {
            font-size: 14px;
          }
          .news-content h1 { font-size: 1.4rem; }
          .news-content h2 { font-size: 1.2rem; }
          .news-content h3 { font-size: 1.1rem; }
          .news-content ul, 
          .news-content ol {
            padding-left: 1.2em;
          }
          .news-content blockquote {
            padding-left: 0.8em;
          }
        }
        
        /* Desktop */
        @media (min-width: 1024px) {
          .news-content {
            font-size: 16px;
          }
          .news-content h1 { font-size: 1.8rem; }
          .news-content h2 { font-size: 1.5rem; }
          .news-content h3 { font-size: 1.3rem; }
        }
      `}</style>
    </AntProvider>
  );
}