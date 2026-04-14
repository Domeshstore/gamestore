'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/format';

export interface Banner {
  _id?: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  linkUrl?: string;
  isActive: boolean;
  sortOrder: number;
}

interface BannerCarouselProps {
  banners: Banner[];
  autoPlay?: boolean;
  interval?: number;
  className?: string;
}

export default function BannerCarousel({
  banners,
  autoPlay = true,
  interval = 4000,
  className,
}: BannerCarouselProps) {
  const active = banners.filter(b => b.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
  const [cur, setCur] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation(); // Mencegah event propagation ke Link
    setCur(c => (c + 1) % active.length);
  }, [active.length]);
  
  const prev = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation(); // Mencegah event propagation ke Link
    setCur(c => (c - 1 + active.length) % active.length);
  }, [active.length]);

  useEffect(() => {
    if (!autoPlay || paused || active.length <= 1) return;
    const t = setInterval(() => setCur(c => (c + 1) % active.length), interval);
    return () => clearInterval(t);
  }, [autoPlay, paused, interval, active.length]);

  if (active.length === 0) return null;

  const banner = active[cur];

  // Konten banner (tanpa Link di luar)
  const BannerContent = () => (
    <div
      className="relative w-full overflow-hidden rounded-2xl cursor-pointer"
      style={{ aspectRatio: '3/1', minHeight: '160px', maxHeight: '380px' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides */}
      <div className="relative w-full h-full">
        {active.map((b, i) => (
          <div
            key={i}
            className={cn(
              'absolute inset-0 transition-all duration-700 ease-in-out',
              i === cur ? 'opacity-100 translate-x-0' : i < cur ? 'opacity-0 -translate-x-full' : 'opacity-0 translate-x-full'
            )}
          >
            {/* Background image */}
            <img
              src={b.imageUrl}
              alt={b.title || `Banner ${i + 1}`}
              className="w-full h-full object-cover"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0"
              style={{ background: 'linear-gradient(90deg, rgba(13,2,33,0.8) 0%, rgba(13,2,33,0.3) 50%, transparent 100%)' }} />
            {/* Text content */}
            {(b.title || b.subtitle) && (
              <div className="absolute inset-0 flex items-center px-8 md:px-12">
                <div className="max-w-md">
                  {b.title && (
                    <h2 className="text-white font-black text-xl md:text-3xl leading-tight mb-2 drop-shadow-lg">
                      {b.title}
                    </h2>
                  )}
                  {b.subtitle && (
                    <p className="text-slate-200 text-sm md:text-base drop-shadow">{b.subtitle}</p>
                  )}
                  {b.linkUrl && (
                    <div className="mt-4">
                      <span 
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-105"
                        style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', boxShadow: '0 4px 16px rgba(124,58,237,0.4)' }}
                        onClick={(e) => e.stopPropagation()} // Mencegah double navigation
                      >
                        Lihat Sekarang →
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Arrows - dengan stopPropagation */}
      {active.length > 1 && (
        <>
          <button 
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110 z-10"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <button 
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110 z-10"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </>
      )}

      {/* Dots */}
      {active.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {active.map((_, i) => (
            <button 
              key={i} 
              onClick={(e) => {
                e.stopPropagation();
                setCur(i);
              }}
              className={cn('rounded-full transition-all duration-300', i === cur ? 'w-6 h-2' : 'w-2 h-2')}
              style={{
                background: i === cur
                  ? 'linear-gradient(90deg, #7c3aed, #0ea5e9)'
                  : 'rgba(255,255,255,0.35)',
              }} 
            />
          ))}
        </div>
      )}

      {/* Progress bar */}
      {autoPlay && !paused && active.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5"
          style={{ background: 'rgba(255,255,255,0.1)' }}>
          <div className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, #7c3aed, #0ea5e9)',
              width: `${((cur + 1) / active.length) * 100}%`,
              transition: `width ${interval}ms linear`,
            }} />
        </div>
      )}
    </div>
  );

  // Render dengan atau tanpa Link, tapi navigasi tetap terpisah
// Ganti bagian return di akhir dengan ini:
return (
  <div className={className}>
    {banner.linkUrl ? (
      <div onClick={() => window.location.href = banner.linkUrl!}>
        <BannerContent />
      </div>
    ) : (
      <BannerContent />
    )}
  </div>
);
}