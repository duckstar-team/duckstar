import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import VoteToggle from './VoteToggle';
import { AnimeCandidateDto } from '@/types';
import { MAX_VOTES } from '@/lib/constants';

interface VoteCardProps {
  anime: AnimeCandidateDto;
  checked: boolean;
  onChange?: (isBonusVote?: boolean) => void;
  showError?: boolean;
  currentVotes?: number;
  isBonusMode?: boolean;
  isBonusVote?: boolean;
  onMouseLeave?: () => void;
  disabled?: boolean;
  showGenderSelection?: boolean;
}

export default function VoteCard({
  anime,
  checked,
  onChange,
  showError = false,
  currentVotes = 0,
  isBonusMode = false,
  isBonusVote = false,
  onMouseLeave,
  disabled = false,
}: VoteCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [justDeselected, setJustDeselected] = useState(false);
  const [prevChecked, setPrevChecked] = useState(checked);
  const [hoverSide, setHoverSide] = useState<'left' | 'right' | null>(null);

  // 하이브리드 모드 여부 확인
  const isHybridMode = isBonusMode && currentVotes < MAX_VOTES;

  // 선택 상태 변경 감지
  useEffect(() => {
    if (prevChecked && !checked) {
      // 선택 해제됨
      setJustDeselected(true);
    } else if (!prevChecked && checked) {
      // 선택됨
      setJustDeselected(false);
    }
    setPrevChecked(checked);
  }, [checked, prevChecked]);

  // 카드 호버 해제 시 justDeselected 상태 초기화 및 에러 메시지 숨기기 - 메모이제이션
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setJustDeselected(false);
    setHoverSide(null);
    if (onMouseLeave) {
      onMouseLeave();
    }
  }, [onMouseLeave]);

  // 카드 몸체에서 마우스 이동 시 좌우 구분 - 메모이제이션
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isHybridMode || disabled) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;

      // 기표칸의 중앙점이 카드 몸체에서 위치하는 지점 계산
      // 썸네일(112px) + 갭(16px) + 제목영역(남은공간) + 갭(16px) + 기표칸중앙(48px)
      // 실제로는 기표칸의 중앙이 카드의 오른쪽 끝에서 48px 지점
      const stampCenterX = rect.width - 48; // 기표칸 중앙점
      const isLeftSide = x < stampCenterX;

      setHoverSide(isLeftSide ? 'left' : 'right');
    },
    [isHybridMode, disabled]
  );

  // 카드 클릭 처리 - 메모이제이션
  const handleCardClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!onChange) return; // disabled 상태에서는 클릭 무시

      if (isHybridMode) {
        // 하이브리드 모드에서는 클릭 위치에 따라 일반/보너스 투표 구분
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;

        // 기표칸의 중앙점이 카드 몸체에서 위치하는 지점 계산
        const stampCenterX = rect.width - 48; // 기표칸 중앙점
        const isLeftSide = x < stampCenterX;

        if (isLeftSide) {
          // 왼쪽 영역 클릭: 일반 투표
          onChange(false);
        } else {
          // 오른쪽 영역 클릭: 보너스 투표
          onChange(true);
        }
      } else {
        // 일반 모드 또는 풀 보너스 모드
        const isFullBonusMode = isBonusMode && currentVotes >= MAX_VOTES;
        onChange(isFullBonusMode);
      }
    },
    [onChange, isHybridMode, isBonusMode, currentVotes]
  );

  return (
    <div className="relative h-full">
      <motion.div
        className={`h-full w-full rounded-xl border-2 bg-white shadow transition-all duration-200 ease-in-out ${disabled ? 'cursor-pointer' : 'cursor-pointer hover:shadow-lg'} ${
          showError
            ? 'border-[#CB285E]/80 shadow-red-200/50'
            : 'border-gray-200'
        } `}
        initial={{ scale: 1 }}
        animate={{
          scale: 1,
        }}
        transition={{
          duration: 0.2,
          ease: 'easeInOut',
        }}
        onMouseEnter={!disabled ? () => setIsHovered(true) : undefined}
        onMouseLeave={!disabled ? handleMouseLeave : undefined}
        onMouseMove={!disabled && isHybridMode ? handleMouseMove : undefined}
        onClick={!disabled ? handleCardClick : undefined}
      >
        <div className="flex h-full gap-4 p-4 lg:items-start">
          {/* 썸네일 */}
          <div className="relative h-full w-20 flex-shrink-0 lg:h-36 lg:w-28">
            <img
              src={anime.mainThumbnailUrl}
              alt={anime.titleKor}
              className="h-full w-full rounded-md object-cover"
              loading="lazy"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/banners/duckstar-logo.svg';
              }}
            />
          </div>
          {/* 오른쪽 열: 제목 + 시즌 + 기표칸 */}
          <div className="flex flex-1 flex-col gap-2">
            {/* 제목 */}
            <div className="line-clamp-3 leading-tight font-semibold break-words text-gray-900 lg:text-lg">
              {anime.titleKor}
            </div>

            <div className="flex w-full items-start justify-between gap-1">
              {/* 시즌 정보 */}
              <div className="text-xs text-gray-500 lg:text-sm">
                {`${anime.year} ${anime.quarter}분기 ${anime.medium}`}
              </div>

              {/* 투표 토글 */}
              <div className="flex @max-md:self-end">
                <VoteToggle
                  selected={checked}
                  isCardHovered={isHovered}
                  justDeselected={justDeselected}
                  currentVotes={currentVotes}
                  isBonusMode={isBonusMode}
                  isBonusVote={isBonusVote}
                  onClick={(isBonusVote) => {
                    if (!onChange) return; // disabled 상태에서는 클릭 무시
                    // 클릭은 항상 허용하고, 부모 컴포넌트에서 에러 처리
                    onChange(isBonusVote);
                  }}
                  disabled={disabled}
                  cardHoverSide={hoverSide}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 에러 메시지 - 빨간 테두리 위에 작은 글씨 */}
        {showError && (
          <div className="absolute -top-2 left-4 bg-white px-2 text-xs font-medium text-[#990033] transition-opacity duration-3000 ease-in-out">
            일반 투표 횟수(10회)를 모두 소진하였습니다.
          </div>
        )}
      </motion.div>
    </div>
  );
}
