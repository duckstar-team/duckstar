'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import RankDiff from './RankDiff';
import ImagePlaceholder from '../common/ImagePlaceholder';
import Medal from './Medal';

interface HomeRankInfoMobileProps {
  rank?: number;
  rankDiff?: "up-greater-equal-than-5" | "up-less-than-5" | "down-less-than-5" | "down-greater-equal-than-5" | "same-rank" | "new" | "Zero";
  rankDiffValue?: string | number;
  title?: string;
  studio?: string;
  image?: string;
  percentage?: string;
  averageRating?: number; // 백엔드에서 받은 평균 별점
  voterCount?: number; // 백엔드에서 받은 참여자 수
  type?: "ANIME" | "HERO" | "HEROINE";
  contentId?: number;
  medal?: "Gold" | "Silver" | "Bronze" | "None";
  className?: string;
}

export default function HomeRankInfoMobile({
  rank = 1,
  rankDiff = "up-greater-equal-than-5",
  rankDiffValue = "5",
  title = "내가 연인이 될 수 있을 리 없잖아, 무리무리! (※무리가 아니었다?!)",
  studio = "Studio Mother",
  image = "",
  percentage = "15.18",
  averageRating = 4.5, // 기본값
  voterCount = 0, // 기본값
  type = "ANIME",
  contentId = 1,
  medal = "None",
  className = ""
}: HomeRankInfoMobileProps) {
  
  const router = useRouter();
  const [showTooltip, setShowTooltip] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // 평균 별점을 정수 부분과 소수 부분으로 분리
  const integerPart = Math.floor(averageRating);
  const decimalPart = averageRating - integerPart;
  const decimalString = decimalPart > 0 ? `.${Math.floor(decimalPart * 10)}` : '';

  // 1-3등 체크
  const isTopThree = rank <= 3;
  const isFirst = rank === 1;

  // 별점 색상 결정
  const getStarColor = () => {
    if (rank === 1) return 'text-rose-800';
    if (rank <= 3) return 'text-gray-600';
    return 'text-gray-400';
  };

  // 폰트 굵기 결정
  const getFontWeight = () => {
    if (rank === 1) return 'font-bold';
    if (rank <= 3) return 'font-semibold';
    return 'font-normal';
  };

  // 별점 위치 결정
  const getPosition = () => {
    if (rank === 1) return 'left-[6px]';
    if (rank === 2) return 'left-[8px]';
    if (rank === 3) return 'left-[10px]';
    return 'left-[12px]';
  };

  // 별점 상단 위치 결정
  const getTopPosition = () => {
    if (rank === 1) return 'top-[6px]';
    if (rank === 2) return 'top-[8px]';
    if (rank === 3) return 'top-[10px]';
    return 'top-[12px]';
  };

  const handleClick = () => {
    if (type === "ANIME") {
      router.push(`/animes/${contentId}`);
    } else {
      router.push(`/characters/${contentId}`);
    }
  };

  return (
    <div 
      className={`w-full h-24 px-3 sm:px-4 py-3 bg-white rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors relative ${className}`}
      onClick={handleClick}
    >
      <div className="flex items-center gap-2 sm:gap-3 md:gap-4 w-full h-full">
        {/* 왼쪽 영역 - 순위와 이미지 */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* 순위 */}
          <div className="flex flex-col items-center gap-1">
            <div className="text-xl sm:text-2xl font-bold font-['Pretendard'] leading-snug text-gray-400">
              {rank}
            </div>
            <RankDiff 
              property1={rankDiff} 
              value={rankDiffValue} 
            />
          </div>
          
          {/* 이미지 */}
          <div className="w-10 h-14 sm:w-12 sm:h-16 relative">
            {image ? (
              <img 
                src={image} 
                alt={title}
                className="w-full h-full object-cover rounded"
              />
            ) : (
              <ImagePlaceholder />
            )}
          </div>
        </div>
        
        {/* 제목과 스튜디오 */}
        <div className="flex-1 inline-flex flex-col justify-start items-start gap-0.5 -mt-1">
          {/* 평균별점과 참여자 수 표시 */}
          <div className="flex gap-1 sm:gap-2 items-center -mb-[2px]">
            <div className="flex gap-0.5 sm:gap-1 items-center">
              <div className="w-3 h-3 sm:w-4 sm:h-4 relative">
                <img 
                  alt="star" 
                  className="block max-w-none size-full" 
                  src="/icons/star/star-UnSelected.svg" 
                />
              </div>
              <p className="font-['Pretendard'] leading-[18px] sm:leading-[22px] text-[#adb5bd] text-[12px] sm:text-[14px] text-center text-nowrap whitespace-pre">
                {averageRating.toFixed(1)}
              </p>
            </div>
            <p className="font-['Pretendard'] leading-[18px] sm:leading-[22px] text-[#adb5bd] text-[12px] sm:text-[14px] text-center text-nowrap whitespace-pre">
              참여
            </p>
            <p className="font-['Pretendard'] leading-[18px] sm:leading-[22px] text-[#adb5bd] text-[12px] sm:text-[14px] text-center text-nowrap whitespace-pre sm:-ml-1">
              {voterCount}
            </p>
          </div>
          
          <div className={`w-full justify-start text-black text-sm sm:text-base md:text-lg font-semibold font-['Pretendard'] leading-snug line-clamp-2 ${isTopThree ? 'pr-8' : ''}`}>
            {title}
          </div>
          <div className={`text-start justify-start text-gray-400 text-xs sm:text-sm font-normal font-['Pretendard'] leading-snug ${isTopThree ? 'pr-8' : ''}`}>
            {studio}
          </div>
        </div>
      </div>
      
      {/* 메달 - 1등, 2등, 3등만 표시 */}
      {rank <= 3 && (
        <div className="absolute top-2 right-2">
          <Medal property1={
            rank === 1 ? "Gold" : 
            rank === 2 ? "Silver" : 
            rank === 3 ? "Bronze" : 
            "None"
          } />
        </div>
      )}
      
      {/* 모바일에서는 퍼센트 표시 제거 */}
    </div>
  );
}
