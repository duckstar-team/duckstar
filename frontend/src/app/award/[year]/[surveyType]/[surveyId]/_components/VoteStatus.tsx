'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import VoteStamp from './VoteStamp';
import VoteButton from './VoteButton';
import TooltipBtn from '@/components/common/TooltipBtn';

interface VoteStatusProps {
  currentVotes: number;
  bonusVotesUsed: number;
  isBonusMode: boolean;
  hasReachedMaxVotes: boolean;
  hasClickedBonus: boolean;
  showGenderSelection: boolean;
  isSubmitting?: boolean;
  onBonusClick: () => void;
  onBonusButtonPositionChange?: (position: { x: number; y: number }) => void;
  onBonusStampPositionChange?: (position: { x: number; y: number }) => void;
}

export default function VoteStatus({
  currentVotes,
  bonusVotesUsed,
  isBonusMode,
  hasReachedMaxVotes,
  hasClickedBonus,
  showGenderSelection,
  isSubmitting = false,
  onBonusClick,
  onBonusButtonPositionChange,
  onBonusStampPositionChange,
}: VoteStatusProps) {
  const bonusButtonRef = useRef<HTMLDivElement>(null);
  const bonusStampRef = useRef<HTMLDivElement>(null);

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
      <div className="flex max-[425px]:flex-col items-center justify-center gap-8 max-[425px]:gap-4">
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
                <TooltipBtn
                  text="더 투표하고 싶으신가요?"
                  defaultIsOpen={hasReachedMaxVotes}
                  isOpen={hasReachedMaxVotes}
                  variant="light"
                  placement="bottom"
                >
                  <VoteButton
                    type="bonus"
                    onClick={onBonusClick}
                    disabled={isSubmitting}
                  />
                </TooltipBtn>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
