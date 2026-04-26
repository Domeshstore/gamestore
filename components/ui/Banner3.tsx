'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
  interval = 30000,
}: Props) {
  const active = banners
    .filter(b => b.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const [index, setIndex] = useState(0);
  const x = useMotionValue(0);
  const isDragging = useRef(false);

  const clampIndex = (i: number) =>
    (i + active.length) % active.length;

  const snapTo = (newIndex: number) => {
    const clamped = clampIndex(newIndex);
    setIndex(clamped);
    animate(x, 0, {
      type: 'spring',
      stiffness: 120,
      damping: 20,
    });
  };

  const handleDragEnd = (_: any, info: any) => {
    isDragging.current = false;

    const threshold = 80; // 🔥 lebih kecil buat mobile
    const velocity = info.velocity.x;

    if (info.offset.x < -threshold || velocity < -400) {
      snapTo(index + 1);
    } else if (info.offset.x > threshold || velocity > 400) {
      snapTo(index - 1);
    } else {
      snapTo(index);
    }
  };

  useEffect(() => {
    const id = setInterval(() => {
      if (!isDragging.current) {
        snapTo(index + 1);
      }
    }, interval);

    return () => clearInterval(id);
  }, [index, interval]);

  if (!active.length) return null;

  return (
    <div
      className={cn(
        'relative w-full py-12 md:py-24 flex flex-col items-center justify-center overflow-hidden',
        className
      )}
    >
      {/* CAROUSEL */}
      <motion.div
        className="relative w-full max-w-7xl h-[240px] sm:h-[300px] md:h-[420px] flex items-center justify-center cursor-grab active:cursor-grabbing"
        style={{ perspective: '1920px', x }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragStart={() => (isDragging.current = true)}
        onDragEnd={handleDragEnd}
      >
        {active.map((b, i) => {
          const offset = i - index;

          if (Math.abs(offset) > 3) return null;

          return (
            <motion.div
              key={i}
              className="absolute"
              animate={{
                x:
                  offset *
                  (typeof window !== 'undefined' && window.innerWidth < 768
                    ? 220 // 📱 mobile lebih rapat
                    : 320),
                scale: i === index ? 1 : 0.85,
                rotateY:
                  typeof window !== 'undefined' && window.innerWidth < 768
                    ? offset * -10 // 📱 lebih subtle
                    : offset * -25,
                opacity: i === index ? 1 : 0.5,
                zIndex: i === index ? 10 : 5 - Math.abs(offset),
              }}
              transition={{
                type: 'spring',
                stiffness: 120,
                damping: 20,
              }}
            >
              <motion.div
  className="relative rounded-xl md:rounded-2xl overflow-hidden shadow-xl md:shadow-2xl bg-black"
>
  {/* 🟦 BACKGROUND LAYER (slow) */}
  <motion.img
    src={b.imageUrl}
    alt={b.title}
    className="absolute inset-0 w-full h-full object-cover scale-110 blur-sm opacity-50"
    style={{
      x: x.get() * 0.03, // paling lambat
    }}
    draggable={false}
  />

  {/* 🟩 MAIN IMAGE */}
  <motion.img
    src={b.imageUrl}
    alt={b.title}
    className="relative w-[300px] h-[150px] sm:w-[320px] sm:h-[200px] md:w-[700px] md:h-[400px] object-cover z-10"
    style={{
      x: x.get() * 0.08,
    }}
    draggable={false}
  />

  {/* 🟨 FOREGROUND LAYER (fast) */}
  <motion.div
    className="absolute inset-0 z-20 pointer-events-none"
    style={{
      x: x.get() * 0.12, // paling cepat
    }}
  >
    {/* grain / noise overlay */}
    <div className="absolute inset-0 opacity-[0.05] bg-[url('/noise.png')]" />

    {/* subtle light streak */}
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
  </motion.div>

  {/* 🎬 CINEMATIC LIGHT */}
  <motion.div
    className="absolute inset-0 pointer-events-none z-30"
    animate={{
      opacity: i === index ? 0.35 : 0.15,
    }}
    style={{
      background:
        'radial-gradient(circle at 50% 40%, rgba(255,255,255,0.4), transparent 60%)',
    }}
  />

  {/* 🎥 VIGNETTE */}
  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/30 pointer-events-none z-30" />

  {/* ✨ TOP LIGHT */}
  <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/10 to-transparent pointer-events-none z-30" />

  {/* 💡 REFLECTION */}
  <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-white/10 to-transparent pointer-events-none z-30" />
</motion.div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* NAV (hidden di mobile optional) */}
      <div className="hidden md:block">
        <button
          onClick={() => snapTo(index - 1)}
          className="absolute left-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/30 backdrop-blur text-white flex items-center justify-center"
        >
          <ChevronLeft />
        </button>

        <button
          onClick={() => snapTo(index + 1)}
          className="absolute right-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/30 backdrop-blur text-white flex items-center justify-center"
        >
          <ChevronRight />
        </button>
      </div>

      {/* DOT */}
      <div className="flex gap-2 mt-4 md:mt-6">
        {active.map((_, i) => (
          <button key={i} onClick={() => snapTo(i)}>
            <div
              className={cn(
                'h-2 rounded-full transition-all',
                i === index
                  ? 'w-5 md:w-6 bg-orange-500'
                  : 'w-2 bg-gray-300'
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}