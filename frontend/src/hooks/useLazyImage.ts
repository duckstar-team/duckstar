'use client';

import { useState, useRef, useEffect } from 'react';

interface UseLazyImageOptions {
  threshold?: number;
  rootMargin?: string;
  priority?: boolean;
}

export const useLazyImage = (options: UseLazyImageOptions = {}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const { threshold = 0.1, rootMargin = '50px', priority = false } = options;

  useEffect(() => {
    const img = imgRef.current;
    if (!img || priority) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(img);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(false);
  };

  return {
    imgRef,
    isInView,
    isLoaded,
    hasError,
    handleLoad,
    handleError,
  };
};

export default useLazyImage;
