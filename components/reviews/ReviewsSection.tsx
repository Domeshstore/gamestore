// components/reviews/ReviewsSection.tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Calendar, MessageSquare, ThumbsUp, Flag, ChevronLeft, ChevronRight } from 'lucide-react';
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
          className={readonly ? 'cursor-default' : 'cursor-pointer transition-transform hover:scale-110'}
          disabled={readonly}
          type="button"
        >
          <Star
            size={iconSize}
            className={star <= rating ? 'fill-current text-yellow-400' : 'text-gray-600'}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewCard({ review, index }: { review: Review; index: number }) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  const handleLike = () => {
    if (liked) {
      setLikesCount(prev => prev - 1);
      setLiked(false);
    } else {
      setLikesCount(prev => prev + 1);
      setLiked(true);
    }
  };

  // Nama produk yang akan ditampilkan
  const fullProductName = `${review.gameName} · ${review.voucherName}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      className="group relative p-5 rounded-2xl transition-all duration-300 hover:scale-[1.02]"
      style={{
        background: 'linear-gradient(135deg, oklch(0.27 0.01 17.95), oklch(0.24 0.01 17.53))',
        border: '1px solid oklch(0.32 0.02 34.90)',
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-base font-black text-white shrink-0 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, oklch(0.92 0.06 67.02), oklch(0.70 0.10 55.00))' }}>
          {review.userId?.avatar ? (
            <img src={review.userId.avatar} alt={review.userId.name} className="w-full h-full object-cover" />
          ) : (
            review.userId?.name?.[0]?.toUpperCase() ?? 'U'
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h4 className="text-white font-bold text-sm">{review.userId?.name ?? 'Pengguna'}</h4>
              <div className="flex items-center gap-2 mt-1">
                <StarRating rating={review.review.rating} size="sm" readonly />
                <span className="text-yellow-400 text-xs font-semibold">{review.review.rating}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
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
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                {fullProductName}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* COMMENT - WAJIB TAMPIL */}
      <div className="relative mb-3 mt-3">
        <MessageSquare size={14} className="absolute -top-1 -left-1 text-purple-500/30" />
        {review.review.comment && review.review.comment.trim() !== '' ? (
          <p className="text-slate-300 text-sm leading-relaxed pl-5">
            "{review.review.comment}"
          </p>
        ) : (
          <p className="text-slate-500 text-sm leading-relaxed pl-5 italic">
            Tidak ada komentar
          </p>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center gap-4 pt-3 border-t border-white/10">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 text-xs transition-all ${
            liked ? 'text-purple-400' : 'text-slate-500 hover:text-purple-400'
          }`}
        >
          <ThumbsUp size={14} className={liked ? 'fill-current' : ''} />
          <span>Membantu ({likesCount})</span>
        </button>
        <button className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-400 transition-all">
          <Flag size={14} />
          <span>Laporkan</span>
        </button>
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

  // Pagination
  const paginatedReviews = reviews.slice(0, currentPage * reviewsPerPage);
  const hasMore = paginatedReviews.length < reviews.length;

  // Calculate rating distribution dari data review yang ada
  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => Math.floor(r.review.rating) === rating).length,
    percentage: reviews.length > 0 ? (reviews.filter(r => Math.floor(r.review.rating) === rating).length / reviews.length) * 100 : 0,
  }));

  if (reviews.length === 0) return null;

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-8 w-1.5 rounded-full bg-gradient-to-b from-[#ea5234] to-[#ea5234]/50" />
        <span className="text-2xl">⭐</span>
        <div>
          <h2 className="text-white font-black text-xl">Ulasan Pelanggan</h2>
          <p className="text-slate-500 text-xs mt-1">Apa kata mereka tentang layanan kami</p>
        </div>
      </div>

      {/* Rating Summary */}
      {totalReviews > 0 && (
        <div className="p-5 rounded-2xl" style={{ background: 'oklch(0.27 0.01 17.95)', border: '1px solid oklch(0.32 0.02 34.90)' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center">
              <div className="text-5xl font-black text-white mb-2">{averageRating.toFixed(1)}</div>
              <StarRating rating={Math.round(averageRating)} size="lg" readonly />
              <div className="text-slate-400 text-sm mt-2">Dari {totalReviews} ulasan</div>
            </div>
            <div className="space-y-2">
              {ratingDistribution.map(({ rating, count, percentage }) => (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-12">
                    <span className="text-white text-sm">{rating}</span>
                    <Star size={12} className="fill-yellow-400 text-yellow-400" />
                  </div>
                  <div className="flex-1 h-2 rounded-full bg-gray-700 overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="text-slate-400 text-xs w-12">{count}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reviews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedReviews.map((review, index) => (
          <ReviewCard key={review._id} review={review} index={index} />
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="text-center">
          <button
            onClick={() => setCurrentPage(prev => prev + 1)}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#ea5234]/20 border border-[#ea5234]/50 hover:bg-[#ea5234]/30 transition-all"
          >
            Lihat Lebih Banyak
          </button>
        </div>
      )}
    </section>
  );
}