import React, { useState } from "react";
import Image from "next/image";

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
  onClick 
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

  // 카드 호버 시 왼쪽 호버 상태로 설정 (단, 기표칸 직접 호버 시에는 마우스 위치 우선)
  const shouldShowLeftHover = isHybridMode && !selected && (
    (isCardHovered && !isHovered) || // 카드 호버만 있을 때
    (isHovered && hoverSide === 'left') // 기표칸 왼쪽 직접 호버
  );
  const shouldShowRightHover = isHovered && hoverSide === 'right' && isHybridMode && !selected;

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
    <div className="relative size-24">
      {/* 기표칸 배경 */}
      <button
        type="button"
        aria-pressed={selected}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        onMouseMove={isHybridMode ? handleMouseMove : undefined}
        className={`
          size-24
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
          cursor-pointer
          overflow-hidden
        `}
      >
        {/* 선택 상태일 때 이미지 표시 */}
        {selected && (
          <Image
            src={isBonusVote ? "/voted-bonus.svg" : "/voted-normal.svg"}
            alt="Selected"
            width={isBonusVote ? 60 : 96}
            height={isBonusVote ? 60 : 96}
            className={isBonusVote ? "w-[60px] h-[60px] object-cover rounded-xl" : "w-full h-full object-cover rounded-xl"}
          />
        )}
      </button>

      {/* 호버 레이어 - 왼쪽 50% 영역 */}
      {!selected && shouldShowHover && isHybridMode && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-0 top-0 w-1/2 h-full">
            {shouldShowLeftHover && (
              <Image
                src="/hybrid-hover-left.svg"
                alt="Normal Hover Effect"
                width={48}
                height={96}
                className="w-full h-full object-cover rounded-l-xl"
              />
            )}
          </div>
          <div className="absolute right-0 top-0 w-1/2 h-full">
            {shouldShowRightHover && (
              <Image
                src="/hybrid-hover-right.svg"
                alt="Bonus Hover Effect"
                width={48}
                height={96}
                className="w-full h-full object-cover rounded-r-xl"
              />
            )}
          </div>
        </div>
      )}

      {/* 호버 레이어 - 일반 모드 (상태 1, 2) */}
      {shouldShowNormalHover && (
        <div className="absolute inset-0 pointer-events-none">
          <Image
            src="/normal-hover.svg"
            alt="Normal Hover Effect"
            width={96}
            height={96}
            className="w-full h-full object-cover rounded-xl"
          />
        </div>
      )}

      {/* 호버 레이어 - 풀 보너스 모드 */}
      {!selected && shouldShowHover && isFullBonusMode && (
        <div className="absolute inset-0 pointer-events-none">
          <Image
            src="/bonus-hover.svg"
            alt="Bonus Hover Effect"
            width={96}
            height={96}
            className="w-full h-full object-cover rounded-xl"
          />
        </div>
      )}
    </div>
  );
}
