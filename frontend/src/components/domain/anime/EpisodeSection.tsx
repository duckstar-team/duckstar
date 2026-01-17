import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from 'react';
import EpisodeItem from './EpisodeItem';
import QuarterWeekLabel from './QuarterWeekLabel';
import { cn, getThisWeekRecord } from '@/lib';
import {
  updateAnimeTotalEpisodes,
  setAnimeTotalEpisodesUnknown,
} from '@/api/search';
import { useAuth } from '@/context/AuthContext';
import { ChevronDown } from 'lucide-react';

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
  currentPage: number; // 부모에서 관리하는 페이지 상태
  onPageChange: (page: number) => void; // 페이지 변경 핸들러
  isMobile?: boolean; // 모바일 여부
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
const getEpisodeStatus = (
  scheduledAt: string
): 'past' | 'current' | 'future' => {
  const now = new Date();
  const episodeDate = new Date(scheduledAt);

  // 현재 시각과 에피소드 방영일 비교 (시간까지 고려)
  const timeDiff = episodeDate.getTime() - now.getTime();

  // 현재 시각의 분기/주차 계산
  const currentRecord = getThisWeekRecord(now);

  // 에피소드의 분기/주차 계산
  const episodeRecord = getThisWeekRecord(episodeDate);

  // 현재 시각에 해당하는 분기/주차의 에피소드인지 확인
  const isCurrentQuarterWeek =
    currentRecord.quarterValue === episodeRecord.quarterValue &&
    currentRecord.weekValue === episodeRecord.weekValue;

  if (timeDiff < 0) {
    return 'past'; // 이미 방영됨 (시간까지 지남)
  } else if (isCurrentQuarterWeek && timeDiff > 0) {
    return 'current'; // 현재 분기/주차의 에피소드 (아직 방영 안됨)
  } else {
    return 'future'; // 아직 방영 안됨
  }
};

// 에피소드 variant 결정 함수
const getEpisodeVariant = (
  status: 'past' | 'current' | 'future',
  isSelected: boolean
):
  | 'past'
  | 'current'
  | 'future'
  | 'filterSelectForPast'
  | 'filterSelectForCurrent' => {
  if (isSelected) {
    return status === 'current'
      ? 'filterSelectForCurrent'
      : 'filterSelectForPast';
  }
  return status;
};

