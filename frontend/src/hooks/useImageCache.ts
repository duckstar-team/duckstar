import { useState, useEffect, useCallback } from 'react';

// 이미지 캐시 상태 관리
interface ImageCacheState {
  [url: string]: {
    isLoaded: boolean;
    isError: boolean;
    element?: HTMLImageElement;
  };
}

// 글로벌 이미지 캐시 (모든 컴포넌트에서 공유)
let globalImageCache: ImageCacheState = {};
let cacheListeners: Set<() => void> = new Set();

// 캐시 상태 변경 알림
const notifyCacheUpdate = () => {
  cacheListeners.forEach(listener => listener());
};

// 이미지 프리로딩 함수
const preloadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    // 이미 캐시에 있으면 즉시 반환
    if (globalImageCache[url]?.isLoaded && globalImageCache[url].element) {
      resolve(globalImageCache[url].element!);
      return;
    }

    const img = new window.Image();
    
    img.onload = () => {
      globalImageCache[url] = {
        isLoaded: true,
        isError: false,
        element: img
      };
      notifyCacheUpdate();
      resolve(img);
    };
    
    img.onerror = () => {
      globalImageCache[url] = {
        isLoaded: false,
        isError: true
      };
      notifyCacheUpdate();
      reject(new Error(`Failed to load image: ${url}`));
    };
    
    img.src = url;
  });
};

// 여러 이미지 동시 프리로딩
const preloadImages = async (urls: string[]): Promise<HTMLImageElement[]> => {
  const promises = urls.map(url => preloadImage(url));
  return Promise.allSettled(promises).then(results => 
    results
      .filter((result): result is PromiseFulfilledResult<HTMLImageElement> => 
        result.status === 'fulfilled'
      )
      .map(result => result.value)
  );
};

// 이미지 캐시 훅
export const useImageCache = () => {
  const [cache, setCache] = useState<ImageCacheState>(globalImageCache);

  useEffect(() => {
    const updateCache = () => setCache({ ...globalImageCache });
    cacheListeners.add(updateCache);
    
    return () => {
      cacheListeners.delete(updateCache);
    };
  }, []);

  const preloadImageCallback = useCallback((url: string) => {
    return preloadImage(url);
  }, []);

  const preloadImagesCallback = useCallback((urls: string[]) => {
    return preloadImages(urls);
  }, []);

  const isImageLoaded = useCallback((url: string) => {
    return globalImageCache[url]?.isLoaded || false;
  }, []);

  const isImageError = useCallback((url: string) => {
    return globalImageCache[url]?.isError || false;
  }, []);

  const getCachedImage = useCallback((url: string) => {
    return globalImageCache[url]?.element;
  }, []);

  return {
    cache,
    preloadImage: preloadImageCallback,
    preloadImages: preloadImagesCallback,
    isImageLoaded,
    isImageError,
    getCachedImage
  };
};

// 특정 이미지의 로딩 상태를 추적하는 훅
export const useImagePreload = (src: string, options?: {
  priority?: boolean;
  timeout?: number;
  onLoad?: () => void;
  onError?: () => void;
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const { isImageLoaded, isImageError } = useImageCache();

  useEffect(() => {
    if (!src) return;

    // 이미 캐시에 있으면 즉시 로드됨으로 처리
    if (isImageLoaded(src)) {
      setIsLoaded(true);
      setIsError(false);
      options?.onLoad?.();
      return;
    }

    // 에러 상태 확인
    if (isImageError(src)) {
      setIsError(true);
      setIsLoaded(false);
      options?.onError?.();
      return;
    }

    // 이미지 프리로딩
    preloadImage(src)
      .then(() => {
        setIsLoaded(true);
        setIsError(false);
        options?.onLoad?.();
      })
      .catch(() => {
        setIsError(true);
        setIsLoaded(false);
        options?.onError?.();
      });

    // 타임아웃 설정
    if (options?.timeout) {
      const timeoutId = setTimeout(() => {
        if (!isLoaded && !isError) {
          setIsError(true);
          options?.onError?.();
        }
      }, options.timeout);

      return () => clearTimeout(timeoutId);
    }
  }, [src, isImageLoaded, isImageError, isLoaded, isError, options]);

  return { isLoaded, isError };
};

export default useImageCache;
