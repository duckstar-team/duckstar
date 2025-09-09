'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getCurrentSchedule, getScheduleByYearAndQuarter } from '@/api/search';
import type { AnimePreviewListDto } from '@/types/api';
import { getCurrentYearAndQuarter } from '@/lib/quarterUtils';

// React Query 키 상수
export const SEARCH_QUERY_KEYS = {
  schedule: (year: number, quarter: number) => ['schedule', year, quarter],
  currentSchedule: () => ['schedule', 'current'],
} as const;

// 분기별 편성표 캐싱 훅
export function useScheduleCache(year?: number, quarter?: number) {
  const { year: currentYear, quarter: currentQuarter } = getCurrentYearAndQuarter();
  const targetYear = year ?? currentYear;
  const targetQuarter = quarter ?? currentQuarter;

  return useQuery({
    queryKey: SEARCH_QUERY_KEYS.schedule(targetYear, targetQuarter),
    queryFn: () => getScheduleByYearAndQuarter(targetYear, targetQuarter),
    staleTime: 10 * 60 * 1000, // 10분간 fresh 상태 유지 (분기별 데이터는 자주 변경되지 않음)
    gcTime: 60 * 60 * 1000, // 1시간간 캐시 유지
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// 현재 분기 편성표 캐싱 훅 (자정마다 백엔드 요청)
export function useCurrentScheduleCache() {
  return useQuery({
    queryKey: SEARCH_QUERY_KEYS.currentSchedule(),
    queryFn: getCurrentSchedule,
    staleTime: 0, // 항상 백엔드에서 최신 데이터 확인
    gcTime: 24 * 60 * 60 * 1000, // 24시간간 캐시 유지
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: true, // 창 포커스 시 재요청
    refetchOnMount: true, // 컴포넌트 마운트 시 재요청
  });
}

// 캐시 관리 유틸리티 훅
export function useSearchCacheUtils() {
  const queryClient = useQueryClient();

  // 캐시 무효화
  const invalidateScheduleCache = (year?: number, quarter?: number) => {
    if (year && quarter) {
      queryClient.invalidateQueries({
        queryKey: SEARCH_QUERY_KEYS.schedule(year, quarter),
      });
    } else {
      queryClient.invalidateQueries({
        queryKey: ['schedule'],
      });
    }
  };

  // 분기별 캐시 무효화 (새 분기 시작 시 사용)
  const invalidateQuarterCache = (year: number, quarter: number) => {
    queryClient.invalidateQueries({
      queryKey: SEARCH_QUERY_KEYS.schedule(year, quarter),
    });
  };

  // 전체 캐시 클리어
  const clearAllCache = () => {
    queryClient.clear();
  };

  return {
    invalidateScheduleCache,
    invalidateQuarterCache,
    clearAllCache,
  };
}
