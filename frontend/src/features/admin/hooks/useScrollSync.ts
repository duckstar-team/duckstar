import { useEffect } from 'react';

export function useScrollSync(
  topRef: React.RefObject<HTMLDivElement | null>,
  bottomRef: React.RefObject<HTMLDivElement | null>,
  dependencies: any[] = []
) {
  useEffect(() => {
    const topScroll = topRef.current;
    const bottomScroll = bottomRef.current;

    if (!topScroll || !bottomScroll) return;

    // 테이블의 실제 너비를 계산하여 상단 스크롤 영역의 너비를 맞춤
    const table = bottomScroll.querySelector('table');
    if (table) {
      const tableWidth = table.scrollWidth;
      const topScrollContent = topScroll.querySelector('div');
      if (topScrollContent) {
        topScrollContent.style.minWidth = `${tableWidth}px`;
      }
    }

    const handleTopScroll = () => {
      if (bottomScroll) {
        bottomScroll.scrollLeft = topScroll.scrollLeft;
      }
    };

    const handleBottomScroll = () => {
      if (topScroll) {
        topScroll.scrollLeft = bottomScroll.scrollLeft;
      }
    };

    topScroll.addEventListener('scroll', handleTopScroll);
    bottomScroll.addEventListener('scroll', handleBottomScroll);

    return () => {
      topScroll.removeEventListener('scroll', handleTopScroll);
      bottomScroll.removeEventListener('scroll', handleBottomScroll);
    };
  }, [topRef, bottomRef, ...dependencies]);
}
