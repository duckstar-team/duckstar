'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export const useNavigationState = () => {
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigationStartTime, setNavigationStartTime] = useState<number | null>(null);
  const pathname = usePathname();

  // 네비게이션 시작
  const startNavigation = () => {
    setIsNavigating(true);
    setNavigationStartTime(Date.now());
  };

  // 네비게이션 완료
  const completeNavigation = () => {
    setIsNavigating(false);
    setNavigationStartTime(null);
  };

  // 경로 변경 감지
  useEffect(() => {
    if (isNavigating) {
      // 네비게이션 완료
      completeNavigation();
    }
  }, [pathname]);

  // 타임아웃 처리 (5초 후 강제 완료)
  useEffect(() => {
    if (isNavigating && navigationStartTime) {
      const timeout = setTimeout(() => {
        console.warn('네비게이션 타임아웃 - 강제 완료');
        completeNavigation();
      }, 5000);

      return () => clearTimeout(timeout);
    }
  }, [isNavigating, navigationStartTime]);

  return {
    isNavigating,
    startNavigation,
    completeNavigation
  };
};
