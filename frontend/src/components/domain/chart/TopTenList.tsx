'use client';

import React from 'react';
import { MdOutlineHowToVote } from 'react-icons/md';
import { Schemas, WeekDto } from '@/types';
import { getBannerSubtitle, cn, getRankDiffType } from '@/lib';
import { format } from 'date-fns';
import RankDiff from './RankDiff';
import { Users } from 'lucide-react';

type TopTenListProps =
  | {
      type: 'award';
      topTen: Schemas['SurveyRankPage'];
      titleData: Schemas['SurveyDto'] | null;
    }
  | {
      type: 'weekly';
      topTen: Schemas['AnimeRankSliceDto'];
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

  const renderAwardItem = (item: Schemas['SurveyRankDto'], index: number) => (
    <div
      key={`${item.animeId}-${index}`}
      className="flex items-center gap-5 rounded-xl border border-gray-200 bg-white px-4 py-2"
    >
      {/* 순위 */}
      <div
        className={cn(
          'flex w-8 shrink-0 items-center justify-center text-3xl font-medium',
          item.rank === 1 ? 'text-red-500' : 'text-gray-500/80'
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
        <h3 className="text-xl font-medium text-black">
          {item.animeCandidateDto.titleKor}
        </h3>
        <p className="text-sm font-medium text-black/60">
          {item.animeCandidateDto.year}년 {item.animeCandidateDto.quarter}분기{' '}
          {item.animeCandidateDto.medium}
        </p>
      </div>

      {/* 메달 이미지 */}
      {item.rank && item.rank <= 3 && (
        <img src={getMedalImg(item.rank)} alt="medal" width={30} height={30} />
      )}
    </div>
  );

  const renderWeeklyItem = (item: Schemas['RankPreviewDto']) => (
    <div
      key={item.contentId}
      className="flex items-center gap-5 rounded-xl border border-gray-200 bg-white py-2"
    >
      {/* 순위 */}
      <div
        className={cn(
          'ml-4 flex w-8 shrink-0 items-center justify-center text-3xl font-medium',
          item.rank === 1 ? 'text-red-500' : 'text-gray-500/80'
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
        <h3 className="text-xl font-medium text-black">{item.title}</h3>
      </div>

      {/* 순위 변동 */}
      <div className="flex h-10 w-20 items-center justify-center border-l border-gray-200">
        <RankDiff
          property1={getRankDiffType(
            item.rankDiff,
            item.consecutiveWeeksAtSameRank
          )}
          value={
            getRankDiffType(item.rankDiff, item.consecutiveWeeksAtSameRank) ===
            'same-rank'
              ? (item.consecutiveWeeksAtSameRank || 0).toString()
              : (item.rankDiff || 0).toString()
          }
          isTopTen={true}
        />
      </div>
    </div>
  );

  const renderAwardTitle = (
    surveyDto: Schemas['SurveyDto'],
    voteTotalCount: number
  ) => (
    <div className="flex items-center justify-between rounded-lg bg-white px-4 py-2.5">
      <h2 className="text-2xl font-bold text-black">
        {surveyDto.year}년 {getBannerSubtitle(surveyDto, false)}{' '}
        <span className="text-brand">TOP 10</span>
      </h2>
      <div className="flex flex-col items-end text-black/60">
        <span className="text-sm">{`${format(surveyDto.startDateTime, 'yy.MM.dd')} - ${format(surveyDto.endDateTime, 'yy.MM.dd')}`}</span>
        <span className="flex items-center gap-2">
          <MdOutlineHowToVote size={20} />총 투표 수: {voteTotalCount}표
        </span>
      </div>
    </div>
  );

  const renderWeeklyTitle = (
    weekDto: WeekDto,
    voterCount: number,
    voteTotalCount: number
  ) => {
    return (
      <div className="flex items-center justify-between rounded-lg bg-white px-4 py-2.5">
        <h2 className="text-2xl font-bold text-black">
          {weekDto.year}년 {weekDto.quarter}분기 {weekDto.week}
          주차 <span className="text-brand">TOP 10</span>
        </h2>
        <div className="flex flex-col text-sm text-black/60">
          <span className="flex items-center gap-2">
            <Users size={18} />
            전체 투표자: {voterCount}명
          </span>
          <span className="flex items-center gap-2">
            <MdOutlineHowToVote size={20} />총 투표 수: {voteTotalCount}표
          </span>
        </div>
      </div>
    );
  };

  return (
    <div
      id="top-ten-list-download"
      className="flex w-[700px] flex-col items-center bg-gray-100"
    >
      {/* 헤더 */}
      {titleData && (
        <header className="flex w-full items-center bg-gray-200">
          <img
            src="/logo.svg"
            alt="duckstar logo"
            className="h-full w-40 object-contain"
          />
          <div className="w-full px-4">
            {type === 'award'
              ? renderAwardTitle(titleData, topTen.voteTotalCount)
              : renderWeeklyTitle(
                  titleData,
                  topTen.voterCount,
                  topTen.voteTotalCount
                )}
          </div>
        </header>
      )}

      {/* Top 10 리스트 */}
      <div className="w-full px-6 py-4">
        <div className="space-y-3">
          {type === 'award'
            ? topTen.surveyRankDtos.map((item, index) =>
                renderAwardItem(item, index)
              )
            : topTen.animeRankDtos
                .slice(0, 10)
                .map((item) => renderWeeklyItem(item.rankPreviewDto))}
        </div>

        {/* 푸터 */}
        <footer className="w-full pt-2 text-right text-sm font-medium text-black/60">
          ©Duckstar All Rights Reserved
        </footer>
      </div>
    </div>
  );
}