export default function EpisodeSection({
  episodes,
  totalEpisodes,
  selectedEpisodeIds,
  onEpisodeClick,
  disableFutureEpisodes = false,
  animeId,
  currentPage,
  onPageChange,
  isMobile = false,
}: EpisodeSectionProps) {
  // 화면 크기 감지 (425px 미만에서 텍스트 크기 조정)
  const [isVerySmallScreen, setIsVerySmallScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsVerySmallScreen(window.innerWidth < 425);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(totalEpisodes || 12);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // 관리자 여부 확인
  const isAdmin = user?.role === 'ADMIN';

  // 드롭다운 핸들러
  const handleDropdownToggle = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleEpisodeSelect = (episodeId: number) => {
    onEpisodeClick(episodeId);
    setDropdownOpen(false);
  };

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
  // 화면 크기 감지
  useEffect(() => {
    const checkScreenSize = () => {
      if (isMobile) {
        setIsSmallScreen(window.innerWidth <= 600);
      } else {
        setIsSmallScreen(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, [isMobile]);

  const episodesPerPage = 6;
  // totalEpisodes가 0이면 기본값 12로 설정
  const effectiveTotalEpisodes = totalEpisodes > 0 ? totalEpisodes : 12;
  // 실제 에피소드 데이터의 길이를 기준으로 페이지 수 계산
  const totalPages = Math.ceil(episodes.length / episodesPerPage);

  // 호버 상태
  const [hoveredEpisodeId, setHoveredEpisodeId] = useState<number | null>(null);

  // 툴팁 상태
  const [tooltipState, setTooltipState] = useState<TooltipState>({
    hoveredEpisodeId: null,
    showTooltip: false,
    isMouseStopped: false,
    position: { x: 0, y: 0 },
    timeout: null,
    mouseMoveTimeout: null,
  });

  // 현재 페이지의 에피소드들
  const currentPageEpisodes = useMemo(() => {
    const startIndex = currentPage * episodesPerPage;
    return episodes.slice(startIndex, startIndex + episodesPerPage);
  }, [episodes, currentPage, episodesPerPage]);

  // 페이지 네비게이션 핸들러
  const handlePreviousPage = useCallback(() => {
    if (currentPage > 0) {
      onPageChange(currentPage - 1);
    }
  }, [currentPage, onPageChange]);

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages - 1) {
      onPageChange(currentPage + 1);
    }
  }, [currentPage, totalPages, onPageChange]);

  // 툴팁 관련 핸들러들
  const clearTooltipTimers = useCallback(() => {
    if (tooltipState.timeout) {
      clearTimeout(tooltipState.timeout);
    }
    if (tooltipState.mouseMoveTimeout) {
      clearTimeout(tooltipState.mouseMoveTimeout);
    }
  }, [tooltipState.timeout, tooltipState.mouseMoveTimeout]);

  const handleMouseEnter = useCallback(
    (episodeId: number) => {
      setHoveredEpisodeId(episodeId);
      setTooltipState((prev) => ({
        ...prev,
        hoveredEpisodeId: episodeId,
        isMouseStopped: false,
        showTooltip: false,
      }));
      clearTooltipTimers();
    },
    [clearTooltipTimers]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent, episodeId: number) => {
      setTooltipState((prev) => ({
        ...prev,
        isMouseStopped: false,
        showTooltip: false,
      }));
      clearTooltipTimers();

      const mouseX = e.pageX;
      const mouseY = e.pageY;

      const moveTimeout = setTimeout(() => {
        setTooltipState((prev) => ({
          ...prev,
          isMouseStopped: true,
          position: {
            x: mouseX + 10,
            y: mouseY - 30,
          },
        }));

        const newTooltipTimeout = setTimeout(() => {
          setTooltipState((prev) => ({
            ...prev,
            showTooltip: true,
          }));
        }, 500);

        setTooltipState((prev) => ({
          ...prev,
          timeout: newTooltipTimeout,
        }));
      }, 100);

      setTooltipState((prev) => ({
        ...prev,
        mouseMoveTimeout: moveTimeout,
      }));
    },
    [clearTooltipTimers]
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredEpisodeId(null);
    setTooltipState((prev) => ({
      ...prev,
      hoveredEpisodeId: null,
      showTooltip: false,
      isMouseStopped: false,
    }));
    clearTooltipTimers();
  }, [clearTooltipTimers]);

  // 에피소드 클릭 핸들러
  const handleEpisodeClick = useCallback(
    (episodeId: number, status: 'past' | 'current' | 'future') => {
      if (status === 'past' || status === 'current') {
        onEpisodeClick(episodeId);
      }
    },
    [onEpisodeClick]
  );

  return (
    <div className="flex w-full flex-col items-center justify-start gap-2.5">
      {/* 에피소드 헤더 */}
      <div
        className={`${isSmallScreen ? 'w-full max-w-[100%]' : 'w-full'} inline-flex h-5 items-center justify-start gap-3.5 px-6`}
      >
        <div
          className={`justify-start text-center leading-snug font-semibold ${isVerySmallScreen ? 'text-lg' : 'text-xl'}`}
        >
          에피소드 공개
        </div>
        <div className="flex items-center justify-start gap-1 text-center">
          {isEditing ? (
            // 편집 모드
            <div className="flex items-center gap-2">
              <span className="text-base leading-snug font-semibold">
                총 화수:
              </span>
              <input
                type="number"
                value={editValue}
                onChange={handleEditChange}
                min="1"
                max="999"
                className="w-16 rounded border border-gray-300 px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                disabled={isUpdating}
              />
              <span className="text-base leading-snug font-semibold">화</span>
              <div className="flex gap-1">
                <button
                  onClick={handleEditSave}
                  disabled={isUpdating}
                  className="cursor-pointer rounded bg-blue-500 px-2 py-1 text-xs text-white hover:bg-blue-600 disabled:opacity-50"
                >
                  {isUpdating ? '저장중...' : '저장'}
                </button>
                <button
                  onClick={handleEditCancel}
                  disabled={isUpdating}
                  className="cursor-pointer rounded bg-gray-500 px-2 py-1 text-xs text-white hover:bg-gray-600 disabled:opacity-50"
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
                  <span className="text-base leading-snug font-semibold">
                    총{' '}
                  </span>
                  <span className="text-base leading-snug font-semibold text-rose-800">
                    {totalEpisodes}
                  </span>
                  <span className="text-base leading-snug font-semibold">
                    {' '}
                    화
                  </span>
                </>
              ) : (
                <div className="group relative">
                  <div className="h-4 w-4 flex-shrink-0 cursor-help">
                    <img
                      src="/icons/info.svg"
                      alt="정보"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  {/* 툴팁 */}
                  <div className="pointer-events-none absolute top-full left-0 z-[9999] mt-1 rounded-md bg-gray-800 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    총 화수 정보를 준비 중입니다. (기본값: 12화)
                  </div>
                </div>
              )}
              {/* 관리자 편집 버튼 */}
              {isAdmin && (
                <div className="ml-2 flex gap-1">
                  <button
                    onClick={handleEditToggle}
                    className="cursor-pointer rounded bg-gray-100 px-2 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-200"
                  >
                    편집
                  </button>
                  <button
                    onClick={handleSetUnknown}
                    disabled={isUpdating}
                    className="cursor-pointer rounded bg-orange-100 px-2 py-1 text-xs text-orange-600 transition-colors hover:bg-orange-200 disabled:opacity-50"
                  >
                    {isUpdating ? '처리중...' : '모름'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 에피소드 프로그레스 바 또는 드롭다운 */}
      {isSmallScreen ? (
        /* 작은 화면: 드롭다운 */
        <div className="w-full max-w-[100%] px-6">
          <div className="relative">
            <button
              onClick={handleDropdownToggle}
              className="flex w-full items-center justify-between rounded-lg border border-gray-300 px-4 py-3 text-left transition hover:bg-gray-100 dark:border-zinc-700 dark:hover:bg-zinc-800/20"
            >
              <span className="text-base font-medium">
                {selectedEpisodeIds.length > 0
                  ? `선택된 에피소드: ${selectedEpisodeIds.length}개`
                  : '에피소드 선택'}
              </span>
              <ChevronDown
                className={cn(
                  'size-5 transition-transform dark:text-zinc-400',
                  dropdownOpen && 'rotate-180'
                )}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute top-full right-0 left-0 z-10 mt-1 max-h-60 overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                {episodes.map((episode) => {
                  const isSelected = selectedEpisodeIds.includes(episode.id);
                  const status = getEpisodeStatus(episode.scheduledAt);
                  const isDisabled =
                    disableFutureEpisodes &&
                    (status === 'current' || status === 'future');

                  return (
                    <button
                      key={episode.id}
                      onClick={() => handleEpisodeSelect(episode.id)}
                      disabled={isDisabled}
                      className={`w-full border-b border-gray-100 px-4 py-3 text-left last:border-b-0 dark:border-zinc-700 ${
                        isSelected
                          ? 'bg-blue-50 text-blue-700 dark:bg-zinc-800 dark:text-white'
                          : 'text-gray-700 hover:bg-gray-50 dark:text-white dark:hover:bg-zinc-800/20'
                      } ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">
                            {episode.episodeNumber}화
                          </div>
                          <div className="text-sm text-gray-500">
                            {episode.quarter} {episode.week} ·{' '}
                            {formatScheduledAt(episode.scheduledAt)}
                          </div>
                        </div>
                        {isSelected && (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500">
                            <svg
                              className="h-3 w-3 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* 큰 화면: 기존 슬라이더 */
        <div className="size- inline-flex items-center justify-center">
          {/* 이전 버튼 */}
          <div
            className={`inline-flex h-[116.5px] w-full max-w-[33px] cursor-pointer items-center justify-start ${
              currentPage === 0 ? 'opacity-0' : 'opacity-100 hover:opacity-70'
            }`}
            onClick={handlePreviousPage}
          >
            <img
              src="/icons/episodes-before.svg?v=2"
              alt="이전 보기"
              className="h-5.5 w-3"
            />
          </div>

          {/* 에피소드 슬라이드 컨테이너 */}
          <div
            className="inline-flex w-[500px] flex-col items-start justify-center gap-0 py-4"
            style={{
              overflowX: 'hidden',
              overflowY: 'visible',
              minHeight: '120px',
            }}
          >
            {/* 에피소드 아이콘 슬라이드 */}
            <div className="relative w-full" style={{ overflow: 'visible' }}>
              <div
                className="flex transition-transform duration-300 ease-in-out"
                style={{
                  transform: `translateX(-${currentPage * 464}px)`,
                  width: `${effectiveTotalEpisodes * 80}px`,
                }}
              >
                <div className="ml-2 inline-flex items-center justify-start overflow-visible pl-2">
                  {episodes.map((episode, index) => {
                    const isSelected = selectedEpisodeIds.includes(episode.id);
                    const status = getEpisodeStatus(episode.scheduledAt);
                    const variant = getEpisodeVariant(status, isSelected);
                    const isLast = index === episodes.length - 1;

                    return (
                      <div
                        key={episode.id}
                        data-episode-id={episode.id}
                        className="overflow-visible transition-opacity duration-200"
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
                          disableCursor={
                            disableFutureEpisodes &&
                            (status === 'current' || status === 'future')
                          }
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
                  width: `${effectiveTotalEpisodes * 80}px`,
                }}
              >
                <div className="ml-2 inline-flex items-start justify-center">
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
                          episodeNumber={episode.episodeNumber}
                          isLast={isLast}
                          isSelected={isSelected}
                          isHovered={hoveredEpisodeId === episode.id}
                          onMouseEnter={() => handleMouseEnter(episode.id)}
                          onMouseMove={(e) => handleMouseMove(e, episode.id)}
                          onMouseLeave={handleMouseLeave}
                          onClick={() => handleEpisodeClick(episode.id, status)}
                          disableCursor={
                            disableFutureEpisodes &&
                            (status === 'current' || status === 'future')
                          }
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
            className={`inline-flex h-[116.5px] w-full max-w-[33px] cursor-pointer items-center justify-end ${
              currentPage >= totalPages - 1
                ? 'opacity-0'
                : 'opacity-100 hover:opacity-70'
            }`}
            onClick={handleNextPage}
          >
            <img
              src="/icons/episodes-after.svg?v=2"
              alt="다음 보기"
              className="h-5.5 w-3"
            />
          </div>
        </div>
      )}

      {/* 툴팁 */}
      {tooltipState.showTooltip && tooltipState.hoveredEpisodeId && (
        <div
          className="pointer-events-none fixed z-50 rounded bg-gray-800 px-2 py-1 text-xs text-white shadow-lg"
          style={{
            left: tooltipState.position.x,
            top: tooltipState.position.y,
            opacity: tooltipState.showTooltip ? 1 : 0,
            transition: 'opacity 0.2s ease-in-out',
          }}
        >
          {formatScheduledAt(
            episodes.find((e) => e.id === tooltipState.hoveredEpisodeId)
              ?.scheduledAt || ''
          )}
        </div>
      )}
    </div>
  );
}
