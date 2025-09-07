'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useScrollRestorationContext } from '@/context/ScrollRestorationContext';

interface UseScrollRestorationOptions {
  /** 스크롤 위치를 저장할 간격 (ms). 기본값: 150 */
  saveInterval?: number;
  /** 스크롤 복원 시 애니메이션 사용 여부. 기본값: false */
  smooth?: boolean;
  /** 스크롤 복원 시 지연 시간 (ms). 기본값: 100 */
  restoreDelay?: number;
}

export function useScrollRestoration(options: UseScrollRestorationOptions = {}) {
  const {
    saveInterval = 150,
    smooth = false,
    restoreDelay = 100,
  } = options;

  const pathname = usePathname();
  const { saveScrollPosition, getScrollPosition, registerPage, unregisterPage, clearScrollPosition } = useScrollRestorationContext();
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRestoringRef = useRef(false);
  const lastScrollYRef = useRef(0);

  // 스크롤 위치 저장 (디바운싱)
  const handleScroll = useCallback(() => {
    if (isRestoringRef.current) return;

    const currentScrollY = window.scrollY;
    
    // 스크롤 위치가 실제로 변경되었을 때만 저장
    if (Math.abs(currentScrollY - lastScrollYRef.current) > 5) {
      lastScrollYRef.current = currentScrollY;
      
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        saveScrollPosition(pathname, currentScrollY);
      }, saveInterval);
    }
  }, [pathname, saveScrollPosition, saveInterval]);

  // 페이지 등록 및 스크롤 이벤트 리스너 설정
  useEffect(() => {
    // 페이지 등록
    registerPage(pathname);

    // 스크롤 이벤트 리스너 추가
    window.addEventListener('scroll', handleScroll, { passive: true });

    // 페이지 언마운트 시 정리
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      window.removeEventListener('scroll', handleScroll);
      unregisterPage(pathname);
    };
  }, [pathname, handleScroll, registerPage, unregisterPage]);

  // 스크롤 복원
  useEffect(() => {
    const savedScrollY = getScrollPosition(pathname);
    
    if (savedScrollY !== null && savedScrollY > 0) {
      isRestoringRef.current = true;
      
      setTimeout(() => {
        window.scrollTo({
          top: savedScrollY,
          behavior: smooth ? 'smooth' : 'auto'
        });
        
        // 복원 완료 후 플래그 해제
        setTimeout(() => {
          isRestoringRef.current = false;
        }, restoreDelay);
      }, restoreDelay);
    }
  }, [pathname, getScrollPosition, smooth, restoreDelay]);

  // 수동으로 스크롤 위치 저장
  const saveCurrentScrollPosition = useCallback(() => {
    const currentScrollY = window.scrollY;
    saveScrollPosition(pathname, currentScrollY);
    lastScrollYRef.current = currentScrollY;
  }, [pathname, saveScrollPosition]);

  // 수동으로 스크롤 위치 복원
  const restoreScrollPosition = useCallback(() => {
    const savedScrollY = getScrollPosition(pathname);
    if (savedScrollY !== null) {
      isRestoringRef.current = true;
      window.scrollTo({
        top: savedScrollY,
        behavior: smooth ? 'smooth' : 'auto'
      });
      setTimeout(() => {
        isRestoringRef.current = false;
      }, restoreDelay);
    }
  }, [pathname, getScrollPosition, smooth, restoreDelay]);

  // 스크롤 위치 초기화
  const clearCurrentScrollPosition = useCallback(() => {
    clearScrollPosition(pathname);
  }, [pathname, clearScrollPosition]);

  return {
    saveCurrentScrollPosition,
    restoreScrollPosition,
    clearCurrentScrollPosition,
    isRestoring: isRestoringRef.current,
  };
}
