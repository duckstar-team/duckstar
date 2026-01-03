import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { SurveyDto } from '@/types/dtos';
import { ApiResponse } from '@/api/http';
import { queryConfig } from '@/lib/queryConfig';
import {
  hasValidSurveySession,
  setSurveySession,
} from '@/lib/surveySessionStorage';

/**
 * 로그인 시 hasVoted=true인 모든 survey에 대해 세션키를 생성하는 훅
 */
export function useSurveySession() {
  const { isAuthenticated } = useAuth();

  // surveys 목록 조회
  const { data: surveysData } = useQuery<ApiResponse<SurveyDto[]>>({
    queryKey: ['surveys'],
    queryFn: async () => {
      const response = await fetch('/api/v1/vote/surveys');
      if (!response.ok) throw new Error('어워드 목록 조회 실패');
      return response.json() as Promise<ApiResponse<SurveyDto[]>>;
    },
    ...queryConfig.vote,
  });

  // 로그인 시 hasVoted=true인 모든 survey에 대해 세션키 생성
  useEffect(() => {
    if (!isAuthenticated || !surveysData?.result) return;

    const surveys = surveysData.result;
    surveys.forEach((survey) => {
      if (
        survey.hasVoted &&
        survey.type &&
        survey.endDateTime &&
        !hasValidSurveySession(survey.type)
      ) {
        // 로그인 상태에서 서버에 저장된 투표 내역이므로 isVoteHistorySaved: true
        setSurveySession(survey.type, survey.endDateTime, true);
      }
    });
  }, [isAuthenticated, surveysData?.result]);
}
