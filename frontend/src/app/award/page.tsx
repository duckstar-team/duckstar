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
import { ExternalLink } from 'lucide-react';
import SurveyCountdown from './[year]/[surveyType]/[surveyId]/_components/SurveyCountdown';

const GOOGLE_FORM_SURVEYS = [
  {
    label: '2025년 4분기 애니 조사',
    link: 'https://docs.google.com/forms/d/e/1FAIpQLSevH6se5MuYkrZvlSEfBOKs51UAxu_lK_9lYmXBeXbXbCbi6w/viewform',
  },
  {
    label: '2025년 애니메이션 연말 결산',
    link: 'https://docs.google.com/forms/d/e/1FAIpQLSeHbQol8LaDVe5uiKryIVqNr17Vx8WkshIBV7k4TF2WNuRnbQ/viewform',
  },
];

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
      'rounded-md px-2 py-1 h-6 w-fit break-keep text-xs font-semibold @md:text-sm @md:h-8';
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
          <span className={`${baseClass} bg-yellow-100 text-amber-500`}>
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
        return (
          <span className={`${baseClass} bg-blue-100 text-blue-500`}>
            {statusText}
          </span>
        );
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
    <main className="max-width px-10!">
      <h1 className="my-4 text-xl font-bold text-gray-600 @lg:text-2xl">
        덕스타 어워드
      </h1>
      {/* 덕스타 어워드 투표 링크 */}
      {surveys.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-sm">
          <p className="text-lg text-gray-500">등록된 어워드가 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {surveys.map((survey, i) => {
            const isOpen = survey.status === 'OPEN';

            return (
              <Link
                key={survey.surveyId}
                href={`/award/${survey.year}/${survey.type.toLowerCase()}/${survey.surveyId}`}
                className="group flex min-h-40 overflow-hidden rounded-lg bg-white shadow-lg shadow-gray-200/80 @lg:min-h-60"
              >
                <div className="relative w-2/3">
                  <img
                    src={`/survey-thumb-${i + 1}.png`}
                    alt="survey-thumbnail"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
                </div>

                <div className="flex w-full flex-col justify-between gap-4 p-4 @md:p-6">
                  <div className="flex flex-col gap-2">
                    <div className="max-xs:flex-col flex gap-2 sm:items-center @md:gap-3">
                      <div>{getStatusBadge(survey.status)}</div>
                      <h2 className="group-hover:text-brand text-lg font-semibold text-gray-600 transition-all duration-300 @sm:text-xl @md:text-2xl">
                        {survey.year} {getSurveyTypeLabel(survey.type)}
                      </h2>
                    </div>
                    <div className="xs:ml-1 font-medium text-gray-500/80 @max-sm:text-sm @md:text-lg">
                      <span>투표 기간 :</span> {survey.startDate} ~{' '}
                      {survey.endDate}
                    </div>
                    {survey.status === 'NOT_YET' && (
                      <div className="font-medium text-gray-500/80 @max-sm:text-sm @md:text-lg">
                        <SurveyCountdown startDate={survey.startDate} />
                      </div>
                    )}
                  </div>

                  {survey.status !== 'NOT_YET' && (
                    <div className="flex h-10 w-fit self-end rounded-full bg-gradient-to-tr from-pink-300 to-blue-300 p-0.5 shadow-lg">
                      <button
                        onClick={() => {
                          router.push(
                            `/award/${survey.year}/${survey.type.toLowerCase()}/${survey.surveyId}`
                          );
                        }}
                        className="flex items-center justify-center rounded-full bg-white/80 px-10 text-sm font-semibold text-gray-500 transition-all duration-300 hover:opacity-80 @md:text-base"
                      >
                        {!isOpen
                          ? '결과 보기'
                          : survey.hasVoted
                            ? '투표 완료'
                            : '투표 하기'}
                      </button>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}

          {/* 커스텀 어워드 투표 링크 */}
          <h1 className="mt-8 text-xl font-bold text-gray-600 @lg:text-2xl">
            커스텀 어워드 투표 링크
          </h1>
          <div className="grid gap-4 @md:grid-cols-2">
            {GOOGLE_FORM_SURVEYS.map((survey) => {
              return (
                <div
                  key={survey.link}
                  className="flex h-fit rounded-lg bg-white shadow-lg shadow-gray-200/80"
                >
                  <Link
                    href={survey.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-brand flex items-center gap-4 p-4 text-lg font-semibold text-gray-600 @md:p-6 @md:text-xl @lg:text-2xl"
                  >
                    <img
                      src="https://nstatic.dcinside.com/dc/w/images/logo_icon.ico"
                      alt="survey-thumbnail"
                      className="size-5"
                    />
                    {survey.label}
                    <ExternalLink className="ml-1 transition-transform duration-300" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}
