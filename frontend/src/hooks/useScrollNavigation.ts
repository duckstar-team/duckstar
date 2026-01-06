import { useEffect } from 'react';
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
  useEffect(() => {
    if (sections.length === 0) return;

    const handleNavigationScroll = () => {
      const scrollY = window.scrollY;

      const sectionPositions = sections
        .map(({ id, day }) => {
          const element = document.getElementById(id);
          if (!element) return null;

          return {
            id,
            day,
            top: element.offsetTop - offset,
          };
        })
        .filter(Boolean) as Array<{ id: string; day: DayOfWeek; top: number }>;

      let activeSection = sections[0];

      if (scrollY === 0) {
        for (let i = 0; i < sections.length; i++) {
          const section = sections[i];
          const element = document.getElementById(section.id);
          if (element && element.children.length > 0) {
            activeSection = section;
            break;
          }
        }
      } else {
        for (let i = sectionPositions.length - 1; i >= 0; i--) {
          const section = sectionPositions[i];
          if (section && scrollY >= section.top) {
            activeSection = { id: section.id, day: section.day };
            break;
          }
        }
      }

      onDayChange(activeSection.day);
    };

    const timeout = setTimeout(() => {
      handleNavigationScroll();
      window.addEventListener('scroll', handleNavigationScroll, {
        passive: true,
      });
    }, 10);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('scroll', handleNavigationScroll);
    };
  }, [sections, onDayChange, offset]);
}
