'use client';

import { useCallback, useRef, useState } from 'react';

interface PreloadConfig {
  maxConcurrent: number;
  batchSize: number;
  priority: 'high' | 'medium' | 'low';
  delay: number;
}

interface PreloadQueue {
  url: string;
  priority: 'high' | 'medium' | 'low';
  resolve: () => void;
  reject: (error: Error) => void;
}

/**
 * 통합된 이미지 프리로딩 훅
 * 모든 이미지 프리로딩 로직을 하나로 통합하여 성능 최적화
 */
export function useUnifiedImagePreloading() {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [activeLoads, setActiveLoads] = useState(0);
  
  const queueRef = useRef<PreloadQueue[]>([]);
  const processingRef = useRef(false);

  // 네트워크 상태에 따른 최적화된 설정
  const getOptimalConfig = useCallback((): PreloadConfig => {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      const effectiveType = connection?.effectiveType;
      
      if (effectiveType === '4g') {
        return { maxConcurrent: 6, batchSize: 3, priority: 'high', delay: 0 };
      } else if (effectiveType === '3g') {
        return { maxConcurrent: 3, batchSize: 2, priority: 'medium', delay: 100 };
      } else {
        return { maxConcurrent: 2, batchSize: 1, priority: 'low', delay: 200 };
      }
    }
    
    // 기본 설정 (4G 환경)
    return { maxConcurrent: 6, batchSize: 3, priority: 'high', delay: 0 };
  }, []);

  // 단일 이미지 프리로딩
  const preloadImage = useCallback((url: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      // 이미 로드된 이미지는 스킵
      if (loadedImages.has(url) || failedImages.has(url)) {
        resolve();
        return;
      }

      const img = new Image();
      
      // 성능 최적화 옵션
      img.decoding = 'async';
      img.loading = 'lazy';
      
      // CORS 설정 (외부 도메인에서만)
      if (!url.includes('duckstar.kr') && !url.includes('localhost')) {
        img.crossOrigin = 'anonymous';
      }
      
      img.onload = () => {
        setLoadedImages(prev => new Set([...prev, url]));
        setActiveLoads(prev => Math.max(0, prev - 1));
        resolve();
      };
      
      img.onerror = (error) => {
        setFailedImages(prev => new Set([...prev, url]));
        setActiveLoads(prev => Math.max(0, prev - 1));
        reject(new Error(`Failed to load image: ${url}`));
      };
      
      setActiveLoads(prev => prev + 1);
      img.src = url;
    });
  }, [loadedImages, failedImages]);

  // 우선순위 기반 배치 프리로딩
  const preloadBatch = useCallback(async (batches: Array<{ 
    images: Array<{ id: string; url: string }>; 
    priority: 'high' | 'medium' | 'low' 
  }>) => {
    const config = getOptimalConfig();
    
    for (const batch of batches) {
      const delay = batch.priority === 'high' ? 0 : 
                   batch.priority === 'medium' ? 100 : 200;
      
      setTimeout(async () => {
        const promises = batch.images.map(({ url }) => preloadImage(url));
        
        try {
          await Promise.allSettled(promises);
        } catch (error) {
          console.warn('일부 이미지 로딩 실패:', error);
        }
      }, delay);
    }
  }, [preloadImage, getOptimalConfig]);

  // 스마트 프리로딩 (네트워크 상태 고려)
  const smartPreload = useCallback(async (urls: string[]) => {
    const config = getOptimalConfig();
    const batches = [];
    
    // 우선순위별로 배치 생성
    const highPriority = urls.slice(0, Math.min(6, urls.length));
    const mediumPriority = urls.slice(6, Math.min(12, urls.length));
    const lowPriority = urls.slice(12);
    
    if (highPriority.length > 0) {
      batches.push({ 
        images: highPriority.map(url => ({ id: url, url })), 
        priority: 'high' as const 
      });
    }
    
    if (mediumPriority.length > 0) {
      batches.push({ 
        images: mediumPriority.map(url => ({ id: url, url })), 
        priority: 'medium' as const 
      });
    }
    
    if (lowPriority.length > 0) {
      batches.push({ 
        images: lowPriority.map(url => ({ id: url, url })), 
        priority: 'low' as const 
      });
    }
    
    await preloadBatch(batches);
  }, [preloadBatch, getOptimalConfig]);

  // 이미지 로딩 상태 확인
  const isImageLoaded = useCallback((url: string) => {
    return loadedImages.has(url);
  }, [loadedImages]);

  // 이미지 로딩 실패 확인
  const isImageFailed = useCallback((url: string) => {
    return failedImages.has(url);
  }, [failedImages]);

  // 캐시 정리
  const clearCache = useCallback(() => {
    setLoadedImages(new Set());
    setFailedImages(new Set());
    setActiveLoads(0);
  }, []);

  return {
    preloadImage,
    preloadBatch,
    smartPreload,
    isImageLoaded,
    isImageFailed,
    clearCache,
    loadedCount: loadedImages.size,
    failedCount: failedImages.size,
    activeLoads,
  };
}
