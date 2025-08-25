import React, { useState, useEffect } from "react";
import VoteToggle from "./VoteToggle";
import { WeekDto } from "@/types/api";
import { getSeasonFromDate, getSeasonInKorean } from "@/lib/utils";

interface VoteCardProps {
  thumbnailUrl: string;
  title: string;
  checked: boolean;
  onChange: (isBonusVote?: boolean) => void;
  showError?: boolean;
  currentVotes?: number;
  maxVotes?: number;
  isBonusMode?: boolean;
  bonusVotesUsed?: number;
  isBonusVote?: boolean;
  weekDto?: WeekDto;
  medium?: "TVA" | "MOVIE";
  onMouseLeave?: () => void;
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
}: VoteCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [justDeselected, setJustDeselected] = useState(false);
  const [prevChecked, setPrevChecked] = useState(checked);

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
    if (onMouseLeave) {
      onMouseLeave();
    }
  };

  // 10표 초과 시도 시 에러 처리
  const handleCardClick = () => {
    // 클릭은 항상 허용하고, 부모 컴포넌트에서 에러 처리
    // 풀 보너스 모드에서는 보너스 투표, 그 외에는 일반 투표로 처리
    const isFullBonusMode = isBonusMode && currentVotes >= maxVotes;
    onChange(isFullBonusMode);
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
      <div
        className={`
          w-full
          bg-white
          rounded-xl
          shadow
          border-2
          flex
          items-center
          gap-4
          p-4
          cursor-pointer
          hover:shadow-lg
          transition-all
          duration-200
          ease-in-out
          ${showError 
            ? 'border-[#CB285E]/80 shadow-red-200/50' 
            : 'border-gray-200'
          }
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        onClick={handleCardClick}
      >
        {/* 썸네일 */}
        <div className="relative w-28 h-36 flex-shrink-0">
          <img
            src={thumbnailUrl}
            alt={title}
            className="w-full h-full object-cover rounded-md"
          />
        </div>

        {/* 제목 + 시즌 */}
        <div className="flex flex-col flex-1">
          <div className="text-base font-semibold text-gray-900 break-words leading-tight">
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
            // 클릭은 항상 허용하고, 부모 컴포넌트에서 에러 처리
            onChange(isBonusVote);
          }}
        />

        {/* 에러 메시지 - 빨간 테두리 위에 작은 글씨 */}
        {showError && (
          <div className="absolute -top-2 left-4 bg-white px-2 text-xs font-medium text-[#990033] transition-opacity duration-3000 ease-in-out">
            일반 투표 횟수(10회)를 모두 소진하였습니다.
          </div>
        )}
      </div>
    </div>
  );
}
