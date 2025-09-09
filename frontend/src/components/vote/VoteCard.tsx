import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import VoteToggle from "./VoteToggle";
import { WeekDto } from "@/types/api";
import { getSeasonFromDate, getSeasonInKorean } from "@/lib/utils";

interface VoteCardProps {
  thumbnailUrl: string;
  title: string;
  checked: boolean;
  onChange?: (isBonusVote?: boolean) => void;
  showError?: boolean;
  currentVotes?: number;
  maxVotes?: number;
  isBonusMode?: boolean;
  bonusVotesUsed?: number;
  isBonusVote?: boolean;
  weekDto?: WeekDto;
  medium?: "TVA" | "MOVIE";
  onMouseLeave?: () => void;
  disabled?: boolean;
  showGenderSelection?: boolean;
}

export default function VoteCard({
  thumbnailUrl,
  title,
  checked,
  onChange,
  showError = false,
  currentVotes = 0,
  maxVotes = 10,
  isBonusMode = false,
  bonusVotesUsed = 0,
  isBonusVote = false,
  weekDto,
  medium,
  onMouseLeave,
  disabled = false,
  showGenderSelection = false,
}: VoteCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [justDeselected, setJustDeselected] = useState(false);
  const [prevChecked, setPrevChecked] = useState(checked);
  const [hoverSide, setHoverSide] = useState<'left' | 'right' | null>(null);

  // 하이브리드 모드 여부 확인
  const isHybridMode = isBonusMode && currentVotes < maxVotes;

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

  // 카드 호버 해제 시 justDeselected 상태 초기화 및 에러 메시지 숨기기
  const handleMouseLeave = () => {
    setIsHovered(false);
    setJustDeselected(false);
    setHoverSide(null);
    if (onMouseLeave) {
      onMouseLeave();
    }
  };

  // 카드 몸체에서 마우스 이동 시 좌우 구분
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isHybridMode || disabled) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    
    // 기표칸의 중앙점이 카드 몸체에서 위치하는 지점 계산
    // 썸네일(112px) + 갭(16px) + 제목영역(남은공간) + 갭(16px) + 기표칸중앙(48px)
    // 실제로는 기표칸의 중앙이 카드의 오른쪽 끝에서 48px 지점
    const stampCenterX = rect.width - 48; // 기표칸 중앙점
    const isLeftSide = x < stampCenterX;
    
    setHoverSide(isLeftSide ? 'left' : 'right');
  };

  // 카드 클릭 처리
  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
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
      const isFullBonusMode = isBonusMode && currentVotes >= maxVotes;
      onChange(isFullBonusMode);
    }
  };

  // subTitle 생성
  const getSubTitle = () => {
    if (weekDto) {
      const year = weekDto.year;
      const season = getSeasonFromDate(weekDto.startDate);
      const seasonKorean = getSeasonInKorean(season);
      const mediumText = medium === "MOVIE" ? "극장판" : "TVA";
      return `${year} ${seasonKorean} ${mediumText}`;
    }
    return ""; // 폴백으로 빈 문자열 반환
  };

  return (
    <div className="relative">
      <motion.div
        className={`
          w-full bg-white rounded-xl shadow border-2
          transition-all duration-200 ease-in-out
          ${disabled ? 'cursor-default' : 'cursor-pointer hover:shadow-lg'}
          ${showError 
            ? 'border-[#CB285E]/80 shadow-red-200/50' 
            : 'border-gray-200'
          }
        `}
        initial={{ scale: 1 }}
        animate={{ 
          scale: 1
        }}
        transition={{ 
          duration: 0.2,
          ease: "easeInOut"
        }}
        onMouseEnter={!disabled ? () => setIsHovered(true) : undefined}
        onMouseLeave={!disabled ? handleMouseLeave : undefined}
        onMouseMove={!disabled && isHybridMode ? handleMouseMove : undefined}
        onClick={!disabled ? handleCardClick : undefined}
      >
        {/* 데스크톱 레이아웃 (lg 이상) */}
        <div className="hidden lg:flex items-center gap-4 p-4">
          {/* 썸네일 */}
          <div className="relative w-28 h-36 flex-shrink-0">
            <Image
              src={thumbnailUrl}
              alt={title}
              fill
              className="object-cover rounded-md"
              sizes="112px"
              loading="lazy"
              placeholder="empty"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/banners/duckstar-logo.svg';
              }}
            />
          </div>

          {/* 제목 + 시즌 */}
          <div className="flex flex-col flex-1">
            <div className="text-lg font-semibold text-gray-900 break-words leading-tight">
              {title}
            </div>
            <div className="text-sm text-gray-500 mt-1">{getSubTitle()}</div>
          </div>

          {/* 투표 토글 */}
          <VoteToggle
            selected={checked}
            isCardHovered={isHovered}
            justDeselected={justDeselected}
            currentVotes={currentVotes}
            maxVotes={maxVotes}
            isBonusMode={isBonusMode}
            bonusVotesUsed={bonusVotesUsed}
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

        {/* 모바일/태블릿 레이아웃 (lg 미만) */}
        <div className="lg:hidden p-4">
          <div className="flex items-start gap-3">
            {/* 썸네일 */}
            <div className="relative w-20 h-24 flex-shrink-0">
              <Image
                src={thumbnailUrl}
                alt={title}
                fill
                className="object-cover rounded-md"
                sizes="80px"
                loading="lazy"
                placeholder="empty"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/banners/duckstar-logo.svg';
                }}
              />
            </div>

            {/* 오른쪽 열: 제목 + 시즌 + 기표칸 */}
            <div className="flex flex-col flex-1 min-w-0">
              {/* 제목 */}
              <div className="text-base font-semibold text-gray-900 break-words leading-tight mb-1">
                {title}
              </div>
              
              {/* 시즌 정보 */}
              <div className="text-xs text-gray-500 mb-3">
                {getSubTitle()}
              </div>
              
              {/* 기표칸 (우하단) */}
              <div className="flex justify-end">
                <VoteToggle
                  selected={checked}
                  isCardHovered={isHovered}
                  justDeselected={justDeselected}
                  currentVotes={currentVotes}
                  maxVotes={maxVotes}
                  isBonusMode={isBonusMode}
                  bonusVotesUsed={bonusVotesUsed}
                  isBonusVote={isBonusVote}
                  onClick={(isBonusVote) => {
                    if (!onChange) return; // disabled 상태에서는 클릭 무시
                    // 클릭은 항상 허용하고, 부모 컴포넌트에서 에러 처리
                    onChange(isBonusVote);
                  }}
                  disabled={disabled}
                  cardHoverSide={hoverSide}
                  isMobile={true}
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
