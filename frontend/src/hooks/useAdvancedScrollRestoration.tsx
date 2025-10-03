'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';

interface ScrollRestorationOptions {
  /** 스크롤 복원 활성화 여부 */
  enabled?: boolean;
  /** 페이지별 스크롤 키 (기본값: pathname) */
  scrollKey?: string;
  /** 스크롤 저장 지연 시간 (ms) */
  saveDelay?: number;
  /** 스크롤 복원 지연 시간 (ms) */
  restoreDelay?: number;
  /** 데이터 로딩 완료 후 스크롤 복원 여부 */
  restoreAfterDataLoad?: boolean;
  /** 스크롤 컨테이너 선택자 (기본값: 'main' 또는 window) */
  containerSelector?: string;
  /** 네비게이션 타입별 처리 */
  navigationTypes?: {
    sidebar?: string;
    logo?: string;
    detail?: string;
  };
}

interface ScrollRestorationReturn {
  /** 스크롤 위치 저장 */
  saveScrollPosition: () => void;
  /** 스크롤 위치 복원 */
  restoreScrollPosition: () => void;
  /** 스크롤과 함께 네비게이션 */
  navigateWithScroll: (url: string) => void;
  /** 뒤로가기와 함께 스크롤 복원 */
  navigateBackWithScroll: () => void;
  /** 스크롤 컨테이너 찾기 */
  findScrollContainer: () => HTMLElement | Window;
  /** 특정 위치로 스크롤 */
  scrollToPosition: (y: number, behavior?: ScrollBehavior) => void;
  /** 맨 위로 스크롤 */
  scrollToTop: () => void;
}

