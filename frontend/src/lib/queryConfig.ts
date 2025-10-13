/**
 * 통일된 React Query 설정
 * 모든 페이지에서 동일한 캐싱 전략 적용
 */

export const queryConfig = {
  // 기본 캐싱 설정
  default: {
    staleTime: 5 * 60 * 1000, // 5분간 fresh 상태 유지
    gcTime: 10 * 60 * 1000, // 10분간 캐시 유지
    refetchOnWindowFocus: false, // 윈도우 포커스 시 재요청 비활성화
    refetchOnReconnect: true, // 네트워크 재연결 시 재요청
    retry: 3, // 에러 시 3번 재시도
    retryDelay: 5000, // 재시도 간격 5초
  },
  
  // 홈 데이터 (자주 변경되지 않음)
  home: {
    staleTime: 10 * 60 * 1000, // 10분간 fresh 상태 유지
    gcTime: 30 * 60 * 1000, // 30분간 캐시 유지
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 3,
    retryDelay: 5000,
  },
  
  // 검색 데이터 (자주 변경됨)
  search: {
    staleTime: 2 * 60 * 1000, // 2분간 fresh 상태 유지
    gcTime: 10 * 60 * 1000, // 10분간 캐시 유지
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 1, // 재시도 횟수 감소 (무한로딩 방지)
    retryDelay: 3000, // 재시도 간격 증가
    retryOnMount: true, // 마운트 시 재시도
    networkMode: 'online', // 온라인 상태에서만 요청
  },
  
  // 투표 데이터 (중요한 데이터)
  vote: {
    staleTime: 5 * 60 * 1000, // 5분간 fresh 상태 유지
    gcTime: 15 * 60 * 1000, // 15분간 캐시 유지
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 3,
    retryDelay: 5000,
  },
  
  // 애니메이션 상세 (자주 변경되지 않음)
  animeDetail: {
    staleTime: 15 * 60 * 1000, // 15분간 fresh 상태 유지
    gcTime: 60 * 60 * 1000, // 1시간 캐시 유지
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 3,
    retryDelay: 5000,
  }
};
