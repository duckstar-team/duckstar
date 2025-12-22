'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import VoteStamp from './VoteStamp';
import VoteButton from './VoteButton';

interface VoteStatusProps {
  currentVotes: number;
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
}

export default function VoteStatus({
  currentVotes,
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
}: VoteStatusProps) {
  const bonusButtonRef = useRef<HTMLDivElement>(null);
  const bonusStampRef = useRef<HTMLDivElement>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // 활성 요소 찾기 (sticky 우선, 없으면 기본)
  const findActiveElement = useCallback(
    (selector: string, stickySelector: string) => {
      const sticky = document.querySelector(stickySelector);
      const default_ = document.querySelector(
        `${selector}:not(${stickySelector})`
      );
      return (sticky || default_) as HTMLElement | null;
    },
    []
  );

  // 위치 업데이트 함수들
  const updateBonusButtonPosition = useCallback(() => {
    if (bonusButtonRef.current && onBonusButtonPositionChange) {
      const rect = bonusButtonRef.current.getBoundingClientRect();
      onBonusButtonPositionChange({
        x: rect.left + rect.width / 2,
        y: rect.top,
      });
    }
  }, [onBonusButtonPositionChange]);

  const updateBonusStampPosition = useCallback(() => {
    if (bonusStampRef.current && onBonusStampPositionChange) {
      const rect = bonusStampRef.current.getBoundingClientRect();
      onBonusStampPositionChange({
        x: rect.left + rect.width / 2 - 50,
        y: rect.top,
      });
    }
  }, [onBonusStampPositionChange]);

  // 보너스 버튼 툴팁 위치 업데이트
  const updateTooltipPosition = useCallback(() => {
    const activeButton = findActiveElement(
      '[data-bonus-button]',
      '[data-vote-section-sticky] [data-bonus-button]'
    );
    if (activeButton) {
      const rect = activeButton.getBoundingClientRect();
      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 55,
      });
    }
  }, [findActiveElement]);

  // 보너스 버튼이 표시될 때 위치 업데이트
  useEffect(() => {
    if (hasReachedMaxVotes && !hasClickedBonus && !showGenderSelection) {
      const updatePosition = () => {
        updateBonusButtonPosition();
        updateTooltipPosition();
      };

      const timer = setTimeout(updatePosition, 50);
      window.addEventListener('scroll', updateTooltipPosition, {
        passive: true,
      });

      return () => {
        clearTimeout(timer);
        window.removeEventListener('scroll', updateTooltipPosition);
      };
    }
  }, [
    hasReachedMaxVotes,
    hasClickedBonus,
    showGenderSelection,
    updateBonusButtonPosition,
    updateTooltipPosition,
  ]);

  // 보너스 도장 위치 업데이트
  const updateStampPosition = useCallback(() => {
    const activeStamp = findActiveElement(
      '[data-bonus-stamp]',
      '[data-vote-section-sticky] [data-bonus-stamp]'
    );
    if (activeStamp) {
      const rect = activeStamp.getBoundingClientRect();
      onBonusStampPositionChange?.({
        x: rect.left + rect.width / 2 - 50,
        y: rect.top,
      });
    }
  }, [findActiveElement, onBonusStampPositionChange]);

  // 보너스 도장이 표시될 때 위치 업데이트
  useEffect(() => {
    if (isBonusMode && !showGenderSelection) {
      const updatePosition = () => {
        updateBonusStampPosition();
        updateStampPosition();
      };

      const timer = setTimeout(updatePosition, 50);
      window.addEventListener('scroll', updateStampPosition, { passive: true });

      return () => {
        clearTimeout(timer);
        window.removeEventListener('scroll', updateStampPosition);
      };
    }
  }, [
    isBonusMode,
    showGenderSelection,
    updateBonusStampPosition,
    updateStampPosition,
  ]);

  return (
    <div className="flex min-h-16 w-full flex-wrap items-center justify-center overflow-visible">
      {/* Vote Stamps and Buttons Container */}
      <div className="flex items-center justify-center gap-3">
        {/* Normal Vote Stamp */}
        <VoteStamp
          type="normal"
          currentVotes={currentVotes}
          showGenderSelection={showGenderSelection}
        />

        {/* Bonus Vote Stamp - 단순한 조건부 렌더링 */}
        {isBonusMode && !(showGenderSelection && bonusVotesUsed === 0) && (
          <div ref={bonusStampRef} data-bonus-stamp className="relative">
            <VoteStamp
              type="bonus"
              currentVotes={currentVotes}
              bonusVotesUsed={bonusVotesUsed}
            />
          </div>
        )}

        {/* Action Buttons */}
        {!showGenderSelection && (
          <>
            {hasReachedMaxVotes && !hasClickedBonus && (
              <div
                ref={bonusButtonRef}
                data-bonus-button
                data-max-votes-button
                className="relative"
              >
                <VoteButton
                  type="bonus"
                  onClick={onBonusClick}
                  disabled={isSubmitting}
                />
                {/* 보너스 버튼 툴팁 - Portal을 사용하여 document.body에 직접 렌더링 */}
                {typeof window !== 'undefined' &&
                  createPortal(
                    <AnimatePresence>
                      {showBonusTooltip &&
                        tooltipPosition.x > 0 &&
                        tooltipPosition.y > 0 && (
                          <div
                            className="pointer-events-none fixed z-[9999999]"
                            style={{
                              left: `${tooltipPosition.x}px`,
                              top: `${tooltipPosition.y}px`,
                              transform: 'translateX(-50%)',
                            }}
                          >
                            <motion.div
                              className="pointer-events-auto relative w-max"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{
                                duration: 0.8,
                                ease: 'easeOut',
                              }}
                            >
                              <img
                                src="/icons/textBalloon.svg"
                                alt="tooltip"
                                className="h-auto w-auto"
                                style={{
                                  filter:
                                    'drop-shadow(2px 2px 4px rgba(0,0,0,0.15))',
                                }}
                              />
                              <div className="absolute inset-0 flex -translate-y-0.5 items-center justify-center px-3 py-1 md:-translate-y-1 md:px-6 md:py-2">
                                <div className="text-center font-['Pretendard',_sans-serif] text-xs leading-[16px] font-normal whitespace-nowrap text-[#000000] md:text-base md:leading-[22px]">
                                  <span className="block md:hidden">
                                    더 투표할까요?
                                  </span>
                                  <span className="hidden md:inline">
                                    더 투표하고 싶으신가요?
                                  </span>
                                </div>
                              </div>
                            </motion.div>
                          </div>
                        )}
                    </AnimatePresence>,
                    document.body
                  )}
              </div>
            )}
              <VoteButton
                type="next"
                onClick={onNextClick}
                showError={showNextError}
              />
          </>
        )}
      </div>
    </div>
  );
}
