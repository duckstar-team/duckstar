'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import RankDiff from './RankDiff';
import StarRatingDisplay from '../StarRatingDisplay';

interface RankContentsProps {
  rank: number;
  rankDiff: number;
  rankDiffType:
    | 'up-greater-equal-than-5'
    | 'up-less-than-5'
    | 'down-less-than-5'
    | 'down-greater-equal-than-5'
    | 'same-rank'
    | 'new'
    | 'Zero';
  rankDiffValue?: string;
  title: string;
  studio: string;
  image: string;
  rating: number;
  averageRating?: number; // 원본 전체 점수
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
  averageRating,
  className = '',
}: RankContentsProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [tooltipVisible, setTooltipVisible] = useState(false);

  // 실제 전체 점수 (소수점 셋째자리까지 반올림, 항상 표시)
  const fullRating =
    averageRating !== undefined
      ? (Math.round(averageRating * 1000) / 1000).toFixed(3)
      : (Math.round(rating * 1000) / 1000).toFixed(3);

  // 딜레이 후 서서히 보이게
  useEffect(() => {
    if (showTooltip) {
      const timer = setTimeout(() => {
        setTooltipVisible(true);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setTooltipVisible(false);
    }
  }, [showTooltip]);

  return (
    <div
      className={`xs:gap-3 inline-flex h-[140px] w-full max-w-[488px] items-center justify-start gap-2 sm:gap-5 ${className}`}
    >
      {/* 순위 및 변동 정보 */}
      <div className="inline-flex w-9 flex-col items-center justify-start">
        <div className="xs:text-[32px] justify-start text-center text-[28px] leading-normal font-bold text-[#868E96] sm:text-[32px]">
          {rank}
        </div>
        <RankDiff property1={rankDiffType} value={rankDiffValue || rankDiff} />
      </div>

      {/* 애니메이션 포스터 */}
      <div className="xs:w-[60px] xs:h-[80px] h-[65px] w-[50px] overflow-hidden rounded-2xl sm:h-[100px] sm:w-[75px]">
        <img className="h-full w-full object-cover" src={image} alt={title} />
      </div>

      {/* 제목, 스튜디오, 별점 정보 */}
      <div className="inline-flex flex-col items-end justify-center gap-2">
        <div className="xs:max-w-[200px] flex w-72 max-w-[150px] flex-col items-start justify-start gap-[3px] sm:max-w-[288px]">
          <div className="xs:text-lg line-clamp-2 justify-start self-stretch text-base leading-snug font-semibold text-black sm:text-lg">
            {title}
          </div>
          <div className="xs:text-sm justify-start text-center text-xs leading-snug font-normal text-gray-400 sm:text-sm">
            {studio}
          </div>
        </div>

        {/* 별점 */}
        <div
          className="inline-flex cursor-pointer items-center justify-start gap-2.5 self-stretch pr-[5px]"
          onMouseEnter={(e) => {
            setTooltipPosition({ x: e.clientX, y: e.clientY });
            setShowTooltip(true);
          }}
          onMouseLeave={() => {
            setShowTooltip(false);
          }}
        >
          <StarRatingDisplay
            rating={rating}
            size="lg"
            maxStars={5}
            responsiveSize={true}
          />
        </div>
      </div>

      {/* 툴팁 포털 */}
      {showTooltip &&
        typeof window !== 'undefined' &&
        createPortal(
          <div
            className={`pointer-events-none fixed z-50 rounded bg-gray-700/60 px-2 py-1 text-xs whitespace-nowrap text-white shadow-lg transition-opacity duration-300 ${
              tooltipVisible ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              left: tooltipPosition.x + 10,
              top: tooltipPosition.y + 10,
            }}
          >
            ★ {fullRating} / 10
          </div>,
          document.body
        )}
    </div>
  );
}
