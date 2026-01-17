'use client';

import VoteBanner from '@/components/domain/vote/VoteBanner';
import { ChevronRight, Share2 } from 'lucide-react';
import Link from 'next/link';
import React, { useRef, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { SurveyDto, SurveyResultDto } from '@/types/dtos';
import { queryConfig, getBannerTitle, getBannerSubtitle } from '@/lib';
import DownloadBtn from '@/components/common/DownloadBtn';
import { useOutsideClick } from '@/hooks/useOutsideClick';
import ShareDropdown from '@/components/common/ShareDropdown';
import TopTenList from '@/components/domain/chart/TopTenList';
import { getSurveyResult } from '@/api/chart';
import { SurveyStatus } from '@/types/enums';

export default function AwardHeader() {
  const params = useParams();
  const pathname = usePathname();
  const surveyId = params.surveyId ? parseInt(params.surveyId as string) : null;
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  useOutsideClick(dropdownRef, (e) => {
    setIsDropdownOpen(false);
    e.stopPropagation();
  });

  // Top 10 데이터 가져오기
  const { data: topTenData } = useQuery<SurveyResultDto>({
    queryKey: ['survey-result-top10', surveyId],
    queryFn: async () => {
      if (!surveyId) throw new Error('Survey ID가 없습니다');
      const response = await getSurveyResult(surveyId, 0, 10);
      if (!response.isSuccess) throw new Error('Survey Result 조회 실패');
      return response.result;
    },
    enabled: !!surveyId,
    ...queryConfig.vote,
  });

  return (
    <>
      <VoteBanner
        customTitle={getBannerTitle(surveyData, true)}
        customSubtitle={bannerSubtitle}
      />

      <nav className="max-width my-6! flex items-center gap-3 text-sm font-medium break-keep text-gray-500 @md:text-base">
        <Link href="/award" className="hover:text-brand">
          어워드 목록
        </Link>
        {isSurveyPage && surveyData && (
          <>
            <ChevronRight className="size-4 shrink-0 text-gray-500/80" />
            <span className="text-gray-500">{getBannerTitle(surveyData)}</span>
          </>
        )}
        {surveyData?.status === SurveyStatus.ResultOpen && (
          <div
            ref={dropdownRef}
            className="relative ml-auto flex items-center gap-1"
          >
            <DownloadBtn />
            <button
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="rounded-full p-2 transition hover:bg-gray-200 dark:hover:bg-zinc-800"
            >
              <Share2 className="size-5" />
            </button>
            {isDropdownOpen && (
              <div className="absolute top-full right-0 z-10">
                <ShareDropdown thumbnailUrl={surveyData?.thumbnailUrl} />
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Top 10 리스트 (숨김 처리, 다운로드용) */}
      <div className="fixed top-0 left-full">
        {topTenData && (
          <TopTenList
            topTen={topTenData}
            type="award"
            titleData={surveyData || null}
          />
        )}
      </div>
    </>
  );
}
