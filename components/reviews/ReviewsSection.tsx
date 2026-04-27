// components/reviews/ReviewsSection.tsx
// components/reviews/ReviewsSection.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Calendar, MessageSquare, ThumbsUp, Flag, ChevronLeft, ChevronRight, Sparkles, Quote, Award, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

interface Review {
  _id: string;
  userId: {
    _id: string;
    name: string;
    avatar?: string;
  };
  gameName: string;
  voucherName: string;
  review: {
    rating: number;
    comment: string;
    createdAt: string;
  };
  createdAt: string;
}

interface ReviewsSectionProps {
  reviews: Review[];
  averageRating?: number;
  totalReviews?: number;
  productId?: string;
  canWriteReview?: boolean;
  onReviewSubmitted?: () => void;
}

function StarRating({ rating, onRate, size = 'md', readonly = false }: { 
  rating: number; 
  onRate?: (rating: number) => void; 
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
}) {
  const sizes = { sm: 16, md: 20, lg: 28 };
  const iconSize = sizes[size];
  
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => !readonly && onRate?.(star)}
          className={readonly ? 'cursor-default' : 'cursor-pointer transition-all duration-200 hover:scale-110'}
          disabled={readonly}
          type="button"
        >
          <Star
            size={iconSize}
            className={`${star <= rating ? 'fill-current text-yellow-400 drop-shadow-glow' : 'text-gray-600'} transition-all duration-200`}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewCard({ review, index }: { review: Review; index: number }) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const handleLike = () => {
    if (liked) {
      setLikesCount(prev => prev - 1);
      setLiked(false);
    } else {
      setLikesCount(prev => prev + 1);
      setLiked(true);
    }
  };

  const fullProductName = `${review.gameName} · ${review.voucherName}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 100 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group relative rounded-2xl transition-all duration-500 hover:shadow-2xl"
      style={{
        background: 'linear-gradient(135deg, rgba(30,35,34,0.95), rgba(20,25,24,0.95))',
        border: '1px solid rgba(234,82,52,0.15)',
        boxShadow: isHovered ? '0 20px 40px -15px rgba(234,82,52,0.3)' : 'none'
      }}
    >
      {/* Animated gradient border on hover */}
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-[#ea5234]/0 via-[#ea5234]/30 to-[#ea5234]/0 opacity-0 transition-opacity duration-700 ${isHovered ? 'opacity-100' : ''}`} style={{ padding: '1px', margin: '-1px', borderRadius: '1rem' }} />
      
      {/* Glow effect */}
      <div className={`absolute -inset-0.5 bg-gradient-to-r from-[#ea5234]/20 to-purple-500/20 rounded-2xl blur-xl transition-opacity duration-500 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />
      
      <div className="relative p-5 rounded-2xl backdrop-blur-sm">
        {/* Quote icon decoration */}
        <Quote className="absolute top-4 right-4 w-8 h-8 text-[#ea5234]/10 pointer-events-none" />
        
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="relative">
            <div className={`absolute inset-0 rounded-xl bg-gradient-to-r from-[#ea5234] to-purple-500 opacity-0 transition-opacity duration-300 ${isHovered ? 'opacity-75' : ''}`} style={{ filter: 'blur(8px)' }} />
            <div className="relative w-11 h-11 rounded-xl flex items-center justify-center text-base font-black text-white shrink-0 overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #ea5234, #c13e22)' }}>
              {review.userId?.avatar ? (
                <img src={review.userId.avatar} alt={review.userId.name} className="w-full h-full object-cover" />
              ) : (
                review.userId?.name?.[0]?.toUpperCase() ?? 'U'
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="text-white font-bold text-sm flex items-center gap-1">
                  {review.userId?.name ?? 'Pengguna'}
                  {review.review.rating === 5 && (
                    <Award className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  )}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <StarRating rating={review.review.rating} size="sm" readonly />
                  <span className="text-yellow-400 text-xs font-semibold">{review.review.rating}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 bg-black/20 px-2 py-1 rounded-full">
                <Calendar size={12} />
                <span>
                  {formatDistanceToNow(new Date(review.review.createdAt), { 
                    addSuffix: true, 
                    locale: id 
                  })}
                </span>
              </div>
            </div>
            
            {/* Product Info */}
            {fullProductName && (
              <div className="mt-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-[#ea5234]/20 to-purple-500/20 text-[#ea5234]/90 font-medium">
                  {fullProductName}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* COMMENT Section */}
        <div className="relative mb-3 mt-4">
          <MessageSquare size={14} className="absolute -top-2 -left-2 text-[#ea5234]/40" />
          {review.review.comment && review.review.comment.trim() !== '' ? (
            <motion.p 
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-slate-300 text-sm leading-relaxed pl-6 italic"
            >
              "{review.review.comment}"
            </motion.p>
          ) : (
            <p className="text-slate-500 text-sm leading-relaxed pl-6 italic">
              Tidak ada komentar
            </p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-4 pt-3 mt-2 border-t border-white/10">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLike}
            className={`flex items-center gap-1.5 text-xs transition-all duration-200 ${
              liked ? 'text-[#ea5234]' : 'text-slate-500 hover:text-[#ea5234]'
            }`}
          >
            <ThumbsUp size={14} className={liked ? 'fill-current' : ''} />
            <span>Membantu ({likesCount})</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-400 transition-all duration-200"
          >
            <Flag size={14} />
            <span>Laporkan</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

export default function ReviewsSection({
  reviews,
  averageRating = 0,
  totalReviews = 0,
  productId,
  canWriteReview = true,
  onReviewSubmitted,
}: ReviewsSectionProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 6;

  const paginatedReviews = reviews.slice(0, currentPage * reviewsPerPage);
  const hasMore = paginatedReviews.length < reviews.length;

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => Math.floor(r.review.rating) === rating).length,
    percentage: reviews.length > 0 ? (reviews.filter(r => Math.floor(r.review.rating) === rating).length / reviews.length) * 100 : 0,
  }));

  if (reviews.length === 0) return null;

  return (
    <section className="space-y-8 py-4">
      {/* Header with animation */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="flex items-center gap-3"
      >
        <div className="h-8 w-1.5 rounded-full bg-gradient-to-b from-[#ea5234] to-[#ea5234]/50 animate-pulse" />
        <div className="relative">
          <Sparkles className="absolute -top-2 -left-2 w-5 h-5 text-yellow-400 animate-pulse" />
          <span className="text-3xl animate-bounce">⭐</span>
        </div>
        <div>
          <h2 className="text-white font-black text-2xl tracking-tight">
            Ulasan <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ea5234] to-purple-500">Pelanggan</span>
          </h2>
          <p className="text-slate-400 text-sm mt-1 flex items-center gap-1">
            <Users size={14} />
            {totalReviews} ulasan dari pelanggan setia kami
          </p>
        </div>
      </motion.div>

      {/* Rating Summary with glass morphism */}
      {totalReviews > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#ea5234]/10 to-purple-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative p-6 rounded-2xl backdrop-blur-sm" style={{ 
            background: 'linear-gradient(135deg, rgba(30,35,34,0.8), rgba(20,25,24,0.8))',
            border: '1px solid rgba(234,82,52,0.2)',
            backdropFilter: 'blur(10px)'
          }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#ea5234] to-purple-500 rounded-full blur-xl opacity-50 animate-pulse" />
                  <div className="relative text-6xl font-black text-white mb-3">
                    {averageRating.toFixed(1)}
                  </div>
                </div>
                <StarRating rating={Math.round(averageRating)} size="lg" readonly />
                <div className="text-slate-400 text-sm mt-3 flex items-center justify-center gap-1">
                  <Award size={14} className="text-yellow-400" />
                  Dari {totalReviews} ulasan
                </div>
              </div>
              <div className="space-y-3">
                {ratingDistribution.map(({ rating, count, percentage }) => (
                  <motion.div 
                    key={rating} 
                    className="flex items-center gap-3 group/bar"
                    initial={{ width: 0 }}
                    whileInView={{ width: '100%' }}
                    transition={{ delay: rating * 0.1 }}
                  >
                    <div className="flex items-center gap-1 w-12">
                      <span className="text-white text-sm font-semibold">{rating}</span>
                      <Star size={12} className="fill-yellow-400 text-yellow-400" />
                    </div>
                    <div className="flex-1 h-2 rounded-full bg-gray-800 overflow-hidden">
                      <motion.div 
                        className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${percentage}%` }}
                        transition={{ duration: 0.8, delay: rating * 0.1 }}
                      />
                    </div>
                    <div className="text-slate-400 text-xs w-12 font-mono">{count}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Reviews Grid with staggered animation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <AnimatePresence>
          {paginatedReviews.map((review, index) => (
            <ReviewCard key={review._id} review={review} index={index} />
          ))}
        </AnimatePresence>
      </div>

      {/* Load More Button with animation */}
      {hasMore && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurrentPage(prev => prev + 1)}
            className="relative group px-6 py-3 rounded-xl text-sm font-semibold text-white overflow-hidden transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#ea5234] to-[#c13e22] opacity-90 group-hover:opacity-100 transition-opacity" />
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-[#ea5234] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <span className="relative flex items-center gap-2">
              Lihat Lebih Banyak
              <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </motion.button>
        </motion.div>
      )}
    </section>
  );
}