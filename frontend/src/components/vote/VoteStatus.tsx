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
          y: rect.top + window.scrollY // 문서 기준 절대 좌표로 변환
        };
        setBonusButtonPosition(position);
        onBonusButtonPositionChange?.(position);
      }
    };

    // 즉시 위치 업데이트 (렌더링 직후)
    updateBonusButtonPosition();
    
    // 추가 위치 업데이트 (애니메이션 진행에 따라)
    const timeouts = [
      setTimeout(() => updateBonusButtonPosition(), 16), // 1프레임 후
      setTimeout(() => updateBonusButtonPosition(), 50), // 애니메이션 중간
      setTimeout(() => updateBonusButtonPosition(), 100), // 애니메이션 거의 완료
      setTimeout(() => updateBonusButtonPosition(), 200), // 애니메이션 완료 후
    ];

    // 근본적인 해결책 1: Intersection Observer로 위치 추적
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            updateBonusButtonPosition();
          }
        });
      },
      { 
        threshold: 0,
        rootMargin: '0px'
      }
    );

    // 보너스 버튼이 렌더링되면 관찰 시작
    if (bonusButtonRef.current) {
      observer.observe(bonusButtonRef.current);
    }

    // 근본적인 해결책 2: 여러 요소에 스크롤 이벤트 등록
    const handleScroll = () => {
      updateBonusButtonPosition();
    };
    
    // 1. window에 등록
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', updateBonusButtonPosition);
    
    // 2. document에 등록
    document.addEventListener('scroll', handleScroll, { passive: true });
    
    // 3. document.body에 등록
    document.body.addEventListener('scroll', handleScroll, { passive: true });
    
    // 4. document.documentElement에 등록
    document.documentElement.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      // 모든 timeout 정리
      timeouts.forEach(timeout => clearTimeout(timeout));
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateBonusButtonPosition);
      document.removeEventListener('scroll', handleScroll);
      document.body.removeEventListener('scroll', handleScroll);
      document.documentElement.removeEventListener('scroll', handleScroll);
    };
  }, [hasReachedMaxVotes, hasClickedBonus, showGenderSelection, onBonusButtonPositionChange]); // 보너스 버튼 렌더링 상태를 의존성에 추가

  // Track bonus stamp position
  useEffect(() => {
    const updateBonusStampPosition = () => {
      if (bonusStampRef.current) {
        const rect = bonusStampRef.current.getBoundingClientRect();
        const position = {
          x: rect.left + 33.5,
          y: rect.top + window.scrollY // 문서 기준 절대 좌표로 변환
        };
        setBonusStampPosition(position);
        onBonusStampPositionChange?.(position);
      }
    };

    // 즉시 위치 업데이트 (렌더링 직후)
    updateBonusStampPosition();
    
    // 추가 위치 업데이트 (애니메이션 진행에 따라)
    const timeouts = [
      setTimeout(() => updateBonusStampPosition(), 16), // 1프레임 후
      setTimeout(() => updateBonusStampPosition(), 50), // 애니메이션 중간
      setTimeout(() => updateBonusStampPosition(), 100), // 애니메이션 거의 완료
      setTimeout(() => updateBonusStampPosition(), 200), // 애니메이션 완료 후
    ];

    // 근본적인 해결책 1: Intersection Observer로 위치 추적
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            updateBonusStampPosition();
          }
        });
      },
      { 
        threshold: 0,
        rootMargin: '0px'
      }
    );

    // 보너스 스탬프가 렌더링되면 관찰 시작
    if (bonusStampRef.current) {
      observer.observe(bonusStampRef.current);
    }

    // 근본적인 해결책 2: 여러 요소에 스크롤 이벤트 등록
    const handleScroll = () => {
      updateBonusStampPosition();
    };
    
    // 1. window에 등록
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', updateBonusStampPosition);
    
    // 2. document에 등록
    document.addEventListener('scroll', handleScroll, { passive: true });
    
    // 3. document.body에 등록
    document.body.addEventListener('scroll', handleScroll, { passive: true });
    
    // 4. document.documentElement에 등록
    document.documentElement.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      // 모든 timeout 정리
      timeouts.forEach(timeout => clearTimeout(timeout));
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateBonusStampPosition);
      document.removeEventListener('scroll', handleScroll);
      document.body.removeEventListener('scroll', handleScroll);
      document.documentElement.removeEventListener('scroll', handleScroll);
    };
  }, [isBonusMode, bonusAnimationComplete, showGenderSelection, onBonusStampPositionChange]); // 보너스 스탬프 렌더링 상태를 의존성에 추가

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
        y: rect.top + window.scrollY // 문서 기준 절대 좌표로 변환
      };
      setBonusButtonPosition(position);
      onBonusButtonPositionChange?.(position);
    }
  };

  const isNormalVoteActive = currentVotes >= maxVotes;

  return (
    <div className="flex flex-wrap items-center justify-center min-h-16 overflow-visible w-full">
      {/* Vote Stamps and Buttons Container */}
      <div className={`flex flex-wrap items-center justify-center min-h-16 overflow-visible ${showGenderSelection ? 'gap-4 sm:gap-6 lg:gap-12' : (isBonusMode ? 'gap-4 sm:gap-6 lg:gap-12' : 'gap-3 sm:gap-4 lg:gap-8')}`}>
        
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
