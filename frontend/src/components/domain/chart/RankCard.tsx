'use client';

import { useState } from 'react';
import RankContents from './RankContents';
import RankStat from './RankStat';
import { AnimeRankDto } from '@/types';
import MedalGrid from './MedalGrid';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RankCardProps {
  anime: AnimeRankDto;
}

export default function RankCard({ anime }: RankCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isWinner = anime.rankPreviewDto.rank === 1;

  return (
    <div className="mx-auto flex w-full flex-col @max-md:max-w-sm">
      {/* 메인 카드 */}
      <div
        className={cn(
          'xs:pl-3 xs:gap-[16px] flex w-full cursor-pointer items-center gap-[12px] border border-[#D1D1D6] bg-white pl-2 transition-all duration-200 hover:bg-gray-50 sm:gap-[26px] sm:pl-5',
          !isWinner && 'h-[140px]',
          isExpanded ? 'rounded-t-xl rounded-b-none' : 'rounded-xl'
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* 순위 정보 */}
        <RankContents anime={anime} variant={isWinner ? 'winner' : 'default'} />

        {/* 메달 섹션 */}
        <div className="flex shrink-0 items-center justify-center">
          <div className="hidden @md:block">
            <MedalGrid medals={anime.medalPreviews} hideSeparators={false} />
          </div>
          <div className="block h-[52px] w-0 border-l border-gray-300 @md:hidden"></div>
          <div className="inline-flex h-52 w-12 flex-col items-center justify-center">
            <ChevronDown
              size={18}
              className={`text-gray-600 transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : 'rotate-0'
              }`}
            />
          </div>
        </div>
      </div>

      {/* RankStat (드롭다운) */}
      {isExpanded && <RankStat anime={anime} />}
    </div>
  );
}
