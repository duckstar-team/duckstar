'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useImagePreload } from '@/hooks/useImagePreload';

interface ProgressiveImageProps {
  thumbnailSrc: string;
  mainSrc: string;
  alt: string;
  fallbackSrc?: string;
  className?: string;
  style?: React.CSSProperties;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  quality?: number;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  showLoadingState?: boolean;
  loadingComponent?: React.ReactNode;
  transitionDuration?: number; // 페이드 인/아웃 지속 시간 (ms)
}

export default function ProgressiveImage({
  thumbnailSrc,
  mainSrc,
  alt,
  fallbackSrc = '/banners/duckstar-logo.svg',
  className,
  style,
  fill = false,
  width,
  height,
  sizes,
  quality = 75,
  priority = false,
  onLoad,
  onError,
  showLoadingState = true,
  loadingComponent,
  transitionDuration = 300
}: ProgressiveImageProps) {
  const [currentSrc, setCurrentSrc] = useState(thumbnailSrc);
  const [isMainLoaded, setIsMainLoaded] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  // 메인 이미지 프리로딩
  const { isLoaded: isMainImageLoaded, isError: isMainImageError, isLoading: isMainImageLoading } = useImagePreload(mainSrc, {
    priority,
    onLoad: () => {
      setIsMainLoaded(true);
      onLoad?.();
    },
    onError: () => {
      if (fallbackSrc && !hasError) {
        setCurrentSrc(fallbackSrc);
        setHasError(true);
      }
      onError?.();
    }
  });

  // 썸네일 이미지 프리로딩
  const { isLoaded: isThumbnailLoaded, isError: isThumbnailError } = useImagePreload(thumbnailSrc, {
    priority: true, // 썸네일은 우선 로딩
    onError: () => {
      if (fallbackSrc && !hasError) {
        setCurrentSrc(fallbackSrc);
        setHasError(true);
      }
    }
  });

  // 메인 이미지가 로드되면 즉시 교체 (깜빡임 없이)
  useEffect(() => {
    if (isMainImageLoaded && !isMainImageError && mainSrc !== currentSrc) {
      setCurrentSrc(mainSrc);
    }
  }, [isMainImageLoaded, isMainImageError, mainSrc, currentSrc]);

  // 에러 처리
  useEffect(() => {
    if ((isThumbnailError || isMainImageError) && fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setHasError(true);
    }
  }, [isThumbnailError, isMainImageError, fallbackSrc, currentSrc]);

  // 로딩 상태 표시 제거

  return (
    <div className={`relative ${className}`} style={style}>
      <Image
        src={currentSrc}
        alt={alt}
        fill={fill}
        {...(fill ? {} : { width, height })}
        sizes={sizes}
        quality={quality}
        priority={priority}
        onLoad={onLoad}
        onError={() => {
          if (fallbackSrc && !hasError) {
            setCurrentSrc(fallbackSrc);
            setHasError(true);
          }
          onError?.();
        }}
      />
      
      {/* 로딩 인디케이터 제거 */}
    </div>
  );
}

// 배경 이미지용 Progressive 컴포넌트
interface ProgressiveBackgroundImageProps {
  thumbnailSrc: string;
  mainSrc: string;
  fallbackSrc?: string;
  className?: string;
  style?: React.CSSProperties;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  showLoadingState?: boolean;
  loadingComponent?: React.ReactNode;
  transitionDuration?: number;
}

export function ProgressiveBackgroundImage({
  thumbnailSrc,
  mainSrc,
  fallbackSrc = '/banners/duckstar-logo.svg',
  className,
  style,
  priority = false,
  onLoad,
  onError,
  showLoadingState = true,
  loadingComponent,
  transitionDuration = 300
}: ProgressiveBackgroundImageProps) {
  const [currentSrc, setCurrentSrc] = useState(thumbnailSrc);
  const [isMainLoaded, setIsMainLoaded] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  // 메인 이미지 프리로딩
  const { isLoaded: isMainImageLoaded, isError: isMainImageError, isLoading: isMainImageLoading } = useImagePreload(mainSrc, {
    priority,
    onLoad: () => {
      setIsMainLoaded(true);
      onLoad?.();
    },
    onError: () => {
      if (fallbackSrc && !hasError) {
        setCurrentSrc(fallbackSrc);
        setHasError(true);
      }
      onError?.();
    }
  });

  // 썸네일 이미지 프리로딩
  const { isLoaded: isThumbnailLoaded, isError: isThumbnailError } = useImagePreload(thumbnailSrc, {
    priority: true,
    onError: () => {
      if (fallbackSrc && !hasError) {
        setCurrentSrc(fallbackSrc);
        setHasError(true);
      }
    }
  });

  // 메인 이미지가 로드되면 즉시 교체 (깜빡임 없이)
  useEffect(() => {
    if (isMainImageLoaded && !isMainImageError && mainSrc !== currentSrc) {
      setCurrentSrc(mainSrc);
    }
  }, [isMainImageLoaded, isMainImageError, mainSrc, currentSrc]);

  // 에러 처리
  useEffect(() => {
    if ((isThumbnailError || isMainImageError) && fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setHasError(true);
    }
  }, [isThumbnailError, isMainImageError, fallbackSrc, currentSrc]);

  // 로딩 상태 표시 제거

  return (
    <div 
      className={className}
      style={{
        ...style,
        backgroundImage: `url('${currentSrc}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* 로딩 인디케이터 제거 */}
    </div>
  );
}
