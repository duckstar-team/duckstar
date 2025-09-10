import { useEffect, useState, useCallback } from 'react';

interface PreloadConfig {
  maxConcurrent: number;
  batchSize: number;
  batchDelay: number;
}

interface PreloadQueue {
  url: string;
  priority: 'high' | 'medium' | 'low';
  timestamp: number;
}

const DEFAULT_CONFIG: PreloadConfig = {
  maxConcurrent: 3,    // 동시에 최대 3개만 로딩
  batchSize: 2,        // 2개씩 배치로 처리
  batchDelay: 100      // 100ms 간격
};

export const useSmartImagePreloader = (config: Partial<PreloadConfig> = {}) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const [queue, setQueue] = useState<PreloadQueue[]>([]);
  const [activeLoads, setActiveLoads] = useState(0);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  // 이미지 preload 함수
  const preloadImage = useCallback((url: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      // 이미 로드된 이미지는 스킵
      if (loadedImages.has(url) || failedImages.has(url)) {
        resolve();
        return;
      }

      const img = new Image();
      // CORS 설정 (duckstar.kr 도메인만)
      if (url.includes('duckstar.kr')) {
        img.crossOrigin = 'anonymous';
      }
      img.decoding = 'async';
      
      img.onload = () => {
        setLoadedImages(prev => new Set([...prev, url]));
        resolve();
      };
      
      img.onerror = (error) => {
        console.warn(`Image preload failed: ${url}`, error);
        setFailedImages(prev => new Set([...prev, url]));
        reject(new Error(`Failed to load image: ${url}`));
      };
      
      img.src = url;
    });
  }, [loadedImages, failedImages]);

  // 큐에 이미지 추가
  const addToQueue = useCallback((urls: string[], priority: 'high' | 'medium' | 'low' = 'medium') => {
    const newItems: PreloadQueue[] = urls
      .filter(url => !loadedImages.has(url) && !failedImages.has(url))
      .map(url => ({
        url,
        priority,
        timestamp: Date.now()
      }));

    setQueue(prev => {
      // 우선순위별로 정렬 (high -> medium -> low)
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return [...prev, ...newItems].sort((a, b) => {
        if (a.priority !== b.priority) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return a.timestamp - b.timestamp;
      });
    });
  }, [loadedImages, failedImages]);

  // 배치 처리
  useEffect(() => {
    if (queue.length === 0 || activeLoads >= finalConfig.maxConcurrent) return;

    const batch = queue.slice(0, finalConfig.batchSize);
    setQueue(prev => prev.slice(finalConfig.batchSize));
    setActiveLoads(prev => prev + batch.length);

    // 배치 지연
    const timeoutId = setTimeout(() => {
      Promise.allSettled(batch.map(item => preloadImage(item.url)))
        .finally(() => {
          setActiveLoads(prev => prev - batch.length);
        });
    }, finalConfig.batchDelay);

    return () => clearTimeout(timeoutId);
  }, [queue, activeLoads, finalConfig, preloadImage]);

  // 큐 상태 확인
  const getQueueStatus = useCallback(() => ({
    total: queue.length,
    active: activeLoads,
    loaded: loadedImages.size,
    failed: failedImages.size
  }), [queue.length, activeLoads, loadedImages.size, failedImages.size]);

  // 큐 초기화
  const clearQueue = useCallback(() => {
    setQueue([]);
    setActiveLoads(0);
  }, []);

  // 캐시 초기화
  const clearCache = useCallback(() => {
    setLoadedImages(new Set());
    setFailedImages(new Set());
  }, []);

  return {
    addToQueue,
    getQueueStatus,
    clearQueue,
    clearCache,
    isImageLoaded: (url: string) => loadedImages.has(url),
    isImageFailed: (url: string) => failedImages.has(url)
  };
};
