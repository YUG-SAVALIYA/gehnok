import React, { useRef, useState, useEffect } from 'react';

import ImageWithSkeleton from './ImageWithSkeleton';

interface HoverVideoProps {
  videoUrl?: string | null;
  imageUrl: string;
  alt: string;
  imageClassName?: string;
  videoClassName?: string;
  containerClassName?: string;
  onClick?: () => void;
  forceHover?: boolean;
}

export default function HoverVideo({ 
  videoUrl, 
  imageUrl, 
  alt, 
  imageClassName = '', 
  videoClassName = '', 
  containerClassName = '', 
  onClick,
  forceHover
}: HoverVideoProps) {
  const [inView, setInView] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Lazy load the video element when it comes into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setInView(true);
        }
      },
      { rootMargin: '200px' }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const activeHoverState = forceHover !== undefined ? forceHover : isHovered;

  // Handle play/pause and reset
  useEffect(() => {
    if (!videoRef.current) return;
    
    if (activeHoverState) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Auto-play was prevented, likely needs user interaction
        });
      }
    } else {
      videoRef.current.pause();
      if (videoRef.current.readyState > 0) {
        videoRef.current.currentTime = 0;
      }
      setIsPlaying(false);
    }
  }, [activeHoverState]);

  return (
    <div 
      ref={containerRef}
      className={`${containerClassName} relative overflow-hidden`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => setIsHovered(false)}
    >
      <ImageWithSkeleton
        src={imageUrl}
        alt={alt}
        className={`${imageClassName}`}
        containerClassName={`${isPlaying ? 'opacity-0' : 'opacity-100'}`}
        draggable={false}
        loading="lazy"
        decoding="async"
      />
      {inView && videoUrl && (
        <video 
          ref={videoRef}
          src={videoUrl} 
          loop 
          muted 
          playsInline 
          preload="metadata"
          onPlaying={() => setIsPlaying(true)}
          className={`${videoClassName} ${isPlaying ? 'opacity-100' : 'opacity-0'} transition-opacity duration-700 ease-out`} 
        />
      )}
    </div>
  );
}
