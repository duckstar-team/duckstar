/**
 * 쿼리별 React Query 설정 (QueryProvider 기본값에서 변경이 필요한 경우만)
 *
 * 기본값:
 * staleTime 5분, gcTime 10분, retry 3회, retryDelay 5초
 * refetchOnWindowFocus: false, refetchOnReconnect: true
 */
export const queryConfig = {
  // 홈 데이터 (더 긴 캐싱)
  home: {
    staleTime: 10 * 60 * 1000, // 10분
    gcTime: 30 * 60 * 1000, // 30분
  },

  // 검색/스케줄 데이터 (공통 설정)
  search: {
    staleTime: 2 * 60 * 1000, // 2분
    retry: 2,
    retryDelay: 3000,
    retryOnMount: true,
    networkMode: 'online' as const,
  },

  // 검색 쿼리 (사용자 검색)
  searchQuery: {
    staleTime: 1 * 60 * 1000, // 1분
    gcTime: 5 * 60 * 1000, // 5분
    retry: 1,
    retryDelay: 2000,
  },

  // 투표 데이터 (기본값과 동일, 명시적으로 사용)
  vote: {
    gcTime: 15 * 60 * 1000, // 15분
  },

  // 애니메이션 상세 (더 긴 캐싱)
  animeDetail: {
    staleTime: 15 * 60 * 1000, // 15분
    gcTime: 60 * 60 * 1000, // 1시간
  },
};
