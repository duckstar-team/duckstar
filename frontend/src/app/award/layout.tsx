'use client';

import VoteBanner from '@/components/domain/vote/VoteBanner';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import React from 'react';
import { useParams, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { SurveyDto } from '@/types';
import { queryConfig } from '@/lib/queryConfig';
import { getBannerTitle, getBannerSubtitle } from '@/lib/surveyUtils';

export default function AwardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const surveyId = params.surveyId ? parseInt(params.surveyId as string) : null;

  // survey 정보 조회
  const { data: surveyData } = useQuery<SurveyDto>({
    queryKey: ['survey', surveyId],
    queryFn: async () => {
      if (!surveyId) throw new Error('Survey ID가 없습니다');
      const response = await fetch(`/api/v1/vote/surveys/${surveyId}`);
      if (!response.ok) throw new Error('설문 조회 실패');
      const result = await response.json();
      return result.result || result;
    },
    enabled: !!surveyId,
    ...queryConfig.vote,
  });

  const isSurveyPage = pathname.startsWith('/award');
  const isRootAwardPage = pathname === '/award';
  const isAwardSubPage = isSurveyPage && !isRootAwardPage;
  const bannerSubtitle = isAwardSubPage
    ? getBannerSubtitle(surveyData)
    : undefined;

  return (
    <>
      <VoteBanner
        customTitle={getBannerTitle(surveyData, true)}
        customSubtitle={bannerSubtitle}
      />

      <nav className="max-width my-6! flex items-center gap-3 px-10! text-sm font-medium text-gray-500 @md:text-base">
        <Link href="/award" className="hover:text-brand">
          어워드 목록
        </Link>
        {isSurveyPage && surveyData && (
          <>
            <ChevronRight className="size-4 text-gray-500/80" />
            <span className="text-gray-700">{getBannerTitle(surveyData)}</span>
          </>
        )}
      </nav>

      {children}
    </>
  );
}
