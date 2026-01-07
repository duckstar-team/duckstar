'use client';

import { useState, useEffect, useCallback } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import RankCard from '@/app/chart/[year]/[quarter]/[week]/_components/RankCard';
import AbroadRankCard from './AbroadRankCard';
import { getChartData, getWeeks } from '@/api/chart';
import { queryConfig, cn, getRankDiffType, getSeasonFromQuarter } from '@/lib';
import DownloadBtn from '@/components/common/DownloadBtn';
import TopTenList from '@/components/domain/chart/TopTenList';
import { useChart } from '@/components/layout/AppContainer';
import { Loader } from 'lucide-react';

export default function ChartPageContent() {
  const [activeView, setActiveView] = useState<
    'duckstar' | 'anime-corner' | 'anilab'
  >('duckstar');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const { selectedWeek } = useChart();

  const { year, quarter, week } = selectedWeek || {
    year: 2025,
    quarter: 3,
    week: 1,
  };

  // 화면 크기 감지
  useEffect(() => {
    const checkScreenSize = () => {
      const wasDesktop = isDesktop;
      const nowDesktop = window.innerWidth >= 1280;

      setIsDesktop(nowDesktop);

      // 데스크톱에서 모바일로 전환될 때 덕스타 순위로 리셋
      if (wasDesktop && !nowDesktop) {
        setActiveView('duckstar');
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, [isDesktop]);

  // 드롭다운 외부 클릭으로 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isDropdownOpen) {
        const target = event.target as HTMLElement;
        if (!target.closest('[data-dropdown]')) {
          setIsDropdownOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  // 버튼 활성화 상태 확인
  const isButtonActive = (
    buttonType: 'duckstar' | 'anime-corner' | 'anilab'
  ) => {
    if (isDesktop) {
      // 1280px 이상: DUCKSTAR 항상 활성화, 해외 순위만 탭 전환
      return buttonType === 'duckstar' || activeView === buttonType;
    } else {
      // 1280px 미만: 3진 선택 (덕스타 순위 대신 해외 순위 리스트 표시)
      return activeView === buttonType;
    }
  };

  // 주간 정보 조회
  const { data: weeksData } = useQuery({
    queryKey: ['weeks'],
    queryFn: getWeeks,
    ...queryConfig.home,
  });

  // 현재 주차 정보 찾기
  const currentWeekInfo = weeksData?.result?.find(
    (weekData) =>
      weekData.year === year &&
      weekData.quarter === quarter &&
      weekData.week === week
  );

  // 무한 스크롤을 위한 useInfiniteQuery 사용
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['chart', year, quarter, week],
    queryFn: ({ pageParam = 0 }) =>
      getChartData(year, quarter, week, pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (lastPage: any) => {
      if (lastPage.result.pageInfo.hasNext) {
        return lastPage.result.pageInfo.page + 1;
      }
      return undefined;
    },
    ...queryConfig.home,
  });

  // 주간 정보에서 날짜 범위 가져오기
  const getDateRangeFromData = () => {
    if (currentWeekInfo?.startDate && currentWeekInfo?.endDate) {
      // YYYY-MM-DD 형식을 YYYY/MM/DD로 변환
      const formatDate = (dateStr: string) => {
        return dateStr.replace(/-/g, '/');
      };

      return {
        start: formatDate(currentWeekInfo.startDate),
        end: formatDate(currentWeekInfo.endDate),
      };
    }

    // 기본값
    return { start: `${year}/06/29`, end: `${year}/07/06` };
  };

  const quarterName = getSeasonFromQuarter(quarter);
  const dateRange = getDateRangeFromData();

  // 무한 스크롤 트리거
  const handleScroll = useCallback(() => {
    if (
      window.innerHeight + document.documentElement.scrollTop >=
      document.documentElement.offsetHeight - 1000
    ) {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // 데이터 로드 후 탭 자동 설정 (데스크톱에서만 적용)
  useEffect(() => {
    if (data?.pages?.[0]?.result && isDesktop) {
      const animeCornerData = data.pages[0].result.animeTrendRankPreviews || [];
      const anilabData = data.pages[0].result.aniLabRankPreviews || [];

      const hasAnilab = anilabData.length > 0;
      const hasAnimeCorner = animeCornerData.length > 0;

      if (hasAnilab && !hasAnimeCorner) {
        // Anilab만 있는 경우 - Anilab 탭 활성화
        setActiveView('anilab');
      } else if (hasAnimeCorner) {
        // Anime Corner가 있는 경우 (둘 다 있거나 Anime Corner만 있는 경우) - Anime Corner 탭 활성화
        setActiveView('anime-corner');
      } else if (hasAnilab) {
        // Anilab만 있는 경우 (fallback) - Anilab 탭 활성화
        setActiveView('anilab');
      }
      // 둘 다 없으면 기본값 유지 (duckstar)
    }
  }, [data, isDesktop]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center bg-gray-50 py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-rose-800"></div>
        <span className="ml-3 text-gray-600">차트 데이터 로딩 중...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center bg-gray-50 py-20">
        <div className="text-center">
          <div className="mb-2 text-4xl text-red-500">⚠️</div>
          <h3 className="mb-2 text-lg font-semibold text-red-600">
            데이터 로딩 실패
          </h3>
          <p className="mb-4 text-sm text-gray-600">
            차트 데이터를 불러올 수 없습니다.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded bg-rose-500 px-4 py-2 text-sm text-white hover:bg-rose-600"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  // 덕스타 차트와 해외 차트 데이터 확인
  const duckstarData = data?.pages?.[0]?.result?.animeRankDtos || [];
  const animeCornerData =
    data?.pages?.[0]?.result?.animeTrendRankPreviews || [];
  const anilabData = data?.pages?.[0]?.result?.aniLabRankPreviews || [];

  // 모든 차트 데이터가 없는 경우에만 "데이터 없음" 표시
  if (
    duckstarData.length === 0 &&
    animeCornerData.length === 0 &&
    anilabData.length === 0
  ) {
    return (
      <div className="flex items-center justify-center bg-gray-50 py-20">
        <div className="text-center">
          <div className="mb-2 text-4xl text-gray-500">📊</div>
          <h3 className="mb-2 text-lg font-semibold text-gray-600">
            데이터 없음
          </h3>
          <p className="text-sm text-gray-500">차트 데이터가 없습니다.</p>
        </div>
      </div>
    );
  }

  // 모든 페이지의 애니메이션 데이터를 합치기
  const allAnimeList =
    data?.pages?.flatMap((page) => page.result.animeRankDtos || []) || [];

  return (
    <div className="w-full">
      {/* 배너 */}
      <div className="mb-4 flex justify-center">
        <div className="relative h-[99px] w-full overflow-hidden">
          {/* 모바일/태블릿용 배너 */}
          <img
            src="/banners/chart-banner-mobile.svg"
            alt="차트 배너"
            className="absolute inset-0 h-full w-full object-cover object-center xl:hidden"
          />
          {/* 데스크톱용 배너 */}
          <img
            src="/banners/chart-banner.svg"
            alt="차트 배너"
            className="absolute inset-0 hidden h-full w-full object-cover object-center xl:block"
          />
          {/* 배너 텍스트 오버레이 */}
          <div className="absolute inset-0 inline-flex flex-col items-center justify-center gap-1 sm:gap-0">
            <div
              className="justify-center text-xl leading-tight font-bold whitespace-nowrap text-white sm:text-2xl sm:leading-[1.2] md:text-3xl md:leading-[1.3] lg:text-4xl lg:leading-[50.75px]"
              style={{ textShadow: '0 0 2px rgba(0,0,0,0.8)' }}
            >
              {year} {quarterName} {week}주차 애니메이션 순위
            </div>
            <div className="-mt-[5px] h-6 justify-center self-stretch text-center text-base font-light tracking-wide text-white">
              {dateRange.start} - {dateRange.end}
            </div>
          </div>
        </div>
      </div>

      {/* 차트 헤더 배경 */}
      <div className="sticky top-[60px] z-40 flex justify-center">
        <div className="relative h-[48px] w-full overflow-visible">
          <img
            src="/banners/chart-header-bg.svg"
            alt="차트 헤더 배경"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />

          {/* 홈페이지 헤더 컴포넌트들 오버레이 */}
          <div className="absolute inset-0 flex items-center justify-center">
            {/* 왼쪽 프레임 - 애니메이션 순위 (768px 너비) */}
            <div className="flex w-[768px] items-center justify-start pl-2">
              <div className="relative h-12 w-44 overflow-hidden">
                <button
                  onClick={() => !isDesktop && setActiveView('duckstar')}
                  className={`flex h-full w-full items-center justify-center ${
                    isDesktop ? 'cursor-default' : 'cursor-pointer'
                  }`}
                  disabled={isDesktop}
                >
                  <p
                    className={`text-md text-center leading-tight text-nowrap whitespace-pre not-italic md:text-[20px] md:leading-[22px] ${
                      isButtonActive('duckstar')
                        ? 'font-semibold text-[#FED783]'
                        : 'font-normal text-gray-400'
                    }`}
                  >
                    DUCK★STAR
                  </p>
                </button>
                {isButtonActive('duckstar') && (
                  <div className="absolute right-0 bottom-0 left-0 h-[3px] bg-[#FED783]"></div>
                )}
              </div>
            </div>

            {/* 간격 46px */}
            <div className="w-[48px]"></div>

            {/* 오른쪽 프레임 - 해외 랭킹 메뉴들 (352px 너비) */}
            <div className="flex w-[352px] items-center justify-center">
              <div className="inline-flex h-12 items-center justify-start pl-2">
                {/* 500px 이상: 기존 탭들 */}
                <div className="hidden min-[500px]:flex">
                  {/* Anime Corner 탭 */}
                  <div className="relative h-12 w-44">
                    <button
                      onClick={() => setActiveView('anime-corner')}
                      className="inline-flex h-full w-full cursor-pointer flex-col items-center justify-center px-2.5 py-3"
                    >
                      <div
                        className={`text-md justify-start self-stretch leading-tight md:text-xl md:leading-snug ${
                          isButtonActive('anime-corner')
                            ? 'font-semibold text-[#FED783]'
                            : 'font-normal text-gray-400'
                        }`}
                      >
                        Anime Corner
                      </div>
                    </button>
                    {isButtonActive('anime-corner') && (
                      <div className="absolute right-0 bottom-0 left-0 h-[3px] bg-[#FED783]"></div>
                    )}
                  </div>

                  {/* AniLab 탭 */}
                  <div className="relative h-12 w-44">
                    <button
                      onClick={() => setActiveView('anilab')}
                      className="inline-flex h-full w-full cursor-pointer flex-col items-center justify-center px-9 py-3"
                    >
                      <div
                        className={`text-md justify-start self-stretch text-center leading-tight md:text-xl md:leading-snug ${
                          isButtonActive('anilab')
                            ? 'font-semibold text-[#FED783]'
                            : 'font-normal text-gray-400'
                        }`}
                      >
                        AniLab
                      </div>
                    </button>
                    {isButtonActive('anilab') && (
                      <div className="absolute right-0 bottom-0 left-0 h-[3px] bg-[#FED783]"></div>
                    )}
                  </div>
                </div>

                {/* 500px 미만: 드롭다운 메뉴 */}
                <div
                  className="relative block min-[500px]:hidden"
                  data-dropdown
                >
                  <button
                    onClick={() => {
                      setIsDropdownOpen(!isDropdownOpen);
                    }}
                    className="flex items-center gap-2 px-3 py-2 font-normal whitespace-nowrap text-gray-400"
                  >
                    <span
                      className={`whitespace-nowrap ${
                        activeView === 'anime-corner' || activeView === 'anilab'
                          ? 'font-semibold text-[#FED783]'
                          : 'text-gray-400'
                      }`}
                    >
                      {activeView === 'anime-corner'
                        ? 'Anime Corner'
                        : activeView === 'anilab'
                          ? 'AniLab'
                          : '해외 순위'}
                    </span>
                    <svg
                      className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''} ${
                        activeView === 'anime-corner' || activeView === 'anilab'
                          ? 'text-[#FED783]'
                          : 'text-gray-400'
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* 드롭다운 메뉴 */}
                  {isDropdownOpen && (
                    <div className="absolute top-full right-0 z-[70] mt-1 w-fit rounded-lg border border-gray-200 bg-white shadow-lg">
                      <button
                        onClick={() => {
                          setActiveView('anime-corner');
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-3 text-left whitespace-nowrap hover:bg-gray-50 ${
                          activeView === 'anime-corner'
                            ? 'font-semibold text-[#FED783]'
                            : 'text-gray-400'
                        }`}
                      >
                        Anime Corner
                      </button>
                      <button
                        onClick={() => {
                          setActiveView('anilab');
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-3 text-left whitespace-nowrap hover:bg-gray-50 ${
                          activeView === 'anilab'
                            ? 'font-semibold text-[#FED783]'
                            : 'text-gray-400'
                        }`}
                      >
                        AniLab
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 주간 Top 10 이미지 저장 버튼 */}
      <div className="max-width flex justify-end pt-2">
        <DownloadBtn />
      </div>
      <div className="fixed top-0 left-full">
        {data?.pages?.[0]?.result && (
          <TopTenList
            topTen={data?.pages?.[0]?.result}
            type="weekly"
            titleData={currentWeekInfo || null}
          />
        )}
      </div>

      {/* 메인 컨텐츠 - 차트 리스트와 해외 랭킹 나란히 */}
      <div className="max-width mt-[10px] flex items-start justify-around gap-10 pb-12">
        {/* 차트 리스트 - 1등부터 쭉 간격 20 */}
        <div
          className={cn(
            'flex max-w-md flex-1 flex-col gap-5',
            !isDesktop && activeView !== 'duckstar' ? 'hidden' : 'flex'
          )}
        >
          {!allAnimeList || allAnimeList.length === 0 ? (
            <div className="flex h-[200px] w-[768px] items-center justify-center rounded-lg bg-gray-200">
              <div className="text-gray-500">덕스타 차트 데이터 없음</div>
            </div>
          ) : (
            /* 모든 RankCard (1등 포함) */
            allAnimeList.map((anime, index) => (
              <RankCard
                key={`${anime.rankPreviewDto.contentId}-${index}`}
                anime={anime}
              />
            ))
          )}

          {/* 로딩 인디케이터 */}
          {isFetchingNextPage && (
            <div className="flex justify-center py-8">
              <Loader className="animate-spin" />
            </div>
          )}

          {/* 더 이상 데이터가 없을 때 */}
          {!hasNextPage && allAnimeList && allAnimeList.length > 1 && (
            <div className="py-8 text-center text-gray-500">
              모든 차트 데이터를 불러왔습니다.
            </div>
          )}
        </div>

        {/* 해외 랭킹 리스트 */}
        <div
          className={cn(
            'flex w-[352px] flex-col gap-4',
            isDesktop && 'hidden lg:flex',
            activeView !== 'duckstar' ? 'flex' : 'hidden'
          )}
        >
          {(() => {
            // 선택된 탭에 따라 모든 페이지의 데이터 합치기
            const abroadData =
              activeView === 'anime-corner'
                ? data?.pages.flatMap(
                    (page) => page.result?.animeTrendRankPreviews || []
                  )
                : data?.pages.flatMap(
                    (page) => page.result?.aniLabRankPreviews || []
                  );

            // 데이터가 없을 때 준비중 메세지 표시
            if (abroadData && abroadData.length === 0) {
              return (
                <div className="relative h-[220px] w-full">
                  <div className="relative z-10 flex h-full flex-col items-center justify-center">
                    {activeView === 'anilab' ? (
                      <>
                        <div className="mb-4 text-6xl text-gray-400 opacity-90">
                          🇯🇵
                        </div>
                        <h3 className="mb-2 text-lg font-semibold text-gray-600">
                          해외 순위 데이터 준비 중..
                        </h3>
                        <p className="text-center text-sm text-gray-500">
                          Anilab 순위는 일 22:00 공개
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="mb-4 text-6xl text-gray-400 opacity-90">
                          🌍
                        </div>
                        <h3 className="mb-2 text-lg font-semibold text-gray-600">
                          해외 순위 데이터 준비 중..
                        </h3>
                        <p className="text-center text-sm text-gray-500">
                          해당 주차의 해외 순위 데이터가
                          <br />
                          아직 준비되지 않았습니다.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              );
            }

            return (
              abroadData &&
              abroadData.map((rankPreview, index) => {
                const isWinner = index === 0; // 1등만 Winner

                // rankDiff 타입 결정
                const safeRankDiff = rankPreview.rankDiff ?? 0;
                const safeConsecutiveWeeks =
                  rankPreview.consecutiveWeeksAtSameRank ?? 0;
                const isAnilab = activeView === 'anilab';

                const finalRankDiffType = getRankDiffType(
                  safeRankDiff,
                  safeConsecutiveWeeks,
                  isAnilab
                );

                return (
                  <AbroadRankCard
                    key={rankPreview.contentId || `abroad-${index}`}
                    rankPreview={rankPreview}
                    rankDiff={finalRankDiffType}
                    rankDiffValue={
                      finalRankDiffType === 'same-rank'
                        ? safeConsecutiveWeeks.toString()
                        : safeRankDiff.toString()
                    }
                    isWinner={isWinner}
                  />
                );
              })
            );
          })()}
        </div>
      </div>
    </div>
  );
}