export function useAdvancedScrollRestoration(
  options: ScrollRestorationOptions = {}
): ScrollRestorationReturn {
  const pathname = usePathname();
  const router = useRouter();
  
  const {
    enabled = true,
    scrollKey = options.scrollKey || pathname,
    saveDelay = 100,
    restoreDelay = 10,
    restoreAfterDataLoad = true,
    containerSelector = 'main',
    navigationTypes = {
      logo: 'logo-navigation',
      detail: 'from-anime-detail'
    }
  } = options;


  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const restoreTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRestoringRef = useRef(false);

  // 스크롤 컨테이너 찾기
  const findScrollContainer = useCallback((): HTMLElement | Window => {
    if (typeof window === 'undefined') return window;
    
    // 지정된 선택자로 컨테이너 찾기
    if (containerSelector !== 'main') {
      const container = document.querySelector(containerSelector) as HTMLElement;
      if (container && container.scrollHeight > container.clientHeight) {
        return container;
      }
    }
    
    // main 요소 우선 확인
    const mainElement = document.querySelector('main') as HTMLElement;
    if (mainElement && mainElement.scrollHeight > mainElement.clientHeight) {
      return mainElement;
    }
    
    // 모든 main 요소 중에서 스크롤 가능한 것 찾기
    const mainElements = document.querySelectorAll('main');
    for (const element of mainElements) {
      const el = element as HTMLElement;
      if (el.scrollHeight > el.clientHeight) {
        return el;
      }
    }
    
    // 기본값으로 window 사용
    return window;
  }, [containerSelector]);

  // 스크롤 위치 저장
  const saveScrollPosition = useCallback(() => {
    if (typeof window === 'undefined' || !enabled) return;

    // 상세화면 복원이 완료된 경우 스크롤 저장 방지
    const detailRestoreDone = sessionStorage.getItem('detail-restore-done');
    if (detailRestoreDone === 'true') {
      return;
    }

    const container = findScrollContainer();
    const scrollY = container === window ? window.scrollY : (container as HTMLElement).scrollTop;

    // 스크롤 위치가 0이면 저장하지 않음 (무의미한 저장 방지)
    if (scrollY === 0) {
      return;
    }

    // 이전에 저장된 위치와 비교하여 의미 있는 변화가 있을 때만 저장
    const lastSavedY = sessionStorage.getItem(`scroll-${scrollKey}`);
    if (lastSavedY && Math.abs(scrollY - parseInt(lastSavedY)) < 50) {
      return;
    }


    // 스크롤 위치 저장
    sessionStorage.setItem(`scroll-${scrollKey}`, scrollY.toString());

    // 타임스탬프와 함께 저장 (중복 저장 방지용)
    const scrollData = {
      y: scrollY,
      timestamp: Date.now()
    };
    sessionStorage.setItem(`scroll-position-${scrollKey}`, JSON.stringify(scrollData));
  }, [enabled, scrollKey, findScrollContainer]);

  // 스크롤 위치 복원 - 완전 재설계
  const restoreScrollPosition = useCallback(() => {
    if (typeof window === 'undefined' || !enabled || isRestoringRef.current) return;
    
    // 상세화면 복원이 이미 완료된 경우 다른 복원 방지
    const detailRestoreDone = sessionStorage.getItem('detail-restore-done');
    if (detailRestoreDone === 'true') {
      return;
    }
    
    const savedY = sessionStorage.getItem(`scroll-${scrollKey}`);
    if (!savedY) {
      return;
    }
    
    const y = parseInt(savedY);
    if (isNaN(y) || y < 0) {
      return;
    }
    
    // 사용자가 이미 스크롤한 경우 복원하지 않음 (사용자 의도 보호)
    // 단, 상세화면에서 돌아온 경우는 예외
    const navigationType = sessionStorage.getItem('navigation-type');
    const currentScrollY = window.scrollY || 0;
    if (currentScrollY > 50 && navigationType !== 'from-anime-detail') {
      return;
    }
    
    isRestoringRef.current = true;
    
    
    // 🚨 비상대책: 완전 즉시 복원 (애니메이션 0%)
    // 1. CSS scroll-behavior 강제 무시
    const originalScrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
    document.body.style.scrollBehavior = 'auto';
    
    // 2. 단일 시점 복원 (한 번만, 확실하게)
    window.scrollTo(0, y);
    document.body.scrollTop = y;
    document.documentElement.scrollTop = y;
    
    // 3. 스크롤 컨테이너 복원
    const container = findScrollContainer();
    if (container !== window) {
      (container as HTMLElement).scrollTop = y;
    }
    
    // 4. CSS 복원
    setTimeout(() => {
      document.documentElement.style.scrollBehavior = originalScrollBehavior;
      document.body.style.scrollBehavior = originalScrollBehavior;
      isRestoringRef.current = false;
    }, 0);
  }, [enabled, scrollKey, findScrollContainer]);

  // 특정 위치로 스크롤 - 완전 재설계
  const scrollToPosition = useCallback((y: number, behavior: ScrollBehavior = 'instant') => {
    const container = findScrollContainer();
    
    // 🚨 비상대책: CSS scroll-behavior 강제 무시
    const originalScrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
    document.body.style.scrollBehavior = 'auto';
    
    if (container === window) {
      window.scrollTo(0, y);
    } else {
      (container as HTMLElement).scrollTop = y;
    }
    
    // CSS 복원
    setTimeout(() => {
      document.documentElement.style.scrollBehavior = originalScrollBehavior;
      document.body.style.scrollBehavior = originalScrollBehavior;
    }, 0);
  }, [findScrollContainer]);

  // 맨 위로 스크롤
  const scrollToTop = useCallback(() => {
    scrollToPosition(0, 'instant');
  }, [scrollToPosition]);

  // 네비게이션 타입별 스크롤 처리
  const handleNavigationScroll = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const logoNav = sessionStorage.getItem(navigationTypes.logo || 'logo-navigation');
    const fromDetail = sessionStorage.getItem(navigationTypes.detail || 'from-anime-detail');
    const seasonChange = sessionStorage.getItem('navigation-type');
    
    // 로고 네비게이션인 경우 맨 위로 이동
    if (logoNav === 'true') {
      scrollToTop();
      // 관련 플래그 정리
      const flagsToClear = [
        navigationTypes.logo,
        `scroll-${scrollKey}`,
        'shouldRestoreScroll'
      ].filter(Boolean);
      
      flagsToClear.forEach(flag => {
        if (flag) sessionStorage.removeItem(flag);
      });
    } else if (fromDetail === 'true') {
      // 상세화면에서 돌아온 경우 스크롤 복원
      
      // 상세화면 복원 플래그를 즉시 설정 (다른 복원 방지)
      sessionStorage.setItem('detail-restore-done', 'true');
      
      // 고정된 키로 스크롤 복원
      const savedY = sessionStorage.getItem('scroll-search-return');
      if (savedY) {
        const y = parseInt(savedY);
        
        // 즉시 스크롤 복원 (지연 없음) - 한 번만 실행
        window.scrollTo({ top: y, left: 0, behavior: 'instant' });
        document.body.scrollTop = y;
        document.documentElement.scrollTop = y;
        
        // 0ms 지연으로 즉시 강제 유지
        setTimeout(() => {
          window.scrollTo({ top: y, left: 0, behavior: 'instant' });
          document.body.scrollTop = y;
          document.documentElement.scrollTop = y;
        }, 0);
      }
      
      sessionStorage.removeItem(navigationTypes.detail || 'from-anime-detail');
    } else if (seasonChange === 'season-change') {
      // 시즌 변경인 경우 스크롤 복원
      
      // 시즌 변경 시에는 현재 스크롤 키로 복원
      const savedY = sessionStorage.getItem(`scroll-${scrollKey}`);
      if (savedY) {
        const y = parseInt(savedY);
        
        // 즉시 스크롤 복원
        window.scrollTo(0, y);
        document.body.scrollTop = y;
        document.documentElement.scrollTop = y;
      } else {
      }
      
      sessionStorage.removeItem('navigation-type');
    }
    // 리프레시 또는 직접 URL 접근인 경우는 스크롤을 건드리지 않음 (사용자 스크롤 보호)
  }, [navigationTypes, scrollKey, scrollToTop, restoreScrollPosition]);

  // 스크롤 이벤트 핸들러 (디바운싱)
  const handleScroll = useCallback(() => {
    if (!enabled) return;
    
    // 스크롤 복원 중이면 저장하지 않음
    if (isRestoringRef.current) return;
    
    // 스크롤 위치가 0이면 저장하지 않음 (불필요한 호출 방지)
    const currentScrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    if (currentScrollY === 0) {
      return;
    }
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveScrollPosition();
    }, saveDelay);
  }, [enabled, saveDelay, saveScrollPosition]);

  // 페이지 로드 시 즉시 스크롤 복원 (깜빡임 완전 방지)
  useEffect(() => {
    if (!enabled) return;
    
    const savedY = sessionStorage.getItem(`scroll-${scrollKey}`);
    const fromDetail = sessionStorage.getItem(navigationTypes.detail || 'from-anime-detail');
    
    if (savedY && fromDetail === 'true') {
      const y = parseInt(savedY);
      
      // 🚨 비상대책: 페이지 로드 즉시 복원 (애니메이션 0%)
      // 1. CSS scroll-behavior 강제 무시
      document.documentElement.style.scrollBehavior = 'auto';
      document.body.style.scrollBehavior = 'auto';
      
      // 2. 단일 시점 복원 (한 번만, 확실하게)
      window.scrollTo(0, y);
      document.body.scrollTop = y;
      document.documentElement.scrollTop = y;
      
      // 3. 스크롤 컨테이너 복원
      const container = findScrollContainer();
      if (container !== window) {
        (container as HTMLElement).scrollTop = y;
      }
    }
    
    // 네비게이션 타입별 처리
    handleNavigationScroll();
  }, [enabled, scrollKey, navigationTypes.detail, handleNavigationScroll]);

  // 데이터 로딩 완료 후 스크롤 복원 (상세화면에서 돌아온 경우에만)
  useEffect(() => {
    if (!enabled || !restoreAfterDataLoad) return;
    
    const savedY = sessionStorage.getItem(`scroll-${scrollKey}`);
    const fromDetail = sessionStorage.getItem(navigationTypes.detail || 'from-anime-detail');
    
    // 상세화면에서 돌아온 경우에만 스크롤 복원
    if (savedY && fromDetail === 'true') {
      // 데이터 로딩 완료를 확인하는 로직
      const checkDataLoaded = () => {
        const hasContent = document.querySelector('[data-content-loaded]') || 
                          document.body.scrollHeight > window.innerHeight;
        
        if (hasContent) {
          // 사용자가 이미 스크롤한 경우 복원하지 않음
          const currentScrollY = window.scrollY || 0;
          if (currentScrollY <= 50) {
            // 이미 페이지 로드 시 복원했으므로 추가 복원은 최소화
            const container = findScrollContainer();
            if (container !== window) {
              const y = parseInt(savedY);
              (container as HTMLElement).scrollTop = y;
            } else {
              // window 스크롤도 instant로 복원
              const y = parseInt(savedY);
              window.scrollTo({
                top: y,
                left: 0,
                behavior: 'instant'
              });
            }
          }
        } else {
          // 데이터가 아직 로드되지 않았으면 재시도
          setTimeout(checkDataLoaded, 100);
        }
      };
      
      checkDataLoaded();
    }
  }, [enabled, restoreAfterDataLoad, scrollKey, navigationTypes.detail, findScrollContainer]);

  // 스크롤 이벤트 리스너 등록
  useEffect(() => {
    if (typeof window === 'undefined' || !enabled) return;
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [enabled, handleScroll]);

  // 페이지 언마운트 시 스크롤 위치 저장
  useEffect(() => {
    return () => {
      if (enabled) {
        // 클릭 시점에 이미 저장했는지 확인
        const savedPosition = sessionStorage.getItem(`scroll-position-${scrollKey}`);
        if (savedPosition) {
          try {
            const { timestamp, y } = JSON.parse(savedPosition);
            const now = Date.now();
            // 2초 이내에 저장된 값이 있고, 스크롤 값이 100 이상이면 언마운트 시 저장 건너뛰기
            if (now - timestamp < 2000 && y > 100) {
              return;
            }
          } catch (error) {
console.error('저장된 스크롤 위치 파싱 실패:', error);
          }
        }
        
        saveScrollPosition();
      }
    };
  }, [enabled, scrollKey, saveScrollPosition]);

  // 스크롤과 함께 네비게이션
  const navigateWithScroll = useCallback((url: string) => {
    if (!enabled) {
      router.push(url);
      return;
    }
    
    // 애니메이션 상세화면으로 이동하는 경우 to-anime-detail 플래그 설정
    if (url.includes('/animes/')) {
      sessionStorage.setItem('to-anime-detail', 'true');
      
      // 현재 스크롤 위치를 즉시 저장 (고정된 키 사용)
      const currentScrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      if (currentScrollY > 0) {
        sessionStorage.setItem('scroll-search-return', currentScrollY.toString());
      }
    }
    
    // 클릭 시점의 스크롤 위치를 즉시 저장
    saveScrollPosition();
    
    router.push(url);
  }, [enabled, router, saveScrollPosition]);

  // 뒤로가기와 함께 스크롤 복원
  const navigateBackWithScroll = useCallback(() => {
    if (!enabled) {
      router.back();
      return;
    }
    
    sessionStorage.setItem('shouldRestoreScroll', 'true');
    router.back();
  }, [enabled, router]);

  return {
    saveScrollPosition,
    restoreScrollPosition,
    navigateWithScroll,
    navigateBackWithScroll,
    findScrollContainer,
    scrollToPosition,
    scrollToTop
  };
}

// 유틸리티 함수들
export const scrollUtils = {
  /** 맨 위로 스크롤 */
  scrollToTop: () => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  },
  
  /** 특정 위치로 스크롤 */
  scrollToPosition: (y: number, behavior: ScrollBehavior = 'instant') => {
    window.scrollTo({ top: y, left: 0, behavior });
  },
  
  /** 스크롤 위치 저장 */
  saveScrollPosition: (key: string) => {
    const scrollY = window.scrollY || 0;
    sessionStorage.setItem(`scroll-${key}`, scrollY.toString());
  },
  
  /** 스크롤 위치 복원 */
  restoreScrollPosition: (key: string) => {
    const savedY = sessionStorage.getItem(`scroll-${key}`);
    if (savedY) {
      const y = parseInt(savedY);
      window.scrollTo(0, y);
    }
  },
  
  /** 스토리지 플래그 정리 */
  clearStorageFlags: (...flags: string[]) => {
    flags.forEach(flag => {
      if (flag) sessionStorage.removeItem(flag);
    });
  }
};
