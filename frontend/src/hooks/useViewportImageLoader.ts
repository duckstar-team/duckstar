import { useEffect, useRef, useState, useCallback } from 'react';
import { useSmartImagePreloader } from './useSmartImagePreloader';

interface ViewportImageLoaderConfig {
  rootMargin: string;
  threshold: number;
  preloadDistance: number;
}

const DEFAULT_CONFIG: ViewportImageLoaderConfig = {
  rootMargin: '200px',    // 200px 전에 미리 로드
  threshold: 0.1,         // 10% 보이면 로드
  preloadDistance: 500    // 500px 전에 preload
};

export const useViewportImageLoader = (config: Partial<ViewportImageLoaderConfig> = {}) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const [visibleImages, setVisibleImages] = useState<Set<string>>(new Set());
  const [preloadedImages, setPreloadedImages] = useState<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver>();
  const preloadObserverRef = useRef<IntersectionObserver>();
  const { addToQueue, isImageLoaded } = useSmartImagePreloader();

  // 뷰포트에 들어온 이미지 처리
  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    entries.forEach(entry => {
      const img = entry.target as HTMLImageElement;
      const src = img.dataset.src || img.src;
      
      if (entry.isIntersecting && src) {
        setVisibleImages(prev => new Set([...prev, src]));
        
        // 이미지가 로드되지 않았으면 로드
        if (!isImageLoaded(src)) {
          img.src = src;
          img.removeAttribute('data-src');
        }
        
        observerRef.current?.unobserve(img);
      }
    });
  }, [isImageLoaded]);

  // preload 대상 이미지 처리
  const handlePreloadIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    entries.forEach(entry => {
      const img = entry.target as HTMLImageElement;
      const src = img.dataset.src || img.src;
      
      if (entry.isIntersecting && src && !preloadedImages.has(src)) {
        setPreloadedImages(prev => new Set([...prev, src]));
        addToQueue([src], 'medium');
        preloadObserverRef.current?.unobserve(img);
      }
    });
  }, [addToQueue, preloadedImages]);

  // Intersection Observer 설정
  useEffect(() => {
    // 메인 로더 (실제 로딩)
    observerRef.current = new IntersectionObserver(handleIntersection, {
      rootMargin: finalConfig.rootMargin,
      threshold: finalConfig.threshold
    });

    // Preload 로더 (미리 로딩)
    preloadObserverRef.current = new IntersectionObserver(handlePreloadIntersection, {
      rootMargin: `${finalConfig.preloadDistance}px`,
      threshold: 0
    });

    return () => {
      observerRef.current?.disconnect();
      preloadObserverRef.current?.disconnect();
    };
  }, [handleIntersection, handlePreloadIntersection, finalConfig]);

  // 이미지 요소 관찰 시작
  const observeImage = useCallback((imgElement: HTMLImageElement) => {
    if (observerRef.current && preloadObserverRef.current) {
      // preload 관찰 (먼저 시작)
      preloadObserverRef.current.observe(imgElement);
      // 실제 로딩 관찰
      observerRef.current.observe(imgElement);
    }
  }, []);

  // 이미지 요소 관찰 중지
  const unobserveImage = useCallback((imgElement: HTMLImageElement) => {
    observerRef.current?.unobserve(imgElement);
    preloadObserverRef.current?.unobserve(imgElement);
  }, []);

  // 상태 확인
  const getStatus = useCallback(() => ({
    visible: visibleImages.size,
    preloaded: preloadedImages.size,
    total: visibleImages.size + preloadedImages.size
  }), [visibleImages.size, preloadedImages.size]);

  return {
    observeImage,
    unobserveImage,
    getStatus,
    isVisible: (src: string) => visibleImages.has(src),
    isPreloaded: (src: string) => preloadedImages.has(src)
  };
};
