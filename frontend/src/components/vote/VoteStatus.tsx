'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import VoteStamp from './VoteStamp';
import VoteButton from './VoteButton';

interface VoteStatusProps {
  currentVotes: number;
  maxVotes: number;
  bonusVotesUsed: number;
  isBonusMode: boolean;
  hasReachedMaxVotes: boolean;
  hasClickedBonus: boolean;
  showGenderSelection: boolean;
  showNextError: boolean;
  isSubmitting?: boolean;
  onBonusClick: () => void;
  onNextClick: () => void;
  onBonusButtonPositionChange?: (position: { x: number; y: number }) => void;
  onBonusStampPositionChange?: (position: { x: number; y: number }) => void;
  showBonusTooltip?: boolean;
  onTooltipHide?: () => void;
  weekDto?: { year: number; startDate: string } | null;
}

export default function VoteStatus({
  currentVotes,
  maxVotes,
  bonusVotesUsed,
  isBonusMode,
  hasReachedMaxVotes,
  hasClickedBonus,
  showGenderSelection,
  showNextError,
  isSubmitting = false,
  onBonusClick,
  onNextClick,
  onBonusButtonPositionChange,
  onBonusStampPositionChange,
  showBonusTooltip = false,
  onTooltipHide,
  weekDto = null
}: VoteStatusProps) {
  const bonusButtonRef = useRef<HTMLDivElement>(null);
  const bonusStampRef = useRef<HTMLDivElement>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // 위치 업데이트 함수들
  const updateBonusButtonPosition = useCallback(() => {
    if (bonusButtonRef.current && onBonusButtonPositionChange) {
      const rect = bonusButtonRef.current.getBoundingClientRect();
      const position = {
        x: rect.left + rect.width / 2,  // 버튼 중앙
        y: rect.top  // 버튼 위쪽 (스크롤 고려하지 않음)
      };
      onBonusButtonPositionChange(position);
    }
  }, [onBonusButtonPositionChange]);

  // 외부에서 위치 업데이트를 받을 때 툴팁 위치도 업데이트
  useEffect(() => {
    if (onBonusButtonPositionChange) {
      const handlePositionUpdate = (position: { x: number; y: number }) => {
        setTooltipPosition({
          x: position.x,
          y: position.y - 80
        });
      };
      
      // 위치 변경 이벤트 리스너 등록 (실제로는 props로 전달받은 함수 사용)
      // 이 부분은 VoteSection에서 handleBonusButtonPositionChange를 통해 처리됨
    }
  }, [onBonusButtonPositionChange]);

  const updateBonusStampPosition = useCallback(() => {
    if (bonusStampRef.current && onBonusStampPositionChange) {
      const rect = bonusStampRef.current.getBoundingClientRect();
      const position = {
        x: rect.left + rect.width / 2,  // 도장 중앙
        y: rect.top  // 도장 위쪽
      };
      onBonusStampPositionChange(position);
    }
  }, [onBonusStampPositionChange]);

  // 보너스 버튼이 표시될 때 위치 업데이트
  useEffect(() => {
    if (hasReachedMaxVotes && !hasClickedBonus && !showGenderSelection) {
      const updatePosition = () => {
        updateBonusButtonPosition();
        // 현재 활성화된 보너스 버튼 찾기 (스티키 또는 기본)
        const stickyButton = document.querySelector('[data-vote-section-sticky] [data-bonus-button]');
        const defaultButton = document.querySelector('[data-bonus-button]:not([data-vote-section-sticky] [data-bonus-button])');
        
        const activeButton = stickyButton || defaultButton;
        if (activeButton) {
          const rect = activeButton.getBoundingClientRect();
          setTooltipPosition({
            x: rect.left + rect.width / 2,
            y: rect.top - 55
          });
        }
      };

      const timer = setTimeout(updatePosition, 50);
      
      // 스크롤 이벤트로 실시간 위치 업데이트
      const handleScroll = () => {
        const stickyButton = document.querySelector('[data-vote-section-sticky] [data-bonus-button]');
        const defaultButton = document.querySelector('[data-bonus-button]:not([data-vote-section-sticky] [data-bonus-button])');
        
        const activeButton = stickyButton || defaultButton;
        if (activeButton) {
          const rect = activeButton.getBoundingClientRect();
          setTooltipPosition({
            x: rect.left + rect.width / 2,
            y: rect.top - 55
          });
        }
      };

      window.addEventListener('scroll', handleScroll, { passive: true });
      
      return () => {
        clearTimeout(timer);
        window.removeEventListener('scroll', handleScroll);
      };
    }
  }, [hasReachedMaxVotes, hasClickedBonus, showGenderSelection, updateBonusButtonPosition]);

  // 보너스 도장이 표시될 때 위치 업데이트
  useEffect(() => {
    if (isBonusMode && !showGenderSelection) {
      const updateStampPosition = () => {
        updateBonusStampPosition();
        // 현재 활성화된 보너스 도장 찾기 (스티키 또는 기본)
        const stickyStamp = document.querySelector('[data-vote-section-sticky] [data-bonus-stamp]');
        const defaultStamp = document.querySelector('[data-bonus-stamp]:not([data-vote-section-sticky] [data-bonus-stamp])');
        
        const activeStamp = stickyStamp || defaultStamp;
        if (activeStamp) {
          const rect = activeStamp.getBoundingClientRect();
          const position = {
            x: rect.left + rect.width / 2 - 50, // 왼쪽으로 오프셋
            y: rect.top
          };
          onBonusStampPositionChange?.(position);
        }
      };

      const timer = setTimeout(updateStampPosition, 50);
      
      // 스크롤 이벤트로 실시간 위치 업데이트
      const handleScroll = () => {
        const stickyStamp = document.querySelector('[data-vote-section-sticky] [data-bonus-stamp]');
        const defaultStamp = document.querySelector('[data-bonus-stamp]:not([data-vote-section-sticky] [data-bonus-stamp])');
        
        const activeStamp = stickyStamp || defaultStamp;
        if (activeStamp) {
          const rect = activeStamp.getBoundingClientRect();
          const position = {
            x: rect.left + rect.width / 2 - 50, // 왼쪽으로 오프셋
            y: rect.top
          };
          onBonusStampPositionChange?.(position);
        }
      };

      window.addEventListener('scroll', handleScroll, { passive: true });
      
      return () => {
        clearTimeout(timer);
        window.removeEventListener('scroll', handleScroll);
      };
    }
  }, [isBonusMode, showGenderSelection, updateBonusStampPosition, onBonusStampPositionChange]);


  // 등장 시점에만 위치 계산 (스크롤 추적 제거)
  // 툴팁이 등장할 때 딱 한 번만 위치를 계산하여 성능 최적화

  const isNormalVoteActive = currentVotes >= maxVotes;

  return (
    <div className="flex flex-wrap items-center justify-center min-h-16 overflow-visible w-full">
      {/* Vote Stamps and Buttons Container */}
      <div className={`flex flex-wrap items-center justify-center min-h-16 overflow-visible ${
        showGenderSelection 
          ? 'gap-4 sm:gap-6 lg:gap-12' 
          : isBonusMode 
            ? 'gap-4 sm:gap-6 lg:gap-12' 
            : 'gap-3 sm:gap-4 lg:gap-8'
      }`}>
        
        {/* Normal Vote Stamp */}
        <VoteStamp
          type="normal"
          isActive={isNormalVoteActive}
          currentVotes={currentVotes}
          maxVotes={maxVotes}
          showGenderSelection={showGenderSelection}
          weekDto={weekDto}
        />

        {/* Bonus Vote Stamp - 단순한 조건부 렌더링 */}
        {isBonusMode && !(showGenderSelection && bonusVotesUsed === 0) && (
          <div ref={bonusStampRef} data-bonus-stamp className="relative">
            <VoteStamp
              type="bonus"
              isActive={true}
              currentVotes={currentVotes}
              maxVotes={maxVotes}
              bonusVotesUsed={bonusVotesUsed}
              weekDto={weekDto}
            />
          </div>
        )}

        {/* Action Buttons */}
        {hasReachedMaxVotes && !hasClickedBonus && !showGenderSelection ? (
          <>
            <div ref={bonusButtonRef} data-bonus-button data-max-votes-button className="relative">
              <VoteButton
                type="bonus"
                onClick={onBonusClick}
                disabled={isSubmitting}
              />
              {/* 보너스 버튼 툴팁 - Portal을 사용하여 document.body에 직접 렌더링 */}
              {typeof window !== 'undefined' && createPortal(
                <AnimatePresence>
                  {showBonusTooltip && tooltipPosition.x > 0 && tooltipPosition.y > 0 && (
                    <div 
                      className="fixed pointer-events-none z-[9999999]"
                      style={{
                        left: `${tooltipPosition.x}px`,
                        top: `${tooltipPosition.y}px`,
                        transform: 'translateX(-50%)'
                      }}
                    >
                      <motion.div 
                        className="relative w-max pointer-events-auto"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ 
                          duration: 0.8,
                          ease: "easeOut"
                        }}
                      >
                        <img 
                          src="/icons/textBalloon.svg" 
                          alt="tooltip" 
                          className="w-auto h-auto"
                          style={{ filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.15))' }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center px-3 py-1 -translate-y-0.5 md:px-6 md:py-2 md:-translate-y-1">
                          <div className="font-['Pretendard',_sans-serif] font-normal text-center text-[#000000] text-xs md:text-base leading-[16px] md:leading-[22px] whitespace-nowrap">
                            <span className="block md:hidden">더 투표할까요?</span>
                            <span className="hidden md:inline">더 투표하고 싶으신가요?</span>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>,
                document.body
              )}
            </div>
            <div className="relative hidden lg:block">
              <VoteButton
                type="next"
                onClick={onNextClick}
                showError={showNextError}
              />
              {/* NEXT 버튼 에러 메시지 */}
              {showNextError && (
                <div className="absolute top-full -right-4 -y-2 mt-2 bg-white px-2 text-xs font-medium text-[#990033] transition-opacity duration-3000 ease-in-out z-10 whitespace-nowrap">
                  일반 투표를 1개 이상 선택해주세요.
                </div>
              )}
            </div>
          </>
        ) : (
          !showGenderSelection && (
            <div className="relative hidden lg:block">
              <VoteButton
                type="next"
                onClick={onNextClick}
                showError={showNextError}
              />
              {/* NEXT 버튼 에러 메시지 */}
              {showNextError && (
                <div className="absolute top-full -right-4 -y-2 mt-2 bg-white px-2 text-xs font-medium text-[#990033] transition-opacity duration-3000 ease-in-out z-10 whitespace-nowrap">
                  일반 투표를 1개 이상 선택해주세요.
                </div>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}