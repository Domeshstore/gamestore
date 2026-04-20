// components/ui/PromoBanner.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { promoAPI } from '@/lib/api/client';
import { formatCurrency } from '@/lib/utils/format';
import toast from 'react-hot-toast'; // ✅ TAMBAHKAN IMPORT INI

interface Promo {
  _id: string;
  name: string;
  code: string;
  description: string;
  type: 'percentage' | 'fixed' | 'first_transaction';
  value: number;
  maxDiscount: number;
  minOrder: number;
  scope: string;
  categories: string[];
  productIds: string[];
  usageLimit: number;
  usedCount: number;
  perUserLimit: number;
  startsAt: string;
  expiresAt: string | null;
  isActive: boolean;
  isAutoApply: boolean;
  image: string;
}

interface PromoBannerProps {
  className?: string;
  autoPlay?: boolean;
  interval?: number;
  limit?: number;
}

export default function PromoBanner({ 
  className = '', 
  autoPlay = true, 
  interval = 5000,
  limit = 5 
}: PromoBannerProps) {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const fetchPromos = async () => {
      try {
        const res = await promoAPI.getAll({ 
          isActive: true,
          limit: limit 
        });
        const activePromos = res.data.data || [];
        setPromos(activePromos);
      } catch (error) {
        console.error('Failed to load promos:', error);
        setPromos(getFallbackPromos());
      } finally {
        setLoading(false);
      }
    };

    fetchPromos();
  }, [limit]);

  // Auto slide
  useEffect(() => {
    if (!autoPlay || paused || promos.length <= 1) return;
    
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % promos.length);
    }, interval);
    
    return () => clearInterval(timer);
  }, [autoPlay, paused, promos.length, interval]);

  const getFallbackPromos = (): Promo[] => {
    return [
      {
        _id: '1',
        name: 'Diskon Pengguna Baru',
        code: 'NEWUSER33',
        description: 'Dapatkan diskon 33% untuk transaksi pertama!',
        type: 'percentage',
        value: 33,
        maxDiscount: 50000,
        minOrder: 0,
        scope: 'all',
        categories: [],
        productIds: [],
        usageLimit: 1000,
        usedCount: 0,
        perUserLimit: 1,
        startsAt: new Date().toISOString(),
        expiresAt: null,
        isActive: true,
        isAutoApply: true,
        image: 'https://nmzg68mby1os258h.public.blob.vercel-storage.com/d182bdab47188249b6b34839fc6238e827c814ea-1920x1080-8ppUdeb85I6lb3LbyPFpN555Jj1k8V.avif',
      },
      {
        _id: '2',
        name: 'Flash Sale Weekend',
        code: 'FLASH50',
        description: 'Diskon 50% khusus akhir pekan!',
        type: 'percentage',
        value: 50,
        maxDiscount: 100000,
        minOrder: 50000,
        scope: 'all',
        categories: [],
        productIds: [],
        usageLimit: 500,
        usedCount: 0,
        perUserLimit: 1,
        startsAt: new Date().toISOString(),
        expiresAt: null,
        isActive: true,
        isAutoApply: false,
        image: 'https://nmzg68mby1os258h.public.blob.vercel-storage.com/d182bdab47188249b6b34839fc6238e827c814ea-1920x1080-8ppUdeb85I6lb3LbyPFpN555Jj1k8V.avif',
      },
    ];
  };

  // Format discount text
  const getDiscountText = (promo: Promo) => {
    if (promo.type === 'percentage') {
      return `${promo.value}% OFF`;
    } else if (promo.type === 'fixed') {
      return `Rp ${promo.value.toLocaleString()} OFF`;
    } else if (promo.type === 'first_transaction') {
      return 'First Order Bonus!';
    }
    return 'Special Offer';
  };

  // Get badge color based on promo type
  const getBadgeColor = (promo: Promo) => {
    if (promo.type === 'percentage') return 'from-orange-500 to-red-500';
    if (promo.type === 'fixed') return 'from-green-500 to-emerald-500';
    if (promo.type === 'first_transaction') return 'from-purple-500 to-pink-500';
    return 'from-blue-500 to-cyan-500';
  };

  if (loading) {
    return (
      <div className={`max-w-3xl mx-auto px-4 ${className}`}>
        <div className="relative overflow-hidden p-8 rounded-3xl text-center bg-gradient-to-r from-[#ea5234]/20 to-[#ea5234]/5 border border-[#ea5234]/30 animate-pulse">
          <div className="h-32 w-full bg-white/10 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (promos.length === 0) return null;

  // Single promo mode (no carousel)
  if (promos.length === 1) {
    return <SinglePromoBanner promo={promos[0]} className={className} />;
  }

  // Carousel mode (multiple promos)
  return (
    <div className={`max-w-3xl mx-auto px-4 ${className}`}>
      <div 
        className="relative overflow-hidden rounded-3xl"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="relative">
          {promos.map((promo, index) => (
            <motion.div
              key={promo._id}
              initial={{ opacity: 0, x: 100 }}
              animate={{ 
                opacity: index === currentIndex ? 1 : 0,
                x: index === currentIndex ? 0 : 100,
                display: index === currentIndex ? 'block' : 'none'
              }}
              transition={{ duration: 0.5 }}
              className="relative overflow-hidden rounded-3xl"
            >
              <PromoContent promo={promo} />
            </motion.div>
          ))}
          
          {/* Navigation Dots */}
          {promos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {promos.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex 
                      ? 'w-6 bg-[#ea5234]' 
                      : 'bg-white/50 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>
          )}
          
          {/* Navigation Arrows */}
          {promos.length > 1 && (
            <>
              <button
                onClick={() => setCurrentIndex((prev) => (prev - 1 + promos.length) % promos.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-all z-10"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => setCurrentIndex((prev) => (prev + 1) % promos.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-all z-10"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Single Promo Banner Component
function SinglePromoBanner({ promo, className = '' }: { promo: Promo; className?: string }) {
  return (
    <div className={`max-w-3xl mx-auto px-4 ${className}`}>
      <PromoContent promo={promo} />
    </div>
  );
}

// Promo Content Component
function PromoContent({ promo }: { promo: Promo }) {
  const [imgError, setImgError] = useState(false);
  const discountText = promo.type === 'percentage' 
    ? `${promo.value}%` 
    : promo.type === 'fixed' 
      ? `Rp ${promo.value.toLocaleString()}` 
      : 'Special';
      
  const discountLabel = promo.type === 'percentage' ? 'OFF' : 'Diskon';
  
  const isExpiringSoon = promo.expiresAt && new Date(promo.expiresAt) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  const isExpired = promo.expiresAt && new Date(promo.expiresAt) < new Date();

  const getGradient = () => {
    if (promo.type === 'percentage') return 'from-orange-500/20 to-red-500/10';
    if (promo.type === 'fixed') return 'from-green-500/20 to-emerald-500/10';
    if (promo.type === 'first_transaction') return 'from-purple-500/20 to-pink-500/10';
    return 'from-blue-500/20 to-cyan-500/10';
  };

  const getBorderColor = () => {
    if (promo.type === 'percentage') return 'border-orange-500/30';
    if (promo.type === 'fixed') return 'border-green-500/30';
    if (promo.type === 'first_transaction') return 'border-purple-500/30';
    return 'border-blue-500/30';
  };

  const getBadgeColor = (promo: Promo) => {
    if (promo.type === 'percentage') return 'from-orange-500 to-red-500';
    if (promo.type === 'fixed') return 'from-green-500 to-emerald-500';
    if (promo.type === 'first_transaction') return 'from-purple-500 to-pink-500';
    return 'from-blue-500 to-cyan-500';
  };

  return (
    <div 
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-r ${getGradient()} border ${getBorderColor()} transition-all hover:scale-[1.02] duration-300`}
    >
      {/* Background Image - dengan fallback */}
      {promo.image && !imgError && (
        <div className="absolute inset-0 opacity-20">
          <img
            src={promo.image}
            alt={promo.name}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        </div>
      )}
      
      {/* Fallback pattern jika gambar gagal */}
      {imgError && (
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-[#ea5234] to-[#c43a1f]" />
        </div>
      )}
      
      <div className="relative p-6 md:p-8">
        {/* Promo Badge */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold text-white bg-gradient-to-r ${getBadgeColor(promo)}`}>
            <span>🏷️</span>
            <span>{discountText} {discountLabel}</span>
          </div>
          
          {promo.isAutoApply && (
            <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <span>⚡</span>
              <span>Auto Apply</span>
            </div>
          )}
          
          {isExpiringSoon && !isExpired && (
            <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
              <span>⏰</span>
              <span>Segera Berakhir!</span>
            </div>
          )}
        </div>
        
        {/* Title & Description */}
        <h2 className="text-2xl md:text-3xl font-black text-white mb-2">
          {promo.name}
        </h2>
        
        <p className="text-white/70 text-sm md:text-base mb-2 max-w-md">
          {promo.description}
        </p>
        
        {/* Promo Code dengan copy button */}
        <div className="inline-flex items-center gap-2 bg-black/30 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2 mb-4">
          <span className="text-white/60 text-xs">Kode Promo:</span>
          <code className="text-white font-mono font-bold text-sm tracking-wider">{promo.code}</code>
          <button
            onClick={() => {
              navigator.clipboard.writeText(promo.code);
              toast.success('Kode promo disalin!');
            }}
            className="ml-2 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            📋
          </button>
        </div>
        
        {/* Minimum Order Info */}
        {promo.minOrder > 0 && (
          <p className="text-white/50 text-xs mb-4">
            Minimal belanja: {formatCurrency(promo.minOrder)}
          </p>
        )}
        
        {/* Max Discount Info */}
        {promo.maxDiscount > 0 && promo.type === 'percentage' && (
          <p className="text-white/50 text-xs mb-4">
            Maksimal diskon: {formatCurrency(promo.maxDiscount)}
          </p>
        )}
        
        {/* CTA Button */}
        <Link href="/dashboard/games">
          <button className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#ea5234] to-[#c43a1f] hover:from-[#ea5234]/90 hover:to-[#c43a1f]/90 transition-all shadow-lg hover:shadow-xl">
            Gunakan Promo →
          </button>
        </Link>
      </div>
    </div>
  );
}