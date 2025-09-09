import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import Image from 'next/image';
import EpisodeItem from './EpisodeItem';
import QuarterWeekLabel from './QuarterWeekLabel';
import { getBusinessQuarter, calculateBusinessWeekNumber } from '../../lib/quarterUtils';

// 타입 정의
interface Episode {
  id: number;
  episodeId: number;
  episodeNumber: number;
  quarter: string;
  week: string;
  scheduledAt: string;
}

interface EpisodeSectionProps {
  episodes: Episode[];
  totalEpisodes: number;
  selectedEpisodeIds: number[];
  onEpisodeClick: (episodeId: number) => void;
  disableFutureEpisodes?: boolean; // 미래 에피소드 비활성화 옵션
}

// 툴팁 관련 타입
interface TooltipState {
  hoveredEpisodeId: number | null;
  showTooltip: boolean;
  isMouseStopped: boolean;
  position: { x: number; y: number };
  timeout: NodeJS.Timeout | null;
  mouseMoveTimeout: NodeJS.Timeout | null;
}

// 날짜 포맷팅 함수
const formatScheduledAt = (scheduledAt: string): string => {
  const date = new Date(scheduledAt);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
  return `${month}월 ${day}일 (${dayOfWeek})`;
};

// 현재 시각 기반 에피소드 상태 계산
const getEpisodeStatus = (scheduledAt: string): 'past' | 'current' | 'future' => {
  const now = new Date();
  const episodeDate = new Date(scheduledAt);
  
  // 현재 시각과 에피소드 방영일 비교 (시간까지 고려)
  const timeDiff = episodeDate.getTime() - now.getTime();
  
  // 현재 시각의 분기/주차 계산
  const currentQuarter = getBusinessQuarter(now);
  const currentWeek = calculateBusinessWeekNumber(now);
  
  // 에피소드의 분기/주차 계산
  const episodeQuarter = getBusinessQuarter(episodeDate);
  const episodeWeek = calculateBusinessWeekNumber(episodeDate);
  
  // 현재 시각에 해당하는 분기/주차의 에피소드인지 확인
  const isCurrentQuarterWeek = (currentQuarter === episodeQuarter && currentWeek === episodeWeek);
  
  if (timeDiff < 0) {
    return "past"; // 이미 방영됨 (시간까지 지남)
  } else if (isCurrentQuarterWeek && timeDiff > 0) {
    return "current"; // 현재 분기/주차의 에피소드 (아직 방영 안됨)
  } else {
    return "future"; // 아직 방영 안됨
  }
};

// 에피소드 variant 결정 함수
const getEpisodeVariant = (
  status: 'past' | 'current' | 'future',
  isSelected: boolean
): 'past' | 'current' | 'future' | 'filterSelectForPast' | 'filterSelectForCurrent' => {
  if (isSelected) {
    return status === 'current' ? 'filterSelectForCurrent' : 'filterSelectForPast';
  }
  return status;
};

