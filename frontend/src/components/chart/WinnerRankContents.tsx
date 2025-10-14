'use client';

import RankDiff from './RankDiff';
import StarRatingDisplay from '../StarRatingDisplay';

interface WinnerRankContentsProps {
  rank: number;
  rankDiff: number;
  rankDiffType: "up-greater-equal-than-5" | "up-less-than-5" | "down-less-than-5" | "down-greater-equal-than-5" | "same-rank" | "new" | "Zero";
  rankDiffValue?: string;
  title: string;
  studio: string;
  image: string;
  rating: number;
  className?: string;
}

export default function WinnerRankContents({
  rank,
  rankDiff,
  rankDiffType,
  rankDiffValue,
  title,
  studio,
  image,
  rating,
  className = ""
}: WinnerRankContentsProps) {

  return (
    <div className={`w-full max-w-[488px] h-52 inline-flex justify-start items-center gap-2 xs:gap-3 sm:gap-5 ${className}`}>
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

      {/* 애니메이션 포스터 - Winner용 원래 크기 */}
      <div className="w-16 xs:w-20 sm:w-28 h-20 xs:h-28 sm:h-36 rounded-2xl overflow-hidden">
        <img 
          className="w-full h-full object-cover" 
          src={image} 
          alt={title}
        />
      </div>

      {/* 제목, 스튜디오, 별점 정보 */}
      <div className="inline-flex flex-col justify-center items-end gap-2.5">
        <div className="w-72 max-w-[130px] xs:max-w-[179px] sm:max-w-[251px] flex flex-col justify-start items-start gap-[5px]">
          <div className="self-stretch justify-start text-black text-lg xs:text-xl sm:text-xl font-bold font-['Pretendard'] leading-snug line-clamp-2">
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
