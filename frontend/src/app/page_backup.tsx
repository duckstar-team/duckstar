'use client';

import { useEffect, useState, useRef } from 'react';
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
import { useAdvancedScrollRestoration } from '@/hooks/useAdvancedScrollRestoration';

// 순위 변동 타입 결정 함수
function getRankDiffType(rankDiff: number, consecutiveWeeks: number): "new" | "up-greater-equal-than-5" | "up-less-than-5" | "down-less-than-5" | "down-greater-equal-than-5" | "same-rank" | "Zero" {
  // consecutiveWeeks가 2 이상일 때만 same-rank 우선 적용
  if (consecutiveWeeks >= 2) {
    return "same-rank";
  }
  
  // consecutiveWeeks가 0이고 rankDiff가 0일 때 NEW
  if (consecutiveWeeks === 0 && rankDiff === 0) {
    return "new";
  }
  
  // rankDiff에 따른 처리
  if (rankDiff > 0) {
    return rankDiff >= 5 ? "up-greater-equal-than-5" : "up-less-than-5";
  }
  if (rankDiff < 0) {
    return rankDiff <= -5 ? "down-greater-equal-than-5" : "down-less-than-5";
  }
  if (rankDiff === 0) return "same-rank";
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
  const [rightPanelData, setRightPanelData] = useState<RankPreviewDto[]>([]);
  const [rightPanelLoading, setRightPanelLoading] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<WeekDto | null>(null);
  const [leftPanelData, setLeftPanelData] = useState<DuckstarRankPreviewDto[]>([]); // Left Panel 데이터 추가
  const [isLeftPanelPrepared, setIsLeftPanelPrepared] = useState<boolean>(true); // Left Panel 준비 상태
  const [leftPanelLoading, setLeftPanelLoading] = useState(false); // Left Panel 로딩 상태
  const [leftPanelError, setLeftPanelError] = useState<string | null>(null); // Left Panel 에러 상태
  const [anilabData, setAnilabData] = useState<RankPreviewDto[]>([]); // Anilab 데이터 별도 저장
  const [animeTrendingData, setAnimeTrendingData] = useState<RankPreviewDto[]>([]); // Anime Trending 데이터 별도 저장
  const [selectedRightTab, setSelectedRightTab] = useState<'anilab' | 'anime-trending'>('anilab'); // Right Panel 탭 상태
  const [isClient, setIsClient] = useState(false); // 클라이언트 렌더링 확인
  const scrollRestoredRef = useRef(false); // 스크롤 복원 완료 여부 (ref로 변경)
  const isRestoringRef = useRef(false); // 스크롤 복원 중 여부 (중복 실행 방지)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null); // 스크롤 저장 디바운싱용

  // React Query를 사용한 홈 데이터 페칭 (검색화면처럼 캐싱)
  const { data: homeData, error, isLoading } = useQuery({
    queryKey: ['home'],
    queryFn: () => homeApi.getHome(10),
    staleTime: 5 * 60 * 1000, // 5분간 fresh 상태 유지
    gcTime: 10 * 60 * 1000, // 10분간 캐시 유지
    refetchOnWindowFocus: false, // 윈도우 포커스 시 재요청 비활성화
    refetchOnReconnect: true, // 네트워크 재연결 시 재요청
    retry: 3, // 에러 시 3번 재시도
    retryDelay: 5000, // 재시도 간격 5초
  });

  // 클라이언트 렌더링 확인
  useEffect(() => {
    setIsClient(true);
  }, []);

  // React Query 데이터 처리
  useEffect(() => {
    if (homeData?.result) {
      console.log('🏠 홈 데이터 로드됨:', homeData.result);
      console.log('🏠 배너 데이터:', homeData.result.homeBannerDtos);
      console.log('🏠 Anilab 데이터:', homeData.result.weeklyTopDto.anilabRankPreviews);
      console.log('🏠 Anime Trending 데이터:', homeData.result.weeklyTopDto.animeTrendingRankPreviews);
      
      // 초기 데이터 설정
      const initialAnilabData = homeData.result.weeklyTopDto.anilabRankPreviews || [];
      const initialAnimeTrendingData = homeData.result.weeklyTopDto.animeTrendingRankPreviews || [];
      
      setAnilabData(initialAnilabData); // Anilab 데이터 별도 저장
      setAnimeTrendingData(initialAnimeTrendingData); // Anime Trending 데이터 별도 저장
      
      // Left Panel 초기 데이터 설정
      const initialDuckstarData = homeData.result.weeklyTopDto.duckstarRankPreviews || [];
      const initialIsPrepared = homeData.result.weeklyTopDto.isPrepared;
      
      setLeftPanelData(initialDuckstarData); // Left Panel 초기값 설정
      setIsLeftPanelPrepared(initialIsPrepared); // Left Panel 준비 상태 초기값 설정
      
      console.log('🏠 초기 Left Panel 데이터 설정:', initialDuckstarData);
      console.log('🏠 초기 Left Panel 준비 상태:', initialIsPrepared);
      
      // 초기 Right Panel 데이터 설정 (기본적으로 Anilab 탭)
      setRightPanelData(initialAnilabData);
      console.log('🏠 초기 Right Panel 데이터 설정 (Anilab):', initialAnilabData);
      console.log('🏠 초기 Anime Trending 데이터 저장:', initialAnimeTrendingData);
      
      // 첫 번째 CLOSED 주차를 기본 선택으로 설정 (복원된 상태가 없을 때만)
      const shouldRestore = sessionStorage.getItem('home-state-save') === 'true';
      const hasRestoredWeek = sessionStorage.getItem('home-selected-week');
      const hasRestoredTab = sessionStorage.getItem('home-selected-tab');
      
      // 복원된 상태가 있으면 기본 설정을 완전히 건너뜀
      if (!shouldRestore && !hasRestoredWeek && !hasRestoredTab && !selectedWeek) {
        const closedWeeks = homeData.result.weekDtos.filter(week => week.voteStatus === 'CLOSED');
        if (closedWeeks.length > 0) {
          setSelectedWeek(closedWeeks[0]);
          console.log('🏠 기본 선택 주차:', closedWeeks[0]);
        }
      } else if (hasRestoredWeek || hasRestoredTab) {
        console.log('🏠 복원된 상태 감지 - 기본 주차 설정 건너뜀');
      }
    }
  }, [homeData]);

  // 🚨 홈페이지의 모든 복잡한 로직 제거 - 검색 화면과 완전히 동일하게

  // 🚨 홈페이지도 useAdvancedScrollRestoration 훅 사용 (검색/투표 화면과 완전히 동일)
  const {
    saveScrollPosition,
    restoreScrollPosition,
    navigateWithScroll,
    navigateBackWithScroll,
    findScrollContainer,
    scrollToPosition,
    scrollToTop
  } = useAdvancedScrollRestoration({
    enabled: true,
    scrollKey: 'home-page',
    saveDelay: 1000,
    restoreDelay: 10,
    restoreAfterDataLoad: true,
    containerSelector: 'main',
    navigationTypes: {
      sidebar: 'sidebar-navigation',
      logo: 'logo-navigation',
      detail: 'from-anime-detail'
    }
  });

  // Right Panel 탭 클릭 핸들러
  const handleRightPanelTabChange = async (tab: 'anilab' | 'anime-trending') => {
    setSelectedRightTab(tab); // 탭 상태 업데이트
    
    if (tab === 'anilab') {
      // Anilab 탭은 저장된 Anilab 데이터로 복원
      setRightPanelData(anilabData);
      return;
    } else if (tab === 'anime-trending') {
      // Anime Trending 탭은 저장된 Anime Trending 데이터로 복원
      setRightPanelData(animeTrendingData);
    }
  };

  // 탭 상태 복원 시 데이터도 함께 복원
  useEffect(() => {
    if (selectedRightTab === 'anilab') {
      setRightPanelData(anilabData);
    } else if (selectedRightTab === 'anime-trending') {
      setRightPanelData(animeTrendingData);
    }
  }, [selectedRightTab, anilabData, animeTrendingData]);

  // Left Panel 주차 변경 핸들러
  const handleLeftPanelWeekChange = async (week: WeekDto) => {
    // 주차 변경 전 현재 스크롤 위치 저장 (홈페이지 전용 키)
    const currentScrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    if (currentScrollY > 0) {
      sessionStorage.setItem('home-scroll', currentScrollY.toString());
      sessionStorage.setItem('scroll-home-page', currentScrollY.toString());
      sessionStorage.setItem('navigation-type', 'season-change');
      console.log('🏠 홈페이지: 주차 변경 전 스크롤 저장:', currentScrollY);
    }
    
    setSelectedWeek(week); // 선택된 주차 상태 업데이트
    
    try {
      setRightPanelLoading(true);
      setLeftPanelLoading(true);
      setLeftPanelError(null); // 에러 상태 초기화
      
      // 선택된 주차로 통합 Anime 데이터 조회 (3가지 데이터 모두 포함)
      const response = await homeApi.getAnimeRank(
        week.year, 
        week.quarter, 
        week.week, 
        10
      );
      
      if (response.isSuccess) {
        const weeklyTopData = response.result;
        
        // Left Panel 데이터 업데이트 (Duckstar 데이터)
        const newDuckstarData = weeklyTopData.duckstarRankPreviews || [];
        const newIsPrepared = weeklyTopData.isPrepared;
        
        setLeftPanelData(newDuckstarData); // Left Panel 데이터 업데이트
        setIsLeftPanelPrepared(newIsPrepared); // Left Panel 준비 상태 업데이트
        
        // Right Panel 데이터 업데이트 (anilabRankPreviews를 Anilab으로 매핑)
        const newAnilabData = weeklyTopData.anilabRankPreviews || [];
        const newAnimeTrendingData = weeklyTopData.animeTrendingRankPreviews || [];
        
        setAnilabData(newAnilabData); // Anilab 데이터 업데이트
        setAnimeTrendingData(newAnimeTrendingData); // Anime Trending 데이터 업데이트
        
        // 현재 선택된 탭에 따라 적절한 데이터 표시
        if (selectedRightTab === 'anilab') {
          setRightPanelData(newAnilabData);
        } else if (selectedRightTab === 'anime-trending') {
          setRightPanelData(newAnimeTrendingData);
        }
        
        // 주차 변경 후 스크롤 복원
        setTimeout(() => {
          const navigationType = sessionStorage.getItem('navigation-type');
          const savedScrollY = sessionStorage.getItem('home-scroll');
          const detailRestoreDone = sessionStorage.getItem('detail-restore-done');
          
          console.log('🏠 홈페이지: 주차 변경 후 스크롤 복원 체크');
          console.log('🏠 홈페이지: navigationType:', navigationType);
          console.log('🏠 홈페이지: savedScrollY:', savedScrollY);
          console.log('🏠 홈페이지: detail-restore-done:', detailRestoreDone);
          
          // useAdvancedScrollRestoration 훅이 이미 복원을 완료한 경우
          if (detailRestoreDone === 'true') {
            console.log('🏠 홈페이지: useAdvancedScrollRestoration 훅이 이미 복원 완료 - 플래그 정리');
            // 플래그 정리하여 홈페이지에서 독립적으로 동작하도록 함
            sessionStorage.removeItem('detail-restore-done');
            return;
          }
          
          if (navigationType === 'season-change' && savedScrollY) {
            const y = parseInt(savedScrollY);
            console.log('🏠 홈페이지: 주차 변경 후 스크롤 복원:', y);
            
            // CSS scroll-behavior 강제 무시
            document.documentElement.style.scrollBehavior = 'auto';
            document.body.style.scrollBehavior = 'auto';
            
            // 즉시 스크롤 복원
            window.scrollTo(0, y);
            document.body.scrollTop = y;
            document.documentElement.scrollTop = y;
            
            // 네비게이션 타입 정리
            sessionStorage.removeItem('navigation-type');
            console.log('🏠 홈페이지: 주차 변경 스크롤 복원 완료');
          }
        }, 100);
      } else {
        const errorMessage = `선택된 주차 데이터 로딩 실패: ${response.message}`;
        console.error(errorMessage);
        setLeftPanelError(errorMessage);
      }
    } catch (err) {
      const errorMessage = `선택된 주차 데이터 로딩 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`;
      console.error(errorMessage);
      setLeftPanelError(errorMessage);
    } finally {
      setRightPanelLoading(false);
      setLeftPanelLoading(false);
    }
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
            매 분기 신작 애니 투표,<br />
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
            weekDtos={homeData.result.weekDtos}
          />
        </div>
      </div>

      {/* 헤더 리스트 영역 */}
      <div className="w-full bg-white pt-3 sticky top-[60px] z-20">
        <div className="flex justify-center gap-[57px]">
          {/* Left Panel 헤더 */}
          <HeaderList 
            weekDtos={homeData.result.weekDtos} 
            selectedWeek={selectedWeek}
            onWeekChange={handleLeftPanelWeekChange}
          />
          {/* Right Panel 헤더 */}
          <RightHeaderList 
            weekDtos={homeData.result.weekDtos} 
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
              <div className="w-[750px] bg-white rounded-xl border border-[#D1D1D6] p-5">
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-800"></div>
                  <span className="ml-3 text-gray-600">Left Panel 데이터 로딩 중...</span>
                </div>
              </div>
            ) : leftPanelError ? (
              <div className="w-[750px] bg-white rounded-xl border border-[#D1D1D6] p-5">
                <div className="flex flex-col items-center justify-center h-32">
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
              <HomeChart 
                duckstarRankPreviews={leftPanelData || []}
                isPrepared={isLeftPanelPrepared}
              />
            )}
          </div>
          
          {/* Right Panel */}
          <div className="w-[373px] bg-white rounded-xl border border-[#D1D1D6]">
            {/* Right Panel 컨텐츠 */}
            <div className="p-4 flex flex-col items-center gap-4">
              {rightPanelLoading ? (
                <div className="flex items-center justify-center h-24">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-rose-800"></div>
                </div>
              ) : rightPanelData.length > 0 ? (
                // Right Panel 데이터 표시
                rightPanelData.map((rankPreview, index) => {
                  // null/undefined 체크
                  const safeRankDiff = rankPreview.rankDiff ?? 0;
                  const safeConsecutiveWeeks = rankPreview.consecutiveWeeksAtSameRank ?? 0;
                  
                  // Anilab에서만 NEW를 Zero로 변경, Anime Trending에서는 NEW 그대로 사용
                  const rankDiffType = getRankDiffType(safeRankDiff, safeConsecutiveWeeks);
                  const finalRankDiffType = (selectedRightTab === 'anilab' && rankDiffType === "new") ? "Zero" : rankDiffType;
                  
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
                })
              ) : (
                // 빈 상태 UI
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="text-gray-400 text-6xl mb-4 opacity-60">🌍</div>
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">해외 순위 데이터 준비 중..</h3>
                  <p className="text-sm text-gray-500 text-center">
                    해당 주차의 해외 순위 데이터가<br />
                    아직 준비되지 않았습니다.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}