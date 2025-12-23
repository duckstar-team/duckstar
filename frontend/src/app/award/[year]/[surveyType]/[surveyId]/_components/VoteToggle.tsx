import React, { useState } from 'react';
import { MAX_VOTES } from '@/lib/constants';
import { cn } from '@/lib/utils';

type VoteToggleProps = {
  selected: boolean;
  isCardHovered?: boolean;
  justDeselected?: boolean;
  currentVotes?: number;
  isBonusMode?: boolean;
  isBonusVote?: boolean;
  onClick: (isBonusVote?: boolean) => void;
  disabled?: boolean;
  cardHoverSide?: 'left' | 'right' | null;
};

export default function VoteToggle({
  selected,
  isCardHovered = false,
  justDeselected = false,
  currentVotes = 0,
  isBonusMode = false,
  isBonusVote = false,
  onClick,
  disabled = false,
  cardHoverSide = null,
}: VoteToggleProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [hoverSide, setHoverSide] = useState<'left' | 'right' | null>(null);

  // 보너스 모드에서 10표 미만일 때는 영역 구분, 10표 이상일 때는 전체 영역
  const isHybridMode = isBonusMode && currentVotes < MAX_VOTES;
  const isFullBonusMode = isBonusMode && currentVotes >= MAX_VOTES;

  // 카드 호버 또는 직접 호버 시 모두 호버 상태로 처리
  // 단, 선택 해제 후에는 카드 바깥으로 나가기 전까지 호버 이미지 표시하지 않음 (일반 모드와 풀 보너스 모드에서만)
  // 하이브리드 모드에서는 일반 투표 제한을 무시
  const shouldShowHover =
    (isHovered || isCardHovered) &&
    (isHybridMode ||
      (!justDeselected && (currentVotes < MAX_VOTES || isFullBonusMode)));

  // 카드 호버 시 카드의 hoverSide에 따라 호버 이미지 결정 (단, 기표칸 직접 호버 시에는 마우스 위치 우선)
  const shouldShowLeftHover =
    isHybridMode &&
    !selected &&
    ((isCardHovered && !isHovered && cardHoverSide === 'left') || // 카드 왼쪽 호버
      (isHovered && hoverSide === 'left')); // 기표칸 왼쪽 직접 호버
  const shouldShowRightHover =
    isHybridMode &&
    !selected &&
    ((isCardHovered && !isHovered && cardHoverSide === 'right') || // 카드 오른쪽 호버
      (isHovered && hoverSide === 'right')); // 기표칸 오른쪽 직접 호버

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
    <div className="relative size-12 lg:size-24">
      {/* 기표칸 배경 */}
      <button
        type="button"
        aria-pressed={selected}
        onClick={!disabled ? handleClick : undefined}
        onMouseLeave={!disabled ? handleMouseLeave : undefined}
        onMouseMove={!disabled && isHybridMode ? handleMouseMove : undefined}
        className={cn(
          'relative flex size-12 items-center justify-center rounded-full border border-gray-200 transition-all duration-200 ease-in-out focus:outline-none disabled:cursor-default lg:size-24',
          shouldShowNormalHover && 'bg-brand/10',
          !selected && shouldShowHover && isFullBonusMode && 'bg-amber-400/20'
        )}
      >
        {/* 선택 상태일 때 이미지 표시 */}
        {selected && (
          <img
            src={
              isBonusVote
                ? '/voted-bonus-2025-autumn.svg'
                : '/voted-normal-2025-autumn.svg'
            }
            alt="Selected"
            className="aspect-square w-full object-cover"
          />
        )}
      </button>

      {/* 호버 레이어 - 왼쪽 50% 영역 */}
      {!selected && shouldShowHover && isHybridMode && (
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 left-0 h-full w-1/2">
            {shouldShowLeftHover && (
              <img
                src="/hybrid-hover-left.svg"
                alt="Normal Hover Effect"
                className="h-full w-full rounded-l-full object-cover opacity-50"
              />
            )}
          </div>
          <div className="absolute top-0 right-0 h-full w-1/2">
            {shouldShowRightHover && (
              <img
                src="/hybrid-hover-right.svg"
                alt="Bonus Hover Effect"
                className="h-full w-full rounded-r-full object-cover"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
