'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

export type DayOfWeek = '곧 시작' | '월' | '화' | '수' | '목' | '금' | '토' | '일' | '특별편성 및 극장판';

interface DaySelectionProps {
  selectedDay: DayOfWeek;
  onDaySelect: (day: DayOfWeek) => void;
  className?: string;
  onScrollToSection?: (sectionId: string) => void;
  initialPosition?: boolean; // 초기 위치를 즉시 설정할지 여부
  emptyDays?: Set<DayOfWeek>; // 비어있는 요일들
  isThisWeek?: boolean; // 이번 주인지 여부
  isSticky?: boolean; // 스티키 상태
}

const getDays = (isThisWeek: boolean): DayOfWeek[] => {
  if (isThisWeek) {
    return [
      '곧 시작',
      '월',
      '화',
      '수',
      '목',
      '금',
      '토',
      '일',
      '특별편성 및 극장판'
    ];
  } else {
    return [
      '월',
      '화',
      '수',
      '목',
      '금',
      '토',
      '일',
      '특별편성 및 극장판'
    ];
  }
};

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
  onScrollToSection,
  initialPosition = false,
  emptyDays = new Set(),
  isThisWeek = true,
  isSticky = false,
}: DaySelectionProps) {
  const [hoveredDay, setHoveredDay] = useState<DayOfWeek | null>(null);
  const [showTooltip, setShowTooltip] = useState<DayOfWeek | null>(null);
  const [showStickyTooltip, setShowStickyTooltip] = useState<DayOfWeek | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [stickyTooltipPosition, setStickyTooltipPosition] = useState({ top: 0, left: 0 });
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
    if (!day || !containerRef.current) {
      setSelectedBarStyle({ width: '0px', left: '0px', opacity: 0, transition: 'all 0.3s ease-out' });
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
    
    // 비어있는 요일인 경우 툴팁 표시
    if (emptyDays.has(day) && day !== '곧 시작') {
      const buttonElement = tabRefs.current[day];
      if (buttonElement) {
        const rect = buttonElement.getBoundingClientRect();
        
        if (isSticky) {
          // 스티키 요소의 툴팁
          setStickyTooltipPosition({
            top: rect.top - 30,
            left: rect.left + rect.width / 2
          });
          setShowStickyTooltip(day);
        } else {
          // 기본 요소의 툴팁
          setTooltipPosition({
            top: rect.top + window.scrollY - 30,
            left: rect.left + rect.width / 2
          });
          setShowTooltip(day);
        }
      }
    }
  };

  const handleMouseLeave = () => {
    setHoveredDay(null);
    
    // 호버 종료 시: 호버된 요일의 n만 서서히 사라짐
    setHoveredBarStyle(prev => ({ ...prev, opacity: 0 }));
    
    // 툴팁도 함께 숨기기
    setShowTooltip(null);
    setShowStickyTooltip(null);
  };

  // 컴포넌트 마운트 시 네비게이션 바 위치 설정
  useEffect(() => {
    if (selectedDay) {
      // DOM이 완전히 렌더링된 후 네비게이션 바 위치 설정
      const timeout = setTimeout(() => {
        if (initialPosition) {
          // 초기 위치 설정이 필요한 경우 (sticky 네비게이션 바) 즉시 설정
          updateNavigationBar(selectedDay, true);
        } else {
          // 일반적인 경우 애니메이션과 함께 설정
          updateNavigationBar(selectedDay);
        }
      }, 0);
      
      return () => clearTimeout(timeout);
    }
  }, [initialPosition]); // initialPosition이 변경될 때도 실행

  // 선택된 탭 변경 시 네비게이션 바 위치 업데이트
  useEffect(() => {
    if (selectedDay) {
      // DOM이 완전히 렌더링된 후 네비게이션 바 업데이트
      const timeout = setTimeout(() => {
        updateNavigationBar(selectedDay);
      }, 100);
      
      // 호버된 상태라면 호버된 바도 업데이트
      if (hoveredDay) {
        updateHoveredBar(hoveredDay);
      }
      
      return () => clearTimeout(timeout);
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

  // 스티키 상태가 변경될 때 기본 요소 툴팁 숨기기
  useEffect(() => {
    if (isSticky && showTooltip) {
      setShowTooltip(null);
    }
  }, [isSticky, showTooltip]);

  // 시즌 메뉴에서 "이번 주"로 이동할 때 빈 섹션 알림 표시
  useEffect(() => {
    const handleShowEmptySectionMessage = (event: CustomEvent) => {
      const { day } = event.detail;
      if (day && !isSticky) {
        // 기본 요소에서 빈 섹션 알림 표시
        setShowTooltip(day);
        
        // 3초 후 알림 숨기기
        setTimeout(() => {
          setShowTooltip(null);
        }, 3000);
      }
    };

    window.addEventListener('showEmptySectionMessage', handleShowEmptySectionMessage as EventListener);
    
    return () => {
      window.removeEventListener('showEmptySectionMessage', handleShowEmptySectionMessage as EventListener);
    };
  }, [isSticky]);

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
                {getDays(isThisWeek || false).map((day) => (
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
                      "w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-150 cursor-pointer",
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
        data-day-selection
        className={cn(
          "relative hidden md:flex items-center justify-start gap-1",
          className
        )}
        onMouseLeave={handleMouseLeave}
      >

        
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

        {getDays(isThisWeek).map((day) => {
          const isSelected = selectedDay === day;
          const isHovered = hoveredDay === day;
          const isEmpty = emptyDays ? (Array.isArray(emptyDays) ? emptyDays.includes(day) : emptyDays.has(day)) : false;
          const dayWidth = getDayWidth(day);
          
          return (
            <div key={day} className="relative">
              <button
                ref={(el) => { tabRefs.current[day] = el; }}
                onClick={() => {
                  onDaySelect(day);
                  updateNavigationBar(day, true); // 클릭 시 즉시 이동 (애니메이션 없음)
                  
                  // 비어있는 요일인 경우 스크롤 이동하지 않음
                  if (isEmpty && day !== '곧 시작') {
                    return; // 스크롤 이동하지 않음
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
              
              {/* 기본 요소 툴팁 */}
              {showTooltip === day && typeof window !== 'undefined' && createPortal(
                <div 
                  className="absolute bg-white px-2 py-1 text-xs font-medium text-[#990033] transition-opacity duration-300 ease-in-out whitespace-nowrap border border-gray-200 rounded shadow-sm pointer-events-none"
                  style={{ 
                    zIndex: 999999,
                    top: `${tooltipPosition.top}px`,
                    left: `${tooltipPosition.left}px`,
                    transform: 'translateX(-50%)'
                  }}
                  onMouseEnter={() => {
                    // 툴팁에 마우스가 올라가면 유지
                  }}
                  onMouseLeave={() => {
                    // 툴팁에서 마우스가 벗어나면 숨기기
                    setShowTooltip(null);
                  }}
                >
                  이번 주 없음
                </div>,
                document.body
              )}
              
              {/* 스티키 요소 툴팁 */}
              {showStickyTooltip === day && typeof window !== 'undefined' && createPortal(
                <div 
                  className="fixed bg-white px-2 py-1 text-xs font-medium text-[#990033] transition-opacity duration-300 ease-in-out whitespace-nowrap border border-gray-200 rounded shadow-sm pointer-events-none"
                  style={{ 
                    zIndex: 999999,
                    top: `60px`,
                    left: `${stickyTooltipPosition.left}px`,
                    transform: 'translateX(-50%)'
                  }}
                  onMouseEnter={() => {
                    // 툴팁에 마우스가 올라가면 유지
                  }}
                  onMouseLeave={() => {
                    // 툴팁에서 마우스가 벗어나면 숨기기
                    setShowStickyTooltip(null);
                  }}
                >
                  이번 주 없음
                </div>,
                document.body
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
