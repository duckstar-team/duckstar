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

// 네트워크 상태에 따른 동적 설정 (개선된 버전)
const getOptimalConfig = (): PreloadConfig => {
  if (typeof navigator === 'undefined') {
    return { maxConcurrent: 8, batchSize: 6, batchDelay: 50 };
  }

  const connection = (navigator as any).connection;
  
  // 4G 환경 (빠른 속도)
  if (connection?.effectiveType === '4g' && connection?.downlink > 1.5) {
    return { maxConcurrent: 12, batchSize: 8, batchDelay: 30 };
  } 
  // 4G 환경 (느린 속도) 또는 3G
  else if (connection?.effectiveType === '3g' || (connection?.effectiveType === '4g' && connection?.downlink <= 1.5)) {
    return { maxConcurrent: 6, batchSize: 4, batchDelay: 100 };
  } 
  // 2G 환경
  else if (connection?.effectiveType === '2g' || connection?.effectiveType === 'slow-2g') {
    return { maxConcurrent: 2, batchSize: 1, batchDelay: 300 };
  } 
  // 데이터 절약 모드
  else if (connection?.saveData) {
    return { maxConcurrent: 3, batchSize: 2, batchDelay: 200 };
  }
  // 기본값
  else {
    return { maxConcurrent: 8, batchSize: 6, batchDelay: 50 };
  }
};

const DEFAULT_CONFIG: PreloadConfig = getOptimalConfig();

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
      // CORS는 외부 도메인에서만 필요 (같은 도메인은 제거)
      if (url.includes('duckstar.kr')) {
        // 같은 도메인이므로 CORS 설정 제거 (성능 향상)
      } else {
        img.crossOrigin = 'anonymous';
      }
      img.decoding = 'async';
      
      img.onload = () => {
        setLoadedImages(prev => new Set([...prev, url]));
        resolve();
      };
      
      img.onerror = (error) => {
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

    // 큐에 이미지 추가

    setQueue(prev => {
      // 우선순위별로 정렬 (high -> medium -> low)
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const sortedQueue = [...prev, ...newItems].sort((a, b) => {
        if (a.priority !== b.priority) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return a.timestamp - b.timestamp;
      });
      
      return sortedQueue;
    });
  }, [loadedImages, failedImages]);

  // 배치 처리
  useEffect(() => {
    if (queue.length === 0 || activeLoads >= finalConfig.maxConcurrent) return;

    const batch = queue.slice(0, finalConfig.batchSize);
    setQueue(prev => prev.slice(finalConfig.batchSize));
    setActiveLoads(prev => prev + batch.length);

    // 배치 처리 시작

    // 배치 지연
    const timeoutId = setTimeout(() => {
      Promise.allSettled(batch.map(item => preloadImage(item.url)))
        .finally(() => {
          setActiveLoads(prev => prev - batch.length);
          // 배치 완료
        });
    }, finalConfig.batchDelay);

    return () => clearTimeout(timeoutId);
  }, [queue, activeLoads, finalConfig, preloadImage]);

  // 큐 상태 확인 (성능 모니터링 포함)
  const getQueueStatus = useCallback(() => {
    const total = queue.length;
    const active = activeLoads;
    const loaded = loadedImages.size;
    const failed = failedImages.size;
    const successRate = total > 0 ? (loaded / (loaded + failed)) * 100 : 100;
    
    // 개발 환경에서만 상태 로깅
    
    return {
      total,
      active,
      loaded,
      failed,
      successRate
    };
  }, [queue.length, activeLoads, loadedImages.size, failedImages.size, finalConfig]);

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
