// components/ui/BannerCarousel.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Play, Info, Star, Calendar, Clock } from 'lucide-react';
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
  interval = 5000,
  className,
}: BannerCarouselProps) {
  const active = banners.filter(b => b.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
  const [cur, setCur] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  const next = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCur(c => (c + 1) % active.length);
    setProgress(0);
  }, [active.length]);
  
  const prev = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCur(c => (c - 1 + active.length) % active.length);
    setProgress(0);
  }, [active.length]);

  // Progress bar animation
  useEffect(() => {
    if (!autoPlay || paused || active.length <= 1) return;
    
    const startTime = Date.now();
    const animationFrame = requestAnimationFrame(function update() {
      const elapsed = Date.now() - startTime;
      const newProgress = (elapsed / interval) * 100;
      
      if (newProgress < 100) {
        setProgress(newProgress);
        requestAnimationFrame(update);
      } else {
        setProgress(0);
        setCur(c => (c + 1) % active.length);
      }
    });
    
    return () => cancelAnimationFrame(animationFrame);
  }, [autoPlay, paused, interval, active.length, cur]);

  if (active.length === 0) return null;

  const banner = active[cur];

  // Extract subtitle parts if it contains "·" (like "8.0 | 2025 · 2 Seasons · 13 Episodes")
  const parseSubtitle = (subtitle?: string) => {
    if (!subtitle) return null;
    const parts = subtitle.split('·').map(p => p.trim());
    return parts;
  };

  const subtitleParts = parseSubtitle(banner.subtitle);

  const BannerContent = () => (
    <div
      className="relative w-full overflow-hidden cursor-pointer group"
      style={{ aspectRatio: '16/7', minHeight: '450px', maxHeight: '700px' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        {active.map((b, i) => (
          <div
            key={i}
            className={cn(
              'absolute inset-0 transition-all duration-1000 ease-out',
              i === cur ? 'opacity-100 scale-100' : 'opacity-0 scale-110'
            )}
          >
            <img
              src={b.imageUrl}
              alt={b.title || `Banner ${i + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Gradient Overlay - Cinematic Style like Daredevil */}
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
      
      {/* Content Container */}
      <div className="relative h-full flex items-center px-8 md:px-16 lg:px-24">
        <div className="max-w-2xl space-y-4 animate-fade-in-up">
          
          {/* Title with Daredevil style - uppercase for certain words */}
          {banner.title && (
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-tight drop-shadow-2xl tracking-tight">
              {banner.title.split(' ').map((word, i) => {
                // Check if word is all uppercase (like DARE DEVIL)
                const isUppercase = word === word.toUpperCase() && word.length > 1;
                return (
                  <span key={i} className={isUppercase ? "text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500" : "text-white"}>
                    {word}{' '}
                  </span>
                );
              })}
            </h1>
          )}

          {/* Tagline / Subtitle with cinematic style */}
          {banner.subtitle && !subtitleParts && (
            <p className="text-xl md:text-2xl text-gray-300 font-semibold tracking-wide italic">
              {banner.subtitle}
            </p>
          )}

          {/* Meta Info with rating, year, seasons, episodes */}
          {subtitleParts && subtitleParts.length > 0 && (
            <div className="flex flex-wrap items-center gap-4 text-sm">
              {subtitleParts.map((part, idx) => {
                // Check if part contains rating (has . or /)
                if (part.includes('|') || part.includes('.')) {
                  const ratingMatch = part.match(/(\d+\.\d+)/);
                  if (ratingMatch) {
                    return (
                      <div key={idx} className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                        <span className="text-white font-bold">{ratingMatch[0]}</span>
                        <span className="text-gray-400 text-xs">/10</span>
                      </div>
                    );
                  }
                  return <span key={idx} className="text-gray-300">{part}</span>;
                }
                // Check if part contains Seasons or Episodes
                if (part.toLowerCase().includes('season') || part.toLowerCase().includes('episode')) {
                  return (
                    <div key={idx} className="flex items-center gap-1 text-gray-300">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{part}</span>
                    </div>
                  );
                }
                // Check if contains year
                if (part.match(/\d{4}/)) {
                  return (
                    <div key={idx} className="flex items-center gap-1 text-gray-300">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{part}</span>
                    </div>
                  );
                }
                // Check if contains status (ONGOING, COMPLETED, etc)
                if (part === 'ONGOING' || part === 'COMPLETED' || part === 'UPCOMING') {
                  return (
                    <div key={idx} className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-green-500 font-semibold uppercase text-xs">{part}</span>
                    </div>
                  );
                }
                return <span key={idx} className="text-gray-300">{part}</span>;
              })}
            </div>
          )}

          {/* Action Buttons - Netflix Style */}
          <div className="flex flex-wrap gap-4 pt-4">
            {banner.linkUrl && (
              <button
                onClick={() => window.open(banner.linkUrl, '_blank')}
                className="group flex items-center gap-2 px-8 py-3 rounded-lg font-bold transition-all duration-300 hover:scale-105 hover:gap-3 bg-white text-black hover:bg-gray-200 shadow-2xl"
              >
                <Play className="w-5 h-5 fill-black" />
                View Now
              </button>
            )}
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Optional: More info action
                console.log('More info clicked');
              }}
              className="flex items-center gap-2 px-8 py-3 rounded-lg font-bold transition-all duration-300 hover:bg-white/20 bg-white/10 backdrop-blur-sm text-white border border-white/30"
            >
              <Info className="w-5 h-5" />
              More Info
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Arrows - Netflix Style */}
      {active.length > 1 && (
        <>
          <button 
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:bg-white/20 z-20 opacity-0 group-hover:opacity-100 bg-black/50 backdrop-blur-sm border border-white/20"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <button 
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:bg-white/20 z-20 opacity-0 group-hover:opacity-100 bg-black/50 backdrop-blur-sm border border-white/20"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        </>
      )}

      {/* Dots Indicator - Netflix Style */}
      {active.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {active.map((_, i) => (
            <button 
              key={i} 
              onClick={(e) => {
                e.stopPropagation();
                setCur(i);
                setProgress(0);
              }}
              className="transition-all duration-300"
            >
              <div
                className={cn(
                  'rounded-full transition-all duration-300',
                  i === cur 
                    ? 'w-8 h-1.5 bg-white' 
                    : 'w-2 h-1.5 bg-white/50 hover:bg-white/80'
                )}
              />
            </button>
          ))}
        </div>
      )}

      {/* Progress Bar - Netflix Style */}
      {autoPlay && !paused && active.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 z-20">
          <div
            className="h-full bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 rounded-full transition-all duration-100 linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );

  // Render with or without Link wrapper
  return (
    <div className={cn(className, "relative")}>
      {banner.linkUrl ? (
        <Link href={banner.linkUrl}>
          <BannerContent />
        </Link>
      ) : (
        <BannerContent />
      )}
    </div>
  );
}