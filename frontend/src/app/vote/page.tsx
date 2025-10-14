'use client';

import React, { useState, useEffect } from "react";
import BigCandidate from "@/components/anime/BigCandidate";
import SmallCandidate from "@/components/anime/SmallCandidate";
import AnimeCard from "@/components/anime/AnimeCard";
import SearchBar from "@/components/legacy-vote/SearchBar";
import { searchMatch, extractChosung } from "@/lib/searchUtils";
import { getStarCandidates } from "@/api/client";
import { StarCandidateDto } from "@/types/api";
import { getVotedEpisodes } from "@/lib/voteStorage";
import { useRouter } from "next/navigation";
import { useModal } from "@/components/AppContainer";
import { hasVoteCookieId, getCookie } from "@/lib/cookieUtils";
import { useAuth } from "@/context/AuthContext";
import { getUpcomingAnimes } from "@/api/search";
import { AnimePreviewDto } from "@/types/api";

export default function VotePage() {
  const router = useRouter();
  const { openLoginModal } = useModal();
  const { isAuthenticated, isLoading, user } = useAuth();

  // 클라이언트에서만 이 페이지에 한해 뷰포트를 디바이스 폭으로 임시 전환
  useEffect(() => {
    const head = document.head;
    if (!head) return;
    
    const existing = document.querySelector('meta[name="viewport"]') as HTMLMetaElement | null;
    const prevContent = existing?.getAttribute('content') || '';
    
    // 디바이스 폭으로 설정
    if (existing) {
      existing.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';
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
      const current = document.querySelector('meta[name="viewport"]') as HTMLMetaElement | null;
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
      case 1: return 'WINTER';
      case 2: return 'SPRING';
      case 3: return 'SUMMER';
      case 4: return 'AUTUMN';
      default: return 'SPRING';
    }
  };

  // 창 너비에 따른 동적 컨테이너 너비 계산 (그리드 최적화)
  const getOptimalContainerWidth = (candidateCount: number) => {
    // 창 너비에 따라 점진적으로 줄어드는 너비 (큰 화면부터)
    return 'max-w-[1320px] 2xl:max-w-[1320px] xl:max-w-[1000px] lg:max-w-[900px] md:max-w-[700px] sm:max-w-[500px]';
  };
  const [starCandidates, setStarCandidates] = useState<StarCandidateDto[]>([]);
  const [fallbackAnimes, setFallbackAnimes] = useState<AnimePreviewDto[]>([]); // fallback 애니메이션 데이터
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voteInfo, setVoteInfo] = useState<{year: number, quarter: number, week: number, startDate: string, endDate: string} | null>(null);
  const [hasVotedCandidates, setHasVotedCandidates] = useState(false);
  const [hasVotedEpisodes, setHasVotedEpisodes] = useState(false);
  const [isUsingFallback, setIsUsingFallback] = useState(false); // fallback 데이터 사용 여부
  const [searchQuery, setSearchQuery] = useState(""); // 검색 쿼리 상태
  const [randomAnimeTitle, setRandomAnimeTitle] = useState<string>(''); // 랜덤 애니메이션 제목
  const [isSearchBarSticky, setIsSearchBarSticky] = useState(false); // 검색바 스티키 상태
  const [viewMode, setViewMode] = useState<'large' | 'small'>('large'); // 뷰 모드 상태

  // 뷰 모드 변경 핸들러
  const handleViewModeChange = (mode: 'large' | 'small') => {
    setViewMode(mode);
    localStorage.setItem('voteViewMode', mode);
  };

  // 화면 크기에 따른 기본 뷰 모드 설정 및 저장된 뷰 모드 복원
  useEffect(() => {
    const handleResize = () => {
      const savedViewMode = localStorage.getItem('voteViewMode') as 'large' | 'small' | null;
      
      if (savedViewMode) {
        // 저장된 뷰 모드가 있으면 사용
        setViewMode(savedViewMode);
      } else {
        // 저장된 뷰 모드가 없으면 화면 크기에 따라 기본값 설정
        if (window.innerWidth < 768) {
          setViewMode('small');
        } else {
          setViewMode('large');
        }
      }
    };
    
    // 초기 로드 시 체크
    handleResize();
    
    // 리사이즈 이벤트 리스너
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // 투표 완료 시 호출되는 핸들러
  const handleVoteComplete = () => {
    // 이미 투표 이력이 있다면 업데이트하지 않음
    if (!hasVotedEpisodes) {
      setHasVotedEpisodes(true);
    }
  };

  // 검색 쿼리 변경 핸들러
  const handleSearchQueryChange = (query: string) => {
    setSearchQuery(query);
  };

  // 검색 필터링 함수 (초성 검색 포함)
  const filterCandidates = (candidates: StarCandidateDto[], query: string) => {
    if (!query.trim()) return candidates;
    
    return candidates.filter(candidate => 
      searchMatch(query, candidate.titleKor)
    );
  };

  // 검색 필터링 함수 (fallback 데이터용, 초성 검색 포함)
  const filterFallbackAnimes = (animes: AnimePreviewDto[], query: string) => {
    if (!query.trim()) return animes;
    
    return animes.filter(anime => 
      searchMatch(query, anime.titleKor)
    );
  };

  // 필터링된 데이터
  const filteredStarCandidates = filterCandidates(starCandidates, searchQuery);
  const filteredFallbackAnimes = filterFallbackAnimes(fallbackAnimes, searchQuery);

  // 랜덤 placeholder 생성 함수
  const generateRandomPlaceholder = (animes: (StarCandidateDto | AnimePreviewDto)[]) => {
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
      const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(title);
      
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
      console.log('투표 후보가 비어있어서 곧 시작 그룹을 fallback으로 사용합니다.');
      setIsUsingFallback(true);
      
      const upcomingData = await getUpcomingAnimes();
      const upcomingAnimes = upcomingData.schedule['곧 시작'] || [];
      
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
      setError('투표 후보를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  // 랜덤 placeholder 설정
  useEffect(() => {
    if (starCandidates.length > 0) {
      const placeholder = generateRandomPlaceholder(starCandidates);
      setRandomAnimeTitle(placeholder);
    } else if (fallbackAnimes.length > 0) {
      const placeholder = generateRandomPlaceholder(fallbackAnimes);
      setRandomAnimeTitle(placeholder);
    }
  }, [starCandidates, fallbackAnimes]);

  // 검색바 스티키 처리
  useEffect(() => {
    const handleStickyScroll = () => {
      const searchBarElement = document.querySelector('[data-search-bar]');
      if (!searchBarElement) return;
      
      const scrollY = window.scrollY;
      const searchBarRect = searchBarElement.getBoundingClientRect();
      const searchBarTop = searchBarRect.top + scrollY;
      
      // 검색바가 화면 상단에서 60px 지점을 지나면 스티키
      const shouldBeSticky = scrollY >= searchBarTop - 60 && window.scrollY > 100;
      
      if (shouldBeSticky !== isSearchBarSticky) {
        setIsSearchBarSticky(shouldBeSticky);
      }
    };

    // 스크롤 이벤트 리스너
    window.addEventListener('scroll', handleStickyScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleStickyScroll);
    };
  }, [isSearchBarSticky]);

  // 로그인 상태 변화 감지 - 로그아웃 시 즉시 투표 이력 화면 표시
  useEffect(() => {
    if (isAuthenticated === false) {
      
      const votedEpisodes = getVotedEpisodes();
      const hasVoteCookie = hasVoteCookieId();
      const currentEpisodeIds = starCandidates.map(candidate => candidate.episodeId);
      
      
      // 로그아웃 상태에서 투표 이력이 현재 에피소드와 겹치는 경우
      const hasVoted = !hasVoteCookie && votedEpisodes.some(episodeId => 
        currentEpisodeIds.includes(episodeId)
      );
      
      setHasVotedCandidates(hasVoted);
    }
  }, [isAuthenticated, starCandidates]);

  useEffect(() => {
    const fetchStarCandidates = async () => {
      try {
        setLoading(true);
        
        // 로그인 상태 확인이 완료될 때까지 대기
        if (isLoading) {
          return;
        }
        
        // AuthContext에서 이미 토큰을 확인하므로 백업 확인 불필요
        const actualLoginStatus = isAuthenticated;
        
        // 새로운 별점 투표 API 사용
        const response = await getStarCandidates();
        
        if (!response.isSuccess) {
          throw new Error(response.message);
        }

        
        // 투표 정보 저장 (API에서 weekDto 사용)
        if (response.result && response.result.weekDto) {
          setVoteInfo({
            year: response.result.weekDto.year,
            quarter: response.result.weekDto.quarter,
            week: response.result.weekDto.week,
            startDate: response.result.weekDto.startDate,
            endDate: response.result.weekDto.endDate
          });
        }

        const candidates = response.result?.starCandidates || [];
        setStarCandidates(candidates);
        
        // 후보가 비어있으면 fallback 데이터 사용
        if (candidates.length === 0) {
          console.log('투표 후보가 비어있어서 곧 시작 그룹을 fallback으로 사용합니다.');
          await fetchFallbackCandidates();
          return; // fallback 데이터 사용 시 기존 로직 건너뛰기
        }
        
        // vote_cookie_id가 없으면서 투표한 episodeId가 현재 투표 오픈한 에피소드에 포함되어 있는지 확인
        const votedEpisodes = getVotedEpisodes();
        const hasVoteCookie = hasVoteCookieId();
        const currentEpisodeIds = candidates.map((candidate: StarCandidateDto) => candidate.episodeId);
        
        
        // 겹치는 에피소드 확인
        const overlappingEpisodes = votedEpisodes.filter(episodeId => 
          currentEpisodeIds.includes(episodeId)
        );
        
        
        // 로그인하지 않았고, 투표한 episodeId 중에 현재 투표 오픈한 에피소드가 포함되어 있는 경우
        const hasVoted = !actualLoginStatus && !hasVoteCookie && votedEpisodes.some(episodeId => 
          currentEpisodeIds.includes(episodeId)
        );
        
        setHasVotedCandidates(hasVoted);
        
        // 투표 이력이 있는지 확인 (로그인하지 않은 상태에서)
        const allVotedEpisodes = getVotedEpisodes();
        setHasVotedEpisodes(allVotedEpisodes.length > 0);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : '별점 투표 후보자를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchStarCandidates();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="w-full max-w-[600px] mx-auto px-2 sm:px-4 py-3 sm:py-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-600 mt-2">투표 후보자를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="w-full max-w-[600px] mx-auto px-2 sm:px-4 py-3 sm:py-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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
          <div className="flex justify-center mb-4">
            <div className="relative w-full h-[99px] overflow-hidden">
              {/* 모바일/태블릿용 배너 (1000px 너비) */}
              <img 
                src="/banners/vote-banner-mobile.svg" 
                alt="투표 배너" 
                className="absolute inset-0 w-full h-full object-cover object-center xl:hidden"
              />
              {/* 데스크톱용 배너 */}
              <img 
                src="/banners/vote-banner.svg" 
                alt="투표 배너" 
                className="absolute inset-0 w-full h-full object-cover object-center hidden xl:block"
              />
              {/* 배너 텍스트 오버레이 */}
              <div className="absolute inset-0 inline-flex flex-col justify-center items-center gap-1 sm:gap-0">
                <div className="justify-center text-white text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold font-['Pretendard'] leading-tight sm:leading-[1.2] md:leading-[1.3] lg:leading-[50.75px]" style={{ textShadow: '0 0 2px rgba(0,0,0,0.8)' }}>
                  {voteInfo ? `${voteInfo.year} ${getQuarterName(voteInfo.quarter)} 애니메이션 투표` : '애니메이션 투표'}
                </div>
                <div className="self-stretch h-6 text-center justify-center text-white text-sm sm:text-sm md:text-base font-light font-['Pretendard'] -mt-[5px] tracking-wide" style={{ textShadow: '0 0 1px rgba(0,0,0,0.8)' }}>
                  {voteInfo ? `${voteInfo.startDate.replace(/-/g, '/')} - ${voteInfo.endDate.replace(/-/g, '/')} (${voteInfo.quarter}분기 ${voteInfo.week}주차)` : ''}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 메인 컨텐츠 */}
        <div className={`w-full ${getOptimalContainerWidth(starCandidates.length)} mx-auto px-2 sm:px-4 py-3 sm:py-6`}>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <div className="text-2xl mb-2">😎</div>
              <h2 className="text-xl font-semibold mb-2">기존 투표 이력이 확인되었습니다</h2>
              <p className="text-gray-600 mb-6">이미 선택하신 후보의 투표 시간이 종료되면 접근 가능합니다.</p>
              <p className="text-sm text-gray-500 mb-6">투표한 적이 없으시다면, 중복 투표 방지를 위해 로그인이 필요합니다.</p>
              <button
                onClick={openLoginModal}
                className="text-black font-semibold py-2 px-6 rounded-lg transition-colors duration-200 cursor-pointer"
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
    <div className="bg-gray-50">
      <div className="w-full">
        {/* 배너 */}
        <div className="flex justify-center mb-4">
          <div className="relative w-full h-[99px] overflow-hidden">
            {/* 모바일/태블릿용 배너 (1000px 너비) */}
            <img 
              src="/banners/vote-banner-mobile.svg" 
              alt="투표 배너" 
              className="absolute inset-0 w-full h-full object-cover object-center xl:hidden"
            />
            {/* 데스크톱용 배너 */}
            <img 
              src="/banners/vote-banner.svg" 
              alt="투표 배너" 
              className="absolute inset-0 w-full h-full object-cover object-center hidden xl:block"
            />
            {/* 배너 텍스트 오버레이 */}
            <div className="absolute inset-0 inline-flex flex-col justify-center items-center gap-1 sm:gap-0">
              <div className="justify-center text-white text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold font-['Pretendard'] leading-tight sm:leading-[1.2] md:leading-[1.3] lg:leading-[50.75px]" style={{ textShadow: '0 0 2px rgba(0,0,0,0.8)' }}>
                {voteInfo ? `${voteInfo.year} ${getQuarterName(voteInfo.quarter)} 애니메이션 투표` : '애니메이션 투표'}
              </div>
              <div className="self-stretch h-6 text-center justify-center text-white text-sm sm:text-sm md:text-base font-light font-['Pretendard'] -mt-[5px] tracking-wide" style={{ textShadow: '0 0 1px rgba(0,0,0,0.8)' }}>
                {voteInfo ? `${voteInfo.startDate.replace(/-/g, '/')} - ${voteInfo.endDate.replace(/-/g, '/')} (${voteInfo.quarter}분기 ${voteInfo.week}주차)` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 영역 */}
      <div className={`w-full ${getOptimalContainerWidth(starCandidates.length)} mx-auto px-2 sm:px-4 p-3 sm:p-6`}>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 pt-3 pb-1 md:pt-6 md:pb-2 mb-4">
          <div className={`${isUsingFallback ? 'mb-0' : 'mb-6'} flex flex-col items-center`}>
            {/* Fallback 데이터 사용 시 알림 */}
            {isUsingFallback && (
              <div className="bg-blue-50 border border-blue-200 flex h-8 sm:h-9 items-center justify-start pl-1 pr-2 sm:pl-2 sm:pr-3 lg:pr-5 py-0 rounded-lg w-fit max-w-full mb-4">
                <div className="flex gap-1 sm:gap-2 lg:gap-2.5 items-center justify-start px-1 sm:px-2 lg:px-2.5 py-0">
                  <div className="relative size-3 sm:size-4 overflow-hidden">
                    <div className="w-full h-full bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col font-['Pretendard',_sans-serif] font-semibold justify-center text-blue-700 text-xs sm:text-base min-w-0 flex-1">
                  <p className="leading-normal break-words">
                    현재 투표 가능한 애니메이션이 없습니다.
                  </p>
                </div>
              </div>
            )}
            
            {/* 기존 툴팁 컴포넌트 재사용 - fallback 사용 시 숨김 */}
            {!isUsingFallback && (
              <>
                <div className="bg-[#f1f2f3] flex h-8 sm:h-9 items-center justify-start pl-1 pr-2 sm:pl-2 sm:pr-3 lg:pr-5 py-0 rounded-lg w-fit max-w-full mb-4">
                  <div className="flex gap-1 sm:gap-2 lg:gap-2.5 items-center justify-start px-1 sm:px-2 lg:px-2.5 py-0">
                    <div className="relative size-3 sm:size-4 overflow-hidden">
                      <img
                        src="/icons/voteSection-notify-icon.svg"
                        alt="Notification Icon"
                        className="w-full h-full"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col font-['Pretendard',_sans-serif] font-semibold justify-center text-[#23272b] text-xs sm:text-base min-w-0 flex-1">
                    <p className="leading-normal break-words">
                      마음에 든 애니메이션을 투표해주세요!
                    </p>
                  </div>
                </div>
                
                <div className="text-gray-700 text-center">
                  <p className="mb-2">
                    <span className="sm:hidden">모든 후보는 방영 이후<br />36시간 이내에 투표할 수 있어요.</span>
                    <span className="hidden sm:inline">모든 후보는 방영 이후 36시간 이내에 투표할 수 있어요.</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    <span className="sm:hidden">*덕스타 투표 시 중복 방지를 위해<br />쿠키와 암호화된 IP 정보가 사용됩니다.</span>
                    <span className="hidden sm:inline">*덕스타 투표 시 중복 방지를 위해 쿠키와 암호화된 IP 정보가 사용됩니다.</span>
                  </p>
                </div>
              </>
            )}
            
            {/* 비로그인 투표 시 로그인 안내 버튼 - fallback 사용 시 숨김 */}
            {(!isAuthenticated && hasVotedEpisodes && !isUsingFallback) && (
              <div className="mt-4 flex justify-end">
                <div className="relative group">
                  <button 
                    onClick={openLoginModal}
                    className="text-gray-500 text-base hover:text-gray-700 transition-colors duration-200 flex items-center gap-1 cursor-pointer"
                    style={{ 
                      borderBottom: '1px solid #c4c7cc',
                      lineHeight: '1.1'
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
                    <svg className="w-4 h-4" fill="none" stroke="#9ca3af" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  
                  {/* 툴팁 */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50
                    bg-gray-800 text-white text-sm rounded-lg px-3 py-2 whitespace-nowrap shadow-lg
                    before:content-[''] before:absolute before:top-full before:left-1/2 before:transform before:-translate-x-1/2
                    before:border-4 before:border-transparent before:border-t-gray-800">
                    현재까지 투표 내역 저장!
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 검색창 섹션 */}
        <div 
          data-search-bar
          className={`${isSearchBarSticky ? `fixed top-[60px] left-1/2 lg:left-[calc(50%+100px)] transform -translate-x-1/2 z-10 w-full ${getOptimalContainerWidth(starCandidates.length)} px-4 backdrop-blur-md bg-white/80 rounded-b-lg` : 'rounded-lg'} bg-white shadow-sm border border-gray-200 p-4 mb-7 md:mb-8`}
        >
          <div className="flex flex-row items-center gap-2 sm:gap-4">
            <div className="flex justify-center flex-1 min-w-0">
              <div className="w-full max-w-xs sm:max-w-sm md:max-w-md">
                <SearchBar
                  value={searchQuery}
                  onChange={handleSearchQueryChange}
                  placeholder={randomAnimeTitle || "애니메이션 제목을 입력하세요"}
                />
              </div>
            </div>
            
            {/* 뷰 모드 토글 버튼 - 실제 투표 후보가 있을 때만 표시 */}
            {starCandidates.length > 0 && filteredStarCandidates.length > 0 && (
              <div className="flex bg-gray-100 rounded-lg p-0.5 sm:p-1 shadow-sm border border-gray-200 flex-shrink-0">
                <button
                  onClick={() => handleViewModeChange('large')}
                  className={`px-2 py-1 sm:px-4 sm:py-2 rounded text-xs sm:text-sm font-medium transition-colors duration-200 ${
                    viewMode === 'large' 
                      ? 'bg-white text-gray-900 shadow-sm border border-gray-200' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  크게 보기
                </button>
                <button
                  onClick={() => handleViewModeChange('small')}
                  className={`px-2 py-1 sm:px-4 sm:py-2 rounded text-xs sm:text-sm font-medium transition-colors duration-200 ${
                    viewMode === 'small' 
                      ? 'bg-white text-gray-900 shadow-sm border border-gray-200' 
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
        {isSearchBarSticky && (
          <div className="h-[80px] mb-7 md:mb-8"></div>
        )}

        {/* 별점 투표 후보자 섹션 */}
        {starCandidates.length > 0 && (
          <div className="mb-8">
            <div className={viewMode === 'large' 
              ? `${filteredStarCandidates.length <= 3 ? 'flex flex-wrap justify-center items-center gap-4 sm:gap-6 lg:gap-[40px]' : 'grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 sm:gap-6 lg:gap-[40px] justify-items-center'}` 
              : 'flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:gap-4 lg:min-w-[500px]'
            }>
              {filteredStarCandidates.map((candidate) => (
                viewMode === 'large' ? (
                        <BigCandidate
                          key={candidate.episodeId}
                          anime={{
                            animeId: candidate.animeId,
                            episodeId: candidate.episodeId,
                    mainThumbnailUrl: candidate.mainThumbnailUrl,
                    status: candidate.status,
                    isBreak: candidate.isBreak,
                    titleKor: candidate.titleKor,
                    dayOfWeek: candidate.dayOfWeek,
                    scheduledAt: candidate.scheduledAt,
                    isRescheduled: candidate.isRescheduled,
                    airTime: candidate.airTime,
                    genre: candidate.genre,
                    medium: candidate.medium,
                    ottDtos: []
                  }}
                  isCurrentSeason={true}
                  voteInfo={{
                    year: candidate.year,
                    quarter: candidate.quarter,
                    week: candidate.week
                  }}
                  starInfo={candidate.info}
                  onVoteComplete={handleVoteComplete}
                />
                ) : (
                  <SmallCandidate
                    key={candidate.episodeId}
                    anime={{
                      animeId: candidate.animeId,
                      episodeId: candidate.episodeId,
                      mainThumbnailUrl: candidate.mainThumbnailUrl,
                      status: candidate.status,
                      isBreak: candidate.isBreak,
                      titleKor: candidate.titleKor,
                      dayOfWeek: candidate.dayOfWeek,
                      scheduledAt: candidate.scheduledAt,
                      isRescheduled: candidate.isRescheduled,
                      airTime: candidate.airTime,
                      genre: candidate.genre,
                      medium: candidate.medium,
                      ottDtos: []
                    }}
                    isCurrentSeason={true}
                    voteInfo={{
                      year: candidate.year,
                      quarter: candidate.quarter,
                      week: candidate.week
                    }}
                    starInfo={candidate.info || undefined}
                    onVoteComplete={handleVoteComplete}
                  />
                )
              ))}
            </div>
          </div>
        )}

        {/* Fallback 데이터 섹션 (검색화면 컴포넌트 사용) */}
        {isUsingFallback && fallbackAnimes.length > 0 && (
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 pt-6 px-1 mb-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">곧 시작하는 애니메이션</h3>
                <p className="text-sm text-gray-600">12시간 이내 방영 예정인 애니메이션들입니다</p>
              </div>
              
              {/* 검색화면과 동일한 그리드 레이아웃 */}
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[15px] sm:gap-[30px] justify-items-center">
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

        {/* 검색 결과가 없는 경우 */}
        {searchQuery.trim() && filteredStarCandidates.length === 0 && !isUsingFallback && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <p className="text-gray-600">'{searchQuery}'에 대한 검색 결과가 없습니다.</p>
            </div>
          </div>
        )}

        {/* 검색 결과가 없는 경우 (fallback 데이터) */}
        {searchQuery.trim() && isUsingFallback && filteredFallbackAnimes.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <p className="text-gray-600">'{searchQuery}'에 대한 검색 결과가 없습니다.</p>
            </div>
          </div>
        )}

        {/* 투표 가능한 애니메이션이 없는 경우 */}
        {starCandidates.length === 0 && !isUsingFallback && !searchQuery.trim() && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <p className="text-gray-600">현재 투표 가능한 애니메이션이 없습니다.</p>
            </div>
          </div>
        )}

        {/* Fallback 데이터도 비어있는 경우 */}
        {isUsingFallback && fallbackAnimes.length === 0 && !searchQuery.trim() && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <p className="text-gray-600">곧 시작하는 애니메이션이 없습니다.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}