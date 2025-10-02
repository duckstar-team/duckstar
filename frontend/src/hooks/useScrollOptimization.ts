import { useEffect, useRef, useState } from 'react';

/**
 * 스크롤 중 애니메이션 성능을 최적화하는 훅
 * GPU 가속을 강제로 활성화하고 스크롤 이벤트를 최적화합니다.
 */
export function useScrollOptimization() {
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  const lastScrollY = useRef(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY || document.documentElement.scrollTop;
          
          // 스크롤 위치가 실제로 변경되었을 때만 상태 업데이트
          if (Math.abs(currentScrollY - lastScrollY.current) > 1) {
            setIsScrolling(true);
            lastScrollY.current = currentScrollY;
            
            // 스크롤이 멈춘 후 100ms 후에 스크롤 상태를 false로 설정
            if (scrollTimeoutRef.current) {
              clearTimeout(scrollTimeoutRef.current);
            }
            
            scrollTimeoutRef.current = setTimeout(() => {
              setIsScrolling(false);
            }, 100);
          }
          
          ticking = false;
        });
        ticking = true;
      }
    };

    // passive 옵션으로 스크롤 성능 최적화
    const options = { passive: true };
    
    // 메인 스크롤 컨테이너 찾기
    const mainElement = document.querySelector('main');
    const scrollTarget = mainElement || window;

    if (scrollTarget === window) {
      window.addEventListener('scroll', handleScroll, options);
    } else {
      mainElement?.addEventListener('scroll', handleScroll, options);
    }

    return () => {
      if (scrollTarget === window) {
        window.removeEventListener('scroll', handleScroll);
      } else {
        mainElement?.removeEventListener('scroll', handleScroll);
      }
      
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return {
    isScrolling
  };
}
