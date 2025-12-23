'use client';

import { useState } from 'react';
import MedalSection from './MedalSection';
import RankContents from './RankContents';
import RankStat from './RankStat';

interface MedalData {
  id: string;
  type: "Gold" | "Silver" | "Bronze" | "None";
  title?: string;
  image?: string;
  rank?: number;
  year?: number;
  quarter?: number;
  week?: number;
}

interface RankCardProps {
  medals: MedalData[];
  rank: number;
  rankDiff: number;
  rankDiffType: "up-greater-equal-than-5" | "up-less-than-5" | "down-less-than-5" | "down-greater-equal-than-5" | "same-rank" | "new" | "Zero";
  rankDiffValue?: string;
  title: string;
  studio: string;
  image: string;
  rating: number;
  // RankStat props
  debutRank?: number;
  debutDate?: string;
  peakRank?: number;
  peakDate?: string;
  top10Weeks?: number;
  week?: string;
  averageRating?: number;
  participantCount?: number;
  distribution?: number[];
  animeId?: number;
  className?: string;
  hideMedalsOnMobile?: boolean;
}

export default function RankCard({
  medals,
  rank,
  rankDiff,
  rankDiffType,
  rankDiffValue,
  title,
  studio,
  image,
  rating,
  debutRank,
  debutDate,
  peakRank,
  peakDate,
  top10Weeks,
  week,
  averageRating,
  participantCount,
  distribution,
  animeId,
  className = "",
  hideMedalsOnMobile = false
}: RankCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`flex flex-col ${className}`}>
      {/* 메인 카드 */}
      <div 
        className={`inline-flex items-center pl-2 xs:pl-3 sm:pl-5 gap-[12px] xs:gap-[16px] sm:gap-[26px] bg-white border border-[#D1D1D6] h-[140px] w-full max-w-[768px] lg:w-[768px] cursor-pointer hover:bg-gray-50 transition-all duration-200 ${
          isExpanded ? 'rounded-t-xl rounded-b-none' : 'rounded-xl'
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* 순위 정보 */}
        <RankContents
          rank={rank}
          rankDiff={rankDiff}
          rankDiffType={rankDiffType}
          rankDiffValue={rankDiffValue}
          title={title}
          studio={studio}
          image={image}
          rating={rating}
          averageRating={averageRating}
        />

        {/* 메달 섹션 */}
        <MedalSection 
          medals={medals} 
          isExpanded={isExpanded} 
          hideMedalsOnMobile={hideMedalsOnMobile}
        />
      </div>

      {/* RankStat (드롭다운) */}
      {isExpanded && (
        <div className="mt-0">
          <RankStat
            debutRank={debutRank || 0}
            debutDate={debutDate || ""}
            peakRank={peakRank || 0}
            peakDate={peakDate || ""}
            top10Weeks={top10Weeks || 0}
            week={week || ""}
            averageRating={averageRating || 0}
            participantCount={participantCount || 0}
            distribution={distribution || []}
            animeId={animeId}
            medals={medals}
            isExpanded={isExpanded}
          />
        </div>
      )}
    </div>
  );
}