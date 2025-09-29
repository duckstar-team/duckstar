'use client';

import { useState, useEffect } from 'react';
import ChartHeader from './ChartHeader';
import { WeekDto } from '@/types/api';

interface HeaderListProps {
  weekDtos: WeekDto[];
  selectedWeek?: WeekDto | null;
  onWeekChange?: (week: WeekDto) => void;
  className?: string;
}

export default function HeaderList({ weekDtos, selectedWeek: propSelectedWeek, onWeekChange, className = "" }: HeaderListProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // CLOSED된 주차들만 필터링 (안전장치 추가)
  const closedWeeks = weekDtos?.filter(week => week.voteStatus === 'CLOSED') || [];
  
  // 외부에서 전달받은 selectedWeek 사용, 없으면 첫 번째 CLOSED 주차를 기본 선택
  const selectedWeek = propSelectedWeek || closedWeeks[0] || null;

  // 드롭다운 메뉴 상태 저장 및 복원
  useEffect(() => {
    const savedDropdownState = sessionStorage.getItem('home-left-dropdown-open');
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
      if (isDropdownOpen && !(e.target as Element).closest('.dropdown-container')) {
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
    <div className={`w-[750px] px-5 inline-flex justify-between items-end ${className}`}>
      {/* 왼쪽 헤더 - ChartHeader 사용 */}
      <div className="size- flex justify-start items-center">
        <div className="w-44 h-12 relative overflow-hidden">
          <ChartHeader property1="Selected-Default" />
        </div>
      </div>
      
            {/* 오른쪽 드롭다운 메뉴 */}
            <div className="size- flex justify-end items-center gap-1.5 relative dropdown-container">
              <button 
                onClick={handleDropdownToggle}
                className="flex items-center gap-1.5 text-right justify-start text-gray-400 text-lg font-normal font-['Pretendard'] leading-loose cursor-pointer hover:text-gray-600"
              >
                <span>{currentWeekText}</span>
                {/* 드롭다운 아이콘 */}
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* 드롭다운 메뉴 - CLOSED된 주차들만 표시 */}
              {isDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 min-w-50 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                  {closedWeeks.map((week, index) => (
                    <button
                      key={`${week.year}-${week.quarter}-${week.week}`}
                      onClick={() => handleWeekSelect(week)}
                      className={`w-full px-4 py-3 text-left cursor-pointer hover:bg-gray-50 ${
                        selectedWeek?.year === week.year && 
                        selectedWeek?.quarter === week.quarter && 
                        selectedWeek?.week === week.week
                          ? 'bg-rose-50 text-rose-800 font-semibold' 
                          : 'text-gray-700'
                      }`}
                    >
                      <div className="flex items-center">
                        <span>{week.year}년 {week.quarter}분기 {week.week}주차</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
    </div>
  );
}
