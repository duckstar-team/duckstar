import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useImageCache } from '@/hooks/useImageCache';

interface CachedImageProps {
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

export default function CachedImage({
  src,
  alt,
  fallbackSrc = "/banners/duckstar-logo.svg",
  priority = false,
  className,
  style,
  fill,
  width,
  height,
  sizes,
  quality = 75,
  placeholder = 'empty',
  blurDataURL,
  onLoad,
  onError
}: CachedImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  const { isImageLoaded, isImageError, getCachedImage } = useImageCache();

  useEffect(() => {
    if (!src) {
      setCurrentSrc(fallbackSrc);
      setIsLoading(false);
      return;
    }

    // 이미지가 캐시에 있고 로드된 상태인지 확인
    if (isImageLoaded(src)) {
      setCurrentSrc(src);
      setIsLoading(false);
      setHasError(false);
      onLoad?.();
      return;
    }

    // 이미지 로드 에러가 있는지 확인
    if (isImageError(src)) {
      setCurrentSrc(fallbackSrc);
      setIsLoading(false);
      setHasError(true);
      onError?.();
      return;
    }

    // 이미지 로딩 중
    setIsLoading(true);
    setHasError(false);
  }, [src, fallbackSrc, isImageLoaded, isImageError, onLoad, onError]);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    }
    onError?.();
  };

  return (
    <div className={`relative ${className || ''}`} style={style}>
      <Image
        src={currentSrc}
        alt={alt}
        fill={fill}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        sizes={sizes}
        quality={quality}
        priority={priority}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        onLoad={handleLoad}
        onError={handleError}
        className=""
      />
      
    </div>
  );
}

// 배경 이미지용 컴포넌트
interface CachedBackgroundImageProps {
  src: string;
  fallbackSrc?: string;
  className?: string;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: () => void;
}

export function CachedBackgroundImage({
  src,
  fallbackSrc = "/banners/duckstar-logo.svg",
  className,
  style,
  onLoad,
  onError
}: CachedBackgroundImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  const { isImageLoaded, isImageError } = useImageCache();

  useEffect(() => {
    if (!src) {
      setCurrentSrc(fallbackSrc);
      setIsLoading(false);
      return;
    }

    if (isImageLoaded(src)) {
      setCurrentSrc(src);
      setIsLoading(false);
      setHasError(false);
      onLoad?.();
      return;
    }

    if (isImageError(src)) {
      setCurrentSrc(fallbackSrc);
      setIsLoading(false);
      setHasError(true);
      onError?.();
      return;
    }

    setIsLoading(true);
    setHasError(false);
  }, [src, fallbackSrc, isImageLoaded, isImageError, onLoad, onError]);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    }
    onError?.();
  };

  return (
    <div
      className={`bg-cover bg-center bg-no-repeat ${className || ''}`}
      style={{
        backgroundImage: `url('${currentSrc}')`,
        ...style
      }}
      onLoad={handleLoad}
      onError={handleError}
    />
  );
}
