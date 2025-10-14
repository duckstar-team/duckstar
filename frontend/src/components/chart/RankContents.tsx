'use client';

import RankDiff from './RankDiff';
import StarRatingDisplay from '../StarRatingDisplay';

interface RankContentsProps {
  rank: number;
  rankDiff: number;
  rankDiffType: "up-greater-equal-than-5" | "up-less-than-5" | "down-less-than-5" | "down-greater-equal-than-5" | "same-rank" | "new" | "Zero";
  rankDiffValue?: string;
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
  rankDiffValue,
  title,
  studio,
  image,
  rating,
  className = ""
}: RankContentsProps) {


  return (
    <div className={`w-full max-w-[488px] h-[140px] inline-flex justify-start items-center gap-2 xs:gap-3 sm:gap-5 ${className}`}>
      {/* 순위 및 변동 정보 */}
      <div className="w-9 inline-flex flex-col justify-start items-center">
        <div className="text-center justify-start text-[#868E96] text-[28px] xs:text-[32px] sm:text-[32px] font-bold font-['Pretendard'] leading-normal">
          {rank}
        </div>
        <RankDiff 
          property1={rankDiffType} 
          value={rankDiffValue || rankDiff} 
        />
      </div>

      {/* 애니메이션 포스터 */}
      <div className="w-[50px] xs:w-[60px] sm:w-[75px] h-[65px] xs:h-[80px] sm:h-[100px] rounded-2xl overflow-hidden">
        <img 
          className="w-full h-full object-cover" 
          src={image} 
          alt={title}
        />
      </div>

      {/* 제목, 스튜디오, 별점 정보 */}
      <div className="inline-flex flex-col justify-center items-end gap-2">
        <div className="w-72 max-w-[150px] xs:max-w-[200px] sm:max-w-[288px] flex flex-col justify-start items-start gap-[3px]">
          <div className="self-stretch justify-start text-black text-base xs:text-lg sm:text-lg font-semibold font-['Pretendard'] leading-snug line-clamp-2">
            {title}
          </div>
          <div className="text-center justify-start text-gray-400 text-xs xs:text-sm sm:text-sm font-normal font-['Pretendard'] leading-snug">
            {studio}
          </div>
        </div>
        
        {/* 별점 */}
        <div className="self-stretch pr-[5px] inline-flex justify-start items-center gap-2.5">
          <StarRatingDisplay 
            rating={rating} 
            size="lg" 
            maxStars={5}
            responsiveSize={true}
          />
        </div>
      </div>
    </div>
  );
}
