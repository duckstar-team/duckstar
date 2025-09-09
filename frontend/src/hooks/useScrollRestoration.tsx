'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';

interface UseScrollRestorationOptions {
  enabled?: boolean;
  delay?: number;
}

export function useScrollRestoration(options: UseScrollRestorationOptions = {}) {
  // 완전히 비활성화 - search 화면에서 직접 구현
  console.log('🚫 useScrollRestoration 비활성화됨 - search 화면에서 직접 구현');
  return {
    saveScrollPosition: () => {},
    restoreScrollPosition: () => {},
    navigateWithScroll: () => {},
    navigateBackWithScroll: () => {}
  };

  // 스크롤 위치 저장 (search 화면에서만)
  const saveScrollPosition = () => {
    if (typeof window === 'undefined') return;
    
    // search 화면이 아닌 경우 저장하지 않음
    if (pathname !== '/search') {
      console.log('🚫 search 화면이 아니므로 스크롤 저장 건너뛰기:', pathname);
      return;
    }
    
    const scrollY = window.scrollY || 0;
    console.log('💾 search 화면 스크롤 위치 저장:', { pathname, scrollY });
    sessionStorage.setItem('scroll-/search', scrollY.toString());
  };

  // 스크롤 위치 복원 (search 화면에서만)
  const restoreScrollPosition = () => {
    if (typeof window === 'undefined') return;
    
    // search 화면이 아닌 경우 복원하지 않음
    if (pathname !== '/search') {
      console.log('🚫 search 화면이 아니므로 스크롤 복원 건너뛰기:', pathname);
      return;
    }
    
    const savedY = sessionStorage.getItem('scroll-/search');
    if (savedY) {
      const y = parseInt(savedY);
      console.log('🔄 search 화면 스크롤 복원:', { pathname, y });
      window.scrollTo(0, y);
    }
  };

  // 스크롤 이벤트 핸들러 (디바운싱)
  const handleScroll = () => {
    console.log('스크롤 이벤트 발생:', {
      scrollY: window.scrollY,
      pathname,
      enabled
    });

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveScrollPosition();
    }, saveInterval);
  };

  // 페이지 로드 시 스크롤 복원
  useEffect(() => {
    if (!enabled) return;
    
    const shouldRestore = sessionStorage.getItem('shouldRestoreScroll') === 'true';
    
    if (shouldRestore) {
      console.log('스크롤 복원 시작:', { pathname, enabled });
      
      // 여러 번 시도하여 확실히 복원
      const attemptRestore = (attempt = 1) => {
        const maxAttempts = 10;
        
        if (attempt > maxAttempts) {
          console.log('스크롤 복원 최대 시도 횟수 초과');
          sessionStorage.removeItem('shouldRestoreScroll');
          return;
        }
        
        const hasContent = document.querySelector('[data-content-loaded]') || 
                          document.body.scrollHeight > window.innerHeight;
        
        if (hasContent) {
          console.log(`스크롤 복원 시도 ${attempt}:`, {
            scrollHeight: document.body.scrollHeight,
            windowHeight: window.innerHeight,
            hasContent
          });
          
          restoreTimeoutRef.current = setTimeout(() => {
            restoreScrollPosition();
            sessionStorage.removeItem('shouldRestoreScroll');
          }, restoreDelay);
        } else {
          console.log(`스크롤 복원 대기 ${attempt}:`, {
            scrollHeight: document.body.scrollHeight,
            windowHeight: window.innerHeight
          });
          
          restoreTimeoutRef.current = setTimeout(() => {
            attemptRestore(attempt + 1);
          }, 200);
        }
      };
      
      attemptRestore();
    }

    return () => {
      if (restoreTimeoutRef.current) {
        clearTimeout(restoreTimeoutRef.current);
      }
    };
  }, [pathname, restoreDelay, enabled]);

  // 스크롤 이벤트 리스너 등록 (enabled가 true일 때만)
  useEffect(() => {
    if (typeof window === 'undefined' || !enabled) return;

    console.log('스크롤 이벤트 리스너 등록:', { pathname, enabled });

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      console.log('스크롤 이벤트 리스너 제거:', pathname);
      window.removeEventListener('scroll', handleScroll);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [saveInterval, pathname, enabled]);

  // 페이지 언마운트 시 스크롤 위치 저장 (클릭 시점에 이미 저장했으면 건너뛰기)
  useEffect(() => {
    return () => {
      if (enabled) {
        // 클릭 시점에 이미 저장했는지 확인
        const savedPosition = sessionStorage.getItem(`scroll-position-${pathname}`);
        if (savedPosition) {
          try {
            const { timestamp, y } = JSON.parse(savedPosition);
            const now = Date.now();
            // 2초 이내에 저장된 값이 있고, 스크롤 값이 100 이상이면 언마운트 시 저장 건너뛰기
            if (now - timestamp < 2000 && y > 100) {
              console.log('✅ 클릭 시점에 이미 저장된 스크롤 위치 사용, 언마운트 시 저장 건너뛰기:', {
                savedY: y,
                timeDiff: now - timestamp
              });
              return;
            }
          } catch (error) {
            console.error('저장된 스크롤 위치 파싱 실패:', error);
          }
        }
        
        console.log('컴포넌트 언마운트 - 스크롤 위치 저장');
        saveScrollPosition();
      }
    };
  }, [pathname, enabled]);

  // 스크롤 위치 저장과 함께 네비게이션 (단순화)
  const navigateWithScroll = useCallback((url: string) => {
    console.log('🚀 navigateWithScroll 호출:', { url, pathname });
    
    // 클릭 시점의 스크롤 위치를 즉시 저장
    saveScrollPosition();
    
    router.push(url);
  }, [router, pathname]);

  // 뒤로가기와 함께 스크롤 복원
  const navigateBackWithScroll = useCallback(() => {
    sessionStorage.setItem('shouldRestoreScroll', 'true');
    router.back();
  }, [router]);

  return {
    saveScrollPosition,
    restoreScrollPosition,
    navigateWithScroll,
    navigateBackWithScroll
  };
}

// 별도의 useNavigateWithScroll 훅 - 비활성화
export function useNavigateWithScroll() {
  // 완전히 비활성화 - search 화면에서 직접 구현
  console.log('🚫 useNavigateWithScroll 비활성화됨 - search 화면에서 직접 구현');
  return {
    navigateWithScroll: () => {},
    navigateBackWithScroll: () => {}
  };
}
