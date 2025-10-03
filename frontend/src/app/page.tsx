'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import HomeBanner from '@/components/banner/HomeBanner';
import ButtonVote from '@/components/button/ButtonVote';
import HeaderList from '@/components/header/HeaderList';
import HomeChart from '@/components/chart/HomeChart';
import ChartHeader from '@/components/header/ChartHeader';
import RightHeaderList from '@/components/header/RightHeaderList';
import AbroadRankInfo from '@/components/chart/AbroadRankInfo';
import { homeApi } from '@/api/home';
import { HomeDto, WeekDto, RankPreviewDto, DuckstarRankPreviewDto } from '@/types/api';
import { useSimpleScrollRestoration } from '@/hooks/useSimpleScrollRestoration';
import { queryConfig } from '@/lib/queryConfig';
import React from 'react';

// 순위 변동 타입 결정 함수
function getRankDiffType(rankDiff: number, consecutiveWeeks: number, isAnilab: boolean = false): "new" | "up-greater-equal-than-5" | "up-less-than-5" | "down-less-than-5" | "down-greater-equal-than-5" | "same-rank" | "Zero" {
  // rankDiff가 0이 아니면 up/down 우선 처리
  if (rankDiff > 0) {
    return rankDiff >= 5 ? "up-greater-equal-than-5" : "up-less-than-5";
  }
  if (rankDiff < 0) {
    return rankDiff <= -5 ? "down-greater-equal-than-5" : "down-less-than-5";
  }
  
  // 그 외의 경우 Zero, NEW, consecutive 판단
  
  // consecutiveWeeks가 2 이상일 때 same-rank
  if (consecutiveWeeks >= 2) {
    return "same-rank";
  }
  
  // consecutiveWeeks가 1일 때 NEW (anilab이 아닌 경우에만)
  if (consecutiveWeeks === 1 && !isAnilab) {
    return "new";
  }
  
  // anilab이거나 consecutiveWeeks가 0일 때 Zero
  return "Zero";
}

// 메달 타입 결정 함수
function getMedalType(rank: number): "Gold" | "Silver" | "Bronze" | "None" {
  if (rank === 1) return "Gold";
  if (rank === 2) return "Silver";
  if (rank === 3) return "Bronze";
  return "None";
}

