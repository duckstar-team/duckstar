/**
 * 쿼리별 React Query 설정 (QueryProvider 기본값에서 변경이 필요한 경우만)
 * 기본값: staleTime 5분, gcTime 10분, retry 3회
 */
export const queryConfig = {
  // 홈 데이터 (더 긴 캐싱)
  home: {
    staleTime: 10 * 60 * 1000, // 10분 (기본값: 5분)
    gcTime: 30 * 60 * 1000, // 30분 (기본값: 10분)
  },

  // 검색 데이터 (더 짧은 캐싱, 적은 재시도)
  search: {
    staleTime: 2 * 60 * 1000, // 2분 (기본값: 5분)
    retry: 1, // 기본값: 3회
    retryDelay: 3000,
    retryOnMount: true,
    networkMode: 'online' as const,
  },

  // 투표 데이터 (기본값과 동일, 명시적으로 사용)
  vote: {
    gcTime: 15 * 60 * 1000, // 15분 (기본값: 10분)
  },

  // 애니메이션 상세 (더 긴 캐싱)
  animeDetail: {
    staleTime: 15 * 60 * 1000, // 15분 (기본값: 5분)
    gcTime: 60 * 60 * 1000, // 1시간 (기본값: 10분)
  },
};
