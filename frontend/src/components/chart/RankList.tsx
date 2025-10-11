'use client';

import MedalSection from './MedalSection';
import RankContents from './RankContents';

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

interface RankData {
  rank: number;
  rankDiff: number;
  rankDiffType: "up-greater-equal-than-5" | "up-less-than-5" | "down-less-than-5" | "down-greater-equal-than-5" | "same-rank" | "new" | "Zero";
  title: string;
  studio: string;
  image: string;
  rating: number;
}

interface RankListProps {
  medals: MedalData[];
  rankData: RankData[];
  className?: string;
}

export default function RankList({
  medals,
  rankData,
  className = ""
}: RankListProps) {
  return (
    <div className={`flex flex-col gap-6 ${className}`}>
      {/* 메달 섹션 */}
      <div className="flex justify-center">
        <MedalSection medals={medals} />
      </div>

      {/* 순위 리스트 */}
      <div className="flex flex-col gap-4">
        {rankData.map((rank, index) => (
          <RankContents
            key={index}
            rank={rank.rank}
            rankDiff={rank.rankDiff}
            rankDiffType={rank.rankDiffType}
            title={rank.title}
            studio={rank.studio}
            image={rank.image}
            rating={rank.rating}
          />
        ))}
      </div>
    </div>
  );
}
