import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, Music2, Plus, Volume2, VolumeX, Bookmark, Coins, MoreVertical } from 'lucide-react';
import { cn } from '../lib/utils';
import { Video } from '../types';
import { CommentsPanel } from './CommentsPanel';

interface VideoCardProps {
  video: Video;
  isActive: boolean;
  onLiveClick?: () => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video, isActive, onLiveClick }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
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
      const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(p);
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
      <div className="absolute inset-0 pointer-events-none bg-linear-to-b from-black/20 via-transparent to-black/60" />

      {/* Mute Toggle */}
      <button
        onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
        className="absolute top-6 right-6 z-20 p-2 glass rounded-full text-white/80 hover:text-white transition-colors pointer-events-auto"
      >
        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>

      {/* Right Side Actions */}
      <div className="absolute right-4 bottom-24 flex flex-col items-center gap-5 z-10 pointer-events-auto">
        {/* Profile */}
        <div className="relative mb-2">
          <div 
            onClick={(e) => { e.stopPropagation(); onLiveClick?.(); }}
            className="w-12 h-12 rounded-full border-2 border-white overflow-hidden shadow-lg relative cursor-pointer"
          >
            <img src={video.creatorPhoto} alt={video.creatorName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            {/* Live Badge on Avatar */}
            <div className="absolute bottom-0 left-0 right-0 bg-vortex-secondary text-[8px] font-bold text-center py-0.5 uppercase">
              LIVE
            </div>
          </div>
          <button className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-vortex-secondary rounded-full p-0.5 text-white shadow-lg z-10">
            <Plus size={14} />
          </button>
        </div>

        {/* Like */}
        <button onClick={(e) => { e.stopPropagation(); setIsLiked(!isLiked); }} className="flex flex-col items-center gap-1">
          <motion.div
            whileTap={{ scale: 1.5 }}
            className={cn("p-2 rounded-full transition-colors", isLiked ? "text-vortex-secondary" : "text-white")}
          >
            <Heart size={32} fill={isLiked ? "currentColor" : "none"} />
          </motion.div>
          <span className="text-xs font-mono font-bold drop-shadow-md">{video.likesCount + (isLiked ? 1 : 0)}</span>
        </button>

        {/* Comments */}
        <button 
          onClick={(e) => { e.stopPropagation(); setShowComments(true); }}
          className="flex flex-col items-center gap-1 text-white"
        >
          <div className="p-2">
            <MessageCircle size={32} />
          </div>
          <span className="text-xs font-mono font-bold drop-shadow-md">{video.commentsCount}</span>
        </button>

        {/* Save */}
        <button onClick={(e) => { e.stopPropagation(); setIsSaved(!isSaved); }} className="flex flex-col items-center gap-1">
          <div className={cn("p-2 transition-colors", isSaved ? "text-vortex-gold" : "text-white")}>
            <Bookmark size={32} fill={isSaved ? "currentColor" : "none"} />
          </div>
          <span className="text-xs font-mono font-bold drop-shadow-md">{video.sharesCount}</span>
        </button>

        {/* Share */}
        <button className="flex flex-col items-center gap-1 text-white">
          <div className="p-2">
            <Share2 size={32} />
          </div>
        </button>

        {/* Coins / Tip */}
        <button className="flex flex-col items-center gap-1 text-vortex-highlight">
          <div className="p-2 glass rounded-full">
            <Coins size={24} />
          </div>
        </button>

        {/* More */}
        <button className="text-white/60">
          <MoreVertical size={24} />
        </button>
      </div>

      {/* Bottom Info */}
      <div className="absolute bottom-8 left-4 right-20 z-10 pointer-events-none">
        <h3 className="font-display text-lg font-bold mb-1 drop-shadow-lg">@{video.creatorName}</h3>
        <p className="text-sm text-white/90 line-clamp-2 mb-3 drop-shadow-md">
          {video.description}
        </p>
        <div className="flex items-center gap-2 text-xs font-bold text-vortex-highlight drop-shadow-md">
          <Music2 size={14} className="animate-spin-slow" />
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

      {/* Music Disk */}
      <div className="absolute bottom-8 right-4 z-10">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 rounded-full bg-linear-to-tr from-vortex-bg to-vortex-surface border-4 border-white/20 flex items-center justify-center overflow-hidden shadow-xl"
        >
          <img src={video.creatorPhoto} alt="music" className="w-6 h-6 rounded-full object-cover" referrerPolicy="no-referrer" />
        </motion.div>
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
