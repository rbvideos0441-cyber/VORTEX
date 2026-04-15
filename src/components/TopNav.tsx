import React from 'react';
import { Search, Radio } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface TopNavProps {
  activeFeed: 'following' | 'foryou' | 'trending' | 'nearby';
  setActiveFeed: (feed: 'following' | 'foryou' | 'trending' | 'nearby') => void;
  onLiveClick?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ activeFeed, setActiveFeed, onLiveClick }) => {
  const feeds = [
    { id: 'following', label: 'Seguindo' },
    { id: 'foryou', label: 'Para Você' },
    { id: 'trending', label: 'Trending' },
  ] as const;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex flex-col pointer-events-none">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button 
          onClick={onLiveClick}
          className="p-2 text-white pointer-events-auto hover:scale-110 transition-transform"
        >
          <Radio size={22} className="text-vortex-secondary animate-pulse" />
        </button>

        <div className="flex items-center gap-3 sm:gap-6 pointer-events-auto">
          {feeds.map((feed) => (
            <button
              key={feed.id}
              onClick={() => setActiveFeed(feed.id)}
              className={cn(
                "text-xs sm:text-sm font-bold tracking-tight transition-all whitespace-nowrap relative py-1",
                activeFeed === feed.id ? "text-white scale-110" : "text-white/50"
              )}
            >
              {feed.label}
              {activeFeed === feed.id && (
                <motion.div 
                  layoutId="activeFeedUnderline"
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-vortex-accent rounded-full"
                />
              )}
            </button>
          ))}
        </div>

        <button className="p-2 text-white pointer-events-auto hover:scale-110 transition-transform">
          <Search size={22} />
        </button>
      </div>
    </div>
  );
};
