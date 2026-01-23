'use client';

import { useState, useEffect } from 'react';
import { WeekDto } from '@/types';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib';

interface HeaderListProps {
  weekDtos: WeekDto[];
  selectedWeek: WeekDto | null;
  onWeekChange: (week: WeekDto) => void;
}

export default function HeaderList({
  weekDtos,
  selectedWeek: propSelectedWeek,
  onWeekChange,
}: HeaderListProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // 모든 주차 사용
  const closedWeeks = weekDtos || [];

  // 외부에서 전달받은 selectedWeek 사용, 없으면 첫 번째 주차를 기본 선택
  const selectedWeek = propSelectedWeek || closedWeeks[0] || null;

  // 드롭다운 메뉴 상태 저장 및 복원
  useEffect(() => {
    const savedDropdownState = sessionStorage.getItem(
      'home-left-dropdown-open'
    );
    if (savedDropdownState === 'true') {
      setIsDropdownOpen(true);
      // 복원 후 플래그 제거
      sessionStorage.removeItem('home-left-dropdown-open');
    }
  }, []);

  // 드롭다운 상태 변경 시 저장
  useEffect(() => {
    if (isDropdownOpen) {
      sessionStorage.setItem('home-left-dropdown-open', 'true');
    } else {
      sessionStorage.removeItem('home-left-dropdown-open');
    }
  }, [isDropdownOpen]);

  const currentWeekText = selectedWeek
    ? `${selectedWeek.year}년 ${selectedWeek.quarter}분기 ${selectedWeek.week}주차`
    : '2025년 3분기 12주차';

  // 425px 이하에서는 년도 제거
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth <= 425);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const displayText =
    isSmallScreen && selectedWeek
      ? `${selectedWeek.quarter}분기 ${selectedWeek.week}주차`
      : currentWeekText;

  const handleWeekSelect = (week: WeekDto) => {
    setIsDropdownOpen(false);
    onWeekChange?.(week);
  };

  // 상세화면으로 이동할 때 드롭다운 상태 저장
  const handleDropdownToggle = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // 바깥 영역 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        isDropdownOpen &&
        !(e.target as Element).closest('.dropdown-container')
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isDropdownOpen]);

  return (
    <div className="flex w-full items-end justify-between gap-4 px-3 sm:gap-6 sm:px-4 md:px-5 lg:gap-8">
      {/* 왼쪽 헤더 */}
      <div className="flex items-center justify-start">
        <div className="relative h-12 w-32 overflow-hidden sm:w-36 md:w-40 lg:w-44">
          <div
            className="text-brand absolute left-1/2 translate-x-[-50%] text-center text-sm leading-[18px] font-semibold text-nowrap whitespace-pre not-italic sm:text-base sm:leading-[20px] md:text-lg md:leading-[22px]"
            style={{ top: 'calc(50% - 5px)' }}
          >
            애니메이션 순위 🇰🇷
          </div>
          <div
            aria-hidden="true"
            className="border-brand pointer-events-none absolute inset-0 border-[0px_0px_2px] border-solid"
          />
        </div>
      </div>

      {/* 오른쪽 드롭다운 메뉴 */}
      <div className="dropdown-container relative flex items-center justify-end gap-1.5">
        <button
          onClick={handleDropdownToggle}
          className="group flex cursor-pointer items-center justify-start gap-1.5 text-right text-sm leading-loose font-normal whitespace-nowrap text-zinc-400 hover:text-zinc-500 sm:text-base md:text-lg"
        >
          <span>{displayText}</span>
          {/* 드롭다운 아이콘 */}
          <ChevronDown
            className={cn(
              'size-4 text-zinc-400 transition-transform group-hover:text-zinc-500',
              isDropdownOpen && 'rotate-180'
            )}
          />
        </button>

        {/* 드롭다운 메뉴 - CLOSED된 주차들만 표시 */}
        {isDropdownOpen && (
          <div className="absolute top-full right-0 z-10 mt-2 max-h-60 min-w-50 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-none dark:bg-zinc-800">
            {closedWeeks.map((week, index) => (
              <button
                key={`${week.year}-${week.quarter}-${week.week}`}
                onClick={() => handleWeekSelect(week)}
                className={`w-full cursor-pointer px-4 py-3 text-left ${
                  selectedWeek?.year === week.year &&
                  selectedWeek?.quarter === week.quarter &&
                  selectedWeek?.week === week.week
                    ? 'bg-rose-50 font-semibold text-rose-800 dark:bg-zinc-700 dark:text-zinc-100'
                    : 'text-gray-700 hover:bg-gray-50 dark:text-zinc-400 dark:hover:bg-zinc-700/50'
                }`}
              >
                <div className="flex items-center">
                  <span>
                    {week.year}년 {week.quarter}분기 {week.week}주차
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
