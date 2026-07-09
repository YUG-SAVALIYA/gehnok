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
}

export default function HoverVideo({ 
  videoUrl, 
  imageUrl, 
  alt, 
  imageClassName = '', 
  videoClassName = '', 
  containerClassName = '', 
  onClick 
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

  // Handle play/pause and reset
  useEffect(() => {
    if (!videoRef.current) return;
    
    if (isHovered) {
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
  }, [isHovered]);

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
        className={`${imageClassName} ${isHovered ? 'scale-105' : 'scale-100'} transition-transform duration-700 ease-out`}
        containerClassName={`${isPlaying ? 'opacity-0' : 'opacity-100'}`}
        draggable={false}
      />
      {inView && videoUrl && (
        <video 
          ref={videoRef}
          src={videoUrl} 
          loop 
          muted 
          playsInline 
          preload="none"
          onPlaying={() => setIsPlaying(true)}
          className={`${videoClassName} ${isPlaying ? 'opacity-100' : 'opacity-0'} ${isHovered ? 'scale-105' : 'scale-100'} transition-transform duration-700 ease-out`} 
        />
      )}
    </div>
  );
}
