import { useEffect, useState, RefObject } from 'react';

/**
 * 사이드바 너비를 계산하는 커스텀 훅
 * ref가 제공되면 ref를 사용하고, 없으면 document에서 aside 요소를 찾습니다.
 */
export function useSidebarWidth(sidebarRef?: RefObject<HTMLElement | null>) {
  const [sidebarWidth, setSidebarWidth] = useState(0);

  useEffect(() => {
    const getSidebarElement = (): HTMLElement | null => {
      // ref가 제공되면 ref 사용
      if (sidebarRef?.current) {
        return sidebarRef.current;
      }
      // 없으면 document에서 찾기
      return document.querySelector(
        'aside.fixed.top-15.left-0'
      ) as HTMLElement | null;
    };

    const updateWidth = () => {
      const sidebarElement = getSidebarElement();
      if (sidebarElement) {
        setSidebarWidth(sidebarElement.offsetWidth);
      } else {
        setSidebarWidth(0);
      }
    };

    const sidebarElement = getSidebarElement();
    if (!sidebarElement) {
      // ref가 없고 요소도 없는 경우, 잠시 후 재시도 (VoteFormView에서 사용하는 경우)
      const timeoutId = setTimeout(updateWidth, 100);
      return () => clearTimeout(timeoutId);
    }

    // ResizeObserver로 너비 변경 감지
    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(sidebarElement);

    // 초기 너비 측정
    updateWidth();

    return () => {
      resizeObserver.disconnect();
    };
  }, [sidebarRef]);

  return sidebarWidth;
}
