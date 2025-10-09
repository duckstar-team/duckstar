'use client';

import RankDiff from './RankDiff';
import StarRatingDisplay from '../StarRatingDisplay';

interface RankContentsProps {
  rank: number;
  rankDiff: number;
  rankDiffType: "up-greater-equal-than-5" | "up-less-than-5" | "down-less-than-5" | "down-greater-equal-than-5" | "same-rank" | "new" | "Zero";
  title: string;
  studio: string;
  image: string;
  rating: number;
  rankColor?: string;
  className?: string;
}

export default function RankContents({
  rank,
  rankDiff,
  rankDiffType,
  title,
  studio,
  image,
  rating,
  className = ""
}: RankCardProps) {


  return (
    <div className={`w-[488px] h-[140px] inline-flex justify-start items-center gap-5 ${className}`}>
      {/* 순위 및 변동 정보 */}
      <div className="w-9 inline-flex flex-col justify-start items-center">
        <div className="text-center justify-start text-[#868E96] text-[32px] font-bold font-['Pretendard'] leading-normal">
          {rank}
        </div>
        <RankDiff 
          property1={rankDiffType} 
          value={rankDiff} 
        />
      </div>

      {/* 애니메이션 포스터 */}
      <img 
        className="w-[75px] h-[100px] rounded-2xl" 
        src={image} 
        alt={title}
      />

      {/* 제목, 스튜디오, 별점 정보 */}
      <div className="inline-flex flex-col justify-center items-end gap-2">
        <div className="w-72 flex flex-col justify-start items-start gap-[3px]">
          <div className="self-stretch justify-start text-black text-xl font-bold font-['Pretendard'] leading-snug">
            {title}
          </div>
          <div className="text-center justify-start text-gray-400 text-sm font-normal font-['Pretendard'] leading-snug">
            {studio}
          </div>
        </div>
        
        {/* 별점 */}
        <div className="self-stretch pr-[5px] inline-flex justify-start items-center gap-2.5">
          <StarRatingDisplay 
            rating={rating} 
            size="lg" 
            maxStars={5}
          />
        </div>
      </div>
    </div>
  );
}
