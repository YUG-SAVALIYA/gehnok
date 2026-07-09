import React, { useState, useRef, useEffect } from 'react';

// Global cache to remember which images have already loaded in this session
// We use sessionStorage so the cache survives Vite HMR (Hot Module Reloads) during development
const getSessionCache = (): Set<string> => {
  try {
    const data = sessionStorage.getItem('gehnok_img_cache');
    return data ? new Set(JSON.parse(data)) : new Set();
  } catch {
    return new Set();
  }
};

const saveToSessionCache = (cache: Set<string>) => {
  try {
    sessionStorage.setItem('gehnok_img_cache', JSON.stringify(Array.from(cache)));
  } catch {}
};

let loadedImageCache = getSessionCache();

interface ImageWithSkeletonProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  containerClassName?: string;
  skeletonClassName?: string;
  mobileSrc?: string;
  noFade?: boolean;
}

export default function ImageWithSkeleton({
  src,
  mobileSrc,
  alt,
  className = '',
  containerClassName = '',
  skeletonClassName = 'bg-[#EAE8E3]/50',
  noFade = false,
  ...props
}: ImageWithSkeletonProps) {
  const cacheKey = mobileSrc || src || '';
  const [isLoaded, setIsLoaded] = useState(() => loadedImageCache.has(cacheKey));
  const imgRef = useRef<HTMLImageElement>(null);

  // Simple, bulletproof load check on mount and src change
  useEffect(() => {
    if (!loadedImageCache.has(cacheKey)) {
      setIsLoaded(false);
    }
    if (imgRef.current && imgRef.current.complete) {
      loadedImageCache.add(cacheKey);
      saveToSessionCache(loadedImageCache);
      setIsLoaded(true);
    }
  }, [src, mobileSrc, cacheKey]);

  // If there's no src, we just show the skeleton indefinitely
  if (!src && !mobileSrc) {
    return (
      <div className={`w-full h-full animate-pulse ${skeletonClassName} ${containerClassName}`} />
    );
  }

  const isAbsolute = containerClassName?.includes('absolute') || containerClassName?.includes('fixed');

  return (
    <div className={`${isAbsolute ? '' : 'relative'} w-full h-full overflow-hidden ${containerClassName}`}>
      {/* Skeleton overlay - unmounts IMMEDIATELY when loaded */}
      {!isLoaded && (
        <div 
          className={`absolute inset-0 z-10 pointer-events-none ${skeletonClassName} animate-pulse`} 
        />
      )}

      {/* Actual Image / Picture */}
      {mobileSrc ? (
        <picture className={`block w-full h-full`}>
          <source media="(max-width: 768px)" srcSet={mobileSrc} />
          <img
            ref={imgRef}
            src={src}
            alt={alt}
            {...props}
            className={`${className} w-full h-full ${noFade ? '' : `transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}`}
            onLoad={(e) => {
              loadedImageCache.add(cacheKey);
              saveToSessionCache(loadedImageCache);
              setIsLoaded(true);
              if (props.onLoad) props.onLoad(e);
            }}
            onError={(e) => {
              loadedImageCache.add(cacheKey); // prevent endless retries
              saveToSessionCache(loadedImageCache);
              setIsLoaded(true);
              if (props.onError) props.onError(e);
            }}
          />
        </picture>
      ) : (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          {...props}
          className={`${className} w-full h-full ${noFade ? '' : `transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}`}
          onLoad={(e) => {
            loadedImageCache.add(cacheKey);
            saveToSessionCache(loadedImageCache);
            setIsLoaded(true);
            if (props.onLoad) props.onLoad(e);
          }}
          onError={(e) => {
            loadedImageCache.add(cacheKey);
            saveToSessionCache(loadedImageCache);
            setIsLoaded(true);
            if (props.onError) props.onError(e);
          }}
        />
      )}
    </div>
  );
}
