'use client';

import React from 'react';
import { MdOutlineHowToVote } from 'react-icons/md';
import {
  AnimeRankDto,
  RankPreviewDto,
  SurveyDto,
  SurveyRankDto,
  WeekDto,
} from '@/types/dtos';
import { getBannerSubtitle } from '@/lib/surveyUtils';
import { format, parse } from 'date-fns';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo-white.svg';
import RankDiff from '../domain/chart/RankDiff';
import { getRankDiffType } from '@/lib/chartUtils';

type TopTenListProps =
  | {
      type: 'award';
      topTen: SurveyRankDto[];
      titleData: SurveyDto | null;
    }
  | {
      type: 'weekly';
      topTen: AnimeRankDto[];
      titleData: WeekDto | null;
    };

export default function TopTenList({
  topTen,
  type,
  titleData,
}: TopTenListProps) {
  const getMedalImg = (rank: number) => {
    if (rank === 1) return '/icons/medal-gold.svg';
    if (rank === 2) return '/icons/medal-silver.svg';
    if (rank === 3) return '/icons/medal-bronze.svg';
    return '';
  };

  const renderAwardItem = (item: SurveyRankDto) => (
    <div
      key={item.animeId}
      className="flex items-center gap-5 rounded-lg bg-white px-4 py-2"
    >
      {/* 순위 */}
      <div
        className={cn(
          'flex w-8 shrink-0 items-center justify-center text-3xl font-bold',
          item.rank === 1 ? 'text-red-500' : 'text-black/60'
        )}
      >
        {item.rank}
      </div>

      {/* 썸네일 */}
      <div
        className={cn(
          'relative aspect-[3/4] h-24 shrink-0 overflow-hidden rounded shadow-md',
          item.rank === 1 && 'h-32'
        )}
      >
        <img
          src={item.animeCandidateDto.mainThumbnailUrl}
          alt={item.animeCandidateDto.titleKor}
          className="h-full w-full object-cover"
        />
      </div>

      {/* 제목 및 정보 */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <h3 className="text-xl font-bold text-black">
          {item.animeCandidateDto.titleKor}
        </h3>
        <p className="text-sm font-medium text-black/60">
          {item.animeCandidateDto.year}년 {item.animeCandidateDto.quarter}분기{' '}
          {item.animeCandidateDto.medium}
        </p>
      </div>

      {/* 메달 이미지 */}
      {item.rank <= 3 && (
        <img src={getMedalImg(item.rank)} alt="medal" width={30} height={30} />
      )}
    </div>
  );

  const renderWeeklyItem = (item: RankPreviewDto) => (
    <div
      key={item.contentId}
      className="flex items-center gap-5 rounded-lg bg-white px-4 py-2"
    >
      {/* 순위 */}
      <div
        className={cn(
          'flex w-8 shrink-0 items-center justify-center text-3xl font-bold',
          item.rank === 1 ? 'text-red-500' : 'text-black/60'
        )}
      >
        {item.rank}
      </div>

      {/* 썸네일 */}
      <div
        className={cn(
          'relative aspect-[3/4] h-24 shrink-0 overflow-hidden rounded shadow-md',
          item.rank === 1 && 'h-32'
        )}
      >
        <img
          src={item.mainThumbnailUrl}
          alt={item.title}
          className="h-full w-full object-cover"
        />
      </div>

      {/* 제목  */}
      <div className="flex min-w-0 flex-1">
        <h3 className="text-xl font-bold text-black">{item.title}</h3>
      </div>

      {/* 순위 변동 */}
      <div className="w-20 text-center">
        <RankDiff
          property1={getRankDiffType(item.rankDiff)}
          value={item.rankDiff}
          isTopTen={true}
        />
      </div>
    </div>
  );

  const renderAwardTitle = (surveyDto: SurveyDto) => (
    <>
      <h2 className="text-3xl font-bold text-white">
        {surveyDto.year}년 {getBannerSubtitle(surveyDto, false)}{' '}
        <span className="text-red-500">TOP 10</span>
      </h2>
      <div className="flex flex-col text-white/60">
        <span>{`${format(surveyDto.startDateTime, 'yy.MM.dd')} - ${format(surveyDto.endDateTime, 'yy.MM.dd')}`}</span>
        <span>
          <MdOutlineHowToVote className="inline-block size-5" /> 총 투표수:
        </span>
      </div>
    </>
  );

  const renderWeeklyTitle = (weekDto: WeekDto) => {
    // 날짜 포맷팅 헬퍼 함수
    const formatDate = (dateStr: string): string => {
      if (!dateStr) return '';
      const dateObj = parse(dateStr, 'yyyy-MM-dd', new Date());
      return format(dateObj, 'yy.MM.dd');
    };

    return (
      <>
        <h2 className="text-3xl font-bold text-white">
          {weekDto.year}년 {weekDto.quarter}분기 {weekDto.week}
          주차 <span className="text-red-500">TOP 10</span>
        </h2>
        <div className="flex flex-col text-white/60">
          <span>
            {formatDate(weekDto.startDate)} - {formatDate(weekDto.endDate)}
          </span>
          <span>
            <MdOutlineHowToVote className="inline-block size-5" /> 총 투표수:
          </span>
        </div>
      </>
    );
  };

  return (
    <div
      id="top-ten-list-download"
      className="flex flex-col items-center"
      style={{ minWidth: '700px', maxWidth: '900px' }}
    >
      {/* 헤더 */}
      {titleData && (
        <header
          className="flex h-20 w-full items-center"
          style={{ background: 'linear-gradient(to right, #460e06, #212529)' }}
        >
          <img src={logo} alt="duckstar logo" className="h-full p-4" />
          <div className="mx-2 flex w-full items-center justify-between rounded-lg px-4 py-3">
            {type === 'award'
              ? renderAwardTitle(titleData)
              : renderWeeklyTitle(titleData)}
          </div>
        </header>
      )}

      {/* Top 10 리스트 */}
      <div
        className="w-full px-6 py-4"
        style={{ background: 'linear-gradient(to right, #460e06, #212529)' }}
      >
        <div className="space-y-3">
          {type === 'award'
            ? topTen.map((item) => renderAwardItem(item))
            : topTen.map((item) => renderWeeklyItem(item.rankPreviewDto))}
        </div>

        {/* 푸터 */}
        <footer className="w-full pt-2 text-right text-sm font-medium text-white/60">
          ©Duckstar All Rights Reserved
        </footer>
      </div>
    </div>
  );
}
