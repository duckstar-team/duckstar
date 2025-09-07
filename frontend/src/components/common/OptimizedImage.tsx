'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useImagePreload } from '@/hooks/useImagePreload';

interface OptimizedImageProps {
  src: string;
  alt: string;
  fallbackSrc?: string;
  priority?: boolean;
  className?: string;
  style?: React.CSSProperties;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export default function OptimizedImage({
  src,
  alt,
  fallbackSrc = '/banners/duckstar-logo.svg',
  priority = false,
  className,
  style,
  fill = false,
  width,
  height,
  sizes,
  quality = 75,
  placeholder = 'empty',
  blurDataURL,
  onLoad,
  onError
}: OptimizedImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  
  const { isLoaded, isError, isLoading } = useImagePreload(currentSrc, {
    priority,
    onLoad: () => {
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

  // 에러 발생 시 fallback 이미지로 변경
  useEffect(() => {
    if (isError && fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    }
  }, [isError, fallbackSrc, currentSrc]);


  return (
    <Image
      src={currentSrc}
      alt={alt}
      fill={fill}
      width={width}
      height={height}
      sizes={sizes}
      quality={quality}
      priority={priority}
      placeholder={placeholder}
      blurDataURL={blurDataURL}
      className={className}
      style={style}
      onLoad={onLoad}
      onError={() => {
        if (fallbackSrc && !hasError) {
          setCurrentSrc(fallbackSrc);
          setHasError(true);
        }
        onError?.();
      }}
    />
  );
}

// 배경 이미지용 최적화된 컴포넌트
interface OptimizedBackgroundImageProps {
  src: string;
  fallbackSrc?: string;
  priority?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: () => void;
}

export function OptimizedBackgroundImage({
  src,
  fallbackSrc = '/banners/duckstar-logo.svg',
  priority = false,
  className,
  style,
  onLoad,
  onError
}: OptimizedBackgroundImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  
  const { isLoaded, isError, isLoading } = useImagePreload(currentSrc, {
    priority,
    onLoad: () => {
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

  // 에러 발생 시 fallback 이미지로 변경
  useEffect(() => {
    if (isError && fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    }
  }, [isError, fallbackSrc, currentSrc]);


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
    />
  );
}
