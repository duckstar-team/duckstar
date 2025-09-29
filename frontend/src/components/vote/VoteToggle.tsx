import React, { useState } from "react";
import { getCurrentVoteStampImagePath } from "@/utils/voteStampUtils";

type VoteToggleProps = {
  selected: boolean;
  isCardHovered?: boolean;
  justDeselected?: boolean;
  currentVotes?: number;
  maxVotes?: number;
  isBonusMode?: boolean;
  bonusVotesUsed?: number;
  isBonusVote?: boolean;
  onClick: (isBonusVote?: boolean) => void;
  disabled?: boolean;
  cardHoverSide?: 'left' | 'right' | null;
  isMobile?: boolean;
  weekDto?: { year: number; startDate: string } | null;
};

export default function VoteToggle({ 
  selected, 
  isCardHovered = false, 
  justDeselected = false, 
  currentVotes = 0,
  maxVotes = 10,
  isBonusMode = false,
  bonusVotesUsed = 0,
  isBonusVote = false,
  onClick,
  disabled = false,
  cardHoverSide = null,
  isMobile = false,
  weekDto = null
}: VoteToggleProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [hoverSide, setHoverSide] = useState<'left' | 'right' | null>(null);

  // 보너스 모드에서 10표 미만일 때는 영역 구분, 10표 이상일 때는 전체 영역
  const isHybridMode = isBonusMode && currentVotes < maxVotes;
  const isFullBonusMode = isBonusMode && currentVotes >= maxVotes;

  // 카드 호버 또는 직접 호버 시 모두 호버 상태로 처리
  // 단, 선택 해제 후에는 카드 바깥으로 나가기 전까지 호버 이미지 표시하지 않음 (일반 모드와 풀 보너스 모드에서만)
  // 하이브리드 모드에서는 일반 투표 제한을 무시
  const shouldShowHover = (isHovered || isCardHovered) && (
    (isHybridMode) || (!justDeselected && (currentVotes < maxVotes || isFullBonusMode))
  );

  // 카드 호버 시 카드의 hoverSide에 따라 호버 이미지 결정 (단, 기표칸 직접 호버 시에는 마우스 위치 우선)
  const shouldShowLeftHover = isHybridMode && !selected && (
    (isCardHovered && !isHovered && cardHoverSide === 'left') || // 카드 왼쪽 호버
    (isHovered && hoverSide === 'left') // 기표칸 왼쪽 직접 호버
  );
  const shouldShowRightHover = isHybridMode && !selected && (
    (isCardHovered && !isHovered && cardHoverSide === 'right') || // 카드 오른쪽 호버
    (isHovered && hoverSide === 'right') // 기표칸 오른쪽 직접 호버
  );

  // 일반 모드에서 호버 이미지 표시 (상태 1, 2)
  const shouldShowNormalHover = !isBonusMode && !selected && shouldShowHover;

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isHybridMode) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isLeftSide = x < rect.width / 2;
    setHoverSide(isLeftSide ? 'left' : 'right');
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setHoverSide(null);
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return; // disabled 상태에서는 클릭 무시
    
    e.stopPropagation(); // 카드 클릭과 중복 방지
    
    if (isHybridMode) {
      // 하이브리드 모드에서는 클릭 위치에 따라 일반/보너스 투표 구분
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const isLeftSide = x < rect.width / 2;
      
      if (isLeftSide) {
        // 왼쪽 영역 클릭: 일반 투표
        onClick(false);
      } else {
        // 오른쪽 영역 클릭: 보너스 투표
        onClick(true);
      }
    } else if (isFullBonusMode) {
      // 풀 보너스 모드에서는 항상 보너스 투표
      onClick(true);
    } else {
      // 일반 모드
      onClick();
    }
  };

  return (
    <div className={`relative ${isMobile ? 'size-12' : 'size-24'}`}>
      {/* 기표칸 배경 */}
      <button
        type="button"
        aria-pressed={selected}
        onClick={!disabled ? handleClick : undefined}
        onMouseEnter={!disabled ? () => setIsHovered(true) : undefined}
        onMouseLeave={!disabled ? handleMouseLeave : undefined}
        onMouseMove={!disabled && isHybridMode ? handleMouseMove : undefined}
        className={`
          ${isMobile ? 'size-12' : 'size-24'}
          relative
          rounded-xl
          border border-gray-300
          bg-white
          transition-all
          duration-200
          ease-in-out
          flex
          items-center
          justify-center
          focus:outline-none
          ${disabled ? 'cursor-default' : 'cursor-pointer'}
          overflow-hidden
        `}
      >
        {/* 선택 상태일 때 이미지 표시 */}
        {selected && (
          <img
            src={getCurrentVoteStampImagePath(weekDto, isBonusVote)}
            alt="Selected"
            className={
              isMobile 
                ? (isBonusVote ? "w-[30px] h-[30px] object-cover rounded-xl" : "w-full h-full object-cover rounded-xl")
                : (isBonusVote ? "w-[60px] h-[60px] object-cover rounded-xl" : "w-full h-full object-cover rounded-xl")
            }
          />
        )}
      </button>

      {/* 호버 레이어 - 왼쪽 50% 영역 */}
      {!selected && shouldShowHover && isHybridMode && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-0 top-0 w-1/2 h-full">
            {shouldShowLeftHover && (
              <img
                src="/hybrid-hover-left.svg"
                alt="Normal Hover Effect"
                className="w-full h-full object-cover rounded-l-xl"
              />
            )}
          </div>
          <div className="absolute right-0 top-0 w-1/2 h-full">
            {shouldShowRightHover && (
              <img
                src="/hybrid-hover-right.svg"
                alt="Bonus Hover Effect"
                className="w-full h-full object-cover rounded-r-xl"
              />
            )}
          </div>
        </div>
      )}

      {/* 호버 레이어 - 일반 모드 (상태 1, 2) */}
      {shouldShowNormalHover && (
        <div className="absolute inset-0 pointer-events-none">
          <img
            src="/normal-hover.svg"
            alt="Normal Hover Effect"
            className="w-full h-full object-cover rounded-xl"
          />
        </div>
      )}

      {/* 호버 레이어 - 풀 보너스 모드 */}
      {!selected && shouldShowHover && isFullBonusMode && (
        <div className="absolute inset-0 pointer-events-none">
          <img
            src="/bonus-hover.svg"
            alt="Bonus Hover Effect"
            className="w-full h-full object-cover rounded-xl"
          />
        </div>
      )}
    </div>
  );
}
