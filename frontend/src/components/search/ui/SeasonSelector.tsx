'use client';

import { useState, useEffect, useRef } from 'react';
import { getSeasons } from '@/api/search';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface SeasonSelectorProps {
  onSeasonSelect: (year: number, quarter: number) => void;
  className?: string;
  currentYear?: number;
  currentQuarter?: number;
}

interface SeasonOption {
  year: number;
  quarter: number;
  label: string;
}

export default function SeasonSelector({ onSeasonSelect, className, currentYear, currentQuarter }: SeasonSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<SeasonOption | null>(null);
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
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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
  if (seasonsData) {
    Object.entries(seasonsData).forEach(([yearStr, seasons]) => {
      const year = parseInt(yearStr);
      seasons.forEach(season => {
        const quarter = getQuarterFromSeason(season);
        if (quarter) {
          seasonOptions.push({
            year,
            quarter,
            label: `${year}년 ${getSeasonInKorean(season)} 애니메이션`
          });
        }
      });
    });
  }

  // 현재 선택된 시즌 표시
  const currentSeasonLabel = currentYear && currentQuarter 
    ? `${currentYear}년 ${getSeasonInKorean(getSeasonFromQuarter(currentQuarter))} 애니메이션`
    : '분기 선택';

  // 시즌 타입을 분기로 변환
  function getQuarterFromSeason(season: string): number | null {
    const seasonMap: { [key: string]: number } = {
      'WINTER': 1,  // 겨울
      'SPRING': 2,  // 봄
      'SUMMER': 3,  // 여름  
      'AUTUMN': 4   // 가을
    };
    return seasonMap[season] || null;
  }

  // 시즌 타입을 한글로 변환
  function getSeasonInKorean(season: string): string {
    const seasonMap: { [key: string]: string } = {
      'SPRING': '봄',
      'SUMMER': '여름',
      'AUTUMN': '가을',
      'WINTER': '겨울'
    };
    return seasonMap[season] || season;
  }

  // 분기를 시즌 타입으로 변환
  function getSeasonFromQuarter(quarter: number): string {
    const quarterMap: { [key: number]: string } = {
      1: 'WINTER',  // 겨울
      2: 'SPRING',  // 봄
      3: 'SUMMER',  // 여름
      4: 'AUTUMN'   // 가을
    };
    return quarterMap[quarter] || 'WINTER';
  }

  // 시즌 선택 핸들러
  const handleSeasonSelect = (option: SeasonOption) => {
    setSelectedSeason(option);
    onSeasonSelect(option.year, option.quarter);
    setIsOpen(false);
  };

  if (isLoading) {
    return (
      <div className={cn("w-64 h-12 bg-gray-100 rounded-lg animate-pulse", className)} />
    );
  }

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white box-border content-stretch flex gap-2 items-center justify-center pr-[5px] px-[10px] py-1 relative rounded-[12px] w-fit hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
      >
        <div className="font-['Pretendard'] font-medium leading-[0] not-italic relative shrink-0 text-[18px] text-black text-nowrap">
          <p className="leading-[22px] whitespace-pre">
            {currentSeasonLabel}
          </p>
        </div>
        <svg 
          className={cn(
            "w-4 h-4 text-gray-400 transition-transform duration-200 ml-1",
            isOpen ? "rotate-180" : ""
          )} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {seasonOptions.map((option, index) => (
            <button
              key={`${option.year}-${option.quarter}`}
              onClick={() => handleSeasonSelect(option)}
              className={cn(
                "w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-150 cursor-pointer",
                selectedSeason?.year === option.year && selectedSeason?.quarter === option.quarter
                  ? "bg-[#990033] text-white hover:bg-[#990033]"
                  : "text-gray-900"
              )}
            >
              <span className="text-lg font-medium">{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
