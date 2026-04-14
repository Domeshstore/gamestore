// components/MarqueeVoucherCards.tsx (update)
'use client';

import { useEffect, useState } from 'react';
import Marquee from 'react-fast-marquee';
import { Voucher, Game } from '@/types';
import { formatCurrency } from '@/lib/utils/format';
import { Award, ShoppingCart, Star, Flame } from 'lucide-react';
import { cn } from '@/lib/utils/format';

interface MarqueeVoucherProps {
  vouchers?: (Voucher & { gameId: Game })[]; // Langsung terima data vouchers
  gameSlug?: string;
  onSelect?: (voucher: Voucher & { gameId: Game }) => void;
  selectedVoucherId?: string;
}

const TYPE_EMOJI: Record<string, string> = {
  diamond: '💎', 
  coin: '🪙', 
  subscription: '👑', 
  item: '🎁', 
  other: '⚡',
  default: '🎫'
};

export default function MarqueeVoucherCards({ 
  vouchers: propVouchers,
  gameSlug, 
  onSelect,
  selectedVoucherId 
}: MarqueeVoucherProps) {
  const [vouchers, setVouchers] = useState<(Voucher & { gameId: Game })[]>([]);
  const [loading, setLoading] = useState(true);
  const [gameName, setGameName] = useState('');
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Jika vouchers sudah diberikan dari props, langsung gunakan
    if (propVouchers && propVouchers.length > 0) {
      setVouchers(propVouchers);
      setLoading(false);
      return;
    }

    // Jika tidak ada prop vouchers dan tidak ada gameSlug, jangan fetch
    if (!gameSlug) {
      setLoading(false);
      return;
    }

    const fetchVouchers = async () => {
      setLoading(true);
      setHasError(false);
      try {
        // Import dynamically to avoid circular dependency
        const { gamesAPI } = await import('@/lib/api/client');
        const res = await gamesAPI.getBySlug(gameSlug);
        const gameData = res.data.data;
        setGameName(gameData.name);
        const featuredVouchers = gameData.vouchers?.filter(
          (v: Voucher) => v.isFeatured === true && v.isActive === true
        ) || [];
        featuredVouchers.sort((a: Voucher, b: Voucher) => (a.sortOrder || 0) - (b.sortOrder || 0));
        setVouchers(featuredVouchers);
      } catch (error) {
        console.error('Failed to fetch vouchers:', error);
        setHasError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchVouchers();
  }, [propVouchers, gameSlug]);

  if (loading) {
    return (
      <div className="w-full py-8 bg-gradient-to-b from-[#f8d9b9]/20 to-transparent">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-[#ea5234] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm mt-2">Memuat voucher terlaris...</p>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="w-full py-8 bg-gradient-to-b from-[#f8d9b9]/20 to-transparent">
        <div className="text-center">
          <p className="text-gray-500 text-sm">Gagal memuat voucher terlaris</p>
        </div>
      </div>
    );
  }

  if (vouchers.length === 0) {
    return null;
  }

  // Ambil nama game dari voucher pertama
  const displayGameName = gameName || (vouchers[0]?.gameId && typeof vouchers[0].gameId === 'object' 
    ? (vouchers[0].gameId as Game).name 
    : 'Game');

  return (
    <div className="w-full py-8 ">
      {/* Header Section */}
      <div className="text-center mb-6 px-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#ea5234]/10 border border-[#ea5234]/20 mb-3">
          <Flame className="w-4 h-4 text-[#ea5234]" />
          <span className="text-xs font-bold text-[#ea5234] uppercase tracking-wider">Best Seller</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-[#ea5234]">
          Voucher <span className="text-[#ea5234]">Terlaris</span>
        </h2>
        <p className="text-gray-500 text-sm mt-2">
          Paling banyak dibeli
        </p>
      </div>

      {/* Marquee Section */}
      <Marquee
        speed={50}
        pauseOnHover={true}
        pauseOnClick={false}
        direction="left"
        loop={0}
        autoFill={true}
        gradient={true}
        gradientWidth={50}
        className="py-4"
      >
        {vouchers.map((voucher, index) => (
          <div key={`${voucher._id}-${index}`} className="mx-3">
            <VoucherTerlarisCard 
              voucher={voucher}
              selected={selectedVoucherId === voucher._id}
              onSelect={onSelect}
            />
          </div>
        ))}
      </Marquee>
    </div>
  );
}

// Komponen Card Voucher Terlaris (sama seperti sebelumnya)
function VoucherTerlarisCard({ 
  voucher, 
  selected,
  onSelect 
}: { 
  voucher: Voucher & { gameId: Game }; 
  selected?: boolean;
  onSelect?: (voucher: Voucher & { gameId: Game }) => void;
}) {
  const emoji = TYPE_EMOJI[voucher.type] ?? TYPE_EMOJI.default;
  const hasDisc = voucher.originalPrice > voucher.price && voucher.originalPrice > 0;
  const discPct = hasDisc ? Math.round(((voucher.originalPrice - voucher.price) / voucher.originalPrice) * 100) : 0;
  const isOutOfStock = voucher.stock === 0;
  const gameName = typeof voucher.gameId === 'object' ? (voucher.gameId as Game).name : '';

  return (
    <div 
      onClick={() => {
        if (!isOutOfStock) {
          onSelect?.(voucher);
        }
      }}
      className={cn(
        'group relative w-[280px] cursor-pointer transition-all duration-200',
        selected && 'scale-[0.98]',
        isOutOfStock && 'opacity-50 cursor-not-allowed'
      )}
    >
      <div className={cn(
        'relative overflow-hidden  rounded-2xl p-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1',
        selected 
          ? 'bg-[#f8d9b9] ring-2 ring-[#ea5234]' 
          : 'bg-[#ffdebd] hover:shadow-lg'
      )}>
        
        {/* Badge Terlaris */}
        <div className="absolute top-0 right-0 overflow-hidden w-20 h-20 pointer-events-none z-10">
          <div className="absolute top-2 -right-6 w-24 py-1 text-center text-[9px] font-black tracking-wider text-white rotate-45 shadow-md"
            style={{ background: 'linear-gradient(90deg, #ea5234, #c13e22)' }}>
            TERLARIS
          </div>
        </div>

        {/* Game Name Badge */}
        <div className="absolute top-2 left-2">
          <span className="text-[8px] px-1.5 py-0.5 rounded-full font-medium bg-gray-800 text-white">
            {gameName}
          </span>
        </div>

        {/* Code Product */}
        <p className={cn(
          'text-[10px] font-mono mb-2 mt-4',
          selected ? 'text-gray-500' : 'text-gray-400'
        )}>
          Code #{voucher.code}
        </p>

        {/* Icon + Name */}
        <div className="flex items-center gap-3 mb-3">
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center text-2xl border',
            selected 
              ? 'bg-[#ea5234]/15 border-[#ea5234]/30' 
              : 'bg-gradient-to-br from-[#f8d9b9]/30 to-[#ea5234]/10 border-[#ea5234]/20'
          )}>
            {emoji}
          </div>
          <div>
            <p className={cn(
              'font-bold text-sm line-clamp-1',
              selected ? 'text-gray-900' : 'text-gray-800'
            )}>
              {voucher.name}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <Star className="w-3 h-3 fill-[#ea5234] text-[#ea5234]" />
              <span className="text-[10px] text-gray-500">
                {voucher.rewardPoints > 0 ? `${voucher.rewardPoints} pts` : 'Voucher'}
              </span>
            </div>
          </div>
        </div>

        {/* Price */}
        <div className="mb-3">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className={cn(
              'text-xl font-black',
              selected ? 'text-[#ea5234]' : 'text-[#ea5234]'
            )}>
              {formatCurrency(voucher.price)}
            </span>
            {hasDisc && (
              <span className={cn(
                'text-xs line-through',
                selected ? 'text-gray-500' : 'text-gray-400'
              )}>
                {formatCurrency(voucher.originalPrice)}
              </span>
            )}
            {discPct > 0 && (
              <span className={cn(
                'px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                selected ? 'bg-green-100 text-green-700' : 'bg-green-100 text-green-600'
              )}>
                {discPct}% OFF
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <p className={cn(
          'text-xs leading-relaxed line-clamp-2 mb-3',
          selected ? 'text-gray-600' : 'text-gray-500'
        )}>
          {voucher.description || 'Premium voucher dengan benefit eksklusif untuk Anda'}
        </p>

        {/* Divider */}
        <div className={cn(
          'border-t my-2',
          selected ? 'border-[#ea5234]/20' : 'border-[#f8d9b9]/50'
        )} />

        {/* Footer */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1">
            <Award className={cn(
              'w-3 h-3',
              selected ? 'text-amber-600' : 'text-amber-500'
            )} />
            <span className={cn(
              'text-[10px] font-semibold',
              selected ? 'text-amber-700' : 'text-amber-600'
            )}>
              +{voucher.rewardPoints} pts
            </span>
          </div>
          <button 
            className={cn(
              'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200',
              selected 
                ? 'bg-[#ea5234] text-white hover:bg-[#c13e22]' 
                : 'bg-gray-900 text-white hover:bg-[#ea5234]',
              isOutOfStock && 'opacity-50 cursor-not-allowed hover:bg-gray-900'
            )}
            onClick={(e) => {
              e.stopPropagation();
              if (!isOutOfStock) {
                onSelect?.(voucher);
              }
            }}
            disabled={isOutOfStock}
          >
            <ShoppingCart className="w-3 h-3" />
            {isOutOfStock ? 'Habis' : (selected ? 'Dipilih' : 'Beli')}
          </button>
        </div>

        {/* Hover Glow Effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
          style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(234,82,52,0.08), transparent 60%)' }} />
      </div>
    </div>
  );
}