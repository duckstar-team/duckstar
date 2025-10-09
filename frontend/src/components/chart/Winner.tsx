'use client';

import MedalSection from './MedalSection';
import WinnerRankContents from './WinnerRankContents';

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

interface WinnerProps {
  medals: MedalData[];
  rank: number;
  rankDiff: number;
  rankDiffType: "up-greater-equal-than-5" | "up-less-than-5" | "down-less-than-5" | "down-greater-equal-than-5" | "same-rank" | "new" | "Zero";
  title: string;
  studio: string;
  image: string;
  rating: number;
  className?: string;
}

export default function Winner({
  medals,
  rank,
  rankDiff,
  rankDiffType,
  title,
  studio,
  image,
  rating,
  className = ""
}: WinnerProps) {
  return (
    <div className={`inline-flex items-center pl-5 gap-[26px] border border-[#D1D1D6] rounded-xl w-[768px] ${className}`}>
      {/* 순위 정보 */}
      <WinnerRankContents
        rank={rank}
        rankDiff={rankDiff}
        rankDiffType={rankDiffType}
        title={title}
        studio={studio}
        image={image}
        rating={rating}
      />

      {/* 메달 섹션 */}
      <MedalSection medals={medals} />
    </div>
  );
}
