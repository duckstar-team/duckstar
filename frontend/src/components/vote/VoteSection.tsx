'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import VoteStamp from './VoteStamp';
import VoteButton from './VoteButton';

// Inline SearchBar component with Figma-accurate spacing
function SearchBar({ 
  value, 
  onChange, 
  placeholder = "애니메이션 이름을 입력하세요" 
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex items-center gap-[16px] flex-1">
      {/* Search Icon */}
      <div className="w-[20px] h-[20px] flex-shrink-0">
        <Image
          src="/icons/voteSection-search.svg"
          alt="Search Icon"
          width={20}
          height={20}
          className="w-full h-full"
        />
      </div>
      
      {/* Search Input */}
      <div className="flex-1 max-w-[380px]">
        <div className="relative">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full h-[40px] px-[16px] py-[8px] bg-white border-b-2 border-[#990033] outline-none text-[14px] placeholder-gray-400"
          />
        </div>
      </div>
    </div>
  );
}

interface VoteSectionProps {
  currentVotes?: number;
  maxVotes?: number;
  bonusVotesUsed?: number;
  searchQuery?: string;
  gender?: 'male' | 'female';
  hasClickedBonus?: boolean;
  showGenderSelection?: boolean;
  selectedGender?: 'male' | 'female' | null;
  showVoteResult?: boolean;
  submissionDateTime?: string;
  showNextError?: boolean;
  onSearchQueryChange?: (query: string) => void;
  onNextClick?: () => void;
  onBonusClick?: () => void;
  onBackClick?: () => void;
  onGenderSelect?: (gender: 'male' | 'female') => void;
  onSubmitClick?: () => void;
  external?: boolean;
}

export default function VoteSection({
  currentVotes: externalCurrentVotes = 0,
  maxVotes: externalMaxVotes = 10,
  bonusVotesUsed: externalBonusVotesUsed = 0,
  searchQuery: externalSearchQuery = '',
  gender: externalGender = 'male',
  hasClickedBonus: externalHasClickedBonus = false,
  showGenderSelection: externalShowGenderSelection = false,
  selectedGender: externalSelectedGender = null,
  showVoteResult: externalShowVoteResult = false,
  submissionDateTime: externalSubmissionDateTime = "2025년 8월 21일 18:47",
  showNextError: externalShowNextError = false,
  onSearchQueryChange,
  onNextClick,
  onBonusClick,
  onBackClick,
  onGenderSelect,
  onSubmitClick,
  external = false
}: VoteSectionProps) {
  const router = useRouter();
  // Internal state for testing
  const [internalCurrentVotes, setInternalCurrentVotes] = useState(0);
  const [internalBonusVotesUsed, setInternalBonusVotesUsed] = useState(0);
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const [internalGender, setInternalGender] = useState<'male' | 'female'>('male');
  const [internalHasClickedBonus, setInternalHasClickedBonus] = useState(false);
  const [hasReachedMaxVotes, setHasReachedMaxVotes] = useState(false); // 한번 true가 되면 계속 유지
  const [showBonusTooltip, setShowBonusTooltip] = useState(true); // 보너스 도장 말풍선 표시 여부
  const [showGenderSelection, setShowGenderSelection] = useState(false); // 네 번째 상태: 성별 입력
  const [bonusButtonPosition, setBonusButtonPosition] = useState({ x: 0, y: 0 }); // BONUS 버튼 위치
  const [bonusStampPosition, setBonusStampPosition] = useState({ x: 0, y: 0 }); // 보너스 도장 위치
  const [bonusAnimationComplete, setBonusAnimationComplete] = useState(false); // 보너스 도장 애니메이션 완료 상태

  const bonusButtonRef = useRef<HTMLDivElement>(null); // BONUS 버튼 ref
  const bonusStampRef = useRef<HTMLDivElement>(null); // 보너스 도장 ref

  // Use external or internal state based on external prop
  const currentVotes = external ? externalCurrentVotes : internalCurrentVotes;
  const maxVotes = externalMaxVotes;
  const bonusVotesUsed = external ? externalBonusVotesUsed : internalBonusVotesUsed;
  const searchQuery = external ? externalSearchQuery : internalSearchQuery;
  const gender = external ? externalGender : internalGender;
  const hasClickedBonus = external ? externalHasClickedBonus : internalHasClickedBonus;
  const currentShowGenderSelection = external ? externalShowGenderSelection : showGenderSelection;
  const currentSelectedGender = external ? externalSelectedGender : internalGender;
  const currentShowNextError = externalShowNextError;

  // Check if max votes reached and update state permanently
  useEffect(() => {
    if (currentVotes >= maxVotes && !hasReachedMaxVotes) {
      setHasReachedMaxVotes(true);
    }
  }, [currentVotes, maxVotes, hasReachedMaxVotes]);

  // Track BONUS button position
  useEffect(() => {
    const updateBonusButtonPosition = () => {
      if (bonusButtonRef.current) {
        const rect = bonusButtonRef.current.getBoundingClientRect();
        // BONUS 버튼의 중앙 위치 계산 (버튼의 정확한 중앙)
        setBonusButtonPosition({
          x: rect.left + rect.width / 2,
          y: rect.top
        });
      }
    };

    // 즉시 계산
    updateBonusButtonPosition();
    
    // 연속된 프레임에서 위치 계산 (애니메이션 완료 보장)
    let frameCount = 0;
    const maxFrames = 10;
    
    const updatePosition = () => {
      updateBonusButtonPosition();
      frameCount++;
      
      if (frameCount < maxFrames) {
        requestAnimationFrame(updatePosition);
      }
    };
    
    requestAnimationFrame(updatePosition);

    // Update position on scroll and resize
    window.addEventListener('scroll', updateBonusButtonPosition);
    window.addEventListener('resize', updateBonusButtonPosition);

    return () => {
      window.removeEventListener('scroll', updateBonusButtonPosition);
      window.removeEventListener('resize', updateBonusButtonPosition);
    };
  }, [hasReachedMaxVotes, hasClickedBonus]);



  // Derived states
  const isBonusMode = hasClickedBonus;

  // Reset animation complete state when bonus mode is disabled
  useEffect(() => {
    if (!isBonusMode) {
      setBonusAnimationComplete(false);
    }
  }, [isBonusMode]);
  
  // 보너스 투표 카운트: 외부에서 전달된 값 사용
  const actualBonusVotesUsed = bonusVotesUsed;

  // Vote stamp states
  const isNormalVoteActive = currentVotes < maxVotes; // maxVotes 미만이면 빨강, 이상이면 회색

  // Track bonus stamp position
  useEffect(() => {
    const updateBonusStampPosition = () => {
      if (bonusStampRef.current) {
        const rect = bonusStampRef.current.getBoundingClientRect();
        // 실제 SVG 컨테이너의 중앙 위치 계산 (67px 고정 크기)
        setBonusStampPosition({
          x: rect.left + 33.5, // 67px / 2 = 33.5px
          y: rect.top
        });
      }
    };

    // 애니메이션 완료 후 위치 계산
    if (bonusAnimationComplete) {
      updateBonusStampPosition();
    }

    // Update position on scroll and resize
    window.addEventListener('scroll', updateBonusStampPosition);
    window.addEventListener('resize', updateBonusStampPosition);

    return () => {
      window.removeEventListener('scroll', updateBonusStampPosition);
      window.removeEventListener('resize', updateBonusStampPosition);
    };
  }, [isBonusMode, bonusAnimationComplete]);

  // Event handlers
  const handleSearchQueryChange = (query: string) => {
    if (external && onSearchQueryChange) {
      onSearchQueryChange(query);
    } else {
      setInternalSearchQuery(query);
    }
  };

  const handleNextClick = () => {
    if (external && onNextClick) {
      onNextClick();
    } else {
      // 모든 상태에서 NEXT 클릭 시 네 번째 상태로 전환
      setShowGenderSelection(true);
    }
  };

  const handleBackClick = () => {
    if (external && onBackClick) {
      onBackClick();
    } else {
      setShowGenderSelection(false);
    }
  };

  const handleBonusClick = () => {
    if (external && onBonusClick) {
      onBonusClick();
    } else {
      setInternalHasClickedBonus(true);
    }
  };

  const handleSubmitClick = () => {
    if (external && onSubmitClick) {
      onSubmitClick();
    } else {
      // 새로운 투표 결과 페이지로 이동
      const currentDateTime = new Date().toLocaleString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      const params = new URLSearchParams({
        normalVotes: currentVotes.toString(),
        bonusVotes: actualBonusVotesUsed.toString(),
        submissionDateTime: currentDateTime
      });
      
      router.push(`/vote-result?${params.toString()}`);
    }
  };

  const handleGenderSelect = (gender: 'male' | 'female') => {
    if (external && onGenderSelect) {
      onGenderSelect(gender);
    } else {
      setInternalGender(gender);
    }
  };

  return (
    <>


      {/* 말풍선들을 Portal을 통해 최상위 레이어에 배치 */}
      {typeof window !== 'undefined' && isBonusMode && !currentShowGenderSelection && showBonusTooltip && bonusAnimationComplete && bonusStampPosition.x > 0 && createPortal(
        <div 
          className="fixed z-[99999] pointer-events-none"
          style={{
            left: `${bonusStampPosition.x}px`,
            top: `${bonusStampPosition.y - 55}px`,
            transform: 'translateX(-50%)'
          }}
        >
            <div className="relative w-max pointer-events-auto">
                        <img
                          src="/icons/textBalloon-long.svg"
                          alt="Text Balloon Long"
                          height={55}
                          className="w-auto h-auto"
                          style={{
                            filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.15))'
                          }}
                        />
                        
                        {/* Text overlay */}
                        <div className="absolute inset-0 flex items-center justify-center px-6 py-2 -translate-y-1">
                          <div className="flex flex-col font-['Pretendard',_sans-serif] font-normal justify-center text-[#000000] text-base">
                            <p className="leading-[22px] whitespace-pre">보너스 표는 2개가 모여야 일반 표 1개와 같습니다.</p>
                          </div>
                        </div>
                        
                        {/* Hide notification button */}
                        <div className="absolute top-1 right-1">
                                                     <motion.button
                             className="w-4 h-4 flex items-center justify-center cursor-pointer"
                             whileHover={{ scale: 1.1 }}
                             whileTap={{ scale: 0.9 }}
                             onClick={() => {
                               setShowBonusTooltip(false);
                             }}
                           >
                            <Image
                              src="/icons/voteSection-notify-hide.svg"
                              alt="Hide Notification"
                              width={16}
                              height={16}
                              className="w-full h-full"
                            />
                          </motion.button>
                        </div>
                      </div>
        </div>,
        document.body
      )}

      {typeof window !== 'undefined' && hasReachedMaxVotes && !hasClickedBonus && bonusButtonPosition.x > 0 && createPortal(
        <div 
          className="fixed z-[99999] pointer-events-none"
          style={{
            left: `${bonusButtonPosition.x}px`,
            top: `${bonusButtonPosition.y - 55}px`,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="relative w-max pointer-events-auto">
            <img
              src="/icons/textBalloon.svg"
              alt="Text Balloon"
              className="w-auto h-auto"
              style={{
                filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.15))'
              }}
            />
            
            {/* Text overlay */}
            <div className="absolute inset-0 flex items-center justify-center px-8 py-3 -translate-y-1">
              <div className="flex flex-col font-['Pretendard',_sans-serif] font-normal justify-center text-[#000000] text-base">
                <p className="leading-[22px] whitespace-pre">더 투표하고 싶으신가요?</p>
              </div>
            </div>
                    </div>
        </div>,
        document.body
      )}

      <div className="w-full flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-16">
        {/* Search Bar Section - Hidden in Gender Selection */}
        {!currentShowGenderSelection && (
          <SearchBar
            value={searchQuery}
            onChange={handleSearchQueryChange}
          />
        )}

        {/* Vote Status and Buttons Section - Fixed height for consistent layout */}
        <div className={`flex items-center h-16 overflow-visible ${currentShowGenderSelection ? 'justify-start' : 'gap-4 lg:gap-8'}`}>
          
          {/* Vote Stamps and Buttons Container - Simple flex layout with fixed height */}
          <div className={`flex items-center h-16 overflow-visible ${currentShowGenderSelection ? 'gap-4 lg:gap-8' : (isBonusMode ? 'gap-6 lg:gap-12' : 'gap-4 lg:gap-8')}`}>
          
            {/* Normal Vote Stamp with Slide Animation */}
            <motion.div
              layout
              initial={{ x: 0 }}
              animate={{ 
                x: currentShowGenderSelection ? 0 : (isBonusMode ? -20 : 0)
              }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 30,
                duration: 0.5
              }}
            >
              <VoteStamp
                type="normal"
                isActive={isNormalVoteActive}
                currentVotes={currentVotes}
                maxVotes={maxVotes}
              />
            </motion.div>

            {/* Bonus Vote Stamp - Smooth Entrance Animation */}
            {isBonusMode && (
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
                  x: currentShowGenderSelection ? 0 : 0
                }}
                transition={{ 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 30,
                  duration: 0.6
                }}
                onAnimationComplete={() => setBonusAnimationComplete(true)}
              >
                  <VoteStamp
                    ref={bonusStampRef}
                    type="bonus"
                    isActive={true}
                    currentVotes={currentVotes}
                    maxVotes={maxVotes}
                    bonusVotesUsed={actualBonusVotesUsed}
                  />
                </motion.div>
              )}

              {/* Action Buttons */}
                          {hasReachedMaxVotes && !hasClickedBonus && !currentShowGenderSelection ? (
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
                  >
                    <VoteButton
                      type="bonus"
                      onClick={handleBonusClick}
                    />
                  </motion.div>
                  <div className="relative">
                    <VoteButton
                      type="next"
                      onClick={handleNextClick}
                      showError={currentShowNextError}
                    />
                    {/* NEXT 버튼 에러 메시지 - 버튼 아래에 표시 */}
                    {currentShowNextError && (
                      <div className="absolute top-full right-0 mt-2 bg-white px-2 text-xs font-medium text-[#990033] transition-opacity duration-3000 ease-in-out z-10 whitespace-nowrap">
                        일반 투표를 1개 이상 선택해주세요.
                      </div>
                    )}
                  </div>
                </>
              ) : (
              !currentShowGenderSelection && (
                <div className="relative">
                  <VoteButton
                    type="next"
                    onClick={handleNextClick}
                    showError={currentShowNextError}
                  />
                  {/* NEXT 버튼 에러 메시지 - 버튼 아래에 표시 */}
                  {currentShowNextError && (
                    <div className="absolute top-full -right-4 -y-2 mt-2 bg-white px-2 text-xs font-medium text-[#990033] transition-opacity duration-3000 ease-in-out z-10 whitespace-nowrap">
                      일반 투표를 1개 이상 선택해주세요.
                    </div>
                  )}
                </div>
              )
              )}
            </div>
          </div>

        {/* Gender Selection UI - Fourth State - Independent Container */}
        {currentShowGenderSelection && (
          <div className="flex items-center gap-4 lg:gap-8">
            {/* Gender Selection Toggles */}
            <div className="content-stretch flex gap-8 items-center justify-center relative shrink-0">
              {/* Male Toggle */}
              <div className="content-stretch flex gap-1 items-center justify-start overflow-clip relative shrink-0">
                <div className="flex flex-col font-['Pretendard:SemiBold',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#000000] text-[24px] text-nowrap">
                  <p className="leading-[normal] whitespace-pre">남성</p>
                </div>
                <button 
                  className="block cursor-pointer overflow-visible relative shrink-0 size-[22px]"
                  onClick={() => handleGenderSelect('male')}
                >
                  <Image
                    src={currentSelectedGender === 'male' ? "/icons/voteSection-selected.svg" : "/icons/voteSection-default.svg"}
                    alt={currentSelectedGender === 'male' ? "Male Selected" : "Male Default"}
                    width={22}
                    height={22}
                    className="w-full h-full"
                  />
                </button>
              </div>
              
              {/* Female Toggle */}
              <div className="content-stretch flex gap-1 items-center justify-start overflow-clip relative shrink-0">
                <div className="flex flex-col font-['Pretendard:SemiBold',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#000000] text-[24px] text-nowrap">
                  <p className="leading-[normal] whitespace-pre">여성</p>
                </div>
                <button 
                  className="block cursor-pointer overflow-visible relative shrink-0 size-[22px]"
                  onClick={() => handleGenderSelect('female')}
                >
                  <Image
                    src={currentSelectedGender === 'female' ? "/icons/voteSection-selected.svg" : "/icons/voteSection-default.svg"}
                    alt={currentSelectedGender === 'female' ? "Female Selected" : "Female Default"}
                    width={22}
                    height={22}
                    className="w-full h-full"
                  />
                </button>
              </div>
            </div>
            
            {/* BACK Button */}
            <button
              className="bg-gradient-to-r box-border content-stretch cursor-pointer flex from-[#adb5bd] gap-2.5 items-start justify-start overflow-visible pl-2.5 pr-3 py-2.5 relative rounded-lg shrink-0 to-[#868e96]"
              onClick={handleBackClick}
            >
              <div className="flex flex-col font-['Pretendard',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#ffffff] text-[16px] text-nowrap">
                <p className="leading-[normal] whitespace-pre">BACK</p>
              </div>
            </button>
            
            {/* Submit Button */}
            <button
              className={`box-border content-stretch flex gap-2.5 items-start justify-start pl-2.5 pr-3 py-2.5 relative rounded-lg shrink-0 ${
                currentSelectedGender 
                  ? 'bg-gradient-to-r from-[#cb285e] to-[#9c1f49] cursor-pointer' 
                  : 'bg-gradient-to-r from-[#adb5bd] to-[#868e96] opacity-80 cursor-default'
              }`}
              onClick={currentSelectedGender ? handleSubmitClick : undefined}
            >
              <div className="flex flex-col font-['Pretendard',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#ffffff] text-[16px] text-nowrap">
                <p className="leading-[normal] whitespace-pre">제출하기</p>
              </div>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
