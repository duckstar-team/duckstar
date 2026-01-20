'use client';

import { queryConfig } from '@/lib';
import { SurveyRankDto, SurveyResultDto } from '@/types/dtos';
import { useQuery } from '@tanstack/react-query';
import React, { useState, useEffect } from 'react';
import SurveyResultCard from './SurveyResultCard';
import Pagination from '@/components/common/Pagination';
import { getSurveyResult } from '@/api/chart';
import { SurveyResultSkeleton } from '@/components/skeletons';

export default function SurveyResultChart({ surveyId }: { surveyId: number }) {
  const [page, setPage] = useState(0);

  const { data: surveyResultData, isLoading: isSurveyResultLoading } =
    useQuery<SurveyResultDto>({
      queryKey: ['survey-result', surveyId, page],
      queryFn: async () => {
        if (!surveyId) throw new Error('Survey ID가 없습니다');
        const response = await getSurveyResult(surveyId, page);
        if (!response.isSuccess) throw new Error('Survey Result 조회 실패');
        return response.result;
      },
      enabled: !!surveyId,
      ...queryConfig.vote,
    });

  // 페이지 변경 시 스크롤을 맨 위로 즉시 이동
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [page]);

  if (isSurveyResultLoading) {
    return <SurveyResultSkeleton />;
  }
  if (!surveyResultData || surveyResultData?.surveyRankDtos.length === 0) {
    return <div>결과가 없습니다.</div>;
  }

  return (
    <section className="space-y-20">
      <div className="max-width mt-10 flex flex-col gap-16">
        {surveyResultData?.surveyRankDtos?.map((surveyRank: SurveyRankDto) => (
          <SurveyResultCard
            key={surveyRank.animeCandidateDto.animeCandidateId}
            surveyRank={surveyRank}
            totalCount={surveyResultData?.totalElements || 0}
          />
        ))}
      </div>
      <Pagination
        totalPages={surveyResultData?.totalPages || 0}
        currentPage={page + 1}
        onPageChange={(newPage) => {
          setPage(newPage - 1);
        }}
      />
    </section>
  );
}
