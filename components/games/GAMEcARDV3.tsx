// components/games/GameCard.tsx atau GameCardV2.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Game } from '@/types';
import { formatCurrency } from '@/lib/utils/format';
import { Star, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils/format';

interface GameCardProps {
  game: Game;
  variant?: 'default' | 'compact' | 'featured';
}

const PRODUCT_TYPE_CONFIG: Record<string, { bg: string; label: string; icon: string }> = {
  game: { bg: '#8b5cf6', label: 'Game', icon: '🎮' },
  pulsa: { bg: '#10b981', label: 'Pulsa', icon: '📱' },
  paket_data: { bg: '#3b82f6', label: 'Paket Data', icon: '📶' },
  pln: { bg: '#f59e0b', label: 'Token PLN', icon: '⚡' },
  e_money: { bg: '#ec489a', label: 'E-Money', icon: '💳' },
  streaming: { bg: '#ef4444', label: 'Streaming', icon: '🎬' },
  voucher: { bg: '#06b6d4', label: 'Voucher', icon: '🎫' },
  other: { bg: '#6b7280', label: 'Lainnya', icon: '📦' },
};

export default function GameCard({ game, variant = 'default' }: GameCardProps) {
  const config = PRODUCT_TYPE_CONFIG[game.productType || 'other'];
  const minPrice = game.vouchers && game.vouchers.length > 0 
    ? Math.min(...game.vouchers.map(v => v.price))
    : null;

  // Compact variant untuk e-money, streaming, pln
  if (variant === 'compact') {
    return (
      <Link href={`/dashboard/games/${game.slug}`}>
        <div className="group relative overflow-hidden rounded-xl transition-all duration-300 cursor-pointer hover:-translate-y-1 bg-[#ea5234]/10 border border-[#ea5234]/20">
          <div className="p-4 text-center">
            <div className="w-12 h-12 mx-auto mb-2 rounded-xl flex items-center justify-center text-2xl overflow-hidden bg-gradient-to-br from-[#ea5234] to-[#c43a1f]">
              {game.image ? (
                <Image src={game.image} alt={game.name} width={40} height={40} className="object-cover" />
              ) : (
                <span>{config.icon}</span>
              )}
            </div>
            <div className="text-white font-bold text-xs truncate">{game.name}</div>
          </div>
        </div>
      </Link>
    );
  }

  // Featured variant untuk game
  if (variant === 'featured') {
    return (
      <Link href={`/dashboard/games/${game.slug}`}>
        <div className="group relative overflow-hidden rounded-2xl transition-all duration-300 cursor-pointer hover:-translate-y-2 bg-gradient-to-br from-[#ea5234]/20 to-[#ea5234]/5 border border-[#ea5234]/20">
          <div className="absolute top-3 right-3 z-10">
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold text-white bg-[#ea5234] shadow-lg">
              {config.label}
            </span>
          </div>
          <div className="p-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-3 overflow-hidden bg-gradient-to-br from-[#ea5234] to-[#c43a1f] mx-auto">
              {game.image ? (
                <Image src={game.image} alt={game.name} width={56} height={56} className="object-cover" />
              ) : (
                <span>{config.icon}</span>
              )}
            </div>
            <h3 className="text-white font-bold text-sm text-center truncate">{game.name}</h3>
            {minPrice && (
              <p className="text-[#ea5234] font-bold text-xs text-center mt-1">{formatCurrency(minPrice)}</p>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // Default variant untuk pulsa, paket data, voucher
  return (
    <Link href={`/dashboard/games/${game.slug}`}>
      <div className="group relative overflow-hidden rounded-xl transition-all duration-300 cursor-pointer hover:-translate-y-1 bg-[#ea5234]/10 border border-[#ea5234]/20">
        <div className="p-3">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl overflow-hidden bg-gradient-to-br from-[#ea5234] to-[#c43a1f]">
              {game.image ? (
                <Image src={game.image} alt={game.name} width={32} height={32} className="object-cover" />
              ) : (
                <span>{config.icon}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-sm truncate">{game.name}</h3>
              {minPrice && (
                <p className="text-[#ea5234] font-bold text-xs">{formatCurrency(minPrice)}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}