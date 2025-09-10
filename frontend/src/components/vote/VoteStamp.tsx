'use client';

import { forwardRef } from 'react';

// Types
interface VoteStampProps {
  type: 'normal' | 'bonus';
  isActive: boolean;
  currentVotes: number;
  maxVotes: number;
  bonusVotesUsed?: number;
  showResult?: boolean;
  showTooltip?: boolean;
  onHideTooltip?: () => void;
  showGenderSelection?: boolean;
}

// Constants
const STAMP_SIZES = {
  normal: {
    mobile: 'w-[49px] h-[49px]',
    tablet: 'sm:w-[54px] sm:h-[54px]',
    desktop: 'lg:w-[54px] lg:h-[54px]'
  },
  bonus: {
    mobile: 'w-[60px] h-[60px]',
    tablet: 'sm:w-[67px] sm:h-[67px]',
    desktop: 'lg:w-[67px] lg:h-[67.275px]'
  }
} as const;

const ROUNDED_CORNERS = {
  mobile: 'rounded-[24px]',
  tablet: 'sm:rounded-[27px]',
  desktop: 'lg:rounded-[30px]'
} as const;

const TEXT_SIZES = {
  small: 'text-sm sm:text-base lg:text-lg xl:text-[24px]',
  medium: 'text-base sm:text-lg lg:text-xl xl:text-[28px]',
  large: 'text-lg sm:text-xl lg:text-2xl xl:text-[32px]'
} as const;

const COLORS = {
  normal: {
    active: 'text-[#990033]',
    inactive: 'text-neutral-600'
  },
  bonus: 'text-[#ffb310]'
} as const;

// Utility functions
const getTextSizeClass = (votes: number): string => {
  if (votes >= 100) return TEXT_SIZES.small;
  if (votes >= 50) return TEXT_SIZES.medium;
  return TEXT_SIZES.large;
};

const getNormalStampBackground = (showGenderSelection: boolean, currentVotes: number, maxVotes: number): string => {
  if (showGenderSelection || currentVotes < maxVotes) {
    return 'bg-[rgba(153,0,51,0.15)]';
  }
  return 'bg-neutral-600/20';
};

const getNormalStampImage = (showGenderSelection: boolean, currentVotes: number, maxVotes: number): string => {
  if (showGenderSelection) return "/icons/voteSection-normal-default.svg";
  if (currentVotes >= maxVotes) return "/icons/voteSection-normal-full.svg";
  return "/icons/voteSection-normal-default.svg";
};

const getNormalStampColor = (showGenderSelection: boolean, currentVotes: number, maxVotes: number, isActive: boolean): string => {
  if (showGenderSelection || currentVotes < maxVotes) return COLORS.normal.active;
  // Full 상태일 때는 무조건 회색
  return COLORS.normal.inactive;
};

