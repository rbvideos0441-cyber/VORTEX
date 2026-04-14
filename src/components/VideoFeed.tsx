import React, { useState, useRef, useEffect } from 'react';
import { VideoCard } from './VideoCard';
import { Video } from '../types';

interface VideoFeedProps {
  videos: Video[];
  onLiveClick?: () => void;
}

export const VideoFeed: React.FC<VideoFeedProps> = ({ videos, onLiveClick }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (containerRef.current) {
      const index = Math.round(containerRef.current.scrollTop / containerRef.current.clientHeight);
      if (index !== activeIndex) {
        setActiveIndex(index);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="h-full w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar bg-black"
    >
      {videos.map((video, index) => (
        <VideoCard
          key={video.id}
          video={video}
          isActive={index === activeIndex}
          onLiveClick={onLiveClick}
        />
      ))}
    </div>
  );
};
