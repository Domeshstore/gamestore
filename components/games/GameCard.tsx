// components/games/GameCard.tsx
import Link from 'next/link';
import { Card, Tag, Badge } from 'antd';
import { FireOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { Game } from '@/types';

const CARD_COLORS = ['card-sky','card-purple','card-lime','card-amber','card-coral','card-pink','card-dark','card-emerald'];
const EMOJIS: Record<string, string> = {
  'mobile-legends':'','free-fire':'','pubg-mobile':'','genshin-impact':'',
  'valorant':'','netflix':'','spotify':'','youtube-premium':'',
  'nordvpn':'','disney-hotstar':'',
};

function hashColor(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return CARD_COLORS[Math.abs(h) % CARD_COLORS.length];
}

// Helper function to get the correct URL based on game category
function getProductUrl(game: Game): string {
  const category = game.category || 'game';
  
  switch (category) {
    case 'pulsa':
      return `/dashboard/topup?type=pulsa&product=${game.slug}`;
    case 'paket-data':
      return '/dashboard/topup?type=paket_data';
    case 'pln':
      return '/dashboard/topup?type=pln';
    case 'e-money':
      return `/dashboard/games/${game.slug}`;
    case 'streaming':
      return `/dashboard/games/${game.slug}`;
    case 'game':
    default:
      return `/dashboard/games/${game.slug}`;
  }
}

// Helper function to get badge based on game category
function getProductBadge(category: string) {
  switch (category) {
    case 'pulsa':
      return { label: 'Pulsa', color: '#10b981' };
    case 'paket-data':
      return { label: 'Paket Data', color: '#3b82f6' };
    case 'pln':
      return { label: 'Token PLN', color: '#f59e0b' };
    case 'e-money':
      return { label: 'E-Money', color: '#8b5cf6' };
    case 'streaming':
      return { label: 'Streaming', color: '#ec489a' };
    case 'voucher':
      return { label: 'Voucher', color: '#06b6d4' };
    default:
      return null;
  }
}

export default function GameCard({ game }: { game: Game }) {
  const colorClass = hashColor(game.slug);
  const emoji      = EMOJIS[game.slug] ?? '';
  const productUrl = getProductUrl(game);
  const category = game.category || 'game';
  const badge = getProductBadge(category);

  return (
    <Link href={productUrl}>
      <motion.div
        whileHover={{ y: -6, scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <div className={`game-card ${colorClass}`} style={{ minHeight: 160, position: 'relative' }}>
          {/* Featured badge */}
          {game.isFeatured && (
            <div className="absolute top-3 right-3 z-10">
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-black text-white"
                style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}>
                <FireOutlined /> HOT
              </span>
            </div>
          )}

          {/* Product Type Badge */}
          {badge && (
            <div className="absolute top-3 left-3 z-10">
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold text-white"
                style={{ background: badge.color, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                {badge.label}
              </span>
            </div>
          )}

          <div className="p-4 flex flex-col h-full">
            {/* Emoji */}
            <div className="text-4xl mb-3 filter drop-shadow-lg">{emoji}</div>

            {/* Image if available */}
            {game.image && (
              <div className="absolute inset-0 opacity-15">
                <img src={game.image} alt={game.name} className="w-full h-full object-cover" />
              </div>
            )}

            <div className="mt-auto">
              <div className="text-white font-black text-sm leading-tight mb-1 drop-shadow">{game.name}</div>
              <div className="text-white/60 text-xs mb-2">{game.publisher}</div>
              <div className="flex items-center gap-1">
                {game.platform?.slice(0,2).map(p => (
                  <span key={p} className="text-[10px] px-2 py-0.5 rounded-full font-bold text-white"
                    style={{ background: 'rgba(0,0,0,0.3)' }}>
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}