// components/ui/BannerCarousel.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Play, Info, Star, Calendar, Clock, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils/format';

export interface Banner {
  _id?: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  linkUrl?: string;
  isActive: boolean;
  sortOrder: number;
  logoUrl?: string;
  ageRating?: string;
  genres?: string[];
}

interface BannerCarouselProps {
  banners: Banner[];
  autoPlay?: boolean;
  interval?: number;
  className?: string;
  showMuteToggle?: boolean;
}

export default function BannerCarousel({
  banners,
  autoPlay = true,
  interval = 5000,
  className,
  showMuteToggle = false,
}: BannerCarouselProps) {
  const active = banners.filter(b => b.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
  const [cur, setCur] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [imageLoaded, setImageLoaded] = useState<boolean[]>([]);
  const [isMuted, setIsMuted] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setImageLoaded(new Array(active.length).fill(false));
  }, [active.length]);

  const next = useCallback(() => {
    setCur(c => (c + 1) % active.length);
    setProgress(0);
  }, [active.length]);
  
  const prev = useCallback(() => {
    setCur(c => (c - 1 + active.length) % active.length);
    setProgress(0);
  }, [active.length]);

  const handleImageLoad = (index: number) => {
    setImageLoaded(prev => {
      const next = [...prev];
      next[index] = true;
      return next;
    });
  };

  // Progress bar animation
  useEffect(() => {
    if (!autoPlay || paused || active.length <= 1) return;
    
    const startTime = Date.now();
    let animationFrame: number;
    
    const update = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = (elapsed / interval) * 100;
      
      if (newProgress < 100) {
        setProgress(newProgress);
        animationFrame = requestAnimationFrame(update);
      } else {
        setProgress(0);
        setCur(c => (c + 1) % active.length);
      }
    };
    
    animationFrame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrame);
  }, [autoPlay, paused, interval, active.length, cur]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        prev();
      } else if (e.key === 'ArrowRight') {
        next();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [next, prev]);

  if (active.length === 0) return null;

  const banner = active[cur];

  const parseSubtitle = (subtitle?: string) => {
    if (!subtitle) return null;
    return subtitle.split('·').map(p => p.trim());
  };

  const subtitleParts = parseSubtitle(banner.subtitle);

  // Handle navigation without affecting Link
  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    prev();
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    next();
  };

  const handleDotClick = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setCur(index);
    setProgress(0);
  };

  const handleWatchClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (banner.linkUrl) {
      window.open(banner.linkUrl, '_blank');
    }
  };

  const handleMoreInfoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Add your more info logic here
    console.log('More info:', banner.title);
  };

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMuted(!isMuted);
  };

  return (
    <div className={cn("relative w-full overflow-hidden rounded-lg shadow-2xl", className)}>
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden cursor-pointer group/banner"
        style={{ aspectRatio: '16/7', minHeight: '450px', maxHeight: '700px' }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Background Images */}
        <div className="absolute inset-0 bg-black">
          {active.map((b, i) => (
            <div
              key={i}
              className={cn(
                'absolute inset-0 transition-all duration-1000 ease-out will-change-transform',
                i === cur ? 'opacity-100 scale-100' : 'opacity-0 scale-110 pointer-events-none'
              )}
            >
              {!imageLoaded[i] && (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black animate-pulse" />
              )}
              
              <img
                src={b.imageUrl}
                alt={b.title || `Banner ${i + 1}`}
                className="w-full h-full object-cover transition-opacity duration-500"
                loading={i === cur ? 'eager' : 'lazy'}
                onLoad={() => handleImageLoad(i)}
                style={{ opacity: imageLoaded[i] ? 1 : 0 }}
              />
            </div>
          ))}
        </div>

        {/* Clickable overlay for navigation */}
        {banner.linkUrl && (
          <Link 
            href={banner.linkUrl}
            className="absolute inset-0 z-10"
            aria-label={banner.title || 'View details'}
          />
        )}

        {/* Cinematic Gradient Overlays - placed above Link */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 via-40% to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 via-70% to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/70 pointer-events-none" />
        <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.8)] pointer-events-none" />

        {/* Content Container - above Link but buttons need to be clickable */}
        <div className="relative h-full flex items-center px-6 sm:px-12 md:px-16 lg:px-24 z-20 pointer-events-none">
          <div className="max-w-2xl lg:max-w-3xl space-y-4 md:space-y-6 pointer-events-auto">
            
            {banner.logoUrl && (
              <img 
                src={banner.logoUrl} 
                alt="Logo" 
                className="h-16 md:h-20 lg:h-24 w-auto object-contain animate-fade-in-up"
              />
            )}

            {banner.title && !banner.logoUrl && (
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.1] drop-shadow-2xl tracking-tight animate-fade-in-up">
                {banner.title.split(' ').map((word, i) => {
                  const isUppercase = word === word.toUpperCase() && word.length > 1;
                  return (
                    <span 
                      key={i} 
                      className={cn(
                        isUppercase && "text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500",
                        "inline-block"
                      )}
                    >
                      {word}{' '}
                    </span>
                  );
                })}
              </h1>
            )}

            {banner.subtitle && !subtitleParts && (
              <p className="text-lg sm:text-xl md:text-2xl text-gray-200 font-semibold tracking-wide italic drop-shadow-lg animate-fade-in-up animation-delay-100">
                {banner.subtitle}
              </p>
            )}

            {subtitleParts && subtitleParts.length > 0 && (
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm md:text-base animate-fade-in-up animation-delay-200">
                {banner.ageRating && (
                  <span className="px-2 py-1 text-xs font-bold bg-gray-800/80 backdrop-blur-sm text-white rounded border border-white/20">
                    {banner.ageRating}
                  </span>
                )}

                {subtitleParts.map((part, idx) => {
                  if (part.includes('|') || part.includes('.')) {
                    const ratingMatch = part.match(/(\d+\.\d+)/);
                    if (ratingMatch) {
                      return (
                        <div key={idx} className="flex items-center gap-1.5">
                          <Star className="w-4 h-4 fill-yellow-500 text-yellow-500 drop-shadow" />
                          <span className="text-white font-bold">{ratingMatch[0]}</span>
                          <span className="text-gray-400 text-xs font-medium">/10</span>
                        </div>
                      );
                    }
                    return <span key={idx} className="text-gray-300 font-medium">{part}</span>;
                  }
                  
                  if (part.toLowerCase().includes('season') || part.toLowerCase().includes('episode')) {
                    return (
                      <div key={idx} className="flex items-center gap-1.5 text-gray-200">
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">{part}</span>
                      </div>
                    );
                  }
                  
                  if (part.match(/\d{4}/)) {
                    return (
                      <div key={idx} className="flex items-center gap-1.5 text-gray-200">
                        <Calendar className="w-4 h-4" />
                        <span className="font-medium">{part}</span>
                      </div>
                    );
                  }
                  
                  if (part === 'ONGOING' || part === 'COMPLETED' || part === 'UPCOMING') {
                    const statusColors = {
                      ONGOING: 'bg-green-500',
                      COMPLETED: 'bg-blue-500',
                      UPCOMING: 'bg-yellow-500'
                    };
                    return (
                      <div key={idx} className="flex items-center gap-1.5">
                        <div className={cn(
                          "w-2 h-2 rounded-full animate-pulse",
                          statusColors[part as keyof typeof statusColors] || 'bg-gray-500'
                        )} />
                        <span className={cn(
                          "font-bold uppercase text-xs tracking-wider",
                          part === 'ONGOING' && "text-green-400",
                          part === 'COMPLETED' && "text-blue-400",
                          part === 'UPCOMING' && "text-yellow-400"
                        )}>
                          {part}
                        </span>
                      </div>
                    );
                  }
                  
                  return <span key={idx} className="text-gray-300 font-medium">{part}</span>;
                })}

                {banner.genres && banner.genres.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-300">{banner.genres.join(' • ')}</span>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 sm:gap-4 pt-4 md:pt-6 animate-fade-in-up animation-delay-300">
              <button
                onClick={handleWatchClick}
                className="group relative flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 rounded-lg font-bold transition-all duration-300 hover:scale-105 active:scale-95 bg-white text-black hover:bg-gray-100 shadow-xl hover:shadow-2xl"
              >
                <Play className="w-5 h-5 fill-black transition-transform group-hover:scale-110" />
                <span>View Now</span>
              </button>
              
              <button
                onClick={handleMoreInfoClick}
                className="group relative flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 rounded-lg font-semibold transition-all duration-300 hover:scale-105 active:scale-95 bg-gray-500/20 hover:bg-gray-500/30 backdrop-blur-md text-white border border-white/20 hover:border-white/40 shadow-lg"
              >
                <Info className="w-5 h-5 transition-transform group-hover:scale-110" />
                <span>More Info</span>
              </button>
            </div>
          </div>
        </div>

        {/* Top Right Controls */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-3 z-30">
          {showMuteToggle && (
            <button
              onClick={handleMuteToggle}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-sm border border-white/20 text-white hover:bg-black/60 transition-all duration-300"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          )}
          
          <div className="px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 text-white text-sm font-medium">
            <span className="text-white font-bold">{cur + 1}</span>
            <span className="text-gray-400"> / {active.length}</span>
          </div>
        </div>

        {/* Navigation Arrows */}
        {active.length > 1 && (
          <>
            <button 
              onClick={handlePrev}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 bg-black/40 hover:bg-black/60 backdrop-blur-sm border border-white/20 hover:border-white/40 z-30 opacity-0 group-hover/banner:opacity-100"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </button>
            <button 
              onClick={handleNext}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 bg-black/40 hover:bg-black/60 backdrop-blur-sm border border-white/20 hover:border-white/40 z-30 opacity-0 group-hover/banner:opacity-100"
              aria-label="Next slide"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </button>
          </>
        )}

        {/* Dots Indicator */}
        {active.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-30">
            {active.map((_, i) => (
              <button 
                key={i} 
                onClick={(e) => handleDotClick(e, i)}
                className="group/dot transition-all duration-300 p-1.5 -m-1.5"
                aria-label={`Go to slide ${i + 1}`}
              >
                <div
                  className={cn(
                    'h-1 rounded-full transition-all duration-300',
                    i === cur 
                      ? 'w-8 bg-white shadow-lg shadow-white/30' 
                      : 'w-2 bg-white/40 group-hover/dot:bg-white/60 group-hover/dot:w-3'
                  )}
                />
              </button>
            ))}
          </div>
        )}

        {/* Progress Bar */}
        {autoPlay && !paused && active.length > 1 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-30">
            <div
              className="h-full bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 rounded-r-full transition-all duration-75 ease-linear shadow-[0_0_10px_rgba(239,68,68,0.5)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
      
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }
        
        .animation-delay-100 {
          animation-delay: 100ms;
          opacity: 0;
        }
        
        .animation-delay-200 {
          animation-delay: 200ms;
          opacity: 0;
        }
        
        .animation-delay-300 {
          animation-delay: 300ms;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}