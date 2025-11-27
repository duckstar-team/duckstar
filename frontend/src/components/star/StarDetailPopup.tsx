'use client';

import React from 'react';
import StarDistributionChart from '@/components/chart/StarDistributionChart';
import StarRatingSimple from '@/components/StarRatingSimple';
import { X } from 'lucide-react';

interface StarDetailPopupProps {
  /** 현재 선택된 별점 (0.5~5.0) */
  currentRating: number;
  /** 평균 별점 */
  averageRating: number;
  /** 참여자 수 */
  participantCount: number;
  /** 별점 분산 데이터 (0.5~5.0점 각각의 비율) */
  distribution: number[];
  /** 수정 버튼 클릭 핸들러 */
  onEditClick?: () => void;
  /** 팝업 닫기 핸들러 */
  onClose?: () => void;
  /** 닫기 버튼 클릭 핸들러 */
  onCloseClick?: () => void;
  /** 클래스명 */
  className?: string;
  /** full width variant (summary 화면) */
  fullWidth?: boolean;
}

export default function StarDetailPopup({
  currentRating,
  averageRating,
  participantCount,
  distribution,
  onEditClick,
  onClose,
  className = '',
  fullWidth = false,
}: StarDetailPopupProps) {
  const baseClass = fullWidth
    ? 'flex w-full gap-4'
    : `w-64 h-28 py-6 left-0 top-0 absolute bg-black rounded-bl-2xl rounded-br-2xl inline-flex flex-col justify-center items-center gap-[2px] ${className}`;

  return (
    <div className={baseClass}>
      {/* 닫기 버튼 */}
      {onClose && (
        <button
          onClick={(e) => {
            e.stopPropagation(); // 이벤트 버블링 방지
            onClose();
          }}
          className="absolute -top-[1px] -left-[12px] z-20 flex h-8 w-8 items-center justify-center rounded text-gray-400 transition-colors duration-200 hover:bg-white/20"
          aria-label="닫기"
        >
          <X size={16} />
        </button>
      )}
      {/* 상단: 별점 선택 및 수정 버튼 */}
      <div
        className={`relative ${fullWidth ? 'order-2' : 'order-1'} inline-flex items-center justify-center gap-2.5`}
      >
        <div className="pointer-events-none flex items-center justify-end gap-[0.74px] px-[2.96px] pb-1.5">
          <StarRatingSimple
            key={`star-detail-${currentRating}`}
            maxStars={5}
            initialRating={currentRating}
            size="sm"
            withBackground={true}
            onRatingChange={() => {}} // 읽기 전용
          />
        </div>
        <div
          className={` ${fullWidth ? 'self-start' : 'absolute top-[-5px] left-[135px]'} inline-flex h-7 flex-col items-center justify-center gap-[4.85px] overflow-hidden pb-[5px]`}
        >
          <button
            onClick={onEditClick}
            className="inline-flex items-center justify-center gap-2.5 rounded-sm px-2 pt-[3px] pb-1 transition-opacity hover:opacity-80"
            style={{
              background: 'linear-gradient(to right, #495057, #343A40)',
            }}
          >
            <div className="justify-center text-right font-['Pretendard'] text-[10px] font-bold whitespace-nowrap text-white">
              수정
            </div>
          </button>
        </div>
      </div>

      {/* 하단: 평균 별점 및 분포 그래프 */}
      <div
        className={`${fullWidth ? 'order-1' : 'order-2'} inline-flex items-center justify-center gap-4.5`}
      >
        {/* 평균 별점 정보 */}
        <div className="inline-flex flex-col items-center justify-center">
          <div className="inline-flex items-center justify-center gap-2">
            <div className="relative size-4">
              <img
                src="/icons/star/star-Selected.svg"
                alt="별"
                className="absolute top-0 left-0 h-5 w-5 pb-1"
              />
            </div>
            <div className="flex items-center justify-center gap-2.5 pt-0.5">
              <div className="justify-start text-center text-2xl leading-snug font-semibold text-white">
                {averageRating.toFixed(1)}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-start gap-0.5 pb-1">
            <div className="inline-flex items-center justify-start gap-1">
              <div className="justify-start text-right text-sm leading-snug font-medium text-gray-400">
                {participantCount?.toLocaleString()}명 참여
              </div>
            </div>
          </div>
        </div>

        {/* 별점 분산 막대 그래프 */}
        <div className="relative h-10 w-24 pt-1">
          <StarDistributionChart
            distribution={distribution}
            totalVoters={participantCount}
            width={96}
            height={40}
            barWidth={8}
            barSpacing={2}
            maxBarColor="#FF7B7B"
            normalBarColor="rgba(255, 123, 123, 0.66)"
          />
        </div>
      </div>
    </div>
  );
}
