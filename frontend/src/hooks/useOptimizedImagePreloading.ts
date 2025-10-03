'use client';

import { useCallback, useRef } from 'react';

/**
 * 최적화된 이미지 프리로딩 훅
 * 우선순위 기반 지연 로딩으로 초기 로딩 성능 개선
 */
export function useOptimizedImagePreloading() {
  const preloadedImages = useRef<Set<string>>(new Set());
  const loadingQueue = useRef<Set<string>>(new Set());

  // 우선순위 기반 이미지 프리로딩
  const preloadImages = useCallback((images: Array<{ id: string; url: string }>, priority: 'high' | 'medium' | 'low' = 'medium') => {
    if (!images || images.length === 0) return;

    // 우선순위별 로딩 지연 시간
    const delayMap = {
      high: 0,      // 즉시 로딩
      medium: 100,  // 100ms 지연
      low: 500      // 500ms 지연
    };

    const delay = delayMap[priority];

    setTimeout(() => {
      images.forEach(({ id, url }) => {
        // 이미 프리로드된 이미지는 스킵
        if (preloadedImages.current.has(id) || loadingQueue.current.has(id)) {
          return;
        }

        loadingQueue.current.add(id);

        const img = new Image();
        img.onload = () => {
          preloadedImages.current.add(id);
          loadingQueue.current.delete(id);
        };
        img.onerror = () => {
          loadingQueue.current.delete(id);
        };
        img.src = url;
      });
    }, delay);
  }, []);

  // 배치 프리로딩 (여러 이미지를 한 번에 처리)
  const preloadBatch = useCallback((batches: Array<{ images: Array<{ id: string; url: string }>; priority: 'high' | 'medium' | 'low' }>) => {
    batches.forEach((batch, index) => {
      // 각 배치마다 점진적 지연
      setTimeout(() => {
        preloadImages(batch.images, batch.priority);
      }, index * 200);
    });
  }, [preloadImages]);

  // 특정 이미지가 프리로드되었는지 확인
  const isPreloaded = useCallback((id: string) => {
    return preloadedImages.current.has(id);
  }, []);

  // 프리로드 상태 초기화
  const clearPreloaded = useCallback(() => {
    preloadedImages.current.clear();
    loadingQueue.current.clear();
  }, []);

  return {
    preloadImages,
    preloadBatch,
    isPreloaded,
    clearPreloaded
  };
}