export default function EpisodeSection({
  episodes,
  totalEpisodes,
  selectedEpisodeIds,
  onEpisodeClick,
  disableFutureEpisodes = false
}: EpisodeSectionProps) {
  // 페이징 상태
  const [currentPage, setCurrentPage] = useState(0);
  const episodesPerPage = 6;
  const totalPages = Math.ceil(totalEpisodes / episodesPerPage);

  // 초기화 여부 추적
  const isInitialized = useRef(false);

  // 호버 상태
  const [hoveredEpisodeId, setHoveredEpisodeId] = useState<number | null>(null);

  // 툴팁 상태
  const [tooltipState, setTooltipState] = useState<TooltipState>({
    hoveredEpisodeId: null,
    showTooltip: false,
    isMouseStopped: false,
    position: { x: 0, y: 0 },
    timeout: null,
    mouseMoveTimeout: null
  });

  // 현재 페이지의 에피소드들
  const currentPageEpisodes = useMemo(() => {
    const startIndex = currentPage * episodesPerPage;
    return episodes.slice(startIndex, startIndex + episodesPerPage);
  }, [episodes, currentPage, episodesPerPage]);

  // 현재 분기/주차에 해당하는 페이지로 초기 설정 (한 번만 실행)
  useEffect(() => {
    if (episodes.length > 0 && !isInitialized.current) {
      // 현재 분기/주차에 해당하는 에피소드 찾기
      const currentQuarter = getBusinessQuarter(new Date());
      const currentWeek = calculateBusinessWeekNumber(new Date());
      
      const currentEpisodeIndex = episodes.findIndex(episode => {
        const episodeDate = new Date(episode.scheduledAt);
        const episodeQuarter = getBusinessQuarter(episodeDate);
        const episodeWeek = calculateBusinessWeekNumber(episodeDate);
        
        return episodeQuarter === currentQuarter && episodeWeek === currentWeek;
      });
      
      if (currentEpisodeIndex !== -1) {
        // 현재 분기/주차 에피소드가 있는 페이지 계산
        const targetPage = Math.floor(currentEpisodeIndex / episodesPerPage);
        setCurrentPage(targetPage);
      }
      
      // 초기화 완료 표시
      isInitialized.current = true;
    }
  }, [episodes, episodesPerPage]);

  // 페이지 네비게이션 핸들러
  const handlePreviousPage = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, totalPages]);

  // 툴팁 관련 핸들러들
  const clearTooltipTimers = useCallback(() => {
    if (tooltipState.timeout) {
      clearTimeout(tooltipState.timeout);
    }
    if (tooltipState.mouseMoveTimeout) {
      clearTimeout(tooltipState.mouseMoveTimeout);
    }
  }, [tooltipState.timeout, tooltipState.mouseMoveTimeout]);

  const handleMouseEnter = useCallback((episodeId: number) => {
    setHoveredEpisodeId(episodeId);
    setTooltipState(prev => ({
      ...prev,
      hoveredEpisodeId: episodeId,
      isMouseStopped: false,
      showTooltip: false
    }));
    clearTooltipTimers();
  }, [clearTooltipTimers]);

  const handleMouseMove = useCallback((e: React.MouseEvent, episodeId: number) => {
    setTooltipState(prev => ({
      ...prev,
      isMouseStopped: false,
      showTooltip: false
    }));
    clearTooltipTimers();

    const mouseX = e.pageX;
    const mouseY = e.pageY;

    const moveTimeout = setTimeout(() => {
      setTooltipState(prev => ({
        ...prev,
        isMouseStopped: true,
        position: {
          x: mouseX + 10,
          y: mouseY - 30
        }
      }));

      const newTooltipTimeout = setTimeout(() => {
        setTooltipState(prev => ({
          ...prev,
          showTooltip: true
        }));
      }, 500);

      setTooltipState(prev => ({
        ...prev,
        timeout: newTooltipTimeout
      }));
    }, 100);

    setTooltipState(prev => ({
      ...prev,
      mouseMoveTimeout: moveTimeout
    }));
  }, [clearTooltipTimers]);

  const handleMouseLeave = useCallback(() => {
    setHoveredEpisodeId(null);
    setTooltipState(prev => ({
      ...prev,
      hoveredEpisodeId: null,
      showTooltip: false,
      isMouseStopped: false
    }));
    clearTooltipTimers();
  }, [clearTooltipTimers]);

  // 에피소드 클릭 핸들러
  const handleEpisodeClick = useCallback((episodeId: number, status: 'past' | 'current' | 'future') => {
    if (status === 'past' || status === 'current') {
      onEpisodeClick(episodeId);
    }
  }, [onEpisodeClick]);

  return (
    <div className="size- flex flex-col justify-start items-center gap-2.5">
      {/* 에피소드 헤더 */}
      <div className="w-[580px] h-5 px-6 inline-flex justify-start items-center gap-3.5">
        <div className="text-center justify-start text-black text-xl font-semibold font-['Pretendard'] leading-snug">
          에피소드 공개
        </div>
        <div className="text-center justify-start">
          <span className="text-black text-base font-semibold font-['Pretendard'] leading-snug">총 </span>
          <span className="text-rose-800 text-base font-semibold font-['Pretendard'] leading-snug">{totalEpisodes}</span>
          <span className="text-black text-base font-semibold font-['Pretendard'] leading-snug"> 화</span>
        </div>
      </div>

      {/* 에피소드 프로그레스 바 */}
      <div className="size- inline-flex justify-center items-center">
        {/* 이전 버튼 */}
        <div 
          className={`w-[33px] h-[116.5px] inline-flex justify-start items-center cursor-pointer ${
            currentPage === 0 ? 'opacity-0' : 'opacity-100 hover:opacity-70'
          }`}
          onClick={handlePreviousPage}
        >
          <Image 
            src="/icons/episodes-before.svg?v=2" 
            alt="이전 보기" 
            width={12} 
            height={22} 
            className="w-3 h-5.5"
          />
        </div>

        {/* 에피소드 슬라이드 컨테이너 */}
        <div 
          className="w-[464px] inline-flex flex-col justify-center items-start gap-0 py-4" 
          style={{ overflowX: 'hidden', overflowY: 'visible', minHeight: '120px' }}
        >
          {/* 에피소드 아이콘 슬라이드 */}
          <div className="relative w-full" style={{ overflow: 'visible' }}>
            <div 
              className="flex transition-transform duration-300 ease-in-out"
              style={{ 
                transform: `translateX(-${currentPage * 464}px)`,
                width: `${totalEpisodes * 80}px`
              }}
            >
              <div className="pl-2 inline-flex justify-start items-center overflow-visible">
                {episodes.map((episode, index) => {
                  const isSelected = selectedEpisodeIds.includes(episode.id);
                  const status = getEpisodeStatus(episode.scheduledAt);
                  const variant = getEpisodeVariant(status, isSelected);
                  const isLast = index === episodes.length - 1;

                  return (
                    <div 
                      key={episode.id}
                      data-episode-id={episode.id}
                      className="transition-opacity duration-200 overflow-visible"
                    >
                      <EpisodeItem 
                        property1={variant}
                        episodeNumber={episode.episodeNumber}
                        quarter={episode.quarter}
                        week={episode.week}
                        isLast={isLast}
                        isHovered={hoveredEpisodeId === episode.id}
                        onMouseEnter={() => handleMouseEnter(episode.id)}
                        onMouseMove={(e) => handleMouseMove(e, episode.id)}
                        onMouseLeave={handleMouseLeave}
                        onClick={() => handleEpisodeClick(episode.id, status)}
                        disableCursor={disableFutureEpisodes && (status === 'current' || status === 'future')}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 분기/주차 라벨 슬라이드 */}
          <div className="relative w-full overflow-hidden">
            <div 
              className="flex transition-transform duration-300 ease-in-out"
              style={{ 
                transform: `translateX(-${currentPage * 464}px)`,
                width: `${totalEpisodes * 80}px`
              }}
            >
              <div className="inline-flex justify-start items-start">
                {episodes.map((episode, index) => {
                  const isSelected = selectedEpisodeIds.includes(episode.id);
                  const status = getEpisodeStatus(episode.scheduledAt);
                  const isLast = index === episodes.length - 1;

                  return (
                    <div 
                      key={`label-${episode.id}`}
                      className="transition-opacity duration-200"
                    >
                      <QuarterWeekLabel 
                        variant={status}
                        quarter={episode.quarter}
                        week={episode.week}
                        isLast={isLast}
                        isSelected={isSelected}
                        isHovered={hoveredEpisodeId === episode.id}
                        onMouseEnter={() => handleMouseEnter(episode.id)}
                        onMouseMove={(e) => handleMouseMove(e, episode.id)}
                        onMouseLeave={handleMouseLeave}
                        onClick={() => handleEpisodeClick(episode.id, status)}
                        disableCursor={disableFutureEpisodes && (status === 'current' || status === 'future')}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 다음 버튼 */}
        <div 
          className={`w-[33px] h-[116.5px] inline-flex justify-end items-center cursor-pointer ${
            currentPage >= totalPages - 1 ? 'opacity-0' : 'opacity-100 hover:opacity-70'
          }`}
          onClick={handleNextPage}
        >
          <Image 
            src="/icons/episodes-after.svg?v=2" 
            alt="다음 보기" 
            width={12} 
            height={22} 
            className="w-3 h-5.5"
          />
        </div>
      </div>

      {/* 툴팁 */}
      {tooltipState.showTooltip && tooltipState.hoveredEpisodeId && (
        <div
          className="fixed z-50 px-2 py-1 text-xs bg-gray-800 text-white rounded shadow-lg pointer-events-none"
          style={{
            left: tooltipState.position.x,
            top: tooltipState.position.y,
            opacity: tooltipState.showTooltip ? 1 : 0,
            transition: 'opacity 0.2s ease-in-out'
          }}
        >
          {formatScheduledAt(episodes.find(e => e.id === tooltipState.hoveredEpisodeId)?.scheduledAt || '')}
        </div>
      )}
    </div>
  );
}
