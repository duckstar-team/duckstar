import { useState, useEffect, useRef } from 'react';

interface UseStickyMenuOptions {
  threshold?: number;
  offset?: number;
}

/**
 * 요소가 스티키 상태인지 감지하는 훅
 */
export function useStickyMenu(options: UseStickyMenuOptions = {}) {
  const { threshold = 100, offset = 60 } = options;
  const [isSticky, setIsSticky] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;

      const rect = ref.current.getBoundingClientRect();
      const shouldBeSticky = rect.top <= offset && window.scrollY > threshold;

      setIsSticky((prev) => {
        if (prev !== shouldBeSticky) {
          return shouldBeSticky;
        }
        return prev;
      });
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [threshold, offset]);

  return { ref, isSticky };
}
