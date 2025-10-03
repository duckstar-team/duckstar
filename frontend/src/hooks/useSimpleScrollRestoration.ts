'use client';

import { useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';

/**
 * 단순화된 스크롤 복원 훅
 * Next.js 15 내장 기능을 최대한 활용하여 성능 최적화
 */
export function useSimpleScrollRestoration() {
  const pathname = usePathname();

  // 스크롤 위치 저장 (디바운싱 적용)
  const saveScrollPosition = useCallback(() => {
    const scrollY = window.scrollY;
    if (scrollY > 0) {
      sessionStorage.setItem(`scroll-${pathname}`, scrollY.toString());
    }
  }, [pathname]);

  // 스크롤 위치 복원
  const restoreScrollPosition = useCallback(() => {
    const savedY = sessionStorage.getItem(`scroll-${pathname}`);
    if (savedY) {
      const y = parseInt(savedY);
      if (!isNaN(y) && y > 0) {
        // 즉시 복원 (애니메이션 없이)
        window.scrollTo(0, y);
        // 복원 후 정리
        sessionStorage.removeItem(`scroll-${pathname}`);
      }
    }
  }, [pathname]);

  // 맨 위로 스크롤
  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // 스크롤 이벤트 리스너 (디바운싱)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(saveScrollPosition, 300); // 300ms 디바운싱
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, [saveScrollPosition]);

  // 페이지 로드 시 스크롤 복원
  useEffect(() => {
    // 약간의 지연을 두어 DOM이 완전히 로드된 후 복원
    const timer = setTimeout(restoreScrollPosition, 50);
    return () => clearTimeout(timer);
  }, [restoreScrollPosition]);

  return {
    saveScrollPosition,
    restoreScrollPosition,
    scrollToTop
  };
}
