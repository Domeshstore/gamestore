'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, animate, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles, Zap } from 'lucide-react';
import { cn } from '@/lib/utils/format';

export interface Banner {
  _id?: string;
  imageUrl: string;
  title?: string;
  isActive: boolean;
  sortOrder: number;
}

interface Props {
  banners: Banner[];
  className?: string;
  interval?: number;
}

export default function BannerCarousel({
  banners,
  className,
  interval = 5000,
}: Props) {
  const active = banners
    .filter(b => b.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const [index, setIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const x = useMotionValue(0);
  const isDragging = useRef(false);
  const autoPlayTimeout = useRef<NodeJS.Timeout>();

  const clampIndex = (i: number) =>
    (i + active.length) % active.length;

  const snapTo = (newIndex: number) => {
    const clamped = clampIndex(newIndex);
    setIndex(clamped);
    animate(x, 0, {
      type: 'spring',
      stiffness: 200,
      damping: 25,
      mass: 0.5,
    });
  };

  const handleDragEnd = (_: any, info: any) => {
    isDragging.current = false;
    
    // Reset auto-play after drag
    setIsAutoPlaying(true);
    
    const threshold = 60;
    const velocity = info.velocity.x;

    if (info.offset.x < -threshold || velocity < -300) {
      snapTo(index + 1);
    } else if (info.offset.x > threshold || velocity > 300) {
      snapTo(index - 1);
    } else {
      snapTo(index);
    }
  };

  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const id = setInterval(() => {
      if (!isDragging.current) {
        snapTo(index + 1);
      }
    }, interval);

    return () => clearInterval(id);
  }, [index, interval, isAutoPlaying]);

  useEffect(() => {
    // Pause auto-play on hover
    const container = document.getElementById('carousel-container');
    if (!container) return;
    
    const handleMouseEnter = () => setIsAutoPlaying(false);
    const handleMouseLeave = () => setIsAutoPlaying(true);
    
    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      container.removeEventListener('mouseenter', handleMouseEnter);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  if (!active.length) return null;

  return (
    <div
      id="carousel-container"
      className={cn(
        'relative w-full py-8 md:py-16 flex flex-col items-center justify-center overflow-hidden',
        'bg-gradient-to-b from-transparent via-[#ea5234]/5 to-transparent',
        className
      )}
    >
      {/* Background glow effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-r from-[#ea5234]/20 via-purple-500/20 to-[#ea5234]/20 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      {/* Carousel Container */}
      <motion.div
        className="relative w-full max-w-7xl h-[280px] sm:h-[350px] md:h-[500px] flex items-center justify-center cursor-grab active:cursor-grabbing"
        style={{ perspective: '1200px', x }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.1}
        onDragStart={() => {
          isDragging.current = true;
          setIsAutoPlaying(false);
        }}
        onDragEnd={handleDragEnd}
      >
        <AnimatePresence mode="wait">
          {active.map((b, i) => {
            const offset = i - index;
            const isActive = i === index;
            
            if (Math.abs(offset) > 3) return null;

            return (
              <motion.div
                key={b._id || i}
                className="absolute"
                initial={{ opacity: 0 }}
                animate={{
                  x: offset * (typeof window !== 'undefined' && window.innerWidth < 768 ? 240 : 380),
                  scale: isActive ? 1 : 0.85,
                  rotateY: typeof window !== 'undefined' && window.innerWidth < 768
                    ? offset * -8
                    : offset * -20,
                  opacity: isActive ? 1 : 0.4,
                  zIndex: isActive ? 20 : 10 - Math.abs(offset),
                }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 30,
                  mass: 0.8,
                }}
              >
                <motion.div
                  className="relative rounded-2xl overflow-hidden shadow-2xl"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Animated gradient border */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-[#ea5234]/0 via-[#ea5234]/80 to-[#ea5234]/0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-pulse" />
                  
                  {/* Background Layer (slow parallax) */}
                  <motion.img
                    src={b.imageUrl}
                    alt={b.title}
                    className="absolute inset-0 w-full h-full object-cover scale-110 blur-md opacity-30"
                    style={{
                      x: x.get() * 0.02,
                    }}
                    draggable={false}
                  />

                  {/* Main Image */}
                  <motion.img
                    src={b.imageUrl}
                    alt={b.title || 'Banner'}
                    className="relative w-[320px] h-[180px] sm:w-[400px] sm:h-[240px] md:w-[800px] md:h-[450px] object-cover z-10"
                    style={{
                      x: x.get() * 0.05,
                    }}
                    draggable={false}
                  />

                  {/* Foreground Layer (fast parallax) */}
                  <motion.div
                    className="absolute inset-0 z-20 pointer-events-none"
                    style={{
                      x: x.get() * 0.1,
                    }}
                  >
                   
                    {/* Light streak */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  </motion.div>

                  {/* Cinematic Light Effect */}
                  <motion.div
                    className="absolute inset-0 pointer-events-none z-30"
                    animate={{
                      opacity: isActive ? [0.2, 0.4, 0.2] : 0.1,
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      repeatType: 'reverse',
                    }}
                    style={{
                      background: 'radial-gradient(circle at 50% 40%, rgba(234,82,52,0.3), transparent 70%)',
                    }}
                  />

                  {/* Vignette Effect */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-black/50 pointer-events-none z-30" />

                  {/* Top Light Reflection */}
                  <div className="absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-white/30 to-transparent pointer-events-none z-30" />

                  {/* Bottom Reflection */}
                  <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-white/20 to-transparent pointer-events-none z-30" />

                  {/* Title Overlay (if title exists) */}
                  {b.title && isActive && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="absolute bottom-4 left-4 right-4 z-40 bg-gradient-to-r from-black/60 to-transparent backdrop-blur-sm px-4 py-2 rounded-lg"
                    >
                      <h3 className="text-white font-bold text-sm md:text-lg">
                        {b.title}
                      </h3>
                    </motion.div>
                  )}

                  {/* Active indicator badge */}
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="absolute top-3 right-3 z-40 bg-gradient-to-r from-[#ea5234] to-purple-500 rounded-full px-3 py-1 text-white text-[10px] font-bold shadow-lg flex items-center gap-1"
                    >
                      <Zap size={10} />
                      FEATURED
                    </motion.div>
                  )}
                </motion.div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Navigation Buttons - Enhanced */}
      <div className="hidden md:block">
        <motion.button
          whileHover={{ scale: 1.1, x: -3 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            setIsAutoPlaying(false);
            snapTo(index - 1);
            setTimeout(() => setIsAutoPlaying(true), 5000);
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-40 w-12 h-12 rounded-full bg-black/50 backdrop-blur-md text-white flex items-center justify-center hover:bg-[#ea5234]/80 transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          <ChevronLeft size={24} />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1, x: 3 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            setIsAutoPlaying(false);
            snapTo(index + 1);
            setTimeout(() => setIsAutoPlaying(true), 5000);
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-40 w-12 h-12 rounded-full bg-black/50 backdrop-blur-md text-white flex items-center justify-center hover:bg-[#ea5234]/80 transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          <ChevronRight size={24} />
        </motion.button>
      </div>

      {/* Dot Indicators - Enhanced */}
      <div className="flex gap-3 mt-6 md:mt-8">
        {active.map((_, i) => (
          <motion.button
            key={i}
            onClick={() => {
              setIsAutoPlaying(false);
              snapTo(i);
              setTimeout(() => setIsAutoPlaying(true), 5000);
            }}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
          >
            <motion.div
              className={cn(
                'rounded-full transition-all duration-300',
                i === index
                  ? 'bg-gradient-to-r from-[#ea5234] to-purple-500 shadow-lg shadow-[#ea5234]/30'
                  : 'bg-gray-500/50 hover:bg-gray-400'
              )}
              animate={{
                width: i === index ? 32 : 8,
                height: 8,
              }}
              whileHover={{
                width: i === index ? 32 : 16,
              }}
            />
          </motion.button>
        ))}
      </div>

      {/* Auto-play indicator */}
      <motion.div 
        className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: isAutoPlaying ? 0.5 : 0 }}
      >
        <Sparkles size={12} className="text-[#ea5234]" />
        <span className="text-[10px] text-gray-400">Auto playing</span>
      </motion.div>
    </div>
  );
}