'use client';

import TooltipBtn from '@/components/common/TooltipBtn';
import { MAX_VOTES } from '@/lib/constants';
import { Infinity, X } from 'lucide-react';
import { useState } from 'react';

// Types
interface VoteStampProps {
  type: 'normal' | 'bonus';
  currentVotes: number;
  bonusVotesUsed?: number;
  showResult?: boolean;
  showGenderSelection?: boolean;
}

const TEXT_SIZES = {
  small: 'text-xs sm:text-sm lg:text-base xl:text-lg',
  medium: 'text-sm sm:text-base lg:text-lg xl:text-xl',
  large: 'text-base sm:text-lg lg:text-xl xl:text-2xl',
} as const;

const COLORS = {
  normal: {
    active: 'text-[#990033]',
    inactive: 'text-neutral-600',
  },
  bonus: 'text-[#ffb310]',
} as const;

// Utility functions
const getTextSizeClass = (votes: number): string => {
  if (votes >= 100) return TEXT_SIZES.small;
  if (votes >= 50) return TEXT_SIZES.medium;
  return TEXT_SIZES.large;
};

const getNormalStampImage = (
  showGenderSelection: boolean,
  currentVotes: number
): string => {
  // VoteSection에서는 기존 도장 디자인 사용
  if (showGenderSelection) return '/icons/voteSection-normal-default.svg';
  if (currentVotes >= MAX_VOTES) return '/icons/voteSection-normal-full.svg';
  return '/icons/voteSection-normal-default.svg';
};

const getNormalStampColor = (
  showGenderSelection: boolean,
  currentVotes: number
): string => {
  if (showGenderSelection || currentVotes < MAX_VOTES)
    return COLORS.normal.active;
  // Full 상태일 때는 무조건 회색
  return COLORS.normal.inactive;
};

// Components
const VoteCountText = ({
  currentVotes,
  showResult,
  showGenderSelection,
}: {
  currentVotes: number;
  showResult: boolean;
  showGenderSelection: boolean;
}) => {
  const textSizeClass = getTextSizeClass(currentVotes);
  const textColor = getNormalStampColor(showGenderSelection, currentVotes);

  if (showResult) {
    return (
      <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-2">
        <div className="flex items-center justify-center pt-1 pb-0.5 sm:pt-1.5 sm:pb-0.5 lg:pt-2 lg:pb-1">
          <span
            className={`justify-center text-right ${TEXT_SIZES.medium} font-bold ${textColor}`}
          >
            ×
          </span>
        </div>

        <div className="flex items-center justify-center pt-1 pb-0.5 sm:pt-1.5 sm:pb-0.5 lg:pt-2 lg:pb-1">
          <span
            className={`justify-center text-right font-bold ${textColor} ${textSizeClass}`}
          >
            {currentVotes}표
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-fit items-center justify-center gap-2 font-semibold">
      <span className="text-brand">{currentVotes}표</span> /
      <span>{MAX_VOTES}표</span>
    </div>
  );
};

const BonusVoteCountText = ({
  bonusVotesUsed,
  showResult,
}: {
  bonusVotesUsed: number;
  showResult: boolean;
}) => {
  const textSizeClass = getTextSizeClass(bonusVotesUsed);

  if (showResult) {
    return (
      <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-2">
        <div className="flex items-center justify-center pt-1 pb-0.5 sm:pt-1.5 sm:pb-0.5 lg:pt-2 lg:pb-1">
          <span className={`font-bold ${TEXT_SIZES.medium} ${COLORS.bonus}`}>
            ×
          </span>
        </div>

        <div className="flex items-center justify-center pt-1 pb-0.5 sm:pt-1.5 sm:pb-0.5 lg:pt-2 lg:pb-1">
          <span className={`font-bold ${COLORS.bonus} ${textSizeClass}`}>
            {bonusVotesUsed}표
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex w-fit items-center justify-center gap-2 font-semibold text-amber-500">
        <span>{bonusVotesUsed}표</span> /
        <span className="rounded-full bg-amber-500/70 p-0.75">
          <Infinity className="size-5 stroke-2 text-white" />
        </span>
      </div>
    </>
  );
};

// Main component
export default function VoteStamp({
  type,
  currentVotes,
  bonusVotesUsed = 0,
  showResult = false,
  showGenderSelection = false,
}: VoteStampProps) {
  const [isTooltipOpen, setIsTooltipOpen] = useState(!showResult);
  const imageSrc = getNormalStampImage(showGenderSelection, currentVotes);

  const onCloseTooltip = () => {
    setIsTooltipOpen(false);
  };

  if (type === 'bonus') {
    return (
      <div className="flex items-center gap-3 sm:gap-3.5 md:gap-4">
        {/* Bonus Vote Stamp */}
        <TooltipBtn
          defaultIsOpen={true}
          isOpen={isTooltipOpen}
          className="max-md:text-xs!"
          variant="light"
          placement="bottom"
          content={
            <div className="flex items-center gap-2">
              보너스 표는 2개가 모여야 일반 표 1개와 같습니다.
              <button
                onClick={onCloseTooltip}
                type="button"
                className="size-3.5"
              >
                <X className="size-3.5" />
              </button>
            </div>
          }
        >
          <img
            src="/icons/voteSection-bonus-stamp.svg"
            alt="Bonus Stamp"
            className="size-10 object-cover sm:size-11 md:size-12"
          />
        </TooltipBtn>
        {/* Bonus Vote Count */}
        <BonusVoteCountText
          bonusVotesUsed={bonusVotesUsed}
          showResult={showResult}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 sm:gap-3.5 md:gap-4">
      {/* Normal Vote Stamp */}
      <img
        src={imageSrc}
        alt="Normal Vote Stamp"
        className="size-10 object-cover sm:size-11 md:size-12"
      />
      {/* Vote Count Text */}
      <VoteCountText
        currentVotes={currentVotes}
        showResult={showResult}
        showGenderSelection={showGenderSelection}
      />
    </div>
  );
}
