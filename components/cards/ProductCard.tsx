// components/cards/ProductCard.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, MapPin, TrendingUp } from 'lucide-react';
import { Game } from '@/types';
import { formatCurrency } from '@/lib/utils/format';

interface ProductCardProps {
  game: Game;
  variant?: 'default' | 'compact' | 'featured';
  showStats?: boolean;
}

// Product type configurations
const PRODUCT_TYPE_CONFIG: Record<string, { bg: string; gradient: string; label: string; fallbackIcon: string }> = {
  game: { bg: '#8b5cf6', gradient: 'from-purple-600 to-pink-600', label: 'Game', fallbackIcon: '' },
  pulsa: { bg: '#10b981', gradient: 'from-emerald-500 to-teal-600', label: 'Pulsa', fallbackIcon: '' },
  paket_data: { bg: '#3b82f6', gradient: 'from-blue-500 to-cyan-600', label: 'Paket Data', fallbackIcon: '' },
  pln: { bg: '#f59e0b', gradient: 'from-amber-500 to-orange-600', label: 'Token PLN', fallbackIcon: '' },
  e_money: { bg: '#ec489a', gradient: 'from-pink-500 to-rose-600', label: 'E-Money', fallbackIcon: '' },
  streaming: { bg: '#ef4444', gradient: 'from-red-500 to-rose-600', label: 'Streaming', fallbackIcon: '' },
  voucher: { bg: '#06b6d4', gradient: 'from-cyan-500 to-blue-600', label: 'Voucher', fallbackIcon: '' },
  other: { bg: '#6b7280', gradient: 'from-gray-500 to-gray-700', label: 'Lainnya', fallbackIcon: '' },
};

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
  return num.toString();
}

// Fungsi untuk mendapatkan URL berdasarkan productType
function getProductUrl(game: Game): string {
  switch (game.productType) {
    case 'pulsa':
      return `/dashboard/topup?type=pulsa&product=${game.slug}`;
    case 'paket_data':
      return `/dashboard/topup?type=paket_data&product=${game.slug}`;
    case 'pln':
      return `/dashboard/topup?type=pln&product=${game.slug}`;
    default:
      return `/dashboard/games/${game.slug}`;
  }
}

// components/cards/ProductCard.tsx

// Icon Component dengan gambar dari game.image
function ProductIcon({ game, config, className = "" }: { game: Game; config: any; className?: string }) {
  const [imgError, setImgError] = useState(false);
  const imageUrl = game.image || game.banner;
  
  // DEBUG: Log URL gambar
  if (imageUrl) {
    console.log('ProductIcon image URL:', imageUrl, 'for game:', game.name);
  }

  if (imageUrl && !imgError) {
    return (
      <div className={`relative ${className}`}>
        <Image
          src={imageUrl}
          alt={game.name}
          width={56}
          height={56}
          className="w-full h-full object-cover rounded-xl"
          onError={() => {
            console.error('Failed to load image:', imageUrl);
            setImgError(true);
          }}
          priority={false}
          unoptimized // Tambahkan ini sementara untuk testing
        />
      </div>
    );
  }
  
  // Fallback ke emoji jika gambar gagal load
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <span className="text-2xl">{config.fallbackIcon}</span>
    </div>
  );
}

