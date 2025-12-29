import { queryConfig } from '@/lib/queryConfig';
import { SurveyRankDto, SurveyResultDto } from '@/types';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import SurveyResultCard from './SurveyResultCard';

export default function SurveyResultChart({ surveyId }: { surveyId: number }) {
  const { data: surveyResultData, isLoading: isSurveyResultLoading } =
    useQuery<SurveyResultDto>({
      queryKey: ['survey-result', surveyId],
      queryFn: async () => {
        if (!surveyId) throw new Error('Survey ID가 없습니다');
        const response = await fetch(
          'http://127.0.0.1:3658/m1/1148465-1141052-default/api/v1/chart/surveys/1'
        );
        if (!response.ok) throw new Error('Survey Result 조회 실패');
        const res = await response.json();
        return res.result || res;
      },
      enabled: !!surveyId,
      ...queryConfig.vote,
    });

  if (isSurveyResultLoading) {
    return <div>Loading...</div>;
  }
  if (!surveyResultData || surveyResultData?.surveyRankDtos.length === 0) {
    return <div>결과가 없습니다.</div>;
  }

  return (
    <div className="max-width mt-10 flex flex-col gap-10">
      {surveyResultData?.surveyRankDtos?.map((surveyRank: SurveyRankDto) => (
        <SurveyResultCard key={surveyRank.rank} surveyRank={surveyRank} />
      ))}
    </div>
  );
}
