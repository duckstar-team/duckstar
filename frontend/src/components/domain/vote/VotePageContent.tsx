'use client';

import React, { useState, useEffect, useRef } from 'react';
import BigCandidate from '@/components/domain/anime/BigCandidate';
import SmallCandidate from '@/components/domain/anime/SmallCandidate';
import AnimeCard from '@/components/domain/anime/AnimeCard';
import { getStarCandidates } from '@/api/vote';
import { AnimePreviewDto, LiveCandidateDto } from '@/types/dtos';
import {
  searchMatch,
  extractChosung,
  getVotedEpisodes,
  addVotedEpisodeWithTTL,
  removeVotedEpisode,
  queryConfig,
} from '@/lib';
import { useModal } from '@/components/layout/AppContainer';
import { useAuth } from '@/context/AuthContext';
import { getUpcomingAnimes } from '@/api/search';
import VoteBanner from './VoteBanner';
import { format, subDays, addHours, differenceInSeconds } from 'date-fns';
import VoteCandidateList from './VoteCandidateList';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import SearchBar from '@/components/domain/search/SearchBar';
import { useSidebarWidth } from '@/hooks/useSidebarWidth';
import { Stamp } from 'lucide-react';

export default function VotePageContent() {
  const { openLoginModal } = useModal();
  const { isAuthenticated, isLoading } = useAuth();

  // 클라이언트에서만 이 페이지에 한해 뷰포트를 디바이스 폭으로 임시 전환
  useEffect(() => {
    const head = document.head;
    if (!head) return;

    const existing = document.querySelector(
      'meta[name="viewport"]'
    ) as HTMLMetaElement | null;
    const prevContent = existing?.getAttribute('content') || '';

    // 디바이스 폭으로 설정
    if (existing) {
      existing.setAttribute(
        'content',
        'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
      );
    } else {
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content =
        'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';
      head.appendChild(meta);
    }

    // body의 min-width 오버라이드 (투표 페이지에서만)
    const body = document.body;
    const originalMinWidth = body.style.minWidth;
    const originalOverflowX = body.style.overflowX;

    body.style.minWidth = 'auto';
    body.style.overflowX = 'hidden';

    return () => {
      // viewport 설정 복원
      const current = document.querySelector(
        'meta[name="viewport"]'
      ) as HTMLMetaElement | null;
      if (current) {
        if (prevContent) {
          current.setAttribute('content', prevContent);
        } else {
          current.parentElement?.removeChild(current);
        }
      }

      // body 스타일 복원
      body.style.minWidth = originalMinWidth;
      body.style.overflowX = originalOverflowX;
    };
  }, []);

  // 분기 이름 매핑
  const getQuarterName = (quarter: number) => {
    switch (quarter) {
      case 1:
        return 'WINTER';
      case 2:
        return 'SPRING';
      case 3:
        return 'SUMMER';
      case 4:
        return 'AUTUMN';
      default:
        return 'SPRING';
    }
  };

  // 창 너비에 따른 동적 컨테이너 너비 계산 (그리드 최적화)
  const getOptimalContainerWidth = () => {
    // 창 너비에 따라 점진적으로 줄어드는 너비 (큰 화면부터)
    return 'max-w-[1320px] 2xl:max-w-[1320px] xl:max-w-[1000px] lg:max-w-[900px] md:max-w-[700px] sm:max-w-[500px]';
  };
  const queryClient = useQueryClient();
  const [fallbackAnimes, setFallbackAnimes] = useState<AnimePreviewDto[]>([]); // fallback 애니메이션 데이터
  const [isUsingFallback, setIsUsingFallback] = useState(false); // fallback 데이터 사용 여부

  // React Query를 사용한 별점 후보 조회
  const {
    data: starCandidatesData,
    isLoading: loading,
    error: queryError,
  } = useQuery({
    queryKey: ['starCandidates', isAuthenticated],
    queryFn: async () => {
      // 로그인 상태 확인이 완료될 때까지 대기
      if (isLoading) {
        throw new Error('로그인 상태 확인 중...');
      }
      const response = await getStarCandidates();
      if (!response.isSuccess) {
        throw new Error(response.message);
      }
      return response;
    },
    enabled: !isLoading, // 로그인 상태 확인 완료 후에만 실행
    ...queryConfig.vote,
  });

  // 데이터 추출
  const currentWeekLiveCandidates =
    starCandidatesData?.result?.currentWeekLiveCandidates || [];
  const lastWeekLiveCandidates =
    starCandidatesData?.result?.lastWeekLiveCandidates || [];
  const voteInfo = starCandidatesData?.result?.weekDto || null;
  const isFirstWeek = voteInfo?.quarter === 1 && voteInfo?.week === 1;
  const error = queryError
    ? queryError instanceof Error
      ? queryError.message
      : '별점 투표 후보자를 불러오는데 실패했습니다.'
    : null;
  const [currentWeekSearchQuery, setCurrentWeekSearchQuery] = useState(''); // 이번주차 검색 쿼리 상태
  const [lastWeekSearchQuery, setLastWeekSearchQuery] = useState(''); // 지난주차 검색 쿼리 상태
  const [randomAnimeTitle, setRandomAnimeTitle] = useState<string>(''); // 랜덤 애니메이션 제목 (이번주차용)
  const [lastWeekRandomTitle, setLastWeekRandomTitle] = useState<string>(''); // 랜덤 애니메이션 제목 (지난주차용)
  const [isCurrentWeekSearchBarSticky, setIsCurrentWeekSearchBarSticky] =
    useState(false); // 이번주차 검색바 스티키 상태
  const [isLastWeekSearchBarSticky, setIsLastWeekSearchBarSticky] =
    useState(false); // 지난주차 검색바 스티키 상태
  const [currentWeekSearchBarHeight, setCurrentWeekSearchBarHeight] =
    useState<number>(0); // 이번주차 검색창 높이
  const [lastWeekSearchBarHeight, setLastWeekSearchBarHeight] =
    useState<number>(0); // 지난주차 검색창 높이
  const currentWeekSearchBarRef = useRef<HTMLDivElement | null>(null);
  const lastWeekSearchBarRef = useRef<HTMLDivElement | null>(null);
  const [currentViewMode, setCurrentViewMode] = useState<'large' | 'small'>(
    'large'
  ); // 이번주차 뷰 모드 상태
  const [lastViewMode, setLastViewMode] = useState<'large' | 'small'>('large'); // 지난주차 뷰 모드 상태
  const [hasVotedCandidates, setHasVotedCandidates] = useState(false); // 중복 투표 방지 화면 표시 여부
  const [hasVotedEpisodes, setHasVotedEpisodes] = useState(false); // 비회원 투표 내역 로그인 버튼 표시 여부
  const [duplicatePreventionEndTime, setDuplicatePreventionEndTime] = useState<
    number | null
  >(null); // 중복 방지 종료 시간
  const sidebarWidth = useSidebarWidth();

  // 이번주차 뷰 모드 변경 핸들러
  const handleCurrentViewModeChange = (mode: 'large' | 'small') => {
    setCurrentViewMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('voteViewModeCurrent', mode);
    }
  };

  // 지난주차 뷰 모드 변경 핸들러
  const handleLastViewModeChange = (mode: 'large' | 'small') => {
    setLastViewMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('voteViewModeLast', mode);
    }
  };

  // 화면 크기에 따른 기본 뷰 모드 설정 및 저장된 뷰 모드 복원
  useEffect(() => {
    const handleResize = () => {
      if (typeof window === 'undefined') return;

      const savedCurrentViewMode = localStorage.getItem(
        'voteViewModeCurrent'
      ) as 'large' | 'small' | null;
      const savedLastViewMode = localStorage.getItem('voteViewModeLast') as
        | 'large'
        | 'small'
        | null;

      const defaultMode: 'large' | 'small' =
        window.innerWidth < 768 ? 'small' : 'large';

      setCurrentViewMode(savedCurrentViewMode || defaultMode);
      setLastViewMode(savedLastViewMode || defaultMode);
    };

    // 초기 로드 시 체크
    handleResize();

    // 리사이즈 이벤트 리스너
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // 로그아웃 시 중복 투표 방지 화면 관리
  useEffect(() => {
    if (isAuthenticated === false && duplicatePreventionEndTime) {
      // 로그아웃 상태에서 중복 방지 시간이 설정되어 있으면 화면 표시
      setHasVotedCandidates(true);

      // 시간이 지나면 자동으로 해제
      const timer = setTimeout(() => {
        setHasVotedCandidates(false);
        setDuplicatePreventionEndTime(null);
        localStorage.removeItem('duckstar_vote_block_until');
      }, duplicatePreventionEndTime * 1000);

      return () => clearTimeout(timer);
    } else if (isAuthenticated === true) {
      // 로그인 시 중복 방지 화면 해제
      setHasVotedCandidates(false);
      setDuplicatePreventionEndTime(null);
      localStorage.removeItem('duckstar_vote_block_until');
    }
  }, [isAuthenticated, duplicatePreventionEndTime]);

  // localStorage에서 중복 투표 방지 시간 확인
  useEffect(() => {
    if (isAuthenticated === false) {
      const blockUntil = localStorage.getItem('duckstar_vote_block_until');
      if (blockUntil) {
        const blockUntilTime = parseInt(blockUntil);
        const now = Date.now();

        if (now < blockUntilTime) {
          // 아직 차단 시간이 남아있음
          const timeLeftMs = blockUntilTime - now;
          setDuplicatePreventionEndTime(Math.floor(timeLeftMs / 1000));
        } else {
          // 차단 시간이 만료됨
          localStorage.removeItem('duckstar_vote_block_until');
        }
      }
    }
  }, [isAuthenticated]);

  // 투표 상태 업데이트 함수
  const updateVoteStatus = () => {
    const votedEpisodes = getVotedEpisodes();
    setHasVotedEpisodes(votedEpisodes.length > 0);
  };

  // 투표 완료 시 호출되는 핸들러
  const handleVoteComplete = async (
    episodeId: number,
    voteTimeLeft: number
  ) => {
    if (voteTimeLeft > 0) {
      // 투표 완료
      addVotedEpisodeWithTTL(episodeId, voteTimeLeft);
    } else {
      // 투표 회수
      removeVotedEpisode(episodeId);
    }
    // 즉시 상태 업데이트
    updateVoteStatus();
    // voterCount 업데이트를 위해 React Query 캐시 무효화 및 리패칭
    await queryClient.invalidateQueries({ queryKey: ['starCandidates'] });
  };

  // 검색 쿼리 변경 핸들러
  const handleCurrentWeekSearchQueryChange = (query: string) => {
    setCurrentWeekSearchQuery(query);
  };

  const handleLastWeekSearchQueryChange = (query: string) => {
    setLastWeekSearchQuery(query);
  };

  // 검색 필터링 함수 (초성 검색 포함)
  const filterCandidates = (candidates: LiveCandidateDto[], query: string) => {
    if (!query.trim()) return candidates;

    return candidates.filter((candidate) =>
      searchMatch(query, candidate.titleKor)
    );
  };

  // 검색 필터링 함수 (fallback 데이터용, 초성 검색 포함)
  const filterFallbackAnimes = (animes: AnimePreviewDto[], query: string) => {
    if (!query.trim()) return animes;

    return animes.filter((anime) => searchMatch(query, anime.titleKor));
  };

  // 투표 시간이 많이 남은 순서로 정렬하는 함수
  const sortCandidatesByVoteTimeRemaining = (
    candidates: LiveCandidateDto[]
  ): LiveCandidateDto[] => {
    const now = new Date();
    return [...candidates].sort((a, b) => {
      if (!a.scheduledAt || !b.scheduledAt) return 0;

      const voteEndTimeA = addHours(new Date(a.scheduledAt), 36);
      const voteEndTimeB = addHours(new Date(b.scheduledAt), 36);

      // 투표 종료 시간까지 남은 시간 계산
      const timeRemainingA = differenceInSeconds(voteEndTimeA, now);
      const timeRemainingB = differenceInSeconds(voteEndTimeB, now);

      // 내림차순 정렬 (많이 남은 순서대로)
      return timeRemainingB - timeRemainingA;
    });
  };

  // 필터링된 데이터
  const filteredcurrentWeekLiveCandidates = sortCandidatesByVoteTimeRemaining(
    filterCandidates(currentWeekLiveCandidates, currentWeekSearchQuery)
  );
  const filteredlastWeekLiveCandidates = sortCandidatesByVoteTimeRemaining(
    filterCandidates(lastWeekLiveCandidates, lastWeekSearchQuery)
  );
  const filteredFallbackAnimes = filterFallbackAnimes(
    fallbackAnimes,
    currentWeekSearchQuery
  );

  // 후보자 목록 렌더링 함수
  const renderLiveCandidates = (
    candidates: LiveCandidateDto[],
    filteredCandidates: LiveCandidateDto[],
    viewMode: 'large' | 'small'
  ) => {
    if (candidates.length === 0) return null;

    return (
      <div
        className={
          viewMode === 'large'
            ? `${
                filteredCandidates.length <= 3
                  ? 'flex flex-wrap items-center justify-center gap-4 sm:gap-6 lg:gap-[40px]'
                  : 'grid grid-cols-1 justify-items-center gap-6 sm:grid-cols-1 sm:gap-6 md:grid-cols-2 lg:grid-cols-2 lg:gap-[40px] xl:grid-cols-3 2xl:grid-cols-4'
              }`
            : 'flex flex-col gap-4 lg:grid lg:min-w-[500px] lg:grid-cols-2 lg:gap-4'
        }
      >
        {filteredCandidates.map((candidate) =>
          viewMode === 'large' ? (
            <BigCandidate
              key={candidate.episodeId}
              anime={candidate}
              isCurrentSeason={true}
              voteInfo={{
                year: candidate.year,
                quarter: candidate.quarter,
                week: candidate.week,
              }}
              starInfo={candidate.result.info}
              voterCount={candidate.result.voterCount}
              onVoteComplete={(episodeId: number, voteTimeLeft: number) =>
                handleVoteComplete(episodeId, voteTimeLeft)
              }
            />
          ) : (
            <SmallCandidate
              key={candidate.episodeId}
              anime={
                {
                  ...candidate,
                  ottDtos: [],
                  status: 'NOW_SHOWING' as const,
                  isBreak: false,
                  isRescheduled: null,
                } as AnimePreviewDto
              }
              isCurrentSeason={true}
              voteInfo={{
                year: candidate.year,
                quarter: candidate.quarter,
                week: candidate.week,
              }}
              starInfo={candidate.result.info}
              voterCount={candidate.result.voterCount}
              onVoteComplete={(episodeId: number, voteTimeLeft: number) =>
                handleVoteComplete(episodeId, voteTimeLeft)
              }
            />
          )
        )}
      </div>
    );
  };

  // 랜덤 placeholder 생성 함수
  const generateRandomPlaceholder = (
    animes: (LiveCandidateDto | AnimePreviewDto)[]
  ) => {
    if (animes.length === 0) return '';

    const randomIndex = Math.floor(Math.random() * animes.length);
    const selectedAnime = animes[randomIndex];
    const title = selectedAnime.titleKor;

    const chosung = extractChosung(title);
    const koreanCount = (title.match(/[가-힣]/g) || []).length;

    // 초성 추천 로직 (검색화면과 동일)
    const shouldShowChosung = (() => {
      // 숫자나 특수문자가 포함된 경우 초성 추천 제외
      const hasNumbers = /\d/.test(title);
      const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
        title
      );

      if (hasNumbers || hasSpecialChars) {
        return false;
      }

      // 1. 한글이 3글자 이상인 경우만 초성 추천 (정확도 우선)
      if (koreanCount >= 3 && chosung.length >= 3) {
        return true;
      }

      // 2. 한글이 2글자인 경우, 영문이 많지 않은 경우만 초성 추천
      if (koreanCount >= 2 && chosung.length >= 2) {
        const englishCount = (title.match(/[a-zA-Z]/g) || []).length;
        // 영문이 한글보다 많지 않은 경우만 초성 추천
        return englishCount <= koreanCount;
      }

      // 3. 그 외의 경우는 초성 추천하지 않음
      return false;
    })();

    if (shouldShowChosung) {
      const limitedChosung = chosung.slice(0, Math.min(4, chosung.length));
      return `${title} (예: ${limitedChosung}...)`;
    } else {
      return title;
    }
  };

  // fallback 데이터 가져오기 (곧 시작 그룹)
  const fetchFallbackCandidates = async () => {
    try {
      console.log(
        '투표 후보가 비어있어서 곧 시작 그룹을 fallback으로 사용합니다.'
      );
      setIsUsingFallback(true);

      const upcomingData = await getUpcomingAnimes();
      const noneSchedule = upcomingData.scheduleDtos.find(
        (dto) => dto.dayOfWeekShort === 'NONE'
      );
      const upcomingAnimes = noneSchedule?.animePreviews || [];

      // 남은 시간 순으로 정렬 (가장 가까운 시간부터)
      const sortedAnimes = upcomingAnimes.sort((a, b) => {
        const timeA = new Date(a.scheduledAt).getTime();
        const timeB = new Date(b.scheduledAt).getTime();
        return timeA - timeB; // 오름차순 정렬 (가장 가까운 시간이 먼저)
      });

      // AnimePreviewDto 형태로 저장 (검색화면과 동일한 형태)
      setFallbackAnimes(sortedAnimes);

      // API 응답에서 weekDto 정보 사용 (이미 설정되어 있음)
      // voteInfo는 이미 fetchStarCandidates에서 설정되었으므로 추가 설정 불필요
    } catch (fallbackError) {
      console.error('Fallback 데이터 가져오기 실패:', fallbackError);
      // React Query의 error는 별도로 처리되므로 여기서는 로그만 남김
    }
  };

  // 랜덤 placeholder 설정 (이번주차용)
  useEffect(() => {
    if (currentWeekLiveCandidates.length > 0) {
      const placeholder = generateRandomPlaceholder(currentWeekLiveCandidates);
      setRandomAnimeTitle(placeholder);
    } else if (fallbackAnimes.length > 0) {
      const placeholder = generateRandomPlaceholder(fallbackAnimes);
      setRandomAnimeTitle(placeholder);
    }
  }, [currentWeekLiveCandidates, fallbackAnimes]);

  // 랜덤 placeholder 설정 (지난주차용)
  useEffect(() => {
    if (lastWeekLiveCandidates.length > 0) {
      const placeholder = generateRandomPlaceholder(lastWeekLiveCandidates);
      setLastWeekRandomTitle(placeholder);
    }
  }, [lastWeekLiveCandidates]);

  // 검색창 높이 측정 (한 번만)
  useEffect(() => {
    if (currentWeekSearchBarRef.current) {
      const height =
        currentWeekSearchBarRef.current.getBoundingClientRect().height;
      if (height > 0) {
        setCurrentWeekSearchBarHeight(height);
      }
    }
    if (lastWeekSearchBarRef.current) {
      const height =
        lastWeekSearchBarRef.current.getBoundingClientRect().height;
      if (height > 0) {
        setLastWeekSearchBarHeight(height);
      }
    }
  }, []);

  // 검색바 스티키 처리 (이번주차와 지난주차 모두 처리)
  const lastScrollYRef = useRef(0);
  const currentStickyStartYRef = useRef<number | null>(null);
  const lastStickyStartYRef = useRef<number | null>(null);

  useEffect(() => {
    const headerOffset = 60;

    const handleStickyScroll = () => {
      const currentBar = currentWeekSearchBarRef.current;
      const lastBar = lastWeekSearchBarRef.current;
      const scrollY = window.scrollY;

      const isScrollingDown = scrollY > lastScrollYRef.current;
      lastScrollYRef.current = scrollY;

      let nextCurrentSticky = isCurrentWeekSearchBarSticky;
      let nextLastSticky = isLastWeekSearchBarSticky;

      const currentRectTop = currentBar
        ? currentBar.getBoundingClientRect().top
        : Infinity;
      const lastRectTop = lastBar
        ? lastBar.getBoundingClientRect().top
        : Infinity;

      if (isScrollingDown) {
        // 아래로 스크롤: 이번주차 → 지난주차 순서로 스티키 전환
        if (
          !isLastWeekSearchBarSticky &&
          lastBar &&
          lastRectTop <= headerOffset
        ) {
          // 지난주차 스티키 ON, 이번주차 OFF
          nextLastSticky = true;
          nextCurrentSticky = false;
          lastStickyStartYRef.current = scrollY;
        } else if (
          !nextLastSticky &&
          !isCurrentWeekSearchBarSticky &&
          currentBar &&
          currentRectTop <= headerOffset
        ) {
          // 이번주차 스티키 ON
          nextCurrentSticky = true;
          if (currentStickyStartYRef.current == null) {
            currentStickyStartYRef.current = scrollY;
          }
        }
      } else {
        // 위로 스크롤: 지난주차 스티키 해제 → 이번주차 스티키 → 이번주차 스티키 해제
        if (
          isLastWeekSearchBarSticky &&
          lastStickyStartYRef.current != null &&
          scrollY < lastStickyStartYRef.current
        ) {
          // 지난주차 스티키 해제
          nextLastSticky = false;

          // 해제 시점에서, 이번주차 위치가 헤더에 도달해 있다면 이번주차 스티키
          if (currentBar && currentRectTop <= headerOffset) {
            nextCurrentSticky = true;
            if (currentStickyStartYRef.current == null) {
              currentStickyStartYRef.current = scrollY;
            }
          }
        } else if (
          isCurrentWeekSearchBarSticky &&
          currentStickyStartYRef.current != null &&
          scrollY < currentStickyStartYRef.current
        ) {
          // 이번주차 스티키 해제 (더 위로 올라왔을 때)
          nextCurrentSticky = false;
        } else if (scrollY === 0) {
          // 맨 위로 올라오면 모두 해제
          nextCurrentSticky = false;
          nextLastSticky = false;
        }
      }

      if (nextCurrentSticky !== isCurrentWeekSearchBarSticky) {
        setIsCurrentWeekSearchBarSticky(nextCurrentSticky);
      }
      if (nextLastSticky !== isLastWeekSearchBarSticky) {
        setIsLastWeekSearchBarSticky(nextLastSticky);
      }
    };

    window.addEventListener('scroll', handleStickyScroll, { passive: true });
    // 첫 렌더 시에도 한 번 상태 맞춰줌
    handleStickyScroll();

    return () => {
      window.removeEventListener('scroll', handleStickyScroll);
    };
  }, [
    isCurrentWeekSearchBarSticky,
    isLastWeekSearchBarSticky,
    currentWeekLiveCandidates.length,
    lastWeekLiveCandidates.length,
  ]);

  // 비회원 투표 내역 업데이트
  useEffect(() => {
    const votedEpisodes = getVotedEpisodes();
    setHasVotedEpisodes(votedEpisodes.length > 0);
  }, [starCandidatesData]);

  // fallback 데이터 처리
  useEffect(() => {
    if (
      !loading &&
      starCandidatesData &&
      currentWeekLiveCandidates.length === 0
    ) {
      console.log(
        '투표 후보가 비어있어서 곧 시작 그룹을 fallback으로 사용합니다.'
      );
      fetchFallbackCandidates();
    } else if (currentWeekLiveCandidates.length > 0) {
      setIsUsingFallback(false);
    }
  }, [loading, starCandidatesData, currentWeekLiveCandidates.length]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto w-full max-w-[600px] px-2 py-3 sm:px-4 sm:py-6">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-600">투표 후보자를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto w-full max-w-[600px] px-2 py-3 sm:px-4 sm:py-6">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="text-center">
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 이미 투표한 후보가 있는 경우 투표 이력 화면 표시
  if (hasVotedCandidates) {
    return (
      <div className="bg-gray-50">
        <div className="w-full">
          {/* 배너 */}
          <div className="mb-4 flex justify-center">
            <div className="relative h-[99px] w-full overflow-hidden">
              {/* 모바일/태블릿용 배너 (1000px 너비) */}
              <img
                src="/banners/vote-banner-mobile.svg"
                alt="투표 배너"
                className="absolute inset-0 h-full w-full object-cover object-center xl:hidden"
              />
              {/* 데스크톱용 배너 */}
              <img
                src="/banners/vote-banner.svg"
                alt="투표 배너"
                className="absolute inset-0 hidden h-full w-full object-cover object-center xl:block"
              />
              {/* 배너 텍스트 오버레이 */}
              <div className="absolute inset-0 inline-flex flex-col items-center justify-center gap-1 sm:gap-0">
                <div
                  className="justify-center text-xl leading-tight font-bold text-white sm:text-2xl sm:leading-[1.2] md:text-3xl md:leading-[1.3] lg:text-4xl lg:leading-[50.75px]"
                  style={{ textShadow: '0 0 2px rgba(0,0,0,0.8)' }}
                >
                  {voteInfo
                    ? `${voteInfo.year} ${getQuarterName(
                        voteInfo.quarter
                      )} 애니메이션 투표`
                    : '애니메이션 투표'}
                </div>
                <div
                  className="-mt-[5px] h-6 justify-center self-stretch text-center text-sm font-light tracking-wide text-white sm:text-sm md:text-base"
                  style={{ textShadow: '0 0 1px rgba(0,0,0,0.8)' }}
                >
                  {voteInfo
                    ? `${voteInfo.startDate.replace(
                        /-/g,
                        '/'
                      )} - ${voteInfo.endDate.replace(/-/g, '/')} (${
                        voteInfo.quarter
                      }분기 ${voteInfo.week}주차)`
                    : ''}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 메인 컨텐츠 */}
        <div
          className={`w-full ${getOptimalContainerWidth()} mx-auto px-2 py-3 sm:px-4 sm:py-6`}
        >
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="text-center">
              <div className="mb-2 text-2xl">😎</div>
              <h2 className="mb-2 text-xl font-semibold">
                기존 투표 이력이 확인되었습니다
              </h2>
              <p className="mb-6 text-gray-600">
                이미 선택하신 후보의 투표 시간이 종료되면 접근 가능합니다.
              </p>
              <p className="mb-6 text-sm text-gray-500">
                투표한 적이 없으시다면, 중복 투표 방지를 위해 로그인이
                필요합니다.
              </p>
              <button
                onClick={openLoginModal}
                className="cursor-pointer rounded-lg px-6 py-2 font-semibold text-black transition-colors duration-200"
                style={{ backgroundColor: '#FED783' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#FED783';
                  e.currentTarget.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#FED783';
                  e.currentTarget.style.opacity = '1';
                }}
              >
                로그인하기
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="w-full">
        {/* 배너 */}
        <div className="mb-4 flex justify-center">
          <div className="relative h-[99px] w-full overflow-hidden">
            {/* 모바일/태블릿용 배너 (1000px 너비) */}
            <img
              src="/banners/vote-banner-mobile.svg"
              alt="투표 배너"
              className="absolute inset-0 h-full w-full object-cover object-center xl:hidden"
            />
            {/* 데스크톱용 배너 */}
            <img
              src="/banners/vote-banner.svg"
              alt="투표 배너"
              className="absolute inset-0 hidden h-full w-full object-cover object-center xl:block"
            />
            {/* 배너 텍스트 오버레이 */}
            <div className="absolute inset-0 inline-flex flex-col items-center justify-center gap-1 sm:gap-0">
              <div
                className="justify-center text-xl leading-tight font-bold text-white sm:text-2xl sm:leading-[1.2] md:text-3xl md:leading-[1.3] lg:text-4xl lg:leading-[50.75px]"
                style={{ textShadow: '0 0 2px rgba(0,0,0,0.8)' }}
              >
                {voteInfo
                  ? `${voteInfo.year} ${getQuarterName(
                      voteInfo.quarter
                    )} 애니메이션 투표`
                  : '애니메이션 투표'}
              </div>
              <div
                className="-mt-[5px] h-6 justify-center self-stretch text-center text-sm font-light tracking-wide text-white sm:text-sm md:text-base"
                style={{ textShadow: '0 0 1px rgba(0,0,0,0.8)' }}
              >
                {voteInfo
                  ? `${format(voteInfo.startDate, 'yyyy/MM/dd')} - ${format(
                      voteInfo.endDate,
                      'yyyy/MM/dd'
                    )} (${voteInfo.quarter}분기 ${voteInfo.week}주차)`
                  : ''}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 영역 */}
      <div className="mb-4 pt-4 pb-2 dark:bg-zinc-900">
        <div
          className={`w-full ${getOptimalContainerWidth()} mx-auto ${
            isUsingFallback ? 'mb-0' : 'mb-2'
          } flex flex-col items-center`}
        >
          {/* 투표 안내 텍스트 */}
          <div className="flex w-full items-center justify-between gap-4 px-10 max-lg:flex-col">
            <div className="flex w-fit max-w-full items-center justify-start gap-2 rounded-lg bg-zinc-200/50 py-1.5 pr-3 pl-2 text-sm font-medium dark:bg-zinc-800">
              <Stamp size={16} />
              마음에 든 애니메이션에 투표해주세요!
            </div>

            <div className="text-center text-gray-700 lg:text-right dark:text-zinc-300">
              <p className="mb-2">
                <span className="sm:hidden">
                  모든 후보는 방영 이후
                  <br />
                  36시간 이내에 투표할 수 있어요.
                </span>
                <span className="hidden sm:inline">
                  모든 후보는 방영 이후 36시간 이내에 투표할 수 있어요.
                </span>
              </p>
              <p className="text-sm text-gray-500 dark:text-zinc-400">
                <span className="sm:hidden">
                  *덕스타 투표 시 중복 방지를 위해
                  <br />
                  쿠키와 암호화된 IP 정보가 사용됩니다.
                </span>
                <span className="hidden sm:inline">
                  *덕스타 투표 시 중복 방지를 위해 쿠키와 암호화된 IP 정보가
                  사용됩니다.
                </span>
              </p>
            </div>
          </div>

          {/* 비로그인 투표 시 로그인 안내 버튼 */}
          {!isAuthenticated && hasVotedEpisodes && !isUsingFallback && (
            <div className="mt-4 flex w-full justify-center lg:justify-end lg:pr-10">
              <div className="group relative">
                <button
                  onClick={openLoginModal}
                  className="flex cursor-pointer items-center gap-1 text-base text-gray-500 transition-colors duration-200 hover:text-gray-700 dark:text-zinc-400"
                  style={{
                    borderBottom: '1px solid #c4c7cc',
                    lineHeight: '1.1',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderBottomColor = '#374151';
                    const svg = e.currentTarget.querySelector('svg');
                    if (svg) svg.style.stroke = '#374151';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderBottomColor = '#c4c7cc';
                    const svg = e.currentTarget.querySelector('svg');
                    if (svg) svg.style.stroke = '#9ca3af';
                  }}
                >
                  로그인으로 투표 내역 저장하기
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="#9ca3af"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>

                {/* 툴팁 */}
                <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 transform rounded-lg bg-gray-800 px-3 py-2 text-sm whitespace-nowrap text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100 before:absolute before:top-full before:left-1/2 before:-translate-x-1/2 before:transform before:border-4 before:border-transparent before:border-t-gray-800 before:content-['']">
                  현재까지 투표 내역 저장!
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 이번주차 검색창 섹션 */}
      <div
        ref={currentWeekSearchBarRef}
        className={`p-4 shadow-sm dark:shadow-none ${
          isCurrentWeekSearchBarSticky && !isLastWeekSearchBarSticky
            ? 'fixed top-[60px] right-0 z-20 bg-white/80 backdrop-blur-[6px] dark:bg-zinc-900/80'
            : 'mb-7 bg-white md:mb-8 dark:bg-zinc-900'
        }`}
        style={{
          left: `${sidebarWidth}px`,
          width: `calc(100vw - ${sidebarWidth}px)`,
        }}
      >
        <div
          className={`mx-auto flex w-full items-center justify-between gap-2 sm:gap-4 ${getOptimalContainerWidth()} `}
        >
          <div className="flex min-w-0 flex-1 justify-between">
            <div className="w-full max-w-xs sm:max-w-sm md:max-w-md">
              <SearchBar
                variant="simple"
                value={currentWeekSearchQuery}
                onChange={handleCurrentWeekSearchQueryChange}
                placeholder={randomAnimeTitle || '애니메이션 제목을 입력하세요'}
              />
            </div>
          </div>

          {/* 뷰 모드 토글 버튼 - 실제 투표 후보가 있을 때만 표시 */}
          {currentWeekLiveCandidates.length > 0 &&
            filteredcurrentWeekLiveCandidates.length > 0 && (
              <div className="flex flex-shrink-0 rounded-lg border border-gray-200 bg-gray-100 p-1 dark:border-none dark:bg-zinc-800">
                <button
                  onClick={() => handleCurrentViewModeChange('large')}
                  className={`rounded-lg px-4 py-2 text-xs font-medium transition-colors duration-200 sm:text-sm ${
                    currentViewMode === 'large'
                      ? 'border border-gray-200 bg-white text-gray-900 shadow-sm dark:border-none dark:bg-zinc-900 dark:text-zinc-300'
                      : 'text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-300'
                  }`}
                >
                  크게 보기
                </button>
                <button
                  onClick={() => handleCurrentViewModeChange('small')}
                  className={`rounded-lg px-4 py-2 text-xs font-medium transition-colors duration-200 sm:text-sm ${
                    currentViewMode === 'small'
                      ? 'border border-gray-200 bg-white text-gray-900 dark:border-none dark:bg-zinc-900 dark:text-zinc-300'
                      : 'text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-300'
                  }`}
                >
                  작게 보기
                </button>
              </div>
            )}
        </div>
      </div>
      {/* 스티키 검색창 placeholder - 레이아웃 점프 방지 */}
      {isCurrentWeekSearchBarSticky && !isLastWeekSearchBarSticky && (
        <div
          className="mb-7 md:mb-8"
          style={{ height: `${currentWeekSearchBarHeight || 80}px` }}
        ></div>
      )}

      <div
        className={`w-full ${getOptimalContainerWidth()} mx-auto p-3 px-2 sm:p-6 sm:px-4`}
      >
        {/* 이번주차 실시간 투표 섹션 */}
        <div className="mb-8">
          <div className="mb-8 text-2xl font-bold">실시간 투표</div>
          {!isUsingFallback ? (
            <>
              {renderLiveCandidates(
                currentWeekLiveCandidates,
                filteredcurrentWeekLiveCandidates,
                currentViewMode
              )}
              {/* 검색 결과가 없는 경우 (이번주차만) */}
              {currentWeekSearchQuery.trim() &&
                filteredcurrentWeekLiveCandidates.length === 0 && (
                  <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="text-center">
                      <p className="text-gray-600">
                        '{currentWeekSearchQuery}'에 대한 검색 결과가 없습니다.
                      </p>
                    </div>
                  </div>
                )}
              {/* 투표 가능한 애니메이션이 없는 경우 (이번주차만) */}
            </>
          ) : (
            <>
              {/* Fallback 데이터 섹션 (검색화면 컴포넌트 사용) */}
              {fallbackAnimes.length > 0 && (
                <div className="mb-8">
                  <div className="mb-6">
                    <div className="mb-6 flex items-end gap-2">
                      <h3 className="text-xl font-semibold">
                        이번 주차 곧 시작!
                      </h3>
                      <p className="text-sm text-gray-500">
                        12시간 이내 방영 예정인 애니메이션입니다.
                      </p>
                    </div>

                    {/* 검색화면과 동일한 그리드 레이아웃 */}
                    <div className="grid grid-cols-2 justify-items-center gap-[15px] sm:gap-[30px] lg:grid-cols-3 xl:grid-cols-4">
                      {filteredFallbackAnimes.map((anime) => (
                        <AnimeCard
                          key={anime.animeId}
                          anime={anime}
                          isCurrentSeason={true}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {/* 검색 결과가 없는 경우 (fallback 데이터) */}
              {currentWeekSearchQuery.trim() &&
                filteredFallbackAnimes.length === 0 && (
                  <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="text-center">
                      <p className="text-gray-600">
                        '{currentWeekSearchQuery}'에 대한 검색 결과가 없습니다.
                      </p>
                    </div>
                  </div>
                )}
              {/* Fallback 데이터도 비어있는 경우 */}
              {fallbackAnimes.length === 0 &&
                !currentWeekSearchQuery.trim() && (
                  <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="text-center">
                      <p className="text-gray-600">
                        곧 시작하는 애니메이션이 없습니다.
                      </p>
                    </div>
                  </div>
                )}
            </>
          )}

          {currentWeekLiveCandidates.length > 0 && (
            <div>
              {!isLoading && voteInfo && (
                <VoteCandidateList
                  year={voteInfo?.year}
                  quarter={voteInfo?.quarter}
                  week={voteInfo?.week}
                  searchQuery={currentWeekSearchQuery}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* 지난주차 실시간 투표 섹션 */}
      {lastWeekLiveCandidates.length > 0 && (
        <>
          {voteInfo && (
            <VoteBanner
              weekDto={{
                year: voteInfo.year,
                quarter: voteInfo.quarter,
                week: voteInfo.week - 1,
                startDate: format(
                  subDays(new Date(voteInfo.startDate), 7),
                  'yyyy-MM-dd'
                ),
                endDate: format(
                  subDays(new Date(voteInfo.endDate), 7),
                  'yyyy-MM-dd'
                ),
              }}
              customTitle={`${voteInfo.year} ${getQuarterName(
                voteInfo.quarter
              )} 지난 주차 투표`}
            />
          )}

          {/* 지난주차 검색창 섹션 */}
          <div
            ref={lastWeekSearchBarRef}
            className={`p-4 shadow-sm ${
              isLastWeekSearchBarSticky
                ? 'fixed top-[60px] right-0 z-20 bg-white/80 backdrop-blur-[6px]'
                : 'mt-4 mb-7 bg-white md:mb-8'
            }`}
            style={{
              left: `${sidebarWidth}px`,
              width: `calc(100vw - ${sidebarWidth}px)`,
            }}
          >
            <div
              className={`mx-auto flex items-center justify-between gap-2 sm:gap-4 ${getOptimalContainerWidth()} `}
            >
              <div className="flex min-w-0 flex-1 justify-between">
                <div className="w-full max-w-xs sm:max-w-sm md:max-w-md">
                  <SearchBar
                    variant="simple"
                    value={lastWeekSearchQuery}
                    onChange={handleLastWeekSearchQueryChange}
                    placeholder={
                      lastWeekRandomTitle || '애니메이션 제목을 입력하세요'
                    }
                  />
                </div>
              </div>

              {/* 뷰 모드 토글 버튼 - 실제 투표 후보가 있을 때만 표시 */}
              {lastWeekLiveCandidates.length > 0 &&
                filteredlastWeekLiveCandidates.length > 0 && (
                  <div className="flex flex-shrink-0 rounded-lg border border-gray-200 bg-gray-100 p-0.5 shadow-sm sm:p-1">
                    <button
                      onClick={() => handleLastViewModeChange('large')}
                      className={`rounded px-2 py-1 text-xs font-medium transition-colors duration-200 sm:px-4 sm:py-2 sm:text-sm ${
                        lastViewMode === 'large'
                          ? 'border border-gray-200 bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      크게 보기
                    </button>
                    <button
                      onClick={() => handleLastViewModeChange('small')}
                      className={`rounded px-2 py-1 text-xs font-medium transition-colors duration-200 sm:px-4 sm:py-2 sm:text-sm ${
                        lastViewMode === 'small'
                          ? 'border border-gray-200 bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      작게 보기
                    </button>
                  </div>
                )}
            </div>
          </div>
          {/* 스티키 검색창 placeholder - 레이아웃 점프 방지 */}
          {isLastWeekSearchBarSticky && (
            <div
              className="mb-7 md:mb-8"
              style={{ height: `${lastWeekSearchBarHeight || 80}px` }}
            ></div>
          )}

          <div
            className={`w-full ${getOptimalContainerWidth()} mx-auto p-3 px-2 sm:p-6 sm:px-4`}
          >
            <h1 className="mb-8 text-2xl font-bold">지난 주 실시간 투표</h1>

            {renderLiveCandidates(
              lastWeekLiveCandidates,
              filteredlastWeekLiveCandidates,
              lastViewMode
            )}
            {/* 검색 결과가 없는 경우 (지난주차만) */}
            {lastWeekSearchQuery.trim() &&
              filteredlastWeekLiveCandidates.length === 0 && (
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="text-center">
                    <p className="text-gray-600">
                      '{lastWeekSearchQuery}'에 대한 검색 결과가 없습니다.
                    </p>
                  </div>
                </div>
              )}
          </div>

          <div
            className={`w-full ${getOptimalContainerWidth()} mx-auto p-3 px-2 sm:p-6 sm:px-4`}
          >
            {!isLoading && voteInfo && (
              <VoteCandidateList
                title="지난 주 후보 목록"
                year={isFirstWeek ? voteInfo?.year - 1 : voteInfo?.year}
                quarter={isFirstWeek ? 4 : voteInfo?.quarter}
                week={isFirstWeek ? 13 : voteInfo?.week - 1}
                searchQuery={lastWeekSearchQuery}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
