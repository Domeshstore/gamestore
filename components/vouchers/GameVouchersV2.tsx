'use client';

import { useState } from 'react';
import { Voucher, Game } from '@/types';
import VoucherCard from './VoucherCard';
import { Gift, Star, Grid3X3, List, Flame } from 'lucide-react';
import { cn } from '@/lib/utils/format';

interface GameVouchersProps {
  game: Game;
  vouchers: Voucher[];
  selectedVoucher: Voucher | null;
  onSelect: (v: Voucher) => void;
}

export default function GameVouchers({ game, vouchers, selectedVoucher, onSelect }: GameVouchersProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  if (vouchers.length === 0) {
    return (
      <div className="text-center py-14">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.15)' }}>
          <Gift className="w-8 h-8 text-purple-400" />
        </div>
        <h3 className="text-white font-bold text-lg mb-2">Belum Ada Voucher</h3>
        <p className="text-slate-400 text-sm">Voucher untuk {game.name} belum tersedia.</p>
      </div>
    );
  }

  const bestSellers  = vouchers.filter(v => v.isFeatured);
  const regularVouchers = vouchers.filter(v => !v.isFeatured);

  return (
    <div className="space-y-8">
      {/* ── Best Seller Section ── */}
      {bestSellers.length > 0 && (
        <div>
          {/* Section header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="h-8 w-1.5 rounded-full" style={{ background: 'linear-gradient(180deg, #f59e0b, #ef4444)' }} />
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-400" />
              <h2 className="text-xl font-black text-white">Best Seller</h2>
            </div>
            <span className="chip text-slate-400 text-xs">Paling Laris</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {bestSellers.map(v => (
              <VoucherCard
                key={v._id}
                voucher={v}
                variant="featured"
                selected={selectedVoucher?._id === v._id}
                onSelect={onSelect}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── All Vouchers ── */}
      {regularVouchers.length > 0 && (
        <div>
          {/* Section header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="h-8 w-1.5 rounded-full" style={{ background: 'linear-gradient(180deg, #7c3aed, #4f46e5)' }} />
              <h2 className="text-xl font-black text-white">Semua Voucher</h2>
              <span className="chip text-slate-400 text-xs">{regularVouchers.length} item</span>
            </div>

            {/* View toggle */}
            <div className="flex rounded-xl overflow-hidden p-1"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              {([['grid', Grid3X3], ['list', List]] as const).map(([mode, Icon]) => (
                <button key={mode} onClick={() => setViewMode(mode)}
                  className="p-2 rounded-lg transition-all"
                  style={viewMode === mode
                    ? { background: 'rgba(124,58,237,0.3)', color: 'white' }
                    : { color: 'rgba(148,163,184,0.6)' }}>
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {regularVouchers.map(v => (
                <VoucherCard
                  key={v._id}
                  voucher={v}
                  variant="default"
                  selected={selectedVoucher?._id === v._id}
                  onSelect={onSelect}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {regularVouchers.map(v => (
                <VoucherCard
                  key={v._id}
                  voucher={v}
                  variant="default"
                  selected={selectedVoucher?._id === v._id}
                  onSelect={onSelect}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
