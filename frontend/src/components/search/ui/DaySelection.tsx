'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

export type DayOfWeek = '곧 시작' | '일' | '월' | '화' | '수' | '목' | '금' | '토' | '특별편성 및 극장판';

interface DaySelectionProps {
  selectedDay: DayOfWeek;
  onDaySelect: (day: DayOfWeek) => void;
  className?: string;
  onScrollToSection?: (sectionId: string) => void;
}

const DAYS: DayOfWeek[] = [
  '곧 시작',
  '일',
  '월',
  '화',
  '수',
  '목',
  '금',
  '토',
  '특별편성 및 극장판'
];

const getDayWidth = (day: DayOfWeek): string => {
  switch (day) {
    case '곧 시작':
      return 'w-[120px] md:w-[80px] lg:w-[90px] xl:w-[100px] 2xl:w-[120px]';
    case '특별편성 및 극장판':
      return 'w-[175px] md:w-[120px] lg:w-[130px] xl:w-[140px] 2xl:w-[175px]';
    default:
      return 'w-[115px] md:w-[70px] lg:w-[80px] xl:w-[90px] xl:w-[90px] 2xl:w-[115px]';
  }
};

export default function DaySelection({
  selectedDay,
  onDaySelect,
  className,
  onScrollToSection
}: DaySelectionProps) {
  const [hoveredDay, setHoveredDay] = useState<DayOfWeek | null>(null);
  const [selectedBarStyle, setSelectedBarStyle] = useState({
    width: '0px',
    left: '0px',
    opacity: 0,
    transition: 'all 0.3s ease-out'
  });
  const [hoveredBarStyle, setHoveredBarStyle] = useState({
    width: '0px',
    left: '0px',
    opacity: 0,
    transition: 'all 0.3s ease-out'
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<{ [key in DayOfWeek]: HTMLButtonElement | null }>({} as Record<DayOfWeek, HTMLButtonElement | null>);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 네비게이션 바 위치 업데이트
  const updateNavigationBar = (day: DayOfWeek | null, immediate = false) => {
    if (!day || !tabRefs.current[day] || !containerRef.current) {
      setSelectedBarStyle({ width: '0px', left: '0px', opacity: 0, transition: 'all 0.3s ease-out' });
      return;
    }

    const tabElement = tabRefs.current[day];
    const containerElement = containerRef.current;
    
    const tabRect = tabElement.getBoundingClientRect();
    const containerRect = containerElement.getBoundingClientRect();
    
    const left = tabRect.left - containerRect.left;
    const width = tabRect.width;
    
    setSelectedBarStyle({
      width: `${width}px`,
      left: `${left}px`,
      opacity: 1,
      transition: immediate ? 'none' : 'all 0.3s ease-out'
    });
  };

  // 호버된 네비게이션 바 위치 업데이트
  const updateHoveredBar = (day: DayOfWeek | null, immediate = false) => {
    if (!day || !tabRefs.current[day] || !containerRef.current) {
      setHoveredBarStyle({ width: '0px', left: '0px', opacity: 0, transition: 'all 0.3s ease-out' });
      return;
    }

    const tabElement = tabRefs.current[day];
    const containerElement = containerRef.current;
    
    const tabRect = tabElement.getBoundingClientRect();
    const containerRect = containerElement.getBoundingClientRect();
    
    const left = tabRect.left - containerRect.left;
    const width = tabRect.width;
    
    setHoveredBarStyle({
      width: `${width}px`,
      left: `${left}px`,
      opacity: 1,
      transition: immediate ? 'none' : 'all 0.3s ease-out'
    });
  };

  // 호버 이벤트 핸들러
  const handleMouseEnter = (day: DayOfWeek) => {
    if (day === selectedDay) return;
    
    setHoveredDay(day);
    
    // 호버 시: 선택된 요일의 n은 그대로 유지하고, 호버된 요일의 n만 나타남
    updateHoveredBar(day);
  };

  const handleMouseLeave = () => {
    setHoveredDay(null);
    
    // 호버 종료 시: 호버된 요일의 n만 서서히 사라짐
    setHoveredBarStyle(prev => ({ ...prev, opacity: 0 }));
  };

  // 선택된 탭 변경 시 네비게이션 바 위치 업데이트
  useEffect(() => {
    if (selectedDay) {
      updateNavigationBar(selectedDay);
      // 호버된 상태라면 호버된 바도 업데이트
      if (hoveredDay) {
        updateHoveredBar(hoveredDay);
      }
    }
  }, [selectedDay]);

  // 화면 크기 변경 시 네비게이션 바 위치 업데이트
  useEffect(() => {
    const handleResize = () => {
      if (selectedDay) {
        updateNavigationBar(selectedDay);
        if (hoveredDay) {
          updateHoveredBar(hoveredDay);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [selectedDay, hoveredDay]);

  return (
    <>
      {/* 모바일: 드롭다운 */}
      <div className="md:hidden">
        <div className="relative flex justify-end" ref={dropdownRef}>
          <div className="w-64">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-left shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#990033] focus:border-transparent transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium text-gray-900">{selectedDay}</span>
                <svg 
                  className={cn(
                    "w-5 h-5 text-gray-400 transition-transform duration-200",
                    isDropdownOpen ? "rotate-180" : ""
                  )} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            
            {/* 드롭다운 메뉴 */}
            {isDropdownOpen && (
              <div className="absolute top-full right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto w-64">
                {DAYS.map((day) => (
                  <button
                    key={day}
                                  onClick={() => {
                onDaySelect(day);
                setIsDropdownOpen(false);
                // 스크롤 기능 추가
                if (onScrollToSection) {
                  const sectionId = day === '곧 시작' ? 'upcoming' : 
                                   day === '특별편성 및 극장판' ? 'special' : 
                                   day === '일' ? 'sun' : 
                                   day === '월' ? 'mon' : 
                                   day === '화' ? 'tue' : 
                                   day === '수' ? 'wed' : 
                                   day === '목' ? 'thu' : 
                                   day === '금' ? 'fri' : 
                                   day === '토' ? 'sat' : 'upcoming';
                  onScrollToSection(sectionId);
                }
              }}
                    className={cn(
                      "w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-150",
                      "border-b border-gray-100 last:border-b-0",
                      selectedDay === day
                        ? "bg-[#990033] text-white font-medium"
                        : "text-gray-700 hover:text-gray-900"
                    )}
                  >
                    {day}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 태블릿/데스크톱: 기존 탭 형태 (점진적으로 작아짐) */}
      <div 
        ref={containerRef}
        className={cn(
          "relative hidden md:flex items-center justify-start gap-1",
          className
        )}
        onMouseLeave={handleMouseLeave}
      >
        {/* 모든 탭 아래에 이어지는 회색 선 - 첫 번째와 마지막 탭의 끝에 맞춤 */}
        <div className="absolute bottom-0 h-[0.743px] bg-[#adb5bd]" style={{
          left: '0px',
          right: '0px'
        }} />
        
        {/* 선택된 요일의 네비게이션 바 */}
        <div
          className="absolute bottom-0 h-[1.856px] bg-[#990033]"
          style={{
            width: selectedBarStyle.width,
            left: selectedBarStyle.left,
            opacity: selectedBarStyle.opacity,
            transition: selectedBarStyle.transition
          }}
        />

        {/* 호버된 요일의 네비게이션 바 */}
        <div
          className="absolute bottom-0 h-[1.856px] bg-[#990033]"
          style={{
            width: hoveredBarStyle.width,
            left: hoveredBarStyle.left,
            opacity: hoveredBarStyle.opacity,
            transition: hoveredBarStyle.transition
          }}
        />

        {DAYS.map((day) => {
          const isSelected = selectedDay === day;
          const isHovered = hoveredDay === day;
          const dayWidth = getDayWidth(day);
          
          return (
            <button
              key={day}
              ref={(el) => { tabRefs.current[day] = el; }}
              onClick={() => {
                onDaySelect(day);
                updateNavigationBar(day, true); // 클릭 시 즉시 이동 (애니메이션 없음)
                // 스크롤 기능 추가
                if (onScrollToSection) {
                  const sectionId = day === '곧 시작' ? 'upcoming' : 
                                   day === '특별편성 및 극장판' ? 'special' : 
                                   day === '일' ? 'sun' : 
                                   day === '월' ? 'mon' : 
                                   day === '화' ? 'tue' : 
                                   day === '수' ? 'wed' : 
                                   day === '목' ? 'thu' : 
                                   day === '금' ? 'fri' : 
                                   day === '토' ? 'sat' : 'upcoming';
                  onScrollToSection(sectionId);
                }
              }}
              onMouseEnter={() => handleMouseEnter(day)}
              className={cn(
                "h-11 px-4 py-2.5 flex items-center justify-center transition-all duration-200 cursor-pointer",
                "relative",
                dayWidth
              )}
            >
              <span className={cn(
                "text-lg leading-none whitespace-nowrap transition-colors duration-200",
                isSelected || isHovered
                  ? "text-[#990033] font-semibold"
                  : "text-[#adb5bd] font-normal"
              )}>
                {day}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}
