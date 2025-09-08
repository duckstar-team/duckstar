'use client';

import React, { createContext, useContext, useEffect, useRef, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';

interface ScrollPosition {
  pathname: string;
  scrollY: number;
  timestamp: number;
}

interface ScrollRestorationContextType {
  saveScrollPosition: (pathname: string, scrollY: number) => void;
  getScrollPosition: (pathname: string) => number | null;
  clearScrollPosition: (pathname: string) => void;
  clearAllScrollPositions: () => void;
  registerPage: (pathname: string) => void;
  unregisterPage: (pathname: string) => void;
  setNavigationClick: (isNavigationClick: boolean) => void;
}

const ScrollRestorationContext = createContext<ScrollRestorationContextType | null>(null);

interface ScrollRestorationProviderProps {
  children: ReactNode;
}

export function ScrollRestorationProvider({ children }: ScrollRestorationProviderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const registeredPages = useRef<Set<string>>(new Set());
  const scrollPositions = useRef<Map<string, ScrollPosition>>(new Map());
  const isNavigating = useRef(false);
  const isNavigationClick = useRef(false);

  // 스크롤 위치 저장
  const saveScrollPosition = (pathname: string, scrollY: number) => {
    if (!registeredPages.current.has(pathname)) return;
    
    scrollPositions.current.set(pathname, {
      pathname,
      scrollY,
      timestamp: Date.now()
    });
    
    // sessionStorage에도 저장 (브라우저 새로고침 대비)
    try {
      sessionStorage.setItem('scrollPositions', JSON.stringify(Array.from(scrollPositions.current.entries())));
    } catch (error) {
    }
  };

  // 스크롤 위치 조회
  const getScrollPosition = (pathname: string): number | null => {
    const position = scrollPositions.current.get(pathname);
    return position ? position.scrollY : null;
  };

  // 스크롤 위치 삭제
  const clearScrollPosition = (pathname: string) => {
    scrollPositions.current.delete(pathname);
    try {
      sessionStorage.setItem('scrollPositions', JSON.stringify(Array.from(scrollPositions.current.entries())));
    } catch (error) {
    }
  };

  // 모든 스크롤 위치 삭제 (네비게이션 메뉴 클릭 시 사용)
  const clearAllScrollPositions = () => {
    scrollPositions.current.clear();
    try {
      sessionStorage.removeItem('scrollPositions');
    } catch (error) {
    }
  };

  // 네비게이션 클릭 상태 설정
  const setNavigationClick = (isClick: boolean) => {
    isNavigationClick.current = isClick;
  };

  // 페이지 등록 (스크롤 복원 대상 페이지)
  const registerPage = (pathname: string) => {
    registeredPages.current.add(pathname);
  };

  // 페이지 등록 해제
  const unregisterPage = (pathname: string) => {
    registeredPages.current.delete(pathname);
  };

  // sessionStorage에서 스크롤 위치 복원
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('scrollPositions');
      if (saved) {
        const entries = JSON.parse(saved) as [string, ScrollPosition][];
        scrollPositions.current = new Map(entries);
      }
    } catch (error) {
    }
  }, []);

  // 페이지 변경 감지 및 스크롤 복원
  useEffect(() => {
    const handleRouteChange = () => {
      if (isNavigating.current) {
        isNavigating.current = false;
        return;
      }

      // 네비게이션 클릭으로 인한 페이지 이동인 경우 스크롤 복원하지 않음
      if (isNavigationClick.current) {
        isNavigationClick.current = false;
        window.scrollTo(0, 0);
        return;
      }

      // 현재 페이지가 등록된 페이지인지 확인
      if (registeredPages.current.has(pathname)) {
        const savedScrollY = getScrollPosition(pathname);
        if (savedScrollY !== null) {
          // 약간의 지연을 두어 DOM이 완전히 렌더링된 후 스크롤 복원
          setTimeout(() => {
            window.scrollTo(0, savedScrollY);
          }, 100);
        }
      } else {
        // 등록되지 않은 페이지는 맨 위로 스크롤
        window.scrollTo(0, 0);
      }
    };

    // 페이지 로드 시 스크롤 복원
    handleRouteChange();

    // popstate 이벤트 (뒤로가기/앞으로가기) 감지
    const handlePopState = () => {
      isNavigating.current = true;
      setTimeout(handleRouteChange, 50);
    };

    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [pathname]);

  const contextValue: ScrollRestorationContextType = {
    saveScrollPosition,
    getScrollPosition,
    clearScrollPosition,
    clearAllScrollPositions,
    registerPage,
    unregisterPage,
    setNavigationClick,
  };

  return (
    <ScrollRestorationContext.Provider value={contextValue}>
      {children}
    </ScrollRestorationContext.Provider>
  );
}

export function useScrollRestorationContext() {
  const context = useContext(ScrollRestorationContext);
  if (!context) {
    throw new Error('useScrollRestorationContext must be used within a ScrollRestorationProvider');
  }
  return context;
}
