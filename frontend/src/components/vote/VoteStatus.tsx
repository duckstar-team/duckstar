'use client';

import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
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
  showBonusTooltip?: boolean;
  onBonusClick: () => void;
  onNextClick: () => void;
  onBonusAnimationComplete: (complete: boolean) => void;
  onBonusButtonPositionChange?: (position: { x: number; y: number }) => void;
  onBonusStampPositionChange?: (position: { x: number; y: number }) => void;
  onHideBonusTooltip?: () => void;
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
  showBonusTooltip = false,
  onBonusClick,
  onNextClick,
  onBonusAnimationComplete,
  onBonusButtonPositionChange,
  onBonusStampPositionChange,
  onHideBonusTooltip
}: VoteStatusProps) {
  const bonusButtonRef = useRef<HTMLDivElement>(null);
  const bonusStampRef = useRef<HTMLDivElement>(null);
  const [_bonusButtonPosition, setBonusButtonPosition] = useState({ x: 0, y: 0 });
  const [_bonusStampPosition, setBonusStampPosition] = useState({ x: 0, y: 0 });
  const [bonusAnimationComplete, setBonusAnimationComplete] = useState(false);

  // Track BONUS button position
  useEffect(() => {
    const updateBonusButtonPosition = () => {
      if (bonusButtonRef.current) {
        const rect = bonusButtonRef.current.getBoundingClientRect();
        const position = {
          x: rect.left + rect.width / 2,
          y: rect.top
        };
        setBonusButtonPosition(position);
        onBonusButtonPositionChange?.(position);
      }
    };

    // Initial position update
    updateBonusButtonPosition();
    
    // Continuous position tracking during animation
    let frameCount = 0;
    const maxFrames = 30; // Increased frames for better tracking
    
    const updatePosition = () => {
      updateBonusButtonPosition();
      frameCount++;
      
      if (frameCount < maxFrames) {
        requestAnimationFrame(updatePosition);
      }
    };
    
    requestAnimationFrame(updatePosition);

    // Add a delay to ensure animation is complete
    const timeoutId = setTimeout(() => {
      updateBonusButtonPosition();
    }, 600); // Match animation duration

    window.addEventListener('scroll', updateBonusButtonPosition);
    window.addEventListener('resize', updateBonusButtonPosition);

    return () => {
      window.removeEventListener('scroll', updateBonusButtonPosition);
      window.removeEventListener('resize', updateBonusButtonPosition);
      clearTimeout(timeoutId);
    };
  }, [hasReachedMaxVotes, hasClickedBonus, showGenderSelection, onBonusButtonPositionChange]);

  // Track bonus stamp position
  useEffect(() => {
    const updateBonusStampPosition = () => {
      if (bonusStampRef.current) {
        const rect = bonusStampRef.current.getBoundingClientRect();
        const position = {
          x: rect.left + 33.5,
          y: rect.top
        };
        setBonusStampPosition(position);
        onBonusStampPositionChange?.(position);
      }
    };

    if (bonusAnimationComplete) {
      updateBonusStampPosition();
    }

    window.addEventListener('scroll', updateBonusStampPosition);
    window.addEventListener('resize', updateBonusStampPosition);

    return () => {
      window.removeEventListener('scroll', updateBonusStampPosition);
      window.removeEventListener('resize', updateBonusStampPosition);
    };
  }, [isBonusMode, bonusAnimationComplete, showGenderSelection, onBonusStampPositionChange]);

  // Reset animation complete state when bonus mode is disabled
  useEffect(() => {
    if (!isBonusMode) {
      setBonusAnimationComplete(false);
      onBonusAnimationComplete(false);
    }
  }, [isBonusMode, onBonusAnimationComplete]);

  const handleBonusAnimationComplete = () => {
    setBonusAnimationComplete(true);
    onBonusAnimationComplete(true);
  };

  // Handle BONUS button animation complete
  const handleBonusButtonAnimationComplete = () => {
    // Update position after animation completes
    if (bonusButtonRef.current) {
      const rect = bonusButtonRef.current.getBoundingClientRect();
      const position = {
        x: rect.left + rect.width / 2,
        y: rect.top
      };
      setBonusButtonPosition(position);
      onBonusButtonPositionChange?.(position);
    }
  };

  const isNormalVoteActive = currentVotes >= maxVotes;

  return (
    <div className="flex flex-wrap items-center justify-center min-h-16 overflow-visible w-full">
      {/* Vote Stamps and Buttons Container */}
      <div className={`flex flex-wrap items-center justify-center min-h-16 overflow-visible ${showGenderSelection ? 'gap-6 lg:gap-12' : (isBonusMode ? 'gap-6 lg:gap-12' : 'gap-4 lg:gap-8')}`}>
        
        {/* Normal Vote Stamp */}
        <motion.div
          layout
        >
          <VoteStamp
            type="normal"
            isActive={isNormalVoteActive}
            currentVotes={currentVotes}
            maxVotes={maxVotes}
            showGenderSelection={showGenderSelection}
          />
        </motion.div>

        {/* Bonus Vote Stamp - Smooth Entrance Animation */}
        {isBonusMode && !(showGenderSelection && bonusVotesUsed === 0) && (
          <motion.div
            className="relative"
            layout
            initial={{ 
              opacity: 0, 
              scale: 0.8, 
              x: 50 
            }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              x: showGenderSelection ? 0 : 0
            }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30,
              duration: 0.6
            }}
            onAnimationComplete={handleBonusAnimationComplete}
          >
            <VoteStamp
              ref={bonusStampRef}
              type="bonus"
              isActive={true}
              currentVotes={currentVotes}
              maxVotes={maxVotes}
              bonusVotesUsed={bonusVotesUsed}
              showTooltip={showBonusTooltip && !showGenderSelection}
              onHideTooltip={onHideBonusTooltip}
            />
          </motion.div>
        )}

        {/* Action Buttons */}
        {hasReachedMaxVotes && !hasClickedBonus && !showGenderSelection ? (
          <>
            <motion.div
              ref={bonusButtonRef}
              className="relative"
              initial={{ 
                opacity: 0, 
                scale: 0.9, 
                x: 15,
                rotate: -2
              }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                x: 0,
                rotate: 0
              }}
              transition={{ 
                type: "spring", 
                stiffness: 400, 
                damping: 25,
                duration: 0.5
              }}
              whileHover={{ 
                scale: 1.05,
                rotate: 1,
                transition: { duration: 0.2 }
              }}
              onAnimationComplete={handleBonusButtonAnimationComplete}
            >
              <VoteButton
                type="bonus"
                onClick={onBonusClick}
              />
            </motion.div>
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
