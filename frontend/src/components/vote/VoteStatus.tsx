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
  showBonusTooltip = false,
  onBonusClick,
  onNextClick,
  onBonusAnimationComplete,
  onBonusButtonPositionChange,
  onBonusStampPositionChange,
  onHideBonusTooltip,
  weekDto = null
}: VoteStatusProps) {
  const bonusButtonRef = useRef<HTMLDivElement>(null);
  const bonusStampRef = useRef<HTMLDivElement>(null);
  const [_bonusButtonPosition, setBonusButtonPosition] = useState({ x: 0, y: 0 });
  const [_bonusStampPosition, setBonusStampPosition] = useState({ x: 0, y: 0 });
  const [bonusAnimationComplete, setBonusAnimationComplete] = useState(false);
  
  // 실시간 추적 상태 관리
  const [isTrackingButton, setIsTrackingButton] = useState(false);
  const [isTrackingStamp, setIsTrackingStamp] = useState(false);
  const buttonTrackingRef = useRef<number | undefined>(undefined);
  const stampTrackingRef = useRef<number | undefined>(undefined);

  // 실시간 보너스 버튼 위치 추적 함수
  const startButtonTracking = () => {
    if (buttonTrackingRef.current) return; // 이미 추적 중이면 중복 방지
    
    const track = () => {
      if (bonusButtonRef.current) {
        const rect = bonusButtonRef.current.getBoundingClientRect();
        const position = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2 // 스크롤에 독립적인 상대 위치 사용
        };
        setBonusButtonPosition(position);
        onBonusButtonPositionChange?.(position);
      }
      buttonTrackingRef.current = requestAnimationFrame(track);
    };
    
    track();
    setIsTrackingButton(true);
  };

  const stopButtonTracking = () => {
    if (buttonTrackingRef.current) {
      cancelAnimationFrame(buttonTrackingRef.current);
      buttonTrackingRef.current = undefined;
    }
    setIsTrackingButton(false);
  };

  // 보너스 버튼 실시간 추적
  useEffect(() => {
    const updateBonusButtonPosition = () => {
      if (bonusButtonRef.current) {
        const rect = bonusButtonRef.current.getBoundingClientRect();
        const position = {
          x: rect.left + rect.width / 2,
          y: rect.top + window.scrollY
        };
        setBonusButtonPosition(position);
        onBonusButtonPositionChange?.(position);
      }
    };

    // 즉시 위치 업데이트
    updateBonusButtonPosition();
    
    // 실시간 추적 시작
    startButtonTracking();

    return () => {
      stopButtonTracking();
    };
  }, [hasReachedMaxVotes, hasClickedBonus, showGenderSelection, onBonusButtonPositionChange]);

  // 실시간 보너스 도장 위치 추적 함수
  const startStampTracking = () => {
    if (stampTrackingRef.current) return; // 이미 추적 중이면 중복 방지
    
    const track = () => {
      if (bonusStampRef.current) {
        const rect = bonusStampRef.current.getBoundingClientRect();
        const position = {
          x: rect.left + 33.5,
          y: rect.top + rect.height / 2 // 스크롤에 독립적인 상대 위치 사용
        };
        setBonusStampPosition(position);
        onBonusStampPositionChange?.(position);
      }
      stampTrackingRef.current = requestAnimationFrame(track);
    };
    
    track();
    setIsTrackingStamp(true);
  };

  const stopStampTracking = () => {
    if (stampTrackingRef.current) {
      cancelAnimationFrame(stampTrackingRef.current);
      stampTrackingRef.current = undefined;
    }
    setIsTrackingStamp(false);
  };

  // 보너스 도장 실시간 추적
  useEffect(() => {
    const updateBonusStampPosition = () => {
      if (bonusStampRef.current) {
        const rect = bonusStampRef.current.getBoundingClientRect();
        const position = {
          x: rect.left + 33.5,
          y: rect.top + rect.height / 2 // 스크롤에 독립적인 상대 위치 사용
        };
        setBonusStampPosition(position);
        onBonusStampPositionChange?.(position);
      }
    };

    // 즉시 위치 업데이트
    updateBonusStampPosition();
    
    // 실시간 추적 시작
    startStampTracking();

    return () => {
      stopStampTracking();
    };
  }, [isBonusMode, bonusAnimationComplete, showGenderSelection, onBonusStampPositionChange]); // 보너스 스탬프 렌더링 상태를 의존성에 추가

  // 스크롤 이벤트로 실시간 추적 강화
  useEffect(() => {
    const handleScroll = () => {
      if (isTrackingButton && bonusButtonRef.current) {
        const rect = bonusButtonRef.current.getBoundingClientRect();
        const position = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2 // 스크롤에 독립적인 상대 위치 사용
        };
        setBonusButtonPosition(position);
        onBonusButtonPositionChange?.(position);
      }
      
      if (isTrackingStamp && bonusStampRef.current) {
        const rect = bonusStampRef.current.getBoundingClientRect();
        const position = {
          x: rect.left + 33.5,
          y: rect.top + rect.height / 2 // 스크롤에 독립적인 상대 위치 사용
        };
        setBonusStampPosition(position);
        onBonusStampPositionChange?.(position);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isTrackingButton, isTrackingStamp, onBonusButtonPositionChange, onBonusStampPositionChange]);

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
            weekDto={weekDto}
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
              weekDto={weekDto}
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
