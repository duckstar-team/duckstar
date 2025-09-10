import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useViewportImageLoader } from '../../hooks/useViewportImageLoader';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  loading = 'lazy',
  placeholder,
  onLoad,
  onError
}: OptimizedImageProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const { observeImage, unobserveImage } = useViewportImageLoader();

  // 이미지 로드 핸들러
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setIsError(false);
    onLoad?.();
  }, [onLoad]);

  // 이미지 에러 핸들러
  const handleError = useCallback(() => {
    setIsError(true);
    setIsLoaded(false);
    onError?.();
  }, [onError]);

  // 뷰포트 관찰 설정
  useEffect(() => {
    if (!imgRef.current || priority || loading === 'eager') {
      // 우선순위가 높거나 eager 로딩인 경우 즉시 로드
      setIsInView(true);
      return;
    }

    // 지연 로딩인 경우 뷰포트 관찰
    observeImage(imgRef.current);

    return () => {
      if (imgRef.current) {
        unobserveImage(imgRef.current);
      }
    };
  }, [observeImage, unobserveImage, priority, loading]);

  // 이미지 소스 설정
  useEffect(() => {
    if (imgRef.current && (priority || loading === 'eager' || isInView)) {
      const img = imgRef.current;
      if (img.dataset.src) {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
      }
    }
  }, [priority, loading, isInView]);

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      {/* 로딩 스켈레톤 */}
      {!isLoaded && !isError && (
        <div 
          className="absolute inset-0 bg-gray-200 animate-pulse rounded"
          style={{ width, height }}
        />
      )}
      
      {/* 에러 상태 */}
      {isError && (
        <div 
          className="absolute inset-0 bg-gray-100 flex items-center justify-center text-gray-400 text-sm"
          style={{ width, height }}
        >
          이미지 로드 실패
        </div>
      )}
      
      {/* 실제 이미지 */}
      <img
        ref={imgRef}
        src={priority || loading === 'eager' ? src : undefined}
        data-src={priority || loading === 'eager' ? undefined : src}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : loading}
        decoding="async"
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={handleLoad}
        onError={handleError}
      />
      
      {/* 플레이스홀더 */}
      {placeholder && !isLoaded && !isError && (
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url(${placeholder})`,
            width, 
            height 
          }}
        />
      )}
    </div>
  );
}
