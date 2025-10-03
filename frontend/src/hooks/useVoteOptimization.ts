'use client';

import { useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { hasVotedThisWeek } from '@/lib/cookieUtils';

/**
 * 투표 페이지 최적화 훅
 * 관련 로직을 통합하여 성능 최적화
 */
export function useVoteOptimization() {
  const { isAuthenticated } = useAuth();

  // 투표 상태 확인 (메모이제이션)
  const voteStatus = useMemo(() => {
    const hasVoted = hasVotedThisWeek();
    return {
      hasVoted,
      shouldShowMessage: hasVoted,
    };
  }, []);

  // 로그인 상태 변경 처리 (통합된 useEffect)
  const handleAuthStateChange = useCallback(() => {
    if (!isAuthenticated && voteStatus.hasVoted) {
      // 로그아웃 시 투표 완료 메시지 표시
      return {
        showVotedMessage: true,
        showVoteResult: false,
        voteHistory: null,
      };
    } else if (isAuthenticated) {
      // 로그인 시 메시지 숨김
      return {
        showVotedMessage: false,
      };
    }
    return {};
  }, [isAuthenticated, voteStatus.hasVoted]);

  // 성별 정보 처리 (메모이제이션)
  const processGenderInfo = useCallback((memberGender: string) => {
    if (memberGender && memberGender !== 'UNKNOWN') {
      return memberGender === 'MALE' ? 'male' : 'female';
    }
    return null;
  }, []);

  return {
    voteStatus,
    handleAuthStateChange,
    processGenderInfo,
  };
}
