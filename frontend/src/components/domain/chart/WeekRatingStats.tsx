'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import StarDistributionChart from '../star/StarDistributionChart';
import { useChart } from '@/components/layout/AppContainer';
import { VoteResultDto } from '@/types';
import { createDistributionArray } from '@/lib/chartUtils';

interface WeekRatingStatsProps {
  voteResult: VoteResultDto;
}

export default function WeekRatingStats({ voteResult }: WeekRatingStatsProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const { selectedWeek } = useChart();

  const week = `${selectedWeek?.year}년 ${selectedWeek?.quarter}분기 ${selectedWeek?.week}주차`;
  const averageRating = voteResult.info?.starAverage || 0;
  const participantCount = voteResult.voterCount || 0;
  const distribution = createDistributionArray(voteResult, week);

  // 25년 4분기 1-2주차인지 확인 (1점 단위 모드)
  const isIntegerMode =
    week.includes('25년 4분기 1주차') || week.includes('25년 4분기 2주차');

  // 평균 별점을 정수 부분과 소수 부분으로 분리 (소수점 첫째 자리)
  const integerPart = Math.floor(averageRating);
  const decimalPart = Math.floor((averageRating - integerPart) * 10) / 10;
  const decimalString = decimalPart.toFixed(1).substring(1); // ".7" 형태

  // 실제 전체 점수 (소수점 셋째자리까지 반올림, 항상 표시)
  const fullRating = (Math.round(averageRating * 1000) / 1000).toFixed(3);

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
    <div className="inline-flex min-w-0 flex-shrink-0 flex-col items-center gap-1 sm:items-end">
      {/* 주차 정보 */}
      <div className="xs:text-lg ml-2 text-left text-sm font-normal text-white sm:ml-0 sm:text-right sm:text-lg">
        {week.includes('25년 4분기 1주차') ||
        week.includes('25년 4분기 2주차') ? (
          <div className="flex items-start gap-4 sm:hidden">
            <div className="flex-shrink-0">
              <div>{week.split(' ').slice(0, 2).join(' ')}</div>
              <div>{week.split(' ').slice(2).join(' ')}</div>
            </div>
            <div className="-mt-3 inline-flex flex-col items-end gap-0.5">
              <div
                className="inline-flex cursor-pointer items-center gap-1.5"
                onMouseEnter={(e) => {
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                  setShowTooltip(true);
                }}
                onMouseLeave={() => {
                  setShowTooltip(false);
                }}
              >
                <div className="relative size-6">
                  <img
                    src="/icons/star/star-Selected.svg"
                    alt="별"
                    className="h-6 w-6"
                  />
                </div>
                <div className="text-center">
                  <span className="text-2xl leading-loose font-semibold tracking-widest text-white">
                    {integerPart}
                  </span>
                  <span className="text-xl leading-loose font-semibold tracking-widest text-white">
                    {decimalString}
                  </span>
                </div>
              </div>
              <div className="-mt-3 text-right text-sm leading-loose font-medium text-gray-400 sm:mt-0">
                {participantCount}명 참여
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2 sm:hidden">
            <div className="flex-shrink-0">
              <div>{week.split(' ').slice(0, 2).join(' ')}</div>
              <div>{week.split(' ').slice(2).join(' ')}</div>
            </div>
            <div className="inline-flex flex-col items-end gap-0.5">
              <div
                className="inline-flex cursor-pointer items-center gap-1.5"
                onMouseEnter={(e) => {
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                  setShowTooltip(true);
                }}
                onMouseLeave={() => {
                  setShowTooltip(false);
                }}
              >
                <div className="relative size-6">
                  <img
                    src="/icons/star/star-Selected.svg"
                    alt="별"
                    className="h-6 w-6"
                  />
                </div>
                <div className="text-center">
                  <span className="text-2xl leading-loose font-semibold tracking-widest text-white">
                    {integerPart}
                  </span>
                  <span className="text-xl leading-loose font-semibold tracking-widest text-white">
                    {decimalString}
                  </span>
                </div>
              </div>
              <div className="-mt-3 text-right text-sm leading-loose font-medium text-gray-400 sm:mt-0">
                {participantCount}명 참여
              </div>
            </div>
          </div>
        )}
        <div className="hidden sm:block">{week}</div>
      </div>

      {/* 별점 통계 */}
      <div className="xs:gap-4 inline-flex items-start gap-[2px] sm:gap-4">
        {/* 별점 분산 차트 */}
        <div
          className="xs:w-32 xs:mt-[32px] relative mt-[3px] w-24 sm:mt-[44px] sm:w-32"
          style={{ height: '38.72px' }}
        >
          <StarDistributionChart
            distribution={distribution}
            totalVoters={participantCount}
            width={128}
            height={51.63}
            barWidth={10}
            barSpacing={2}
            maxBarColor="#F87171" // rose-400
            normalBarColor="rgba(248, 113, 113, 0.7)" // rose-400/70
            isIntegerMode={isIntegerMode}
            className="absolute inset-0"
          />
        </div>

        {/* 평균 별점 및 참여자 수 - 640px 이상에서만 표시 */}
        <div className="hidden flex-col items-end sm:inline-flex">
          <div
            className="xs:gap-2 inline-flex cursor-pointer items-center gap-1.5 sm:gap-2"
            onMouseEnter={(e) => {
              setTooltipPosition({ x: e.clientX, y: e.clientY });
              setShowTooltip(true);
            }}
            onMouseLeave={() => {
              setShowTooltip(false);
            }}
          >
            <div className="xs:size-8 relative size-6 sm:size-8">
              <img
                src="/icons/star/star-Selected.svg"
                alt="별"
                className="xs:w-8 xs:h-8 h-6 w-6 sm:h-8 sm:w-8"
              />
            </div>
            <div className="text-center">
              <span className="xs:text-4xl text-2xl leading-loose font-semibold tracking-widest text-white sm:text-4xl">
                {integerPart}
              </span>
              <span className="xs:text-2xl text-xl leading-loose font-semibold tracking-widest text-white sm:text-2xl">
                {decimalString}
              </span>
            </div>
          </div>
          <div className="xs:text-lg xs:-mt-[14px] -mt-[10px] text-right text-sm leading-loose font-medium text-gray-400 sm:-mt-[14px] sm:text-lg">
            {participantCount}명 참여
          </div>
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
