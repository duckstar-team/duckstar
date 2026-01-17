'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib';
import TooltipBtn from '@/components/common/TooltipBtn';
import { ChevronDown } from 'lucide-react';

export type DayOfWeek =
  | '곧 시작'
  | '월'
  | '화'
  | '수'
  | '목'
  | '금'
  | '토'
  | '일'
  | '특별편성 및 극장판';

interface DaySelectionProps {
  selectedDay: DayOfWeek;
  onDaySelect: (day: DayOfWeek) => void;
  emptyDays?: Set<DayOfWeek>; // 비어있는 요일들
  isThisWeek?: boolean; // 이번 주인지 여부
  isSticky?: boolean; // 스티키 상태
}

const getDays = (isThisWeek: boolean): DayOfWeek[] => {
  const days: DayOfWeek[] = [
    '월',
    '화',
    '수',
    '목',
    '금',
    '토',
    '일',
    '특별편성 및 극장판',
  ];
  if (isThisWeek) {
    days.unshift('곧 시작');
    return days;
  } else {
    return days;
  }
};

export default function DaySelection({
  selectedDay,
  onDaySelect,
  emptyDays = new Set(),
  isThisWeek = true,
  isSticky = false,
}: DaySelectionProps) {
  const [hoveredDay, setHoveredDay] = useState<DayOfWeek | null>(null);
  const [selectedBarStyle, setSelectedBarStyle] = useState({
    left: 0,
    width: 0,
    opacity: 0,
    transition: 'all 0.3s ease-out',
  });
  const [hoveredBarStyle, setHoveredBarStyle] = useState({
    left: 0,
    width: 0,
    opacity: 0,
    transition: 'all 0.3s ease-out',
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  const updateNavigationBar = (day: DayOfWeek | null, immediate = false) => {
    if (!day || !containerRef.current) {
      setSelectedBarStyle({
        left: 0,
        width: 0,
        opacity: 0,
        transition: 'all 0.3s ease-out',
      });
      return;
    }

    // tabRefs가 아직 설정되지 않은 경우 지연 실행
    if (!tabRefs.current[day]) {
      setTimeout(() => {
        updateNavigationBar(day, immediate);
      }, 50);
      return;
    }

    const tabElement = tabRefs.current[day];
    const containerElement = containerRef.current;

    // DOM이 완전히 렌더링된 후 위치 계산
    requestAnimationFrame(() => {
      const tabRect = tabElement.getBoundingClientRect();
      const containerRect = containerElement.getBoundingClientRect();

      // 컨테이너의 왼쪽 경계를 기준으로 한 상대적 위치 계산
      const left = tabRect.left - containerRect.left;
      const width = tabRect.width;

      setSelectedBarStyle({
        width: width,
        left: left,
        opacity: 1,
        transition: immediate ? 'none' : 'all 0.3s ease-out',
      });
    });
  };

  // 호버된 네비게이션 바 위치 업데이트
  const updateHoveredBar = (day: DayOfWeek | null, immediate = false) => {
    if (!day || !tabRefs.current[day] || !containerRef.current) {
      setHoveredBarStyle({
        width: 0,
        left: 0,
        opacity: 0,
        transition: 'all 0.3s ease-out',
      });
      return;
    }

    const tabElement = tabRefs.current[day];
    const containerElement = containerRef.current;

    // getBoundingClientRect를 사용하되, 컨테이너 기준으로 정확히 계산
    const tabRect = tabElement.getBoundingClientRect();
    const containerRect = containerElement.getBoundingClientRect();

    // 컨테이너의 왼쪽 경계를 기준으로 한 상대적 위치 계산
    const left = tabRect.left - containerRect.left;
    const width = tabRect.width;

    setHoveredBarStyle({
      width: width,
      left: left,
      opacity: 1,
      transition: immediate ? 'none' : 'all 0.3s ease-out',
    });
  };

  const updateBars = () => {
    if (selectedDay) {
      updateNavigationBar(selectedDay);
    }
    if (hoveredDay) {
      updateHoveredBar(hoveredDay);
    }
  };

  // 선택된 탭 변경 시 네비게이션 바 위치 업데이트
  useEffect(() => {
    updateBars();
  }, [selectedDay, hoveredDay]);

  // sticky 상태 변경 및 컨테이너 크기 변경 감지
  useEffect(() => {
    if (!containerRef.current) return;

    // ResizeObserver로 컨테이너 크기 변경 감지
    const resizeObserver = new ResizeObserver(() => {
      updateBars();
    });

    resizeObserver.observe(containerRef.current);

    // sticky 상태 변경 시에도 업데이트 (ResizeObserver가 즉시 트리거되지 않을 수 있음)
    const timeoutId = setTimeout(() => {
      updateBars();
    }, 100);

    // 윈도우 리사이즈 이벤트
    const handleResize = () => {
      updateBars();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      resizeObserver.disconnect();
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isSticky, selectedDay, hoveredDay]);

  return (
    <>
      {/* 모바일: select option 형태 */}
      <div className="flex-1 md:hidden">
        <div className="relative rounded-xl border border-gray-300 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
          <select
            value={selectedDay}
            onChange={(e) => onDaySelect(e.target.value as DayOfWeek)}
            className="w-full cursor-pointer appearance-none border-none pr-6 text-sm font-medium text-gray-900 outline-none dark:text-white"
          >
            {getDays(isThisWeek).map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 transform">
            <ChevronDown className="size-4.5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* 태블릿/데스크톱: 기존 탭 형태 */}
      <div
        ref={containerRef}
        data-day-selection
        className={cn(
          'relative mx-auto hidden w-full items-center justify-around gap-1 transition md:flex lg:gap-2',
          isSticky ? 'max-w-sm' : 'max-w-sm @lg:max-w-md'
        )}
        onMouseLeave={() => {
          setHoveredDay(null);
          // 호버 종료 시: 호버된 요일의 n만 서서히 사라짐
          setHoveredBarStyle((prev) => ({ ...prev, opacity: 0 }));
        }}
      >
        {getDays(isThisWeek).map((day) => {
          const isSelected = selectedDay === day;
          const isHovered = hoveredDay === day && day !== selectedDay;
          const isEmpty = emptyDays
            ? Array.isArray(emptyDays)
              ? emptyDays.includes(day)
              : emptyDays.has(day)
            : false;

          const showTooltip = isHovered && isEmpty && day !== '곧 시작';

          return (
            <TooltipBtn
              key={day}
              text={showTooltip ? '이번 주 없음' : ''}
              placement="bottom"
              className="text-xs!"
              variant="light"
            >
              <button
                ref={(el) => {
                  tabRefs.current[day] = el;
                }}
                onClick={() => {
                  onDaySelect(day);
                  // 비어있는 요일인 경우 스크롤 이동하지 않음
                  if (isEmpty && day !== '곧 시작') {
                    return;
                  }
                }}
                onMouseEnter={() => {
                  setHoveredDay(day);
                  updateHoveredBar(day);
                }}
                className="relative flex w-full justify-center transition"
              >
                <span
                  className={cn(
                    'whitespace-nowrap transition-colors duration-200 lg:text-lg',
                    isSelected || isHovered
                      ? 'text-brand font-semibold'
                      : 'font-normal text-gray-400/80'
                  )}
                >
                  {day}
                </span>
              </button>

              {/* 선택된 요일의 네비게이션 바 */}
              <div
                className="bg-brand absolute -bottom-2 h-0.5"
                style={{
                  left: selectedBarStyle.left,
                  width: selectedBarStyle.width,
                  opacity: selectedBarStyle.opacity,
                  transition: selectedBarStyle.transition,
                }}
              />

              {/* 호버된 요일의 네비게이션 바 */}
              <div
                className="bg-brand absolute -bottom-2 h-0.5"
                style={{
                  left: hoveredBarStyle.left,
                  width: hoveredBarStyle.width,
                  opacity: hoveredBarStyle.opacity,
                  transition: hoveredBarStyle.transition,
                }}
              />
            </TooltipBtn>
          );
        })}
      </div>
    </>
  );
}