// COMPACT VARIANT - Untuk E-Money, Streaming, PLN
function CompactCard({ game, config }: { game: Game; config: any }) {
  return (
    <Link href={getProductUrl(game)}>
      <motion.div
        whileHover={{ y: -2, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="group relative overflow-hidden rounded-xl transition-all duration-300 cursor-pointer"
        style={{
          background: `linear-gradient(135deg, ${config.bg}15, ${config.bg}05)`,
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="p-3 text-center">
          <div className="w-20 h-20 mx-auto mb-2 rounded-xl flex items-center justify-center overflow-hidden"
            style={{
              boxShadow: `0 4px 12px ${config.bg}40`,
            }}>
            <ProductIcon game={game} config={config} className="w-20 h-20" />
          </div>
          <div className="text-white font-bold text-xs truncate">{game.name}</div>
        </div>
      </motion.div>
    </Link>
  );
}

// FEATURED VARIANT - Untuk Game Top Up
function FeaturedCard({ game, config }: { game: Game; config: any }) {
  return (
    <Link href={getProductUrl(game)}>
      <motion.div
        whileHover={{ y: -4, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="group relative overflow-hidden rounded-2xl transition-all duration-300 cursor-pointer"
        style={{
          background: `linear-gradient(135deg, ${config.bg}20, ${config.bg}08)`,
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        {/* Badge */}
        <div className="absolute top-3 right-3 z-10">
          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold text-white"
            style={{ background: config.bg, boxShadow: `0 2px 8px ${config.bg}60` }}>
            {config.label}
          </span>
        </div>

        <div className="p-5">
          <div className="flex items-start gap-4">
            {/* Icon dengan gambar dari game */}
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden shrink-0"
              style={{
                
                boxShadow: `0 8px 20px ${config.bg}40`,
              }}>
              <ProductIcon game={game} config={config} className="w-20 h-20" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-bold text-lg truncate">{game.name}</h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <div className="flex items-center gap-1">
                  <Star size={14} className="fill-yellow-400 text-yellow-400" />
                  <span className="text-yellow-400 text-xs font-bold">4.99</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin size={12} className="text-slate-400" />
                  <span className="text-slate-400 text-xs">Indonesia</span>
                </div>
              </div>
              {game.description && (
                <p className="text-slate-400 text-xs mt-2 line-clamp-2">{game.description}</p>
              )}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-green-400" />
              <span className="text-green-400 text-xs font-medium">Best Seller</span>
            </div>
            <span className="text-xs font-bold text-white/60 group-hover:text-white transition-colors">
              Beli →
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

// DEFAULT VARIANT - Untuk Pulsa, Paket Data
function DefaultCard({ game, config }: { game: Game; config: any }) {
  const minPrice = game.vouchers && game.vouchers.length > 0 
    ? Math.min(...game.vouchers.map(v => v.price))
    : null;

  return (
    <Link href={getProductUrl(game)}>
      <motion.div
        whileHover={{ y: -4, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="group relative overflow-hidden rounded-2xl transition-all duration-300 cursor-pointer"
        style={{
          background: `linear-gradient(135deg, ${config.bg}12, ${config.bg}04)`,
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 50% 0%, ${config.bg}20, transparent 70%)` }}
        />

        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${config.bg}, ${config.bg}cc)`,
                boxShadow: `0 4px 12px ${config.bg}40`,
              }}>
              <ProductIcon game={game} config={config} className="w-20 h-20" />
            </div>
            <div className="flex items-center gap-1 bg-black/30 px-2 py-1 rounded-full">
              <MapPin size={10} className="text-slate-400" />
              <span className="text-slate-300 text-[10px] font-medium">Indonesia</span>
            </div>
          </div>

          <h3 className="text-white font-bold text-base mb-1 truncate">{game.name}</h3>
          
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-0.5">

            </div>
            <div className="w-1 h-1 rounded-full bg-slate-600" />

          </div>

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-500">Mulai dari</span>
              <span className="text-white font-bold text-sm">
                {minPrice ? formatCurrency(minPrice) : 'Rp 5.000'}
              </span>
            </div>
            <div className="w-7 h-7 rounded-full flex items-center justify-center bg-white/5 group-hover:bg-white/10 transition-all">
              <span className="text-white text-xs">→</span>
            </div>
          </div>
        </div>

        <div className="absolute top-3 left-3">
          <span className="text-[8px] px-1.5 py-0.5 rounded font-bold text-white/60"
            style={{ background: `${config.bg}40`, backdropFilter: 'blur(4px)' }}>
            {config.label}
          </span>
        </div>
      </motion.div>
    </Link>
  );
}

// components/cards/ProductCard.tsx - tambahkan ini di akhir file (sebelum helper functions)

// PRODUCT SECTION COMPONENT
export function ProductSection({ 
  games, 
  title, 
  subtitle,
  icon,
  seeAllLink,
  variant = 'default'
}: { 
  games: Game[]; 
  title: string; 
  subtitle?: string;
  icon?: string;
  seeAllLink?: string;
  variant?: 'default' | 'compact' | 'featured';
}) {
  if (games.length === 0) return null;

  const getColumns = () => {
    switch (variant) {
      case 'compact': return 6;
      case 'featured': return 4;
      default: return 6;
    }
  };

  const colClasses = {
    4: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4',
    5: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4',
    6: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4',
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {icon && <span className="text-3xl">{icon}</span>}
          <div>
            <h2 className="text-white font-black text-xl">{title}</h2>
            {subtitle && <p className="text-slate-500 text-sm">{subtitle}</p>}
          </div>
        </div>
        {seeAllLink && (
          <Link 
            href={seeAllLink}
            className="text-sm font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-1"
          >
            Lihat semua <span className="text-lg">→</span>
          </Link>
        )}
      </div>

      <div className={colClasses[getColumns() as keyof typeof colClasses]}>
        {games.slice(0, 12).map((game) => (
          <ProductCard key={game._id} game={game} variant={variant} />
        ))}
      </div>
    </section>
  );
}
// MAIN PRODUCT CARD COMPONENT
export function ProductCard({ game, variant = 'default' }: ProductCardProps) {
  const config = PRODUCT_TYPE_CONFIG[game.productType || game.category] || PRODUCT_TYPE_CONFIG.other;
  
  if (variant === 'compact') {
    return <CompactCard game={game} config={config} />;
  }
  
  if (variant === 'featured') {
    return <FeaturedCard game={game} config={config} />;
  }
  
  return <DefaultCard game={game} config={config} />;
}

// Helper functions
export function filterProductsByType(products: Game[], type: string): Game[] {
  return products.filter(product => product.productType === type);
}

export function getGameProducts(products: Game[]): Game[] {
  return products.filter(p => p.productType === 'game');
}

export function getPulsaProducts(products: Game[]): Game[] {
  return products.filter(p => p.productType === 'pulsa');
}

export function getPaketDataProducts(products: Game[]): Game[] {
  return products.filter(p => p.productType === 'paket_data');
}

export function getPlnProducts(products: Game[]): Game[] {
  return products.filter(p => p.productType === 'pln');
}

export function getEmoneyProducts(products: Game[]): Game[] {
  return products.filter(p => p.productType === 'e_money');
}

export function getStreamingProducts(products: Game[]): Game[] {
  return products.filter(p => p.productType === 'streaming');
}