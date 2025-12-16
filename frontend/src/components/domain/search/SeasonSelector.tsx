'use client';

import { useState, useEffect, useRef } from 'react';
import { getSeasons } from '@/api/search';
import { useQuery } from '@tanstack/react-query';
import { cn, getSeasonFromQuarter, getSeasonInKorean } from '@/lib/utils';

interface SeasonSelectorProps {
  onSeasonSelect: (year: number, quarter: number) => void;
  className?: string;
  currentYear?: number;
  currentQuarter?: number;
}

interface SeasonOption {
  year?: number;
  quarter?: number;
  label: string;
  isThisWeek?: boolean;
}

export default function SeasonSelector({
  onSeasonSelect,
  className,
  currentYear,
  currentQuarter,
}: SeasonSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<SeasonOption | null>(
    null
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 시즌 목록 조회
  const { data: seasonsData, isLoading } = useQuery({
    queryKey: ['seasons'],
    queryFn: getSeasons,
    staleTime: 10 * 60 * 1000, // 10분간 fresh 상태 유지
    gcTime: 30 * 60 * 1000, // 30분간 캐시 유지
  });

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 시즌 옵션 생성
  const seasonOptions: SeasonOption[] = [];

  // "이번 주" 옵션을 맨 위에 추가
  seasonOptions.push({
    label: '이번 주',
    isThisWeek: true,
  });

  if (seasonsData) {
    Object.entries(seasonsData).forEach(([yearStr, seasons]) => {
      const year = parseInt(yearStr);
      seasons.forEach((season) => {
        const quarter = getQuarterFromSeason(season);
        if (quarter) {
          seasonOptions.push({
            year,
            quarter,
            label: `${year}년 ${getSeasonInKorean(season)} 애니메이션`,
          });
        }
      });
    });
  }

  // 현재 선택된 시즌 표시
  const currentSeasonLabel =
    currentYear && currentQuarter
      ? `${currentYear}년 ${getSeasonInKorean(getSeasonFromQuarter(currentQuarter))} 애니메이션`
      : '이번 주';

  // 시즌 타입을 분기로 변환
  function getQuarterFromSeason(season: string): number | null {
    const seasonMap: { [key: string]: number } = {
      WINTER: 1, // 겨울
      SPRING: 2, // 봄
      SUMMER: 3, // 여름
      AUTUMN: 4, // 가을
    };
    return seasonMap[season] || null;
  }

  // utils.ts의 getSeasonFromQuarter, getSeasonInKorean 함수 사용

  // 시즌 선택 핸들러
  const handleSeasonSelect = (option: SeasonOption) => {
    setSelectedSeason(option);
    if (option.isThisWeek) {
      // "이번 주" 선택 시 특별 처리 (year, quarter를 null로 전달)
      onSeasonSelect(0, 0); // 특별 값으로 "이번 주" 구분
    } else if (option.year && option.quarter) {
      onSeasonSelect(option.year, option.quarter);
    }
    setIsOpen(false);
  };

  if (isLoading) {
    return (
      <div
        className={cn(
          'h-10 w-fit max-w-[280px] animate-pulse rounded-lg bg-gray-100 sm:h-12 sm:max-w-[320px]',
          className
        )}
      />
    );
  }

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative ml-2 box-border flex w-fit max-w-[280px] cursor-pointer content-stretch items-center justify-center gap-2 rounded-[12px] bg-white px-[8px] py-[6px] pr-[5px] transition-colors duration-200 hover:bg-gray-50 sm:max-w-[320px] sm:px-[10px]"
      >
        <div className="relative shrink-0 text-[16px] leading-[0] font-medium text-black not-italic sm:text-[18px]">
          <p className="truncate leading-[20px] sm:leading-[22px]">
            {currentSeasonLabel}
          </p>
        </div>
        <svg
          className={cn(
            'ml-1 h-3 w-3 flex-shrink-0 text-gray-400 transition-transform duration-200 sm:h-4 sm:w-4',
            isOpen ? 'rotate-180' : ''
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-1 max-h-60 w-full max-w-[280px] min-w-[200px] overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg sm:max-w-[320px]">
          {seasonOptions.map((option, index) => (
            <button
              key={
                option.isThisWeek
                  ? 'this-week'
                  : `${option.year}-${option.quarter}`
              }
              onClick={() => handleSeasonSelect(option)}
              className={cn(
                'w-full cursor-pointer px-3 py-2.5 text-left transition-colors duration-150 hover:bg-gray-50',
                'border-b border-gray-100 text-sm last:border-b-0 sm:text-base',
                (option.isThisWeek && selectedSeason?.isThisWeek) ||
                  (option.year &&
                    option.quarter &&
                    selectedSeason?.year === option.year &&
                    selectedSeason?.quarter === option.quarter)
                  ? 'bg-[#990033] text-white hover:bg-[#990033]'
                  : 'text-gray-900'
              )}
            >
              <span className="block truncate font-medium">{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
