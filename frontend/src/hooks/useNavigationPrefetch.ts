'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';

interface PrefetchConfig {
  enabled: boolean;
  delay: number;
  priority: 'high' | 'low';
}

// 네트워크 상태에 따른 프리페칭 설정
const getPrefetchConfig = (): PrefetchConfig => {
  if (typeof navigator === 'undefined') {
    return { enabled: true, delay: 0, priority: 'high' };
  }

  const connection = (navigator as any).connection;
  
  if (connection?.effectiveType === '4g') {
    return { enabled: true, delay: 0, priority: 'high' };
  } else if (connection?.effectiveType === '3g') {
    return { enabled: true, delay: 500, priority: 'low' };
  } else if (connection?.effectiveType === '2g') {
    return { enabled: false, delay: 0, priority: 'low' };
  } else {
    return { enabled: true, delay: 200, priority: 'high' };
  }
};

export const useNavigationPrefetch = () => {
  const router = useRouter();
  const prefetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prefetchedRoutes = useRef<Set<string>>(new Set());

  // 페이지 프리페칭
  const prefetchPage = useCallback((href: string) => {
    if (prefetchedRoutes.current.has(href)) {
      return; // 이미 프리페치됨
    }

    const config = getPrefetchConfig();
    
    if (!config.enabled) {
      return; // 프리페칭 비활성화
    }

    // 지연 프리페칭 (3G 환경에서)
    if (config.delay > 0) {
      prefetchTimeoutRef.current = setTimeout(() => {
        router.prefetch(href);
        prefetchedRoutes.current.add(href);
      }, config.delay);
    } else {
      // 즉시 프리페칭 (4G 환경에서)
      router.prefetch(href);
      prefetchedRoutes.current.add(href);
    }
  }, [router]);

  // 네비게이션 최적화
  const navigateWithPrefetch = useCallback((href: string) => {
    // 기존 타임아웃 정리
    if (prefetchTimeoutRef.current) {
      clearTimeout(prefetchTimeoutRef.current);
      prefetchTimeoutRef.current = null;
    }

    // 즉시 네비게이션
    router.push(href);
  }, [router]);

  // 마우스 호버 시 프리페칭
  const handleMouseEnter = useCallback((href: string) => {
    prefetchPage(href);
  }, [prefetchPage]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (prefetchTimeoutRef.current) {
        clearTimeout(prefetchTimeoutRef.current);
      }
    };
  }, []);

  return {
    prefetchPage,
    navigateWithPrefetch,
    handleMouseEnter,
    isPrefetchEnabled: getPrefetchConfig().enabled
  };
};
