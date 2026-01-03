'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import HomeBanner from '@/components/ui/banner/HomeBanner';
import ButtonVote from '@/components/ui/ButtonVote';
import HeaderList from './HeaderList';
import HomeChart from '@/components/domain/chart/HomeChart';
import RightHeaderList from './RightHeaderList';
import RightPanel from '@/components/domain/chart/RightPanel';
import { homeApi } from '@/api/home';
import {
  WeekDto,
  RankPreviewDto,
  DuckstarRankPreviewDto,
  HomeDto,
} from '@/types/dtos';
import { scrollToTop, queryConfig } from '@/lib';
import React from 'react';
import { ApiResponse } from '@/api/http';

export default function HomeClient() {
  // 홈페이지에서 모바일 뷰포트 사용을 위한 설정
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

    // body의 min-width 오버라이드 (홈페이지에서만)
    const body = document.body;
    const originalMinWidth = body.style.minWidth;
    const originalOverflowX = body.style.overflowX;

    body.style.minWidth = 'auto';
    body.style.overflowX = 'hidden';

    return () => {
      // viewport 설정 복원
      const current = document.querySelector('meta[name="viewport"]');
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

  // 기존 상태 관리 유지 (점진적 최적화)
  const [rightPanelData, setRightPanelData] = useState<RankPreviewDto[]>([]);
  const [rightPanelLoading, setRightPanelLoading] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<WeekDto | null>(null);
  const [leftPanelData, setLeftPanelData] = useState<DuckstarRankPreviewDto[]>(
    []
  );
  const [leftPanelLoading, setLeftPanelLoading] = useState(false);
  const [leftPanelError, setLeftPanelError] = useState<string | null>(null);
  const [anilabData, setAnilabData] = useState<RankPreviewDto[]>([]);
  const [animeCornerData, setAnimeCornerData] = useState<RankPreviewDto[]>([]);
  const [selectedRightTab, setSelectedRightTab] = useState<
    'anilab' | 'anime-corner'
  >('anime-corner');
  const [isInitialized, setIsInitialized] = useState(false);

  // 홈 화면용 스크롤 키 생성 (주차별로 독립적인 스크롤 관리)
  const scrollKey = React.useMemo(() => {
    if (selectedWeek) {
      return `home-${selectedWeek.year}-${selectedWeek.quarter}-${selectedWeek.week}`;
    }
    return 'home-default';
  }, [selectedWeek]);

  // React Query를 사용한 홈 데이터 페칭 (통일된 캐싱 전략)
  const {
    data: homeData,
    error,
    isLoading,
  } = useQuery<ApiResponse<HomeDto>>({
    queryKey: ['home'],
    queryFn: () => homeApi.getHome(10),
    ...queryConfig.home, // 통일된 홈 데이터 캐싱 전략 적용
  });

  // 홈 상태 저장 함수
  const saveHomeState = React.useCallback(() => {
    if (selectedWeek) {
      sessionStorage.setItem(
        'home-selected-week',
        JSON.stringify(selectedWeek)
      );
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
      const initialAnilabData =
        homeData.result.weeklyTopDto.anilabRankPreviews || [];
      const initialAnimeCornerData =
        homeData.result.weeklyTopDto.animeCornerRankPreviews || [];

      setAnilabData(initialAnilabData); // Anilab 데이터 별도 저장
      setAnimeCornerData(initialAnimeCornerData); // Anime Corner 데이터 별도 저장

      // 근본적 해결: 데이터 설정은 useEffect에서 자동 처리

      // Left Panel 초기 데이터 설정
      const initialDuckstarData =
        homeData.result.weeklyTopDto.duckstarRankPreviews || [];

      setLeftPanelData(initialDuckstarData); // Left Panel 초기값 설정

      // 초기 Right Panel 데이터 설정 (Anilab만 있으면 Anilab, 둘 다 있으면 Anime Corner 우선)
      const hasAnilab = initialAnilabData.length > 0;
      const hasAnimeCorner = initialAnimeCornerData.length > 0;

      if (hasAnilab && !hasAnimeCorner) {
        // Anilab만 있는 경우
        setSelectedRightTab('anilab');
        setRightPanelData(initialAnilabData);
      } else if (hasAnimeCorner) {
        // Anime Corner가 있는 경우 (둘 다 있거나 Anime Corner만 있는 경우)
        setSelectedRightTab('anime-corner');
        setRightPanelData(initialAnimeCornerData);
      } else if (hasAnilab) {
        // Anilab만 있는 경우 (fallback)
        setSelectedRightTab('anilab');
        setRightPanelData(initialAnilabData);
      }

      // 홈 상태 복원 시도
      restoreHomeState();

      // 복원된 상태가 없을 때만 기본 주차 설정
      const shouldRestore =
        sessionStorage.getItem('home-state-save') === 'true';
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
      const isHomeScrollTop =
        sessionStorage.getItem('home-scroll-top') === 'true';

      if (isHomeScrollTop) {
        scrollToTop();
        // 모든 플래그 정리
        sessionStorage.clear();
        return;
      }

      // 홈 스크롤 탑이 아닌 경우에만 애니 상세화면에서 돌아온 스크롤 복원 처리
      const savedY = sessionStorage.getItem(`scroll-${scrollKey}`);
      const isFromAnimeDetail =
        sessionStorage.getItem('from-anime-detail') === 'true';

      if (savedY && isFromAnimeDetail) {
        const y = parseInt(savedY);

        // 페이지 로드 즉시 복원 (애니메이션 없이)
        window.scrollTo({
          top: y,
          left: 0,
          behavior: 'instant',
        });
        document.body.scrollTop = y;
        document.documentElement.scrollTop = y;

        // 추가 즉시 복원 (확실하게)
        setTimeout(() => {
          window.scrollTo({
            top: y,
            left: 0,
            behavior: 'instant',
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
      const isHomeScrollTop =
        sessionStorage.getItem('home-scroll-top') === 'true';

      if (isHomeScrollTop) {
        scrollToTop();
        // 모든 플래그 정리
        sessionStorage.clear();
        return;
      }

      // 홈 스크롤 탑이 아닌 경우에만 애니 상세화면에서 돌아온 스크롤 복원 처리
      const savedY = sessionStorage.getItem(`scroll-${scrollKey}`);
      const isFromAnimeDetail =
        sessionStorage.getItem('from-anime-detail') === 'true';

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
  const updateRightPanelData = (
    tab: 'anilab' | 'anime-corner',
    newAnilabData?: any[],
    newAnimeCornerData?: any[]
  ) => {
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
    const targetData =
      selectedRightTab === 'anime-corner' ? animeCornerData : anilabData;

    // 데이터가 있고 현재 표시된 데이터와 다르면 업데이트
    if (
      targetData.length > 0 &&
      JSON.stringify(rightPanelData) !== JSON.stringify(targetData)
    ) {
      setRightPanelData(targetData);
    }
  }, [selectedRightTab, anilabData, animeCornerData, rightPanelData]);

  // 주차별 데이터 일관성 모니터링
  useEffect(() => {
    if (selectedWeek && isInitialized) {
      // 데이터 일관성 검증
      const isConsistent = leftPanelData.length > 0 && anilabData.length > 0;
      if (!isConsistent) {
        console.warn('🏠 ⚠️ 패널 데이터 불일치 감지');
      }
    }
  }, [selectedWeek, leftPanelData, anilabData, isInitialized]);

  // 주차 변경 핸들러 (모든 패널 데이터를 함께 로드)
  const handleLeftPanelWeekChange = async (week: WeekDto) => {
    // 주차 변경 시에는 스크롤 복원하지 않음 (주차 변경은 스크롤 복원 불필요)

    setSelectedWeek(week);

    try {
      setLoadingStates(true);
      clearErrorState();

      // 선택된 주차의 모든 데이터 조회
      const response = await homeApi.getAnimeRank(
        week.year,
        week.quarter,
        week.week,
        10
      );

      if (response.isSuccess) {
        await updateAllPanelData(response.result);
        // 주차 변경 시에는 스크롤 복원하지 않음
      } else {
        handleWeekChangeError(`데이터 로딩 실패: ${response.message}`);
      }
    } catch (err) {
      handleWeekChangeError(
        `데이터 로딩 에러: ${err instanceof Error ? err.message : '알 수 없는 오류'}`
      );
    } finally {
      setLoadingStates(false);
    }
  };

  // 로딩 상태 설정
  const setLoadingStates = (loading: boolean) => {
    setRightPanelLoading(loading);
    setLeftPanelLoading(loading);
  };

  // 모든 패널 데이터 업데이트 (리팩토링)
  const updateAllPanelData = async (weeklyTopData: any) => {
    const newDuckstarData = weeklyTopData.duckstarRankPreviews || [];
    const newAnilabData = weeklyTopData.anilabRankPreviews || [];
    const newAnimeCornerData = weeklyTopData.animeCornerRankPreviews || [];

    // 모든 패널 데이터 업데이트
    setLeftPanelData(newDuckstarData);
    setAnilabData(newAnilabData);
    setAnimeCornerData(newAnimeCornerData);

    // 현재 탭에 따라 Right Panel 표시 데이터 업데이트
    updateRightPanelData(selectedRightTab, newAnilabData, newAnimeCornerData);

    // 상태 업데이트 확인
    setTimeout(() => {}, 100);
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500"></div>
          <p className="text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-red-500">
            오류가 발생했습니다: {error.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (!homeData?.result) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* 상단 홈 배너 */}
      <div className="relative h-[200px] w-full overflow-hidden xl:h-[280px]">
        {/* 배경 배너 이미지 */}
        <img
          src="/banners/home-banner.svg"
          alt="덕스타 홈 배너"
          className="absolute inset-0 hidden h-full w-full object-cover xl:block"
        />
        <img
          src="/banners/home-banner-mobile.svg"
          alt="덕스타 홈 배너 모바일"
          className="absolute inset-0 h-full w-full object-cover xl:hidden"
        />

        {/* 텍스트 오버레이 */}
        <div className="absolute inset-0 flex items-center justify-center px-4 pb-10 xl:items-center xl:pb-0">
          <div
            className="text-left text-[20px] leading-tight font-bold text-white drop-shadow-sm sm:text-[24px] md:text-[26px] lg:text-[32px]"
            style={{ fontFamily: 'Pretendard' }}
          >
            분기 신작 애니메이션 투표,
            <br />
            시간표 서비스 ✨ 한국에서 런칭 !
          </div>
        </div>
      </div>

      {/* 통합 컨테이너 - 모든 섹션을 하나로 묶음 */}
      <div className="w-full">
        {/* 홈배너 섹션 */}
        <div className="mx-auto flex min-h-[300px] w-full max-w-[750px] items-center justify-center gap-4 pt-6 pb-5 max-xl:flex-col max-xl:px-4 xl:max-w-[1147px] xl:gap-18 xl:py-12">
          {/* HomeBanner 컴포넌트 */}
          <HomeBanner homeBannerDtos={homeData.result.homeBannerDtos} />

          {/* ButtonVote 컴포넌트 */}
          <ButtonVote
            weekDtos={[
              homeData.result.currentWeekDto,
              ...homeData.result.pastWeekDtos,
            ]}
          />
        </div>

        {/* 헤더 리스트 영역 */}
        <div className="sticky top-[60px] z-20 w-full bg-white px-4 pt-2 sm:pt-3">
          <div className="mx-auto flex w-full max-w-[1147px] flex-col gap-4 xl:flex-row xl:items-end xl:justify-center xl:gap-6">
            {/* Left Panel 헤더 - 애니메이션 순위(한국) */}
            <div className="w-full xl:w-[750px] xl:flex-shrink-0">
              <HeaderList
                weekDtos={homeData.result.pastWeekDtos}
                selectedWeek={selectedWeek}
                onWeekChange={handleLeftPanelWeekChange}
              />
            </div>
            {/* Right Panel 헤더 - 해외 순위 (데스크톱에서만 같은 줄에 표시) */}
            <div className="hidden w-full xl:block xl:w-[373px] xl:flex-shrink-0">
              <RightHeaderList
                selectedTab={selectedRightTab}
                onTabChange={handleRightPanelTabChange}
              />
            </div>
          </div>
        </div>

        {/* 메인 컨텐츠 영역 - Left Panel + Right Panel */}
        <div className="px-4 py-6">
          <div className="mx-auto flex w-full max-w-[1147px] flex-col gap-4 xl:flex-row xl:justify-center xl:gap-6">
            {/* Left Panel */}
            <div className="flex w-full flex-col items-center gap-4 xl:w-[750px] xl:flex-shrink-0">
              {leftPanelLoading ? (
                <div className="w-full max-w-[750px] rounded-xl border border-[#D1D1D6] bg-white p-5">
                  <div className="flex h-full items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-rose-800"></div>
                    <span className="ml-3 text-gray-600">
                      Left Panel 데이터 로딩 중...
                    </span>
                  </div>
                </div>
              ) : leftPanelError ? (
                <div className="w-full max-w-[750px] rounded-xl border border-[#D1D1D6] bg-white p-5">
                  <div className="flex h-full flex-col items-center justify-center">
                    <div className="mb-2 text-4xl text-red-500">⚠️</div>
                    <h3 className="mb-2 text-lg font-semibold text-red-600">
                      데이터 로딩 실패
                    </h3>
                    <p className="mb-4 text-center text-sm text-gray-600">
                      {leftPanelError}
                    </p>
                    <button
                      onClick={() => window.location.reload()}
                      className="rounded bg-rose-500 px-4 py-2 text-sm text-white hover:bg-rose-600"
                    >
                      다시 시도
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex w-full max-w-[750px] justify-center">
                  <HomeChart
                    duckstarRankPreviews={leftPanelData || []}
                    selectedWeek={selectedWeek}
                  />
                </div>
              )}
            </div>

            {/* 모바일용 해외 순위 헤더 - 한국 순위 패널 아래, 해외 순위 패널 위에 위치 */}
            <div className="w-full xl:hidden">
              <div className="mx-auto w-full rounded-lg bg-white py-1">
                <div className="mx-auto flex justify-center">
                  <RightHeaderList
                    selectedTab={selectedRightTab}
                    onTabChange={handleRightPanelTabChange}
                  />
                </div>
              </div>
            </div>

            {/* Right Panel - 해외 순위 */}
            <div className="flex w-full justify-center xl:w-[373px] xl:flex-shrink-0 xl:justify-start">
              <RightPanel
                rightPanelData={rightPanelData}
                selectedRightTab={selectedRightTab}
                rightPanelLoading={rightPanelLoading}
                selectedWeek={selectedWeek}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
