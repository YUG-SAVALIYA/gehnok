import React, { useState, useRef, useEffect } from 'react';

interface ImageWithSkeletonProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  containerClassName?: string;
  skeletonClassName?: string;
  mobileSrc?: string;
}

export default function ImageWithSkeleton({
  src,
  mobileSrc,
  alt,
  className = '',
  containerClassName = '',
  skeletonClassName = 'bg-[#EAE8E3]/50',
  ...props
}: ImageWithSkeletonProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Simple, bulletproof load check on mount and src change
  useEffect(() => {
    setIsLoaded(false);
    if (imgRef.current && imgRef.current.complete) {
      setIsLoaded(true);
    }
  }, [src, mobileSrc]);

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
            className={`${className} w-full h-full`}
            onLoad={(e) => {
              setIsLoaded(true);
              if (props.onLoad) props.onLoad(e);
            }}
            onError={(e) => {
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
          className={`${className} w-full h-full`}
          onLoad={(e) => {
            setIsLoaded(true);
            if (props.onLoad) props.onLoad(e);
          }}
          onError={(e) => {
            setIsLoaded(true);
            if (props.onError) props.onError(e);
          }}
        />
      )}
    </div>
  );
}