// Components
const VoteCountText = ({ 
  currentVotes, 
  maxVotes, 
  showResult, 
  showGenderSelection, 
  isActive 
}: {
  currentVotes: number;
  maxVotes: number;
  showResult: boolean;
  showGenderSelection: boolean;
  isActive: boolean;
}) => {
  const textSizeClass = getTextSizeClass(currentVotes);
  const textColor = getNormalStampColor(showGenderSelection, currentVotes, maxVotes, isActive);

  if (showResult) {
    return (
      <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-[13px]">
        <div className="pt-1.5 pb-0.5 sm:pt-2 sm:pb-1 lg:pt-2.5 lg:pb-[5px] flex justify-center items-center">
          <span className={`text-right justify-center ${TEXT_SIZES.large} font-bold font-['Pretendard'] leading-none ${textColor}`}>
            ×
          </span>
        </div>
        
        <div className="pt-1.5 pb-0.5 sm:pt-2 sm:pb-1 lg:pt-2.5 lg:pb-[5px] flex justify-center items-center">
          <span className={`text-right justify-center font-bold font-['Pretendard'] leading-none whitespace-nowrap ${textColor} ${textSizeClass}`}>
            {currentVotes}표
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-12 sm:w-16 lg:w-20 pt-1.5 pb-0.5 sm:pt-2 sm:pb-1 lg:pt-2.5 lg:pb-[5px] flex justify-center items-center">
        <span className={`text-right justify-center font-bold font-['Pretendard'] leading-none whitespace-nowrap ${textColor} ${textSizeClass}`}>
          {currentVotes}표
        </span>
      </div>
      
      <div className="w-1.5 sm:w-2 self-stretch pt-1.5 sm:pt-2 lg:pt-3 flex flex-col justify-center items-center">
        <span className="self-stretch h-5 sm:h-7 lg:h-9 text-right justify-center text-black text-sm sm:text-lg lg:text-xl font-bold font-['Pretendard'] leading-none translate-y-0.5 sm:translate-y-1 lg:translate-y-2">
          /
        </span>
      </div>
      
      <div className="pt-1.5 sm:pt-2 lg:pt-3 flex flex-col justify-center items-center">
        <span className="text-right justify-center text-black text-sm sm:text-lg lg:text-xl font-bold font-['Pretendard'] leading-none">
          {maxVotes}표
        </span>
      </div>
    </>
  );
};

const BonusVoteCountText = ({ 
  bonusVotesUsed, 
  showResult 
}: {
  bonusVotesUsed: number;
  showResult: boolean;
}) => {
  const textSizeClass = getTextSizeClass(bonusVotesUsed);

  if (showResult) {
    return (
      <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-[13px]">
        <div className="pt-1.5 pb-0.5 sm:pt-2 sm:pb-1 lg:pt-2.5 lg:pb-[5px] flex justify-center items-center">
          <span className={`font-['Pretendard',_sans-serif] font-bold ${TEXT_SIZES.large} ${COLORS.bonus}`}>
            ×
          </span>
        </div>
        
        <div className="pt-1.5 pb-0.5 sm:pt-2 sm:pb-1 lg:pt-2.5 lg:pb-[5px] flex justify-center items-center">
          <span className={`font-['Pretendard',_sans-serif] font-bold ${COLORS.bonus} whitespace-nowrap ${textSizeClass}`}>
            {bonusVotesUsed}표
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-12 sm:w-16 lg:w-20 pt-1.5 pb-0.5 sm:pt-2 sm:pb-1 lg:pt-2.5 lg:pb-[5px] flex justify-center items-center">
        <span className={`font-['Pretendard',_sans-serif] font-bold ${COLORS.bonus} whitespace-nowrap ${textSizeClass}`}>
          {bonusVotesUsed}표
        </span>
      </div>
      
      <div className="w-1.5 sm:w-2 self-stretch pt-1.5 sm:pt-2 lg:pt-3 flex flex-col justify-center items-center">
        <span className={`self-stretch h-5 sm:h-7 lg:h-9 text-right justify-center ${COLORS.bonus} text-sm sm:text-lg lg:text-xl font-bold font-['Pretendard'] leading-none translate-y-0.5 sm:translate-y-1 lg:translate-y-2`}>
          /
        </span>
      </div>
      
      <div className="pt-1.5 sm:pt-2 lg:pt-3 flex flex-col justify-center items-center">
        <div className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 relative overflow-hidden">
          <img
            src="/icons/voteSection-infinity.svg"
            alt="Infinity Icon"
            className="w-full h-full"
          />
        </div>
      </div>
    </>
  );
};

// Main component
const VoteStamp = forwardRef<HTMLDivElement, VoteStampProps>(({ 
  type, 
  isActive, 
  currentVotes, 
  maxVotes, 
  bonusVotesUsed = 0,
  showResult = false,
  showTooltip = false,
  onHideTooltip,
  showGenderSelection = false
}, ref) => {
  if (type === 'normal') {
    const stampSizes = STAMP_SIZES.normal;
    const roundedCorners = `${ROUNDED_CORNERS.mobile} ${ROUNDED_CORNERS.tablet} ${ROUNDED_CORNERS.desktop}`;
    const backgroundClass = getNormalStampBackground(showGenderSelection, currentVotes, maxVotes);
    const imageSrc = getNormalStampImage(showGenderSelection, currentVotes, maxVotes);

    return (
      <div className="flex items-center gap-3 sm:gap-4 lg:gap-[20px]">
        {/* Normal Vote Stamp */}
        <div className={`flex items-center justify-center ${stampSizes.mobile} ${stampSizes.tablet} ${stampSizes.desktop} ${roundedCorners} ${backgroundClass}`}>
          <img
            src={imageSrc}
            alt="Normal Vote Stamp"
            className={`w-full h-full object-cover ${roundedCorners}`}
          />
        </div>
        
        {/* Vote Count Text */}
        <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-[13px]">
          <VoteCountText
            currentVotes={currentVotes}
            maxVotes={maxVotes}
            showResult={showResult}
            showGenderSelection={showGenderSelection}
            isActive={isActive}
          />
        </div>
      </div>
    );
  }

  if (type === 'bonus') {
    const stampSizes = STAMP_SIZES.bonus;

    return (
      <div className="flex items-center gap-2 sm:gap-3 lg:gap-[16px]">
        {/* Bonus Vote Stamp */}
        <div 
          ref={ref}
          className={`flex items-center justify-center ${stampSizes.mobile} ${stampSizes.tablet} ${stampSizes.desktop}`}
        >
          <img
            src="/icons/voteSection-bonus-stamp.svg"
            alt="Bonus Stamp"
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Bonus Vote Count */}
        <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-[13px]">
          <BonusVoteCountText
            bonusVotesUsed={bonusVotesUsed}
            showResult={showResult}
          />
        </div>
      </div>
    );
  }

  return null;
});

VoteStamp.displayName = 'VoteStamp';

export default VoteStamp;
