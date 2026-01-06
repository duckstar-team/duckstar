import { useState, useEffect } from 'react';

/**
 * 화면 크기를 감지하는 훅
 */
export function useScreenSize(breakpoint: number = 1440) {
  const [isSmallDesktop, setIsSmallDesktop] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallDesktop(window.innerWidth < breakpoint);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, [breakpoint]);

  return isSmallDesktop;
}
