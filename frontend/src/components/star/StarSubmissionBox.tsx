'use client';

import React from 'react';
import StarDetailPopup from '@/components/star/StarDetailPopup';
import StarRatingSimple from '@/components/StarRatingSimple';
import { withdrawStar } from '@/api/client';

interface StarSubmissionBoxProps {
  /** 현재 선택된 별점 (0.5~5.0) */
  currentRating: number;
  /** 평균 별점 */
  averageRating: number;
  /** 참여자 수 */
  participantCount: number;
  /** 별점 분산 데이터 (0.5~5.0점 각각의 비율) */
  distribution: number[];
  /** 에피소드 ID */
  episodeId: number;
  /** 상태: 'submitting' | 'loading' | 'submitted' */
  variant: 'submitting' | 'loading' | 'submitted';
  /** 별점 변경 핸들러 (submitting 상태에서만 사용) */
  onRatingChange?: (rating: number) => void;
  /** 수정 버튼 클릭 핸들러 (submitted 상태에서만 사용) */
  onEditClick?: () => void;
  /** 닫기 버튼 클릭 핸들러 (submitted 상태에서만 사용) */
  onCloseClick?: () => void;
  /** 별점 회수 완료 핸들러 */
  onWithdrawComplete?: () => void;
  /** 별점 즉시 초기화 핸들러 (bin 버튼 클릭 시 호출) */
  onRatingReset?: () => void;
  /** 투표 정보 (연도, 분기, 주차) */
  voteInfo?: {year: number, quarter: number, week: number} | null;
  /** bin 아이콘 표시 여부 (info가 null이 아닌 경우에만 true) */
  showBinIcon?: boolean;
  /** 클래스명 */
  className?: string;
}

export default function StarSubmissionBox({
  currentRating,
  averageRating,
  participantCount,
  distribution,
  episodeId,
  variant,
  onRatingChange,
  onEditClick,
  onCloseClick,
  onWithdrawComplete,
  onRatingReset,
  voteInfo,
  showBinIcon = false,
  className = ''
}: StarSubmissionBoxProps) {
  const isSubmitting = variant === 'submitting';
  const isLoading = variant === 'loading';
  const isSubmitted = variant === 'submitted';

  return (
    <div 
      className={`w-64 h-28 py-6 absolute bg-black rounded-bl-2xl rounded-br-2xl inline-flex flex-col justify-center items-center gap-[2px] ${className}`}
      style={{
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)'
      }}
    >
      {/* 닫기 버튼 (submitted 상태에서만 표시) */}
      {onCloseClick && (
        <button
          onClick={(e) => {
            e.stopPropagation(); // 이벤트 버블링 방지
            onCloseClick(e);
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
      {isSubmitting ? (
        // 상태1: 간단한 별점 제출 UI (BigCandidate와 동일)
        <div className="relative z-10 p-4 h-full flex flex-col justify-center items-center pb-2">
          {/* bin 아이콘 - showBinIcon이 true일 때만 표시 */}
          {showBinIcon && (
            <button
              onClick={async (e) => {
                e.stopPropagation();
                // 즉시 별점 초기화
                if (onRatingReset) {
                  onRatingReset();
                }
                try {
                  await withdrawStar(episodeId);
                  if (onWithdrawComplete) {
                    onWithdrawComplete();
                  }
                } catch (error) {
                  console.error('별점 회수 실패:', error);
                }
              }}
              className="absolute -left-8 top-1/2 transform -translate-y-1/2 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/20 rounded transition-colors duration-200"
              aria-label="별점 회수"
            >
              <img 
                src="/icons/bin-icon.svg" 
                alt="별점 회수" 
                className="w-4 h-4"
              />
            </button>
          )}
          
          <div>
            <StarRatingSimple
              key={`star-${episodeId}-${currentRating}`}
              maxStars={5}
              initialRating={currentRating}
              size="md"
              withBackground={true}
              onRatingChange={onRatingChange}
            />
          </div>
          <div className="text-sm opacity-70 text-gray-200 mt-2">
            {voteInfo ? `${voteInfo.quarter}분기 ${voteInfo.week}주차 투표` : (
              <div className="animate-pulse">
                <div className="h-4 w-24 bg-gray-400/50 rounded"></div>
              </div>
            )}
          </div>
        </div>
      ) : isLoading ? (
        // 로딩 상태: 투표 처리 중
        <div className="relative z-10 p-4 h-full flex flex-col justify-center items-center">
          <div className="animate-spin mb-2">
            <img 
              src="/icons/star/star-Selected.svg" 
              alt="로딩 중" 
              className="w-6 h-6"
            />
          </div>
          <div className="text-white text-xs font-medium">
            투표 처리 중...
          </div>
        </div>
      ) : (
        // 상태2: 상세 정보 UI
        <StarDetailPopup
          currentRating={currentRating}
          averageRating={averageRating}
          participantCount={participantCount}
          distribution={distribution}
          onEditClick={onEditClick}
          onClose={onCloseClick}
        />
      )}
    </div>
  );
}
