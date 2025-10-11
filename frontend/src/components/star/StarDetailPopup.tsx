'use client';

import React from 'react';
import StarDistributionChart from '@/components/chart/StarDistributionChart';
import StarRatingSimple from '@/components/StarRatingSimple';

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
}

export default function StarDetailPopup({
  currentRating,
  averageRating,
  participantCount,
  distribution,
  onEditClick,
  onClose,
  onCloseClick,
  className = ''
}: StarDetailPopupProps) {

  return (
    <div 
      className={`w-64 h-28 py-6 left-0 top-0 absolute bg-black rounded-bl-2xl rounded-br-2xl inline-flex flex-col justify-center items-center gap-[2px] ${className}`}
    >
      {/* 닫기 버튼 */}
      {onClose && (
        <button
          onClick={(e) => {
            e.stopPropagation(); // 이벤트 버블링 방지
            onClose(e);
          }}
          className="absolute -top-[1px] -left-[12px] z-20 w-8 h-8 flex items-center justify-center text-gray-400 hover:bg-white/20 rounded transition-colors duration-200"
          aria-label="닫기"
        >
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 16 16" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              d="M12 4L4 12M4 4L12 12" 
              stroke="currentColor" 
              strokeWidth="1.7" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
      {/* 상단: 별점 선택 및 수정 버튼 */}
      <div className="size- relative inline-flex justify-center items-center gap-2.5">
        <div className="size- px-[2.96px] pb-1.5 flex justify-end items-center gap-[0.74px] pointer-events-none">
          <StarRatingSimple
            maxStars={5}
            initialRating={currentRating}
            size="sm"
            withBackground={true}
            onRatingChange={() => {}} // 읽기 전용
          />
        </div>
        <div className="h-7 pb-[5px] left-[135px] top-[-5px] absolute inline-flex flex-col justify-center items-center gap-[4.85px] overflow-hidden">
          <button
            onClick={onEditClick}
            className="px-2 pt-[3px] pb-1 rounded-sm inline-flex justify-center items-center gap-2.5 hover:opacity-80 transition-opacity"
            style={{
              background: 'linear-gradient(to right, #495057, #343A40)'
            }}
          >
            <div className="text-right justify-center text-white text-[10px] font-bold font-['Pretendard'] whitespace-nowrap">
              수정
            </div>
          </button>
        </div>
      </div>

      {/* 하단: 평균 별점 및 분포 그래프 */}
      <div className="size- inline-flex justify-center items-center gap-4.5">
        {/* 평균 별점 정보 */}
        <div className="size- inline-flex flex-col justify-center items-center">
          <div className="size- inline-flex justify-center items-center gap-2">
            <div className="size-4 relative">
              <img 
                src="/icons/star/star-Selected.svg" 
                alt="별" 
                className="w-5 h-5 left-0 top-0 absolute pb-1"
              />
            </div>
            <div className="size- pt-0.5 flex justify-center items-center gap-2.5">
              <div className="text-center justify-start text-white text-2xl font-semibold font-['Pretendard'] leading-snug">
                {averageRating.toFixed(1)}
              </div>
            </div>
          </div>
          <div className="size- flex flex-col justify-start items-center gap-0.5 pb-1">
            <div className="size- inline-flex justify-start items-center gap-1">
              <div className="text-right justify-start text-gray-400 text-sm font-medium font-['Pretendard'] leading-snug">
                {participantCount.toLocaleString()}명 참여
              </div>
            </div>
          </div>
        </div>

        {/* 별점 분산 막대 그래프 */}
        <div className="w-24 h-10 relative pt-1">
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
