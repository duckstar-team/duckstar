'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryConfig } from '@/lib/queryConfig';
import { SurveyDto } from '@/types';
import VoteBanner from '@/components/domain/vote/VoteBanner';
import { ApiResponse } from '@/api/http';
import Link from 'next/link';
import { getSurveyTypeLabel, getStatusText } from '@/lib/surveyUtils';
import { AwardListSkeleton } from '@/components/skeletons';
import { useRouter } from 'next/navigation';

export default function AwardPage() {
  const router = useRouter();

  // surveys 목록 조회
  const { data, isLoading, error } = useQuery<ApiResponse<SurveyDto[]>>({
    queryKey: ['surveys'],
    queryFn: async () => {
      const response = await fetch('/api/v1/vote/surveys');
      if (!response.ok) throw new Error('어워드 목록 조회 실패');
      return response.json() as Promise<ApiResponse<SurveyDto[]>>;
    },
    ...queryConfig.vote,
  });

  const getStatusBadge = (status: string) => {
    const baseClass =
      'rounded-md px-2 py-1 h-6 w-fit break-keep text-xs font-semibold';
    const statusText = getStatusText(status);

    switch (status) {
      case 'OPEN':
        return (
          <span className={`${baseClass} bg-rose-100 text-rose-500`}>
            {statusText}
          </span>
        );
      case 'PAUSED':
        return (
          <span className={`${baseClass} bg-yellow-100 text-yellow-800`}>
            {statusText}
          </span>
        );
      case 'CLOSED':
        return (
          <span className={`${baseClass} bg-gray-100 text-gray-800`}>
            {statusText}
          </span>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return <AwardListSkeleton />;
  }

  if (error) {
    return (
      <main className="w-full">
        <section>
          <VoteBanner customTitle="어워드" />
        </section>

        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-600">
            어워드 목록을 불러오는 중 오류가 발생했습니다.
          </p>
        </div>
      </main>
    );
  }

  const surveys = data?.result || [];

  return (
    <main className="max-width mt-6">
      {surveys.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-sm">
          <p className="text-lg text-gray-500">등록된 어워드가 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {surveys.map((survey) => {
            const isOpen = survey.status === 'OPEN';

            return (
              <Link
                key={survey.surveyId}
                href={`/award/${survey.year}/${survey.type.toLowerCase()}/${survey.surveyId}`}
                className="flex overflow-hidden rounded-md bg-white shadow-lg shadow-gray-200/80"
              >
                <img
                  src="/survey-thumbnail.png"
                  alt="survey-thumbnail"
                  className="w-1/3 object-cover"
                />

                <div className="flex w-full justify-between gap-4 p-4 max-sm:flex-col">
                  <div className="flex flex-col gap-2">
                    <div className="max-xs:flex-col flex gap-2 sm:items-center">
                      <div>{getStatusBadge(survey.status)}</div>
                      <h2 className="text-md font-semibold text-gray-600">
                        {survey.year} {getSurveyTypeLabel(survey.type)}
                      </h2>
                    </div>
                    <div className="xs:ml-1 text-xs font-semibold text-gray-500/80">
                      <span>투표 기간 :</span> {survey.startDate} ~{' '}
                      {survey.endDate}
                    </div>
                  </div>

                  <div className="flex h-9 w-fit self-end rounded-full bg-gradient-to-tr from-pink-300 to-blue-300 p-0.5 shadow-lg md:self-center">
                    <button
                      onClick={() => {
                        router.push(
                          `/award/${survey.year}/${survey.type.toLowerCase()}/${survey.surveyId}`
                        );
                      }}
                      className="flex items-center justify-center rounded-full bg-white/80 px-4 text-sm font-semibold text-gray-500 transition-all duration-300 hover:opacity-80"
                    >
                      {!isOpen
                        ? '결과 보기'
                        : survey.hasVoted
                          ? '투표 완료'
                          : '투표 하기'}
                    </button>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
