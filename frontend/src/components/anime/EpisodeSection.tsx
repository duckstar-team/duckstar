import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import EpisodeItem from './EpisodeItem';
import QuarterWeekLabel from './QuarterWeekLabel';
import { getThisWeekRecord } from '../../lib/quarterUtils';
import { updateAnimeTotalEpisodes, setAnimeTotalEpisodesUnknown } from '@/api/search';
import { useAuth } from '@/context/AuthContext';

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
  animeId: number; // animeId required로 변경
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
  const currentRecord = getThisWeekRecord(now);
  
  // 에피소드의 분기/주차 계산
  const episodeRecord = getThisWeekRecord(episodeDate);
  
  // 현재 시각에 해당하는 분기/주차의 에피소드인지 확인
  const isCurrentQuarterWeek = (currentRecord.quarterValue === episodeRecord.quarterValue && currentRecord.weekValue === episodeRecord.weekValue);
  
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
  disableFutureEpisodes = false,
  animeId
}: EpisodeSectionProps) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(totalEpisodes || 12);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // 관리자 여부 확인
  const isAdmin = user?.role === 'ADMIN';

  // 편집 모드 토글
  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    setEditValue(totalEpisodes || 12);
  };

  // 편집 값 변경
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setEditValue(value);
    }
  };

  // 편집 저장
  const handleEditSave = async () => {
    if (!animeId || isUpdating) {
      if (!animeId) {
        alert('애니메이션 ID가 없습니다.');
      }
      return;
    }
    
    try {
      setIsUpdating(true);
      await updateAnimeTotalEpisodes(animeId, editValue);
      setIsEditing(false);
      // 페이지 새로고침으로 최신 데이터 반영
      window.location.reload();
    } catch (error) {
      console.error('Failed to update total episodes:', error);
      alert('총 화수 업데이트에 실패했습니다.');
    } finally {
      setIsUpdating(false);
    }
  };

  // 편집 취소
  const handleEditCancel = () => {
    setIsEditing(false);
    setEditValue(totalEpisodes || 12);
  };

  // "모름" 버튼 처리
  const handleSetUnknown = async () => {
    if (!animeId || isUpdating) {
      if (!animeId) {
        alert('애니메이션 ID가 없습니다.');
      }
      return;
    }
    
    try {
      setIsUpdating(true);
      await setAnimeTotalEpisodesUnknown(animeId);
      // 페이지 새로고침으로 최신 데이터 반영
      window.location.reload();
    } catch (error) {
      console.error('Failed to set total episodes as unknown:', error);
      alert('총 화수를 "모름"으로 설정하는데 실패했습니다.');
    } finally {
      setIsUpdating(false);
    }
  };
  // 페이징 상태
  const [currentPage, setCurrentPage] = useState(0);
  const episodesPerPage = 6;
  // totalEpisodes가 0이면 기본값 12로 설정
  const effectiveTotalEpisodes = totalEpisodes > 0 ? totalEpisodes : 12;
  const totalPages = Math.ceil(effectiveTotalEpisodes / episodesPerPage);

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
      const currentRecord = getThisWeekRecord(new Date());
      
      const currentEpisodeIndex = episodes.findIndex(episode => {
        const episodeDate = new Date(episode.scheduledAt);
        const episodeRecord = getThisWeekRecord(episodeDate);
        
        return episodeRecord.quarterValue === currentRecord.quarterValue && episodeRecord.weekValue === currentRecord.weekValue;
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
        <div className="text-center justify-start flex items-center gap-1">
          {isEditing ? (
            // 편집 모드
            <div className="flex items-center gap-2">
              <span className="text-black text-base font-semibold font-['Pretendard'] leading-snug">총 화수:</span>
              <input
                type="number"
                value={editValue}
                onChange={handleEditChange}
                min="1"
                max="999"
                className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isUpdating}
              />
              <span className="text-black text-base font-semibold font-['Pretendard'] leading-snug">화</span>
              <div className="flex gap-1">
                <button
                  onClick={handleEditSave}
                  disabled={isUpdating}
                  className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 cursor-pointer"
                >
                  {isUpdating ? '저장중...' : '저장'}
                </button>
                <button
                  onClick={handleEditCancel}
                  disabled={isUpdating}
                  className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 cursor-pointer"
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            // 일반 모드
            <>
              {totalEpisodes && totalEpisodes > 0 ? (
                <>
                  <span className="text-black text-base font-semibold font-['Pretendard'] leading-snug">총 </span>
                  <span className="text-rose-800 text-base font-semibold font-['Pretendard'] leading-snug">{totalEpisodes}</span>
                  <span className="text-black text-base font-semibold font-['Pretendard'] leading-snug"> 화</span>
                </>
              ) : (
                <div className="relative group">
                  <div className="w-4 h-4 flex-shrink-0 cursor-help">
                    <img 
                      src="/icons/info.svg" 
                      alt="정보" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  {/* 툴팁 */}
                  <div className="absolute top-full left-0 mt-1 px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[9999]">
                    총 화수 정보를 준비 중입니다. (기본값: 12화)
                  </div>
                </div>
              )}
                      {/* 관리자 편집 버튼 */}
                      {isAdmin && (
                        <div className="ml-2 flex gap-1">
                          <button
                            onClick={handleEditToggle}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors cursor-pointer"
                          >
                            편집
                          </button>
                          <button
                            onClick={handleSetUnknown}
                            disabled={isUpdating}
                            className="px-2 py-1 text-xs bg-orange-100 text-orange-600 rounded hover:bg-orange-200 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {isUpdating ? '처리중...' : '모름'}
                          </button>
                        </div>
                      )}
            </>
          )}
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
          <img 
            src="/icons/episodes-before.svg?v=2" 
            alt="이전 보기" 
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
                width: `${effectiveTotalEpisodes * 80}px`
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
                width: `${effectiveTotalEpisodes * 80}px`
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
          <img 
            src="/icons/episodes-after.svg?v=2" 
            alt="다음 보기" 
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
