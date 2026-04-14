import Link from 'next/link';
import Image from 'next/image';
import { Game } from '@/types';
import { Zap, Star } from 'lucide-react';
import { cn } from '@/lib/utils/format';

interface GameCardProps {
  game: Game;
}

const PLACEHOLDER_COLORS: Record<string, string> = {
  mobile: 'from-[#ea5234] to-[#ea5234]/70',
  pc: 'from-[#ea5234] to-[#ea5234]/70',
  console: 'from-[#ea5234] to-[#ea5234]/70',
  other: 'from-[#ea5234] to-[#ea5234]/70',
};

const GAME_EMOJIS: Record<string, string> = {
  'mobile-legends': '⚔️',
  'free-fire': '🔥',
  'pubg-mobile': '🪖',
  'genshin-impact': '🌊',
  'valorant': '🎯',
};

export default function GameCard({ game }: GameCardProps) {
  const gradient = PLACEHOLDER_COLORS[game.category] ?? PLACEHOLDER_COLORS.other;
  const emoji = GAME_EMOJIS[game.slug] ?? '🎮';

  return (
    <Link href={`/dashboard/games/${game.slug}`} className="group block">
      <div className="bg-[#ea5234]/10 border border-[#ea5234]/20 rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl backdrop-blur-sm"
        style={{ boxShadow: '0 4px 12px rgba(234, 82, 52, 0.1)' }}>
        {/* Image / Placeholder */}
        <div className={cn('relative h-36 bg-gradient-to-br', gradient)}>
          {game.image ? (
            <Image
              src={game.image}
              alt={game.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-5xl filter drop-shadow-lg">{emoji}</span>
            </div>
          )}
          {game.isFeatured && (
            <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full px-2 py-0.5"
              style={{ background: '#ea5234', backdropFilter: 'blur(8px)' }}>
              <Star className="w-3 h-3 text-white fill-white" />
              <span className="text-white text-[10px] font-bold">HOT</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="text-white font-semibold text-sm leading-tight transition-colors line-clamp-2 group-hover:text-[#ea5234]">
            {game.name}
          </h3>
          <p className="text-slate-500 text-xs mt-1">{game.publisher}</p>

          <div className="flex items-center justify-between mt-3">
            <div className="flex flex-wrap gap-1">
              {game.platform.slice(0, 2).map((p) => (
                <span key={p} className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{ background: '#ea523420', color: '#ea5234' }}>
                  {p}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-1" style={{ color: '#ea5234' }}>
              <Zap className="w-3 h-3" />
              <span className="text-[10px] font-semibold">Top Up</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}