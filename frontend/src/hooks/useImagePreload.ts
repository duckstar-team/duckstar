import { useState, useEffect } from 'react';

interface UseImagePreloadOptions {
  priority?: boolean; // 우선순위 로딩
  onLoad?: () => void;
  onError?: () => void;
}

export function useImagePreload(src: string, options: UseImagePreloadOptions = {}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!src) return;

    setIsLoading(true);
    setIsError(false);
    setIsLoaded(false);

    const img = new Image();
    
    // 우선순위가 높은 이미지는 preload link 태그 사용
    if (options.priority) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    }

    img.onload = () => {
      setIsLoaded(true);
      setIsLoading(false);
      options.onLoad?.();
    };

    img.onerror = () => {
      setIsError(true);
      setIsLoading(false);
      options.onError?.();
    };

    img.src = src;

    return () => {
      // cleanup
      img.onload = null;
      img.onerror = null;
    };
  }, [src, options.priority]);

  return { isLoaded, isError, isLoading };
}

// 여러 이미지를 동시에 프리로드하는 훅
export function useMultipleImagePreload(srcs: string[], options: UseImagePreloadOptions = {}) {
  const [loadedCount, setLoadedCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [isAllLoaded, setIsAllLoaded] = useState(false);

  useEffect(() => {
    if (!srcs.length) return;

    let loaded = 0;
    let errors = 0;

    const loadPromises = srcs.map(src => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        
        if (options.priority) {
          const link = document.createElement('link');
          link.rel = 'preload';
          link.as = 'image';
          link.href = src;
          document.head.appendChild(link);
        }

        img.onload = () => {
          loaded++;
          setLoadedCount(loaded);
          options.onLoad?.();
          resolve();
        };

        img.onerror = () => {
          errors++;
          setErrorCount(errors);
          options.onError?.();
          resolve();
        };

        img.src = src;
      });
    });

    Promise.all(loadPromises).then(() => {
      setIsAllLoaded(true);
    });
  }, [srcs, options.priority]);

  return {
    loadedCount,
    errorCount,
    isAllLoaded,
    totalCount: srcs.length,
    progress: srcs.length > 0 ? (loadedCount + errorCount) / srcs.length : 0
  };
}
