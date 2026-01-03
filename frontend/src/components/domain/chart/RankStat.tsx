'use client';

import { useRouter } from 'next/navigation';
import WeekRatingStats from './WeekRatingStats';
import { getThisWeekRecord } from '@/lib';
import { format } from 'date-fns';
import MedalGrid from './MedalGrid';
import { AnimeRankDto } from '@/types/dtos';
import { ChevronRight, TrendingUp } from 'lucide-react';

interface RankStatProps {
  anime: AnimeRankDto;
}

export default function RankStat({ anime }: RankStatProps) {
  const router = useRouter();

  const { debutRank, debutDate, peakRank, peakDate, weeksOnTop10 } =
    anime.animeStatDto;
  const animeId = anime.rankPreviewDto.contentId;

  const handleAnimeInfoClick = () => {
    if (animeId) {
      router.push(`/animes/${animeId}`);
    }
  };

  // 날짜 클릭 핸들러: 해당 날짜의 00시를 기준으로 분기/주차 계산 후 차트 페이지로 이동
  const handleDateClick = (dateString: string) => {
    try {
      // 날짜 문자열을 Date 객체로 변환 (YYYY-MM-DD 형식 가정)
      const date = new Date(dateString);

      // 해당 날짜의 00시로 설정
      date.setHours(0, 0, 0, 0);

      // 분기/주차 계산
      const record = getThisWeekRecord(date);

      // 차트 페이지로 이동
      router.push(
        `/chart/${record.yearValue}/${record.quarterValue}/${record.weekValue}`
      );
    } catch (error) {
      console.error('날짜 변환 실패:', error);
    }
  };
  return (
    <div className="xs:px-4 xs:gap-4 flex w-full items-center justify-center gap-2 bg-black px-2 py-4 sm:px-8 md:gap-10 @max-md:flex-col">
      {/* 아랫줄: 별분산과 평균별점 + 메달 섹션 (768px 미만에서만 별도 줄) */}
      <div className="xs:gap-2 flex w-full flex-nowrap items-center justify-between gap-1 sm:gap-4 @md:hidden">
        <WeekRatingStats voteResult={anime.voteResultDto} />
        {/* 모바일용 메달 섹션 */}
        <div className="xs:p-1 min-w-0 flex-shrink-0 rounded-lg bg-[#212529] p-0.5 sm:p-2">
          <MedalGrid medals={anime.medalPreviews} hideSeparators={true} />
        </div>
      </div>

      {/* 윗줄: 데뷔순위, PEAK, TOP10 달성 */}
      <div className="xs:gap-2 flex min-h-fit w-full flex-nowrap items-start justify-center gap-1 rounded-br-xl rounded-bl-xl py-2.5 sm:gap-4 md:gap-7">
        {/* 데뷔 순위 */}
        <div
          data-property-1="Debut"
          className="xs:h-32 xs:gap-1.5 flex h-24 min-w-0 flex-1 flex-col items-center justify-start gap-1 sm:h-32 sm:gap-1.5"
        >
          <div className="xs:h-7 xs:gap-2 inline-flex h-5 items-center justify-center gap-1 self-stretch py-px sm:h-7 sm:gap-2">
            <img
              src="/icons/debut-icon.svg"
              alt="데뷔 순위"
              className="size-6"
            />
            <div className="xs:text-lg justify-start text-sm leading-relaxed font-normal text-white sm:text-lg">
              데뷔 순위
            </div>
          </div>
          <div className="xs:px-3.5 xs:pt-2.5 xs:pb-3.5 xs:gap-3 flex flex-1 flex-col items-center justify-center gap-2 self-stretch rounded-lg px-2 pt-1.5 pb-1.5 outline outline-offset-[-1px] outline-rose-600 sm:gap-3 sm:px-3.5 sm:pt-2.5 sm:pb-3.5">
            <div className="xs:gap-1.5 flex flex-col items-center justify-center gap-1 sm:gap-1.5">
              <div className="justify-start text-center">
                <span className="xs:text-xl text-lg font-semibold text-rose-600 sm:text-xl">
                  #{' '}
                </span>
                <span className="xs:text-4xl text-2xl font-semibold text-rose-600 sm:text-4xl">
                  {debutRank}
                </span>
              </div>
              <div className="xs:gap-2.5 inline-flex items-center justify-center gap-1.5 border-b border-white sm:gap-2.5">
                <div
                  className="xs:w-16 xs:text-base w-12 cursor-pointer justify-start text-center text-sm font-light text-white transition-colors hover:text-rose-400 sm:w-16 sm:text-base"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDateClick(debutDate);
                  }}
                >
                  {format(debutDate, 'yy.MM.dd')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PEAK */}
        <div
          data-property-1="Peak"
          className="xs:h-32 xs:gap-1.5 flex h-24 min-w-0 flex-1 flex-col items-center justify-start gap-1 sm:h-32 sm:gap-1.5"
        >
          <div className="xs:h-7 xs:gap-2 inline-flex h-5 items-center justify-center gap-1 self-stretch py-px sm:h-7 sm:gap-2">
            <TrendingUp className="text-amber-400" />
            <div className="xs:text-lg justify-start text-sm leading-relaxed font-normal text-white sm:text-lg">
              PEAK
            </div>
          </div>
          <div className="xs:px-3.5 xs:pt-2.5 xs:pb-3.5 xs:gap-3 flex flex-1 flex-col items-center justify-center gap-2 self-stretch rounded-lg px-2 pt-1.5 pb-1.5 outline outline-offset-[-1px] outline-rose-600 sm:gap-3 sm:px-3.5 sm:pt-2.5 sm:pb-3.5">
            <div className="xs:gap-1.5 flex flex-col items-center justify-center gap-1 sm:gap-1.5">
              <div className="justify-start text-center">
                <span className="xs:text-xl text-lg font-semibold text-rose-600 sm:text-xl">
                  #{' '}
                </span>
                <span className="xs:text-4xl text-2xl font-semibold text-rose-600 sm:text-4xl">
                  {peakRank}
                </span>
              </div>
              <div className="xs:gap-2.5 inline-flex items-center justify-center gap-1.5 border-b border-white sm:gap-2.5">
                <div
                  className="xs:w-16 xs:text-base w-12 cursor-pointer justify-start text-center text-sm font-light text-white transition-colors hover:text-rose-400 sm:w-16 sm:text-base"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDateClick(peakDate);
                  }}
                >
                  {format(peakDate, 'yy.MM.dd')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TOP10 달성 */}
        <div className="xs:h-32 xs:gap-[9.5px] flex h-24 min-w-0 flex-1 flex-col items-end justify-between gap-[6px] sm:h-32 sm:gap-[9.5px]">
          <div className="xs:gap-2 flex flex-col items-start justify-start gap-1 sm:gap-2">
            <div className="xs:w-32 xs:gap-2 inline-flex w-24 items-center justify-center gap-1 sm:w-32 sm:gap-2">
              <img src="/icons/top10-icon.svg" alt="TOP10" className="size-6" />
              <div className="justify-start">
                <span className="xs:text-lg text-sm font-normal text-white sm:text-lg">
                  TO
                </span>
                <span className="xs:text-lg text-sm font-normal tracking-wide text-white sm:text-lg">
                  P10
                </span>
                <span className="xs:text-lg text-sm font-normal text-white sm:text-lg">
                  {' '}
                  달성
                </span>
              </div>
            </div>
            <div className="xs:w-32 xs:pr-2.5 xs:gap-1.5 inline-flex w-24 items-end justify-end gap-1 pr-1.5 sm:w-32 sm:gap-1.5 sm:pr-2.5">
              <div className="xs:text-4xl justify-start text-right text-2xl font-semibold text-white sm:text-4xl">
                {weeksOnTop10}
              </div>
              <div className="xs:w-4 xs:h-12 xs:pb-1.5 xs:gap-3 inline-flex h-8 w-3 flex-col items-end justify-end gap-2 pb-1 sm:h-12 sm:w-4 sm:gap-3 sm:pb-1.5">
                <div className="xs:h-5 xs:text-lg h-4 justify-start self-stretch text-right text-sm font-semibold text-white sm:h-5 sm:text-lg">
                  주
                </div>
              </div>
            </div>
          </div>
          {animeId && (
            <button
              className="flex items-center gap-1 rounded-md border border-gray-400 py-1 pr-2 pl-3 transition-all duration-200 hover:bg-white/20"
              onClick={handleAnimeInfoClick}
            >
              <span className="text-sm font-normal text-white">애니 정보</span>
              <ChevronRight className="size-4 text-white/70" />
            </button>
          )}
        </div>
      </div>

      {/* 데스크톱: 주차별 별점 통계 (기존 위치) */}
      <div className="hidden @md:flex">
        <WeekRatingStats voteResult={anime.voteResultDto} />
      </div>
    </div>
  );
}
