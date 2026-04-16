import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, Music2, Plus, Volume2, VolumeX, Bookmark, Coins, MoreVertical, UserPlus, UserCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import { Video } from '../types';
import { CommentsPanel } from './CommentsPanel';

interface VideoCardProps {
  video: Video;
  isActive: boolean;
  onLiveClick?: () => void;
  onProfileClick?: (uid: string) => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video, isActive, onLiveClick, onProfileClick }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastTap = useRef<number>(0);

  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.play().catch(() => console.log('Autoplay bloqueado'));
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [isActive]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const duration = videoRef.current.duration;
      const p = duration > 0 ? (videoRef.current.currentTime / duration) * 100 : 0;
      setProgress(isNaN(p) ? 0 : p);
    }
  };

  const handleDoubleTap = (e: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      setIsLiked(true);
      setShowHeartAnim(true);
      setTimeout(() => setShowHeartAnim(false), 1000);
    }
    lastTap.current = now;
  };

  const handleLongPressStart = () => {
    setPlaybackRate(0.5);
    if (videoRef.current) videoRef.current.playbackRate = 0.5;
  };

  const handleLongPressEnd = () => {
    setPlaybackRate(1);
    if (videoRef.current) videoRef.current.playbackRate = 1;
  };

  return (
    <div 
      className="relative h-full w-full bg-black snap-start overflow-hidden select-none"
      onMouseDown={handleLongPressStart}
      onMouseUp={handleLongPressEnd}
      onMouseLeave={handleLongPressEnd}
      onTouchStart={handleLongPressStart}
      onTouchEnd={handleLongPressEnd}
      onClick={handleDoubleTap}
    >
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/20 z-30">
        <motion.div 
          className="h-full bg-vortex-accent"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Video Element */}
      <video
        ref={videoRef}
        src={video.videoUrl}
        className="h-full w-full object-cover"
        loop
        muted={isMuted}
        playsInline
        onTimeUpdate={handleTimeUpdate}
      />

      {/* Heart Animation on Double Tap */}
      <AnimatePresence>
        {showHeartAnim && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 1 }}
            exit={{ scale: 2, opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none"
          >
            <Heart size={100} fill="#EC4899" className="text-vortex-secondary drop-shadow-2xl" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slow Motion Indicator */}
      {playbackRate === 0.5 && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 glass px-4 py-1 rounded-full text-[10px] font-bold tracking-widest text-white z-30">
          0.5x VELOCIDADE
        </div>
      )}

      {/* Overlays */}
      <div className="absolute inset-0 pointer-events-none bg-linear-to-b from-black/40 via-transparent to-black/60" />

      {/* Right Side Actions */}
      <div className="absolute right-4 bottom-32 flex flex-col items-center gap-5 z-10 pointer-events-auto">
        {/* Profile */}
        <div className="relative mb-2 flex flex-col items-center gap-2">
          <div 
            onClick={(e) => { e.stopPropagation(); onProfileClick?.(video.creatorId); }}
            className="w-12 h-12 rounded-full border-2 border-white overflow-hidden shadow-lg relative cursor-pointer"
          >
            <img src={video.creatorPhoto} alt={video.creatorName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            {/* Live Badge on Avatar */}
            <div className="absolute bottom-0 left-0 right-0 bg-vortex-secondary text-[8px] font-bold text-center py-0.5 uppercase">
              LIVE
            </div>
          </div>
          
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); setIsFollowing(!isFollowing); }}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-lg",
              isFollowing 
                ? "bg-white/10 text-white/60 border border-white/20" 
                : "bg-vortex-accent text-white border border-vortex-accent shadow-[0_0_15px_rgba(124,58,237,0.5)] hover:scale-110"
            )}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={isFollowing ? 'following' : 'follow'}
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 45 }}
                transition={{ duration: 0.2 }}
              >
                {isFollowing ? <UserCheck size={16} /> : <UserPlus size={16} />}
              </motion.div>
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Like */}
        <button onClick={(e) => { e.stopPropagation(); setIsLiked(!isLiked); }} className="flex flex-col items-center gap-1">
          <motion.div
            whileTap={{ scale: 1.5 }}
            className={cn("p-2 rounded-full transition-colors", isLiked ? "text-vortex-secondary" : "text-white")}
          >
            <Heart size={32} fill={isLiked ? "currentColor" : "none"} />
          </motion.div>
          <span className="text-xs font-mono font-bold drop-shadow-md">{(video.likesCount || 0) + (isLiked ? 1 : 0)}</span>
        </button>

        {/* Comments */}
        <button 
          onClick={(e) => { e.stopPropagation(); setShowComments(true); }}
          className="flex flex-col items-center gap-1 text-white"
        >
          <div className="p-2">
            <MessageCircle size={32} />
          </div>
          <span className="text-xs font-mono font-bold drop-shadow-md">{video.commentsCount || 0}</span>
        </button>

        {/* Save */}
        <button onClick={(e) => { e.stopPropagation(); setIsSaved(!isSaved); }} className="flex flex-col items-center gap-1">
          <div className={cn("p-2 transition-colors", isSaved ? "text-vortex-gold" : "text-white")}>
            <Bookmark size={32} fill={isSaved ? "currentColor" : "none"} />
          </div>
          <span className="text-xs font-mono font-bold drop-shadow-md">{video.sharesCount || 0}</span>
        </button>

        {/* Share */}
        <button className="flex flex-col items-center gap-1 text-white">
          <div className="p-2">
            <Share2 size={32} />
          </div>
        </button>
      </div>

      {/* Bottom Info */}
      <div className="absolute bottom-28 left-4 right-20 z-10 pointer-events-none">
        <div className="flex items-center gap-3 mb-1 pointer-events-auto">
          <h3 className="font-display text-base font-bold drop-shadow-lg">@{video.creatorName}</h3>
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={(e) => { e.stopPropagation(); setIsFollowing(!isFollowing); }}
            className={cn(
              "px-3 py-0.5 rounded-full text-[10px] font-bold border transition-all",
              isFollowing 
                ? "bg-white/10 border-white/20 text-white/60" 
                : "bg-vortex-accent border-vortex-accent text-white shadow-[0_0_10px_rgba(124,58,237,0.3)]"
            )}
          >
            {isFollowing ? 'Seguindo' : 'Seguir'}
          </motion.button>
        </div>
        <p className="text-xs text-white/90 line-clamp-2 mb-2 drop-shadow-md">
          {video.description}
        </p>
        <div className="flex items-center gap-2 text-xs font-bold text-vortex-highlight drop-shadow-md">
          <Music2 size={14} />
          <div className="overflow-hidden whitespace-nowrap w-40">
            <motion.div
              animate={{ x: [0, -100] }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              className="inline-block pr-8"
            >
              {video.musicName} • Som Original
            </motion.div>
          </div>
        </div>
      </div>

      {/* Comments Panel */}
      <AnimatePresence>
        {showComments && (
          <CommentsPanel onClose={() => setShowComments(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};