export default function Home() {
  // 기존 상태 관리 유지 (점진적 최적화)
  const [rightPanelData, setRightPanelData] = useState<RankPreviewDto[]>([]);
  const [rightPanelLoading, setRightPanelLoading] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<WeekDto | null>(null);
  const [leftPanelData, setLeftPanelData] = useState<DuckstarRankPreviewDto[]>([]);
  const [isLeftPanelPrepared, setIsLeftPanelPrepared] = useState<boolean>(true);
  const [leftPanelLoading, setLeftPanelLoading] = useState(false);
  const [leftPanelError, setLeftPanelError] = useState<string | null>(null);
  const [anilabData, setAnilabData] = useState<RankPreviewDto[]>([]);
  const [animeCornerData, setAnimeCornerData] = useState<RankPreviewDto[]>([]);
  const [selectedRightTab, setSelectedRightTab] = useState<'anilab' | 'anime-corner'>('anime-corner');
  const [isClient, setIsClient] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // 홈 화면용 스크롤 키 생성 (주차별로 독립적인 스크롤 관리)
  const scrollKey = React.useMemo(() => {
    if (selectedWeek) {
      return `home-${selectedWeek.year}-${selectedWeek.quarter}-${selectedWeek.week}`;
    }
    return 'home-default';
  }, [selectedWeek]);

  // 단순화된 스크롤 복원 훅 사용 (성능 최적화)
  const {
    saveScrollPosition,
    restoreScrollPosition,
    scrollToTop
  } = useSimpleScrollRestoration();

  // React Query를 사용한 홈 데이터 페칭 (통일된 캐싱 전략)
  const { data: homeData, error, isLoading } = useQuery({
    queryKey: ['home'],
    queryFn: () => homeApi.getHome(10),
    ...queryConfig.home, // 통일된 홈 데이터 캐싱 전략 적용
  });

  // 클라이언트 렌더링 확인
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 홈 상태 저장 함수
  const saveHomeState = React.useCallback(() => {
    if (selectedWeek) {
      sessionStorage.setItem('home-selected-week', JSON.stringify(selectedWeek));
    }
    if (selectedRightTab) {
      sessionStorage.setItem('home-selected-tab', selectedRightTab);
    }
    sessionStorage.setItem('home-state-save', 'true');
  }, [selectedWeek, selectedRightTab]);

  // 홈 상태 복원 함수
  const restoreHomeState = React.useCallback(() => {
    const savedWeek = sessionStorage.getItem('home-selected-week');
    const savedTab = sessionStorage.getItem('home-selected-tab');
    
    if (savedWeek) {
      try {
        const weekData = JSON.parse(savedWeek);
        setSelectedWeek(weekData);
      } catch (error) {
        console.error('🏠 주차 복원 실패:', error);
      }
    }
    
    if (savedTab && (savedTab === 'anilab' || savedTab === 'anime-corner')) {
      setSelectedRightTab(savedTab);
    }
  }, []);

  // 상태 변경 시 자동 저장
  useEffect(() => {
    if (isInitialized) {
      saveHomeState();
    }
  }, [selectedWeek, selectedRightTab, isInitialized, saveHomeState]);

  // React Query 데이터 처리
  useEffect(() => {
    if (homeData?.result) {
      
      // 초기 데이터 설정
      const initialAnilabData = homeData.result.weeklyTopDto.anilabRankPreviews || [];
      const initialAnimeCornerData = homeData.result.weeklyTopDto.animeCornerRankPreviews || [];
      
      
      setAnilabData(initialAnilabData); // Anilab 데이터 별도 저장
      setAnimeCornerData(initialAnimeCornerData); // Anime Corner 데이터 별도 저장
      
      // 근본적 해결: 데이터 설정은 useEffect에서 자동 처리
      
      // Left Panel 초기 데이터 설정
      const initialDuckstarData = homeData.result.weeklyTopDto.duckstarRankPreviews || [];
      const initialIsPrepared = homeData.result.weeklyTopDto.isPrepared;
      
      setLeftPanelData(initialDuckstarData); // Left Panel 초기값 설정
      setIsLeftPanelPrepared(initialIsPrepared); // Left Panel 준비 상태 초기값 설정
      
      
      // 초기 Right Panel 데이터 설정 (기본적으로 Anilab)
      setRightPanelData(initialAnilabData);
      
      // 홈 상태 복원 시도
      restoreHomeState();
      
      // 복원된 상태가 없을 때만 기본 주차 설정
      const shouldRestore = sessionStorage.getItem('home-state-save') === 'true';
      const hasRestoredWeek = sessionStorage.getItem('home-selected-week');
      
        if (!shouldRestore && !hasRestoredWeek && !selectedWeek) {
          const pastWeeks = homeData.result.pastWeekDtos;
          if (pastWeeks.length > 0) {
            setSelectedWeek(pastWeeks[0]);
          }
        }
      
      // 근본적 해결: 상태 복원은 useEffect에서 자동 처리
      
      setIsInitialized(true);
    }
  }, [homeData]);

  // 비상대책: 홈 스크롤 탑 로직 완전 단순화
  useEffect(() => {
    if (isInitialized && homeData?.result) {
      // 홈 스크롤 탑 플래그가 있으면 무조건 스크롤 탑으로 이동 (다른 조건 무시)
      const isHomeScrollTop = sessionStorage.getItem('home-scroll-top') === 'true';
      
      if (isHomeScrollTop) {
        scrollToTop();
        // 모든 플래그 정리
        sessionStorage.clear();
        return;
      }
      
      // 홈 스크롤 탑이 아닌 경우에만 애니 상세화면에서 돌아온 스크롤 복원 처리
      const savedY = sessionStorage.getItem(`scroll-${scrollKey}`);
      const isFromAnimeDetail = sessionStorage.getItem('from-anime-detail') === 'true';
      
      if (savedY && isFromAnimeDetail) {
        const y = parseInt(savedY);
        
        // 페이지 로드 즉시 복원 (애니메이션 없이)
        window.scrollTo({
          top: y,
          left: 0,
          behavior: 'instant'
        });
        document.body.scrollTop = y;
        document.documentElement.scrollTop = y;
        
        // 추가 즉시 복원 (확실하게)
        setTimeout(() => {
          window.scrollTo({
            top: y,
            left: 0,
            behavior: 'instant'
          });
          document.body.scrollTop = y;
          document.documentElement.scrollTop = y;
        }, 0);
      }
    }
  }, [isInitialized, homeData, scrollKey]);

  // 비상대책: 데이터 로드 후 스크롤 복원 로직 단순화
  useEffect(() => {
    if (homeData?.result && isInitialized) {
      // 홈 스크롤 탑 플래그가 있으면 무조건 스크롤 탑으로 이동 (다른 조건 무시)
      const isHomeScrollTop = sessionStorage.getItem('home-scroll-top') === 'true';
      
      if (isHomeScrollTop) {
        scrollToTop();
        // 모든 플래그 정리
        sessionStorage.clear();
        return;
      }
      
      // 홈 스크롤 탑이 아닌 경우에만 애니 상세화면에서 돌아온 스크롤 복원 처리
      const savedY = sessionStorage.getItem(`scroll-${scrollKey}`);
      const isFromAnimeDetail = sessionStorage.getItem('from-anime-detail') === 'true';
      
      if (savedY && isFromAnimeDetail) {
        const y = parseInt(savedY);
        
        // 실제 스크롤 컨테이너에 복원
        const mainElement = document.querySelector('main');
        if (mainElement) {
          (mainElement as any).scrollTop = y;
        } else {
          // 폴백: window 스크롤
          window.scrollTo(0, y);
        }
        
        // 애니 상세화면에서 돌아온 경우 현재 주차의 데이터 다시 로드
        if (selectedWeek) {
          
          // 현재 주차의 데이터를 다시 로드하여 모든 패널 업데이트
          handleLeftPanelWeekChange(selectedWeek);
        }
        
        // 플래그 정리
        sessionStorage.removeItem('from-anime-detail');
        sessionStorage.removeItem('to-anime-detail');
      }
    }
  }, [homeData, isInitialized, scrollKey, selectedWeek]);

  // 복원된 주차 데이터 로드 (안정화)
  useEffect(() => {
    if (isInitialized && homeData?.result) {
      const savedWeek = sessionStorage.getItem('home-selected-week');
      
      if (savedWeek) {
        try {
          const weekData = JSON.parse(savedWeek);
          
          // 복원된 주차 데이터 로드
          handleLeftPanelWeekChange(weekData);
          
        } catch (error) {
console.error('🏠 복원된 주차 데이터 로드 실패:', error);
        }
      }
    }
  }, [isInitialized, homeData]);

  // 탭 변경 핸들러 (로딩 없이 즉시 표시)
  const handleRightPanelTabChange = (tab: 'anilab' | 'anime-corner') => {
    setSelectedRightTab(tab);
    updateRightPanelData(tab);
  };

  // Right Panel 데이터 업데이트 함수 (리팩토링)
  const updateRightPanelData = (tab: 'anilab' | 'anime-corner', newAnilabData?: any[], newAnimeCornerData?: any[]) => {
    const currentAnilabData = newAnilabData || anilabData;
    const currentAnimeCornerData = newAnimeCornerData || animeCornerData;
    
    if (tab === 'anilab') {
      setRightPanelData(currentAnilabData);
    } else if (tab === 'anime-corner') {
      setRightPanelData(currentAnimeCornerData);
      if (currentAnimeCornerData.length === 0) {
        // Anime Corner 데이터 없음
      }
    }
  };

  // 탭 상태 변경 시 Right Panel 데이터 업데이트 - 근본적 해결
  useEffect(() => {
    if (!selectedRightTab) return;
    
    // 현재 탭에 맞는 데이터를 직접 설정
    const targetData = selectedRightTab === 'anime-corner' ? animeCornerData : anilabData;
    
    // 데이터가 있고 현재 표시된 데이터와 다르면 업데이트
    if (targetData.length > 0 && JSON.stringify(rightPanelData) !== JSON.stringify(targetData)) {
      setRightPanelData(targetData);
    }
  }, [selectedRightTab, anilabData, animeCornerData, rightPanelData]);

  // 주차별 데이터 일관성 모니터링
  useEffect(() => {
    if (selectedWeek && isInitialized) {
      const dataConsistency = {
        week: selectedWeek,
        leftPanel: leftPanelData.length,
        right1: anilabData.length,
        right2: animeCornerData.length,
        currentTab: selectedRightTab
      };
      
      
      // 데이터 일관성 검증
      const isConsistent = leftPanelData.length > 0 && anilabData.length > 0;
      if (!isConsistent) {
        console.warn('🏠 ⚠️ 패널 데이터 불일치 감지');
      }
    }
  }, [selectedWeek, leftPanelData, anilabData, animeCornerData, selectedRightTab, isInitialized]);

  // 주차 변경 핸들러 (모든 패널 데이터를 함께 로드)
  const handleLeftPanelWeekChange = async (week: WeekDto) => {
    // 주차 변경 시에는 스크롤 복원하지 않음 (주차 변경은 스크롤 복원 불필요)
    
    setSelectedWeek(week);
    
    try {
      setLoadingStates(true);
      clearErrorState();
      
      // 선택된 주차의 모든 데이터 조회
      const response = await homeApi.getAnimeRank(week.year, week.quarter, week.week, 10);
      
      if (response.isSuccess) {
        await updateAllPanelData(response.result, week);
        // 주차 변경 시에는 스크롤 복원하지 않음
      } else {
        handleWeekChangeError(`데이터 로딩 실패: ${response.message}`);
      }
    } catch (err) {
      handleWeekChangeError(`데이터 로딩 에러: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
    } finally {
      setLoadingStates(false);
    }
  };

  // 현재 스크롤 위치 저장 (애니 상세화면에서 돌아올 때만 사용)
  const saveCurrentScrollPosition = () => {
    const currentScrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    if (currentScrollY > 0) {
      sessionStorage.setItem(`scroll-${scrollKey}`, currentScrollY.toString());
    }
  };

  // 로딩 상태 설정
  const setLoadingStates = (loading: boolean) => {
    setRightPanelLoading(loading);
    setLeftPanelLoading(loading);
  };

  // 모든 패널 데이터 업데이트 (리팩토링)
  const updateAllPanelData = async (weeklyTopData: any, week: WeekDto) => {
    const newDuckstarData = weeklyTopData.duckstarRankPreviews || [];
    const newIsPrepared = weeklyTopData.isPrepared;
    const newAnilabData = weeklyTopData.anilabRankPreviews || [];
    const newAnimeCornerData = weeklyTopData.animeCornerRankPreviews || [];
    
    // 모든 패널 데이터 업데이트
    setLeftPanelData(newDuckstarData);
    setIsLeftPanelPrepared(newIsPrepared);
    setAnilabData(newAnilabData);
    setAnimeCornerData(newAnimeCornerData);
    
    // 현재 탭에 따라 Right Panel 표시 데이터 업데이트
    updateRightPanelData(selectedRightTab, newAnilabData, newAnimeCornerData);
    
    // 상태 업데이트 확인
    setTimeout(() => {
    }, 100);
  };

  // 주차 변경 에러 처리 (개선)
  const handleWeekChangeError = (errorMessage: string) => {
    setLeftPanelError(errorMessage);
  };

  // 에러 상태 초기화 (개선)
  const clearErrorState = () => {
    setLeftPanelError(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">오류가 발생했습니다: {error.message}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (!homeData?.result) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans bg-white">
      {/* 상단 홈 배너 */}
      <div className="w-full h-[280px] relative overflow-hidden">
        {/* 배경 배너 이미지 */}
        <img
          src="/banners/home-banner.svg"
          alt="덕스타 홈 배너"
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* 텍스트 오버레이 */}
        <div className="absolute inset-0 flex items-center justify-center px-4">
          <div className="text-white font-bold text-[33.83px] leading-tight text-left" style={{ fontFamily: 'Pretendard' }}>
          분기 신작 애니메이션 투표,<br />
          시간표 서비스 ✨ 한국에서 런칭 !
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 영역 */}
      <div className="flex items-center justify-center min-h-[300px] bg-[#F8F9FA]">
        {/* 리스트 아이템들 - 가로 배치 */}
        <div className="flex justify-center items-center gap-[75px] pr-[20px]">
          {/* HomeBanner 컴포넌트 */}
          <HomeBanner 
            homeBannerDtos={homeData.result.homeBannerDtos}
          />
          
          {/* ButtonVote 컴포넌트 */}
          <ButtonVote 
            weekDtos={[homeData.result.currentWeekDto, ...homeData.result.pastWeekDtos]}
          />
        </div>
      </div>

      {/* 헤더 리스트 영역 */}
      <div className="w-full bg-white pt-3 sticky top-[60px] z-20">
        <div className="flex justify-center gap-[57px]">
          {/* Left Panel 헤더 */}
          <HeaderList 
            weekDtos={homeData.result.pastWeekDtos} 
            selectedWeek={selectedWeek}
            onWeekChange={handleLeftPanelWeekChange}
          />
          {/* Right Panel 헤더 */}
          <RightHeaderList 
            weekDtos={homeData.result.pastWeekDtos} 
            selectedTab={selectedRightTab}
            onTabChange={handleRightPanelTabChange}
          />
        </div>
      </div>

      {/* 메인 컨텐츠 영역 - Left Panel + Right Panel */}
      <div className="w-full bg-[#F8F9FA] py-6">
        <div className="flex justify-center gap-[57px]">
          {/* Left Panel */}
          <div className="flex flex-col items-center gap-4">
            {leftPanelLoading ? (
              <div className="w-[750px] h-[600px] bg-white rounded-xl border border-[#D1D1D6] p-5">
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-800"></div>
                  <span className="ml-3 text-gray-600">Left Panel 데이터 로딩 중...</span>
                </div>
              </div>
            ) : leftPanelError ? (
              <div className="w-[750px] h-[600px] bg-white rounded-xl border border-[#D1D1D6] p-5">
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="text-red-500 text-4xl mb-2">⚠️</div>
                  <h3 className="text-lg font-semibold text-red-600 mb-2">데이터 로딩 실패</h3>
                  <p className="text-sm text-gray-600 text-center mb-4">{leftPanelError}</p>
                  <button 
                    onClick={() => window.location.reload()} 
                    className="px-4 py-2 bg-rose-500 text-white rounded hover:bg-rose-600 text-sm"
                  >
                    다시 시도
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-[750px] h-[1144px]">
                <HomeChart 
                  duckstarRankPreviews={leftPanelData || []}
                  isPrepared={isLeftPanelPrepared}
                />
              </div>
            )}
          </div>
          
          {/* Right Panel */}
          <div className="w-[373px] h-[1144px] bg-white rounded-xl border border-[#D1D1D6]">
            {/* Right Panel 컨텐츠 */}
            <div className="flex flex-col">
              {rightPanelLoading ? (
                <div className="flex items-center justify-center h-32 p-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-rose-800"></div>
                </div>
              ) : rightPanelData.length > 0 ? (
                // Right Panel 데이터 표시 - 스크롤 제거, 자연스러운 높이
                <div className="pl-6.5 pt-2">
                  {/* 정보 아이콘 */}
                  <div className="mb-1 flex items-center justify-end gap-2 pr-3">
                    <div className="relative group">
                      <a 
                        href={selectedRightTab === 'anilab' 
                          ? 'https://anilabb.com/rate/anime' 
                          : 'https://animecorner.me/category/anime-corner/rankings/anime-of-the-week/'
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-4 h-4 flex-shrink-0 cursor-pointer block"
                      >
                        <img 
                          src="/icons/info.svg" 
                          alt="정보" 
                          className="w-full h-full object-contain"
                        />
                      </a>
                      {/* 툴팁 */}
                      <div className="absolute top-full -right-10 -mt-10 px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-pre text-right z-[9999]">
                          {selectedRightTab === 'anilab' 
                            ? 'Anilab은 일본의 투표 사이트입니다.\n(결과 공개: 일 22시) '
                            : 'Anime Corner은 미국의 투표 사이트입니다.\n(결과 공개: 금 22시) '
                          }
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                  {rightPanelData.map((rankPreview, index) => {
                    // null/undefined 체크
                    const safeRankDiff = rankPreview.rankDiff ?? 0;
                    const safeConsecutiveWeeks = rankPreview.consecutiveWeeksAtSameRank ?? 0;
                    
                    // anilab 데이터인지 확인하여 NEW 처리
                    const isAnilab = selectedRightTab === 'anilab';
                    const finalRankDiffType = getRankDiffType(safeRankDiff, safeConsecutiveWeeks, isAnilab);
                    
                    return (
                      <AbroadRankInfo 
                        key={rankPreview.contentId || `abroad-${index}`}
                        rank={rankPreview.rank}
                        rankDiff={finalRankDiffType}
                        rankDiffValue={finalRankDiffType === "same-rank" ? safeConsecutiveWeeks.toString() : safeRankDiff.toString()}
                        title={rankPreview.title}
                        studio={rankPreview.subTitle}
                        image={rankPreview.mainThumbnailUrl}
                        type={rankPreview.type}
                        contentId={rankPreview.contentId}
                      />
                    );
                  })}
                  </div>
                </div>
              ) : (
                // 빈 상태 UI - 스켈레톤 UI + 블러 처리 + 로딩 메시지
                <div className="relative min-h-[1142px] pt-21">
                  {/* 스켈레톤 UI (뒷배경) */}
                  <div className="absolute inset-0 p-4 space-y-4">
                    {[...Array(8)].map((_, index) => (
                      <div key={index} className="w-full h-24 bg-gray-10 rounded-xl opacity-50">
                        <div className="flex items-center justify-center h-full p-4 space-x-4">
                          <div className="w-5 h-5 bg-gray-100 rounded"></div>
                          <div className="w-14 h-20 bg-gray-100 rounded-lg"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* 블러 처리 레이어 */}
                  <div className="absolute inset-0 rounded-xl"></div>
                  
                  {/* 로딩 메시지 (앞배경) */}
                  <div className="relative z-10 flex flex-col items-center justify-center h-full">
                    {selectedRightTab === 'anilab' ? (
                      <>
                        <div className="text-gray-400 text-6xl mb-4 opacity-90">🇯🇵</div>
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">해외 순위 데이터 준비 중..</h3>
                        <p className="text-sm text-gray-500 text-center">
                          Anilab 순위는 일 22:00 공개
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="text-gray-400 text-6xl mb-4 opacity-90">🌍</div>
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">해외 순위 데이터 준비 중..</h3>
                        <p className="text-sm text-gray-500 text-center">
                          해당 주차의 해외 순위 데이터가<br />
                          아직 준비되지 않았습니다.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}