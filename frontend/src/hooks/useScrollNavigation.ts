import { useEffect, useRef } from 'react';
import { DayOfWeek } from '@/components/domain/search/DaySelection';

interface Section {
  id: string;
  day: DayOfWeek;
}

/**
 * 스크롤 위치에 따라 활성 섹션을 감지하고 요일을 업데이트하는 훅
 */
export function useScrollNavigation(
  sections: Section[],
  onDayChange: (day: DayOfWeek) => void,
  offset: number = 380
) {
  const currentDayRef = useRef<DayOfWeek | null>(null);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (sections.length === 0) return;

    const handleNavigationScroll = () => {
      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;

      const sectionPositions = sections
        .map(({ id, day }) => {
          const element = document.getElementById(id);
          if (!element) return null;

          // offsetTop을 사용하여 문서 기준 절대 위치 계산
          let absoluteTop = element.offsetTop;
          let parent = element.offsetParent as HTMLElement | null;
          while (parent) {
            absoluteTop += parent.offsetTop;
            parent = parent.offsetParent as HTMLElement | null;
          }

          return {
            id,
            day,
            top: absoluteTop,
            bottom: absoluteTop + element.offsetHeight,
            element,
          };
        })
        .filter(Boolean) as Array<{
        id: string;
        day: DayOfWeek;
        top: number;
        bottom: number;
        element: HTMLElement;
      }>;

      let activeSection: { id: string; day: DayOfWeek } | null = null;

      // 스크롤이 맨 위에 있을 때
      if (scrollY < 100) {
        for (let i = 0; i < sections.length; i++) {
          const section = sections[i];
          const element = document.getElementById(section.id);
          if (element && element.children.length > 0) {
            activeSection = section;
            break;
          }
        }
      } else {
        // 스크롤 위치 + offset이 섹션 top보다 크거나 같은 마지막 섹션 찾기
        // 이렇게 하면 섹션이 뷰포트의 offset 위치에 도달했을 때 바로 활성화됨
        const scrollThreshold = scrollY + offset;
        
        // 섹션 위치를 정렬하여 순서대로 확인
        const sortedSections = [...sectionPositions].sort((a, b) => a.top - b.top);
        
        for (let i = sortedSections.length - 1; i >= 0; i--) {
          const section = sortedSections[i];
          if (section && scrollThreshold >= section.top) {
            activeSection = { id: section.id, day: section.day };
            break;
          }
        }

        // 아무 섹션도 찾지 못한 경우 첫 번째 섹션 사용
        if (!activeSection && sortedSections.length > 0) {
          activeSection = {
            id: sortedSections[0].id,
            day: sortedSections[0].day,
          };
        }
      }

      // 현재 활성 섹션이 변경된 경우에만 업데이트
      if (
        activeSection &&
        activeSection.day !== currentDayRef.current
      ) {
        currentDayRef.current = activeSection.day;
        onDayChange(activeSection.day);
      }
    };

    const throttledHandleScroll = () => {
      if (rafIdRef.current !== null) {
        return;
      }

      rafIdRef.current = requestAnimationFrame(() => {
        handleNavigationScroll();
        rafIdRef.current = null;
      });
    };

    // DOM이 준비될 때까지 대기 후 스크롤 감지 시작
    const timeout = setTimeout(() => {
      // 모든 섹션 요소가 DOM에 존재하는지 확인
      const allElementsExist = sections.every((section) => {
        const element = document.getElementById(section.id);
        return element !== null;
      });

      if (allElementsExist) {
        handleNavigationScroll();
        window.addEventListener('scroll', throttledHandleScroll, {
          passive: true,
        });
      } else {
        // 요소가 아직 준비되지 않았으면 조금 더 기다림
        setTimeout(() => {
          handleNavigationScroll();
          window.addEventListener('scroll', throttledHandleScroll, {
            passive: true,
          });
        }, 100);
      }
    }, 50);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('scroll', throttledHandleScroll);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      currentDayRef.current = null;
    };
  }, [sections, onDayChange, offset]);
}
