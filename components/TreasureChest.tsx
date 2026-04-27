'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Sparkles, Coins, Lock, Unlock, Trophy } from 'lucide-react';

interface TreasureChestProps {
  onOpen?: () => void;
  onCoinsCollected?: (amount: number) => void;
  coinsAmount?: number;
  isOpening?: boolean;
  autoPlay?: boolean;
}

export default function TreasureChest({ 
  onOpen, 
  onCoinsCollected, 
  coinsAmount = 100,
  isOpening = false,
  autoPlay = false 
}: TreasureChestProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [coins, setCoins] = useState<{ id: number; x: number; y: number; delay: number }[]>([]);
  const [showSparkles, setShowSparkles] = useState(false);
  const [showGlow, setShowGlow] = useState(false);

  // Auto play animation
  useEffect(() => {
    if (autoPlay && !isOpen) {
      const timer = setTimeout(() => {
        handleOpen();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoPlay]);

  // Trigger open from parent
  useEffect(() => {
    if (isOpening && !isOpen) {
      handleOpen();
    }
  }, [isOpening]);

  const handleOpen = () => {
    if (isOpen) return;
    
    setIsOpen(true);
    setShowGlow(true);
    onOpen?.();
    
    // Generate flying coins
    const newCoins = [];
    for (let i = 0; i < 20; i++) {
      newCoins.push({
        id: i,
        x: (Math.random() - 0.5) * 200,
        y: (Math.random() - 0.5) * 150 - 50,
        delay: i * 0.05,
      });
    }
    setCoins(newCoins);
    
    // Show sparkles
    setShowSparkles(true);
    setTimeout(() => setShowSparkles(false), 1500);
    
    // Hide glow after animation
    setTimeout(() => setShowGlow(false), 2000);
    
    // Callback with coins amount
    setTimeout(() => {
      onCoinsCollected?.(coinsAmount);
    }, 500);
  };

  const handleReset = () => {
    setIsOpen(false);
    setCoins([]);
    setShowSparkles(false);
    setShowGlow(false);
  };

  return (
    <div className="relative flex flex-col items-center justify-center">
      {/* Glow Effect */}
      <AnimatePresence>
        {showGlow && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1.5 }}
            exit={{ opacity: 0, scale: 2 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 -z-10"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 rounded-full blur-3xl opacity-60" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <div className="relative cursor-pointer" onClick={handleOpen}>
        {/* Sparkles Effect */}
        <AnimatePresence>
          {showSparkles && (
            <>
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={`sparkle-${i}`}
                  initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                  animate={{ 
                    opacity: [0, 1, 0],
                    scale: [0, 1.5, 0],
                    x: (Math.random() - 0.5) * 100,
                    y: (Math.random() - 0.5) * 100 - 50
                  }}
                  transition={{ duration: 0.8, delay: i * 0.05 }}
                  className="absolute top-1/2 left-1/2"
                >
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                </motion.div>
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Treasure Chest SVG */}
        <motion.div
          animate={isOpen ? { scale: 1.1, rotate: [0, -5, 5, 0] } : { scale: 1 }}
          transition={{ duration: 0.3 }}
          className="relative"
        >
          <svg
            width="200"
            height="180"
            viewBox="0 0 200 180"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Chest Shadow */}
            <motion.ellipse
              cx="100"
              cy="170"
              rx="80"
              ry="10"
              fill="rgba(0,0,0,0.3)"
              animate={isOpen ? { opacity: 0.5, scale: 0.8 } : { opacity: 0.3, scale: 1 }}
            />
            
            {/* Chest Bottom */}
            <rect
              x="25"
              y="90"
              width="150"
              height="75"
              rx="8"
              fill="url(#chestGradient)"
              stroke="#b45309"
              strokeWidth="2"
            />
            
            {/* Chest Bottom Detail */}
            <rect
              x="35"
              y="100"
              width="130"
              height="55"
              rx="4"
              fill="#78350f"
              opacity="0.5"
            />
            
            {/* Metal Bands */}
            <rect x="25" y="115" width="150" height="6" fill="#d97706" />
            <rect x="25" y="140" width="150" height="6" fill="#d97706" />
            
            {/* Lock */}
            {!isOpen && (
              <motion.g
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <circle cx="100" cy="110" r="12" fill="#fbbf24" stroke="#b45309" strokeWidth="2" />
                <rect x="97" y="110" width="6" height="8" fill="#b45309" />
                <circle cx="100" cy="108" r="3" fill="#fef3c7" />
              </motion.g>
            )}
            
            {/* Chest Lid */}
            <motion.g
              animate={isOpen ? { rotateX: -180, y: -30 } : { rotateX: 0, y: 0 }}
              transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
              style={{ transformOrigin: "100px 90px", transformStyle: "preserve-3d" }}
            >
              <path
                d="M25 90 L100 45 L175 90 Z"
                fill="url(#lidGradient)"
                stroke="#b45309"
                strokeWidth="2"
              />
              <path
                d="M25 90 L100 60 L175 90 Z"
                fill="#78350f"
                opacity="0.3"
              />
              {/* Lid Metal Strip */}
              <line x1="25" y1="90" x2="175" y2="90" stroke="#d97706" strokeWidth="3" />
            </motion.g>

            {/* Gems on Chest */}
            <circle cx="50" cy="100" r="5" fill="#10b981" opacity={isOpen ? 0 : 0.8} />
            <circle cx="150" cy="100" r="5" fill="#10b981" opacity={isOpen ? 0 : 0.8} />
            <circle cx="100" cy="95" r="7" fill="#ef4444" opacity={isOpen ? 0 : 0.8} />

            {/* Gradients */}
            <defs>
              <linearGradient id="chestGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#92400e" />
                <stop offset="100%" stopColor="#451a03" />
              </linearGradient>
              <linearGradient id="lidGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#b45309" />
                <stop offset="100%" stopColor="#78350f" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>
      </div>

      {/* Flying Coins Animation */}
      <AnimatePresence>
        {coins.map((coin) => (
          <motion.div
            key={`coin-${coin.id}`}
            initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
            animate={{ 
              opacity: [0, 1, 1, 0],
              scale: [0, 1.2, 1, 0],
              x: coin.x,
              y: coin.y
            }}
            transition={{ duration: 0.8, delay: coin.delay }}
            className="absolute top-1/2 left-1/2"
          >
            <Coins className="w-6 h-6 text-yellow-400" />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Reset Button (for demo) */}
      {isOpen && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          onClick={handleReset}
          className="mt-6 px-4 py-2 text-sm font-medium text-amber-400 hover:text-amber-300 transition-colors"
        >
          Reset Treasure
        </motion.button>
      )}
    </div>
  );
}