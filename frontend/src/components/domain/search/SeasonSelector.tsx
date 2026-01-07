'use client';

import { useState, useRef } from 'react';
import { getSeasons, type SeasonResponseItem } from '@/api/search';
import { useQuery } from '@tanstack/react-query';
import {
  cn,
  getQuarterFromSeason,
  getSeasonFromQuarter,
  getSeasonInKorean,
} from '@/lib';
import { useOutsideClick } from '@/hooks/useOutsideClick';
import { ChevronDown } from 'lucide-react';

interface SeasonSelectorProps {
  onSeasonSelect: (year: number, quarter: number) => void;
  className?: string;
  currentYear: number | null;
  currentQuarter: number | null;
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
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 시즌 목록 조회
  const { data: seasonsData } = useQuery({
    queryKey: ['seasons'],
    queryFn: getSeasons,
    staleTime: 10 * 60 * 1000, // 10분간 fresh 상태 유지
    gcTime: 30 * 60 * 1000, // 30분간 캐시 유지
  });

  // 드롭다운 외부 클릭 시 닫기
  useOutsideClick(dropdownRef, () => setIsOpen(false));

  // 시즌 옵션 생성
  const seasonOptions: SeasonOption[] = [];

  // "이번 주" 옵션을 맨 위에 추가
  seasonOptions.push({
    label: '이번 주',
    isThisWeek: true,
  });

  if (seasonsData) {
    // 백엔드에서 정렬된 순서를 그대로 유지하여 순회
    seasonsData.forEach((item: SeasonResponseItem) => {
      item.types.forEach((season) => {
        const quarter = getQuarterFromSeason(season);
        if (quarter) {
          seasonOptions.push({
            year: item.year,
            quarter,
            label: `${item.year}년 ${getSeasonInKorean(season)} 애니메이션`,
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

  // 시즌 선택 핸들러
  const handleSeasonSelect = (option: SeasonOption) => {
    if (option.isThisWeek) {
      // "이번 주" 선택 시 특별 처리 (year, quarter를 null로 전달)
      onSeasonSelect(0, 0); // 특별 값으로 "이번 주" 구분
    } else if (option.year && option.quarter) {
      onSeasonSelect(option.year, option.quarter);
    }
    setIsOpen(false);
  };

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between gap-2 rounded-xl bg-white px-6 py-2.5 max-md:border max-md:border-gray-300 sm:max-w-[320px] md:w-fit md:justify-center md:py-3"
      >
        <span className="shrink-0 font-medium text-black transition-colors duration-200 hover:text-gray-400 max-sm:text-sm">
          {currentSeasonLabel}
        </span>
        <ChevronDown
          className="size-4.5 text-gray-400 transition-transform duration-200"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>
      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div className="absolute top-full left-0 z-30 mt-1 w-full max-w-[280px] min-w-[200px] overflow-hidden rounded-lg bg-white shadow-lg sm:max-w-[320px]">
          {seasonOptions.map((option) => (
            <button
              key={
                option.isThisWeek
                  ? 'this-week'
                  : `${option.year}-${option.quarter}`
              }
              onClick={() => handleSeasonSelect(option)}
              className="w-full border-b border-gray-100 px-3 py-2.5 text-left font-medium transition-colors duration-150 last:border-b-0 hover:bg-gray-50 max-sm:text-sm"
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
