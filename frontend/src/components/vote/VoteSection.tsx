'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
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
  onSearchQueryChange?: (query: string) => void;
  onNextClick?: () => void;
  onBonusClick?: () => void;
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
  onSearchQueryChange,
  onNextClick,
  onBonusClick,
  onSubmitClick,
  external = false
}: VoteSectionProps) {
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
  const bonusButtonRef = useRef<HTMLDivElement>(null); // BONUS 버튼 ref

  // Use external or internal state based on external prop
  const currentVotes = external ? externalCurrentVotes : internalCurrentVotes;
  const maxVotes = externalMaxVotes;
  const bonusVotesUsed = external ? externalBonusVotesUsed : internalBonusVotesUsed;
  const searchQuery = external ? externalSearchQuery : internalSearchQuery;
  const gender = external ? externalGender : internalGender;
  const hasClickedBonus = external ? externalHasClickedBonus : internalHasClickedBonus;

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
        setBonusButtonPosition({
          x: rect.left + rect.width / 2,
          y: rect.top
        });
      }
    };

    // Initial position
    updateBonusButtonPosition();

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
  
  // 보너스 투표 카운트: 외부에서 전달된 값 사용
  const actualBonusVotesUsed = bonusVotesUsed;

  // Vote stamp states
  const isNormalVoteActive = currentVotes < maxVotes; // maxVotes 미만이면 빨강, 이상이면 회색

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
      setShowGenderSelection(true); // 성별 입력 상태로 전환
    }
  };

  const handleGenderSelect = (selectedGender: 'male' | 'female') => {
    setInternalGender(selectedGender);
    setShowGenderSelection(false);
    console.log('Final submit with gender:', selectedGender);
  };

  return (
    <>
      {/* 말풍선들을 Portal을 통해 최상위 레이어에 배치 */}
      {typeof window !== 'undefined' && isBonusMode && showBonusTooltip && createPortal(
        <div className="fixed z-[99999] pointer-events-none">
          <div className="absolute bottom-full mb-[15px] left-8 transform -translate-x-1/2 translate-y-0.5">
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
                  className="w-4 h-4 flex items-center justify-center"
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
          </div>
        </div>,
        document.body
      )}

      {typeof window !== 'undefined' && hasReachedMaxVotes && !hasClickedBonus && createPortal(
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
        {!showGenderSelection && (
          <SearchBar
            value={searchQuery}
            onChange={handleSearchQueryChange}
          />
        )}

        {/* Vote Status and Buttons Section - Fixed height for consistent layout */}
        <div className="flex items-center gap-4 lg:gap-8 h-16 overflow-visible">
          
          {/* Vote Stamps and Buttons Container - Simple flex layout with fixed height */}
          <div className={`flex items-center h-16 overflow-visible ${isBonusMode ? 'gap-6 lg:gap-12' : 'gap-4 lg:gap-8'}`}>
          
            {/* Normal Vote Stamp with Slide Animation */}
            <motion.div
              layout
              initial={{ x: 0 }}
              animate={{ 
                x: isBonusMode ? -20 : 0
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
                  x: 0 
                }}
                transition={{ 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 30,
                  duration: 0.6
                }}
              >
                <VoteStamp
                  type="bonus"
                  isActive={true}
                  currentVotes={currentVotes}
                  maxVotes={maxVotes}
                  bonusVotesUsed={actualBonusVotesUsed}
                />
              </motion.div>
            )}

            {/* Action Buttons */}
            {hasReachedMaxVotes && !hasClickedBonus ? (
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
                {!showGenderSelection && (
                  <VoteButton
                    type="next"
                    onClick={handleNextClick}
                  />
                )}
              </>
            ) : (
              !showGenderSelection && (
                <VoteButton
                  type="next"
                  onClick={handleNextClick}
                />
              )
            )}
          </div>
        </div>

        {/* Gender Selection UI - Fourth State - Independent Container */}
        {showGenderSelection && (
          <div className="flex items-center gap-4 lg:gap-8">
            {/* Gender Selection Toggles */}
            <div className="content-stretch flex gap-8 items-center justify-center relative shrink-0">
              {/* Male Toggle */}
              <div className="content-stretch flex gap-1 items-center justify-start overflow-clip relative shrink-0">
                <div className="flex flex-col font-['Pretendard:SemiBold',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#000000] text-[24px] text-nowrap">
                  <p className="leading-[normal] whitespace-pre">남성</p>
                </div>
                <div className="relative shrink-0 size-[22px]">
                  <Image
                    src="/icons/voteSection-selected.svg"
                    alt="Male Selected"
                    width={22}
                    height={22}
                    className="w-full h-full"
                  />
                </div>
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
                    src="/icons/voteSection-default.svg"
                    alt="Female Default"
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
              onClick={() => setShowGenderSelection(false)}
            >
              <div className="flex flex-col font-['Pretendard',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#ffffff] text-[16px] text-nowrap">
                <p className="leading-[normal] whitespace-pre">BACK</p>
              </div>
            </button>
            
            {/* Submit Button */}
            <div className="bg-gradient-to-r box-border content-stretch flex from-[#cb285e] gap-2.5 items-start justify-start pl-2.5 pr-3 py-2.5 relative rounded-lg shrink-0 to-[#9c1f49]">
              <div className="flex flex-col font-['Pretendard',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#ffffff] text-[16px] text-nowrap">
                <p className="leading-[normal] whitespace-pre">제출하기</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
