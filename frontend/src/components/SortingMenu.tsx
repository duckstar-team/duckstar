import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

export type SortOption = 'Popular' | 'Recent' | 'Oldest';

interface SortingMenuProps {
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
  onScrollToTop?: () => void; // 스크롤 탑 함수
}

const SortingMenu: React.FC<SortingMenuProps> = ({ currentSort, onSortChange, onScrollToTop }) => {
  const [hoveredSort, setHoveredSort] = useState<SortOption | null>(null);
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
  
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<{ [key in SortOption]: HTMLButtonElement | null }>({} as Record<SortOption, HTMLButtonElement | null>);

  const sortOptions = [
    { key: 'Popular' as const, label: '인기순', width: 'w-[100px]' },
    { key: 'Recent' as const, label: '최신순', width: 'w-[100px]' },
    { key: 'Oldest' as const, label: '오래된 순', width: 'w-[115px]' }
  ];

  // 네비게이션 바 위치 업데이트
  const updateNavigationBar = (sort: SortOption | null, immediate = false) => {
    if (!sort || !tabRefs.current[sort] || !containerRef.current) {
      setSelectedBarStyle({ width: '0px', left: '0px', opacity: 0, transition: 'all 0.3s ease-out' });
      return;
    }

    const tabElement = tabRefs.current[sort];
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
  const updateHoveredBar = (sort: SortOption | null, immediate = false) => {
    if (!sort || !tabRefs.current[sort] || !containerRef.current) {
      setHoveredBarStyle({ width: '0px', left: '0px', opacity: 0, transition: 'all 0.3s ease-out' });
      return;
    }

    const tabElement = tabRefs.current[sort];
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
  const handleMouseEnter = (sort: SortOption) => {
    if (sort === currentSort) return;
    
    setHoveredSort(sort);
    updateHoveredBar(sort);
  };

  const handleMouseLeave = () => {
    setHoveredSort(null);
    setHoveredBarStyle(prev => ({ ...prev, opacity: 0 }));
  };

  // 선택된 정렬 변경 시 네비게이션 바 위치 업데이트
  useEffect(() => {
    if (currentSort) {
      updateNavigationBar(currentSort);
      if (hoveredSort) {
        updateHoveredBar(hoveredSort);
      }
    }
  }, [currentSort]);

  // 화면 크기 변경 시 네비게이션 바 위치 업데이트
  useEffect(() => {
    const handleResize = () => {
      if (currentSort) {
        updateNavigationBar(currentSort);
        if (hoveredSort) {
          updateHoveredBar(hoveredSort);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [currentSort, hoveredSort]);

  return (
    <div className="box-border content-stretch flex gap-[105px] items-center justify-start relative size-full">
      <div 
        ref={containerRef}
        className="content-stretch flex items-center justify-start relative shrink-0"
        onMouseLeave={handleMouseLeave}
      >
        {/* 모든 탭 아래에 이어지는 회색 선 */}
        <div className="absolute bottom-0 h-[0.743px] bg-[#adb5bd]" style={{
          left: '0px',
          right: '0px'
        }} />
        
        {/* 선택된 정렬의 네비게이션 바 */}
        <div
          className="absolute bottom-0 h-[1.856px] bg-[#990033]"
          style={{
            width: selectedBarStyle.width,
            left: selectedBarStyle.left,
            opacity: selectedBarStyle.opacity,
            transition: selectedBarStyle.transition
          }}
        />

        {/* 호버된 정렬의 네비게이션 바 */}
        <div
          className="absolute bottom-0 h-[1.856px] bg-[#990033]"
          style={{
            width: hoveredBarStyle.width,
            left: hoveredBarStyle.left,
            opacity: hoveredBarStyle.opacity,
            transition: hoveredBarStyle.transition
          }}
        />

        {sortOptions.map((option) => {
          const isSelected = currentSort === option.key;
          const isHovered = hoveredSort === option.key;
          
          return (
            <button
              key={option.key}
              ref={(el) => { tabRefs.current[option.key] = el; }}
              onClick={() => {
                // 현재 선택된 메뉴가 아닌 다른 메뉴를 클릭했을 때만 스크롤 탑
                if (option.key !== currentSort && onScrollToTop) {
                  onScrollToTop();
                }
                onSortChange(option.key);
                updateNavigationBar(option.key, true); // 클릭 시 즉시 이동
              }}
              onMouseEnter={() => handleMouseEnter(option.key)}
              className={cn(
                "h-11 relative shrink-0 flex items-center justify-center transition-all duration-200 cursor-pointer",
                option.width
              )}
            >
              <div className={cn(
                "justify-start text-[18px] font-normal font-['Pretendard'] leading-snug text-center transition-colors duration-200",
                isSelected || isHovered
                  ? "font-semibold text-[#990033]"
                  : "font-normal text-[#adb5bd]"
              )}>
                <p className="leading-[16.336px] whitespace-pre">{option.label}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SortingMenu;
