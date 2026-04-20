// GameCardV2.tsx - Versi baru dengan desain lebih modern dan dinamis
import Link from 'next/link';
import { Card, Tag, Badge } from 'antd';
import { FireOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { Game } from '@/types';

const CARD_COLORS = ['card-sky','card-purple','card-lime','card-amber','card-coral','card-pink','card-dark','card-emerald'];
const EMOJIS: Record<string, string> = {
  'mobile-legends':'','free-fire':'','pubg-mobile':'','genshin-impact':'','pubg-pc':'', 'mlbb-mobile':'',
  'valorant':'','netflix':'','spotify':'','youtube-premium':'',
  'nordvpn':'','disney-hotstar':'',
};

function hashColor(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 8) - h);
  return CARD_COLORS[Math.abs(h) % CARD_COLORS.length];
}

export default function GameCard({ game }: { game: Game }) {
  const colorClass = hashColor(game.slug);
  const emoji      = EMOJIS[game.slug] ?? '';

  return (
    <Link href={`/dashboard/games/${game.slug}`}>
      <motion.div
        whileHover={{ y: -6, scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <div className={`game-card ${colorClass}`} style={{ minHeight: 160 }}>
          {/* Featured badge */}
          {game.isFeatured && (
            <div className="absolute top-3 right-3 z-10">
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-black text-white"
                style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(5px)' }}>
                <FireOutlined /> HOT
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
                {game.platform.slice(0,2).map(p => (
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
