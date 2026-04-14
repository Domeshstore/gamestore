'use client';

import { Voucher } from '@/types';
import { formatCurrency } from '@/lib/utils/format';
import { Award, ChevronRight, Star, Zap, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils/format';

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
      <button onClick={() => onSelect?.(voucher)}
        className={cn(
          'group relative overflow-hidden rounded-2xl p-5 text-left w-full transition-all duration-300',
          selected ? 'ring-2 ring-purple-500 scale-[0.98]' : 'hover:-translate-y-1 hover:shadow-2xl'
        )}
        style={{
          background: selected
            ? 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(79,70,229,0.15))'
            : 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
          border: selected ? '1px solid rgba(124,58,237,0.5)' : '1px solid rgba(255,255,255,0.12)',
          boxShadow: selected ? '0 0 24px rgba(124,58,237,0.25)' : '0 4px 24px rgba(0,0,0,0.3)',
          backdropFilter: 'blur(16px)',
        }}>

        {/* BEST SELLER ribbon */}
        <div className="absolute top-0 right-0 overflow-hidden w-24 h-24 pointer-events-none">
          <div className="absolute top-3 -right-6 w-28 py-1 text-center text-[10px] font-black tracking-widest text-white rotate-45"
            style={{ background: 'linear-gradient(90deg, #f59e0b, #ef4444)' }}>
            TERLARIS
          </div>
        </div>

        {/* Glow bg on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 120%, rgba(124,58,237,0.15), transparent 60%)' }} />

        <div className="relative text-center">
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 text-3xl"
            style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(79,70,229,0.1))',
              border: '1px solid rgba(124,58,237,0.2)',
              boxShadow: '0 4px 12px rgba(124,58,237,0.2)',
            }}>
            {(voucher as unknown as Record<string,string>).image
              ? <img src={(voucher as unknown as Record<string,string>).image} alt={voucher.name} className="w-full h-full object-cover rounded-2xl" />
              : emoji}
          </div>

          {/* Name & amount */}
          <p className="text-slate-400 text-xs font-medium mb-0.5">{voucher.type === 'subscription' ? 'Langganan' : 'Top Up'}</p>
          <p className="text-white font-black text-xl leading-tight mb-0.5">{voucher.name}</p>

          {/* Price */}
          <div className="my-3">
            <p className="text-white font-black text-lg"
              style={{ background: 'linear-gradient(135deg, #a78bfa, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {formatCurrency(voucher.price)}
            </p>
            {hasDisc && (
              <p className="text-slate-500 text-xs line-through">{formatCurrency(voucher.originalPrice)}</p>
            )}
            {discPct > 0 && (
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold text-green-400"
                style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                {discPct}% OFF
              </span>
            )}
          </div>

          {/* Reward points */}
          <div className="flex items-center justify-center gap-1 text-xs mb-4"
            style={{ color: '#fbbf24' }}>
            <Award className="w-3.5 h-3.5" />
            <span className="font-semibold">+{voucher.rewardPoints} Reward Points</span>
          </div>

          {/* CTA */}
          <div className={cn(
            'flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200',
            selected ? 'gap-3' : 'group-hover:gap-3'
          )}
            style={{
              background: selected
                ? 'linear-gradient(135deg, #7c3aed, #4f46e5)'
                : 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}>
            <ShoppingCart className="w-4 h-4" />
            {selected ? 'Dipilih ✓' : 'Beli Sekarang'}
            <ChevronRight className={cn('w-4 h-4 transition-all', selected ? 'opacity-0 w-0' : 'group-hover:translate-x-1')} />
          </div>
        </div>
      </button>
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
          ? 'linear-gradient(135deg, rgba(124,58,237,0.18), rgba(79,70,229,0.10))'
          : 'rgba(255,255,255,0.04)',
        border: selected ? '1px solid rgba(124,58,237,0.45)' : '1px solid rgba(255,255,255,0.08)',
        boxShadow: selected ? '0 0 20px rgba(124,58,237,0.2)' : 'none',
        backdropFilter: 'blur(8px)',
      }}>

      {/* Icon */}
      <div className={cn(
        'w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 transition-all',
        selected ? 'scale-110' : 'group-hover:scale-110'
      )}
        style={{
          background: selected ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
        {(voucher as unknown as Record<string,string>).image
          ? <img src={(voucher as unknown as Record<string,string>).image} alt={voucher.name} className="w-full h-full object-cover rounded-xl" />
          : emoji}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-sm leading-tight truncate">{voucher.name}</p>
        <div className="flex items-center gap-2 mt-1">
          {hasDisc && <span className="text-slate-500 text-xs line-through">{formatCurrency(voucher.originalPrice)}</span>}
          <span className={cn('text-sm font-black', selected ? 'text-purple-300' : 'text-white')}>
            {formatCurrency(voucher.price)}
          </span>
          {discPct > 0 && (
            <span className="text-xs font-bold px-1.5 py-0.5 rounded-full text-green-400"
              style={{ background: 'rgba(16,185,129,0.1)' }}>
              -{discPct}%
            </span>
          )}
        </div>
        {voucher.rewardPoints > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <Award className="w-3 h-3 text-yellow-400" />
            <span className="text-yellow-400 text-xs font-medium">+{voucher.rewardPoints} pts</span>
          </div>
        )}
      </div>

      {/* Selector */}
      <div className={cn(
        'w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center transition-all',
        selected ? 'border-purple-500 scale-110' : 'border-white/20 group-hover:border-purple-400'
      )}
        style={selected ? { background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' } : {}}>
        {selected && <Zap className="w-3 h-3 text-white fill-white" />}
      </div>
    </button>
  );
}
