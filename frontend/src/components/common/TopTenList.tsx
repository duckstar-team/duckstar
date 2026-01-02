'use client';

import React from 'react';
import { MdOutlineHowToVote } from 'react-icons/md';
import { SurveyDto, SurveyRankDto } from '@/types';
import { getBannerSubtitle } from '@/lib/surveyUtils';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo-white.svg';

interface TopTenListProps {
  topTen: SurveyRankDto[];
  titleData?: SurveyDto;
}

export default function TopTenList({ topTen, titleData }: TopTenListProps) {
  const getMedalImg = (rank: number) => {
    if (rank === 1) return '/icons/medal-gold.svg';
    if (rank === 2) return '/icons/medal-silver.svg';
    if (rank === 3) return '/icons/medal-bronze.svg';
    return '';
  };

  return (
    <div
      id="top-ten-list-download"
      className="flex flex-col items-center"
      style={{ minWidth: '660px', maxWidth: '900px' }}
    >
      {/* 헤더 */}
      {titleData && (
        <header
          className="flex h-20 w-full items-center"
          style={{ background: 'linear-gradient(to right, #460e06, #212529)' }}
        >
          <img src={logo} alt="duckstar logo" className="h-full p-4" />
          <div className="mx-2 flex w-full items-center justify-between rounded-lg px-4 py-3">
            <h2 className="text-3xl font-bold text-white">
              {titleData.year}년 {getBannerSubtitle(titleData, false)}{' '}
              <span className="font-bold text-red-500">TOP 10</span>
            </h2>
            <div className="flex flex-col text-white/60">
              <span>{`${format(titleData.startDateTime, 'yy.MM.dd')} - ${format(titleData.endDateTime, 'yy.MM.dd')}`}</span>
              <span>
                <MdOutlineHowToVote className="inline-block size-5" /> 총
                투표수:
              </span>
            </div>
          </div>
        </header>
      )}

      {/* Top 10 리스트 */}
      <div
        className="w-full px-6 py-4"
        style={{ background: 'linear-gradient(to right, #460e06, #212529)' }}
      >
        <div className="space-y-3">
          {topTen.map((item) => (
            <div
              key={item.animeCandidateDto.animeCandidateId}
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
                <h3 className="truncate text-xl font-bold text-black">
                  {item.animeCandidateDto.titleKor}
                </h3>
                <p className="text-sm font-medium text-black/60">
                  {item.animeCandidateDto.year}년{' '}
                  {item.animeCandidateDto.quarter}
                  분기 {item.animeCandidateDto.medium}
                </p>
              </div>

              {/* 메달 이미지 */}
              {item.rank <= 3 && (
                <img
                  src={getMedalImg(item.rank)}
                  alt="medal"
                  width={30}
                  height={30}
                />
              )}
            </div>
          ))}
        </div>

        {/* 푸터 */}
        <footer className="w-full pt-2 text-right text-sm font-medium text-white/60">
          ©Duckstar All Rights Reserved
        </footer>
      </div>
    </div>
  );
}
