// VoucherCard.tsx - Komponen kartu voucher dengan desain modern dan interaktif
'use client';

import { Voucher } from '@/types';
import { formatCurrency } from '@/lib/utils/format';
import { Award, ChevronRight, Star, Zap, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils/format';
import { Card } from 'antd';

interface VoucherCardProps {
  voucher: Voucher;
  selected?: boolean;
  onSelect?: (voucher: Voucher) => void;
  variant?: 'featured' | 'default';
}

const TYPE_EMOJI: Record<string, string> = {
  diamond: '💎', coin: '🪙', subscription: '👑', item: '🎁', other: '⚡',
};

export default function VoucherCard({ voucher, selected, onSelect, variant = 'default' }: VoucherCardProps) {
  const emoji    = TYPE_EMOJI[voucher.type] ?? '⚡';
  const hasDisc  = voucher.originalPrice > voucher.price && voucher.originalPrice > 0;
  const discPct  = hasDisc ? Math.round(((voucher.originalPrice - voucher.price) / voucher.originalPrice) * 100) : 0;
  const isFeat   = variant === 'featured' || voucher.isFeatured;

  if (isFeat) {
    /* ── FEATURED / BEST-SELLER card ─────────────────── */
    return (
      <Card onClick={() => onSelect?.(voucher)}
  className={cn(
    'group relative overflow-hidden rounded-2xl p-5 text-left w-full transition-all duration-300',
    selected ? 'ring-2 ring-[#ea5234] scale-[0.98]' : 'hover:-translate-y-1 hover:shadow-2xl'
  )}
  style={{
    background: selected
      ? 'linear-gradient(135deg, rgb(248, 217, 185), rgb(248, 217, 185))'
      : 'linear-gradient(135deg, rgba(248,217,185,0.08) 0%, rgba(248,217,185,0.03) 100%)',
    border: selected ? '1px solid rgba(234,82,52,0.5)' : '1px solid rgba(248,217,185,0.12)',
    boxShadow: selected ? '0 0 24px rgba(234,82,52,0.25)' : '0 4px 24px rgba(0,0,0,0.3)',
    backdropFilter: 'blur(16px)',
  }}>

  {/* BEST SELLER ribbon - warna diubah ke #ea5234 */}
  <div className="absolute top-0 right-0 overflow-hidden w-24 h-24 pointer-events-none">
    <div className="absolute top-3 -right-6 w-28 py-1 text-center text-[10px] font-black tracking-widest text-white rotate-45"
      style={{ background: 'linear-gradient(90deg, #ea5234, #c13e22)' }}>
      TERLARIS
    </div>
  </div>

  {/* Glow bg on hover - warna diubah ke #ea5234 */}
  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
    style={{ background: 'radial-gradient(ellipse at 50% 120%, rgba(234,82,52,0.15), transparent 60%)' }} />

  <div className="relative text-center">
    {/* Icon - border dan shadow diubah ke #ea5234 */}
    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 text-3xl"
      style={{
        background: selected 
          ? 'rgba(234,82,52,0.15)' 
          : 'linear-gradient(135deg, rgba(248,217,185,0.2), rgba(234,82,52,0.1))',
        border: selected 
          ? '1px solid rgba(234,82,52,0.4)' 
          : '1px solid rgba(234,82,52,0.2)',
        boxShadow: selected 
          ? '0 4px 12px rgba(234,82,52,0.3)' 
          : '0 4px 12px rgba(234,82,52,0.2)',
      }}>
      {(voucher as unknown as Record<string,string>).image
        ? <img src={(voucher as unknown as Record<string,string>).image} alt={voucher.name} className="w-full h-full object-cover rounded-2xl" />
        : emoji}
    </div>

    {/* Name & amount - warna text berubah saat selected */}
    <p className={cn(
      "text-xs font-medium mb-0.5",
      selected ? "text-gray-600" : "text-slate-400"
    )}>
      {voucher.type === 'subscription' ? 'Langganan' : 'Top Up'}
    </p>
    <p className={cn(
      "font-black text-xl leading-tight mb-0.5",
      selected ? "text-gray-900" : "text-white"
    )}>
      {voucher.name}
    </p>

    {/* Price - gradient diubah ke #ea5234 dan #f8d9b9 */}
    <div className="my-3">
      <p className=" rounded-full text-green-600 font-black text-lg"
        >
        {formatCurrency(voucher.price)}
      </p>
      {hasDisc && (
        <p className={cn(
          "text-xs line-through",
          selected ? "text-gray-500" : "text-slate-500"
        )}>
          {formatCurrency(voucher.originalPrice)}
        </p>
      )}
      {discPct > 0 && (
        <span className={cn(
          "inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold",
          selected ? "bg-green-100 text-green-700" : "bg-green-900/30 text-green-400"
        )}
        style={!selected ? { border: '1px solid rgba(16,185,129,0.2)' } : {}}>
          {discPct}% OFF
        </span>
      )}
    </div>

    {/* Reward points - warna diubah ke #ea5234 saat selected */}
    <div className={cn(
      "flex items-center justify-center gap-1 text-xs mb-4",
      selected ? "text-amber-700" : "text-yellow-400"
    )}>
      <Award className="w-3.5 h-3.5" />
      <span className="font-semibold">+{voucher.rewardPoints} Reward Points</span>
    </div>

    {/* CTA - background diubah ke #ea5234 */}
    <div className={cn(
      'flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200',
      selected ? 'gap-3' : 'group-hover:gap-3'
    )}
      style={{
        background: selected
          ? 'linear-gradient(135deg, #ea5234, #c13e22)'
          : 'rgba(248,217,185,0.08)',
        border: selected 
          ? '1px solid rgba(234,82,52,0.5)' 
          : '1px solid rgba(248,217,185,0.12)',
      }}>
      <ShoppingCart className="w-4 h-4" />
      {selected ? 'Dipilih ✓' : 'Beli Sekarang'}
      <ChevronRight className={cn('w-4 h-4 transition-all', selected ? 'opacity-0 w-0' : 'group-hover:translate-x-1')} />
    </div>
  </div>
</Card>
    );
  }

  /* ── DEFAULT card ─────────────────────────────── */
return (
  <button onClick={() => onSelect?.(voucher)}
    className={cn(
      'group relative w-full text-left p-4 rounded-xl transition-all duration-200 flex items-center gap-4',
      selected ? 'scale-[0.98]' : 'hover:scale-[1.01]'
    )}
    style={{
      background: selected
        ? 'linear-gradient(135deg, rgba(248,217,185,0.95), rgba(248,217,185,0.85))'
        : 'rgba(248,217,185,0.04)',
      border: selected ? '1px solid rgba(234,82,52,0.85)' : '1px solid rgba(248,217,185,0.12)',
      boxShadow: selected ? '0 0 20px rgba(234,82,52,0.25)' : 'none',
      backdropFilter: 'blur(8px)',
    }}>

    {/* Icon */}
    <div className={cn(
      'w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 transition-all',
      selected ? 'scale-110' : 'group-hover:scale-110'
    )}
      style={{
        background: selected 
          ? 'rgba(234,82,52,0.2)' 
          : 'rgba(248,217,185,0.1)',
        border: selected 
          ? '1px solid rgba(234,82,52,0.4)' 
          : '1px solid rgba(248,217,185,0.15)',
      }}>
      {(voucher as unknown as Record<string,string>).image
        ? <img src={(voucher as unknown as Record<string,string>).image} alt={voucher.name} className="w-full h-full object-cover rounded-xl" />
        : emoji}
    </div>

    {/* Info */}
    <div className="flex-1 min-w-0">
      <p className={cn(
        'font-bold text-sm leading-tight truncate',
        selected ? 'text-gray-900' : 'text-white'
      )}>
        {voucher.name}
      </p>
      <div className="flex items-center gap-2 mt-1">
        {hasDisc && (
          <span className={cn(
            'text-xs line-through',
            selected ? 'text-gray-500' : 'text-slate-500'
          )}>
            {formatCurrency(voucher.originalPrice)}
          </span>
        )}
        <span className={cn(
          'text-sm font-black',
          selected ? 'text-[#ea5234]' : 'text-white'
        )}>
          {formatCurrency(voucher.price)}
        </span>
        {discPct > 0 && (
          <span className={cn(
            'text-xs font-bold px-1.5 py-0.5 rounded-full',
            selected ? 'bg-green-100 text-green-700' : 'text-green-400'
          )}
          style={!selected ? { background: 'rgba(16,185,129,0.1)' } : {}}>
            -{discPct}%
          </span>
        )}
      </div>
      {voucher.rewardPoints > 0 && (
        <div className="flex items-center gap-1 mt-1">
          <Award className={cn(
            'w-3 h-3',
            selected ? 'text-amber-700' : 'text-yellow-400'
          )} />
          <span className={cn(
            'text-xs font-medium',
            selected ? 'text-amber-700' : 'text-yellow-400'
          )}>
            +{voucher.rewardPoints} pts
          </span>
        </div>
      )}
    </div>

    {/* Selector */}
    <div className={cn(
      'w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center transition-all',
      selected ? 'border-[#ea5234] scale-110' : 'border-white/20 group-hover:border-[#ea5234]'
    )}
      style={selected ? { background: 'linear-gradient(135deg, #ea5234, #c13e22)' } : {}}>
      {selected && <Zap className="w-3 h-3 text-white fill-white" />}
    </div>
  </button>
);

}
