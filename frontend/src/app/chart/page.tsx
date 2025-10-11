'use client';

import { useState, useEffect, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import Winner from '@/components/chart/Winner';
import RankCard from '@/components/chart/RankCard';
import AbroadRankCard from '@/components/chart/AbroadRankCard';
import { getChartData, ChartAnimeData } from '@/api/chart';
import { queryConfig } from '@/lib/queryConfig';
import { useChart } from '@/components/AppContainer';

// 메달 타입 변환 함수
function convertMedalType(apiType: string): "Gold" | "Silver" | "Bronze" | "None" {
  switch (apiType) {
    case "GOLD": return "Gold";
    case "SILVER": return "Silver";
    case "BRONZE": return "Bronze";
    case "NONE": return "None";
    default: return "None";
  }
}

// 순위 변동 타입 결정 함수
function getRankDiffType(rankDiff: number | null): "up-greater-equal-than-5" | "up-less-than-5" | "down-less-than-5" | "down-greater-equal-than-5" | "same-rank" | "new" | "Zero" {
  if (rankDiff === null) return "new";
  if (rankDiff === 0) return "same-rank";
  if (rankDiff > 0) {
    return rankDiff >= 5 ? "up-greater-equal-than-5" : "up-less-than-5";
  } else {
    return rankDiff <= -5 ? "down-greater-equal-than-5" : "down-less-than-5";
  }
}

// 별점 분포 배열 생성 함수 (절대값을 비율로 변환)
function createDistributionArray(starInfo: any, week: string): number[] {
  const totalVoters = starInfo.voterCount;
  if (totalVoters === 0) {
    // 4분기 1-2주차는 1점 단위 (5개), 나머지는 0.5점 단위 (10개)
    const isIntegerMode = week.includes('4분기 1주차') || week.includes('4분기 2주차');
    return isIntegerMode ? [0, 0, 0, 0, 0] : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  }
  
  // 4분기 1-2주차는 1점 단위 데이터 사용
  const isIntegerMode = week.includes('4분기 1주차') || week.includes('4분기 2주차');
  
  if (isIntegerMode) {
    // 1점 단위: 1점, 2점, 3점, 4점, 5점
    return [
      starInfo.star_1_0 / totalVoters,
      starInfo.star_2_0 / totalVoters,
      starInfo.star_3_0 / totalVoters,
      starInfo.star_4_0 / totalVoters,
      starInfo.star_5_0 / totalVoters
    ];
  } else {
    // 0.5점 단위: 0.5점, 1.0점, 1.5점, ..., 5.0점
    return [
      starInfo.star_0_5 / totalVoters,
      starInfo.star_1_0 / totalVoters,
      starInfo.star_1_5 / totalVoters,
      starInfo.star_2_0 / totalVoters,
      starInfo.star_2_5 / totalVoters,
      starInfo.star_3_0 / totalVoters,
      starInfo.star_3_5 / totalVoters,
      starInfo.star_4_0 / totalVoters,
      starInfo.star_4_5 / totalVoters,
      starInfo.star_5_0 / totalVoters
    ];
  }
}

export default function ChartPage() {
  const { selectedWeek, setSelectedWeek, weeks } = useChart();
  const [selectedTab, setSelectedTab] = useState<'anime-corner' | 'anilab'>('anime-corner');
  
  // selectedWeek가 없을 때 최신 주차로 설정
  useEffect(() => {
    if (!selectedWeek && weeks && weeks.length > 0) {
      const latestWeek = weeks.sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        if (a.quarter !== b.quarter) return b.quarter - a.quarter;
        return b.week - a.week;
      })[0];
      setSelectedWeek(latestWeek);
    }
  }, [selectedWeek, weeks, setSelectedWeek]);

  // 현재 연도, 분기, 주차 정보 (selectedWeek에서 가져오거나 기본값)
  const currentYear = selectedWeek?.year || 2025;
  const currentQuarter = selectedWeek?.quarter || 3;
  const currentWeek = selectedWeek?.week || 1;
  
  
  // 분기 이름 매핑
  const getQuarterName = (quarter: number) => {
    switch (quarter) {
      case 1: return 'SPRING';
      case 2: return 'SUMMER';
      case 3: return 'AUTUMN';
      case 4: return 'WINTER';
      default: return 'SUMMER';
    }
  };
  
  // 무한 스크롤을 위한 useInfiniteQuery 사용
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['chart', 2025, 4, 1],
    queryFn: ({ pageParam = 0 }) => getChartData(2025, 4, 1, pageParam),
    getNextPageParam: (lastPage) => {
      if (lastPage.result.pageInfo.hasNext) {
        return lastPage.result.pageInfo.page + 1;
      }
      return undefined;
    },
    ...queryConfig.home,
  });

  // API 데이터에서 날짜 정보 가져오기
  const getDateRangeFromData = () => {
    if (data?.pages?.[0]?.result?.animeRankDtos?.[0]?.animeStatDto) {
      const animeStat = data.pages[0].result.animeRankDtos[0].animeStatDto;
      // debutDate와 peakDate를 사용하여 날짜 범위 계산
      const startDate = animeStat.debutDate ? new Date(animeStat.debutDate) : new Date('2025-06-29');
      const endDate = animeStat.peakDate ? new Date(animeStat.peakDate) : new Date('2025-07-06');
      
      return {
        start: startDate.toLocaleDateString('ko-KR', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit' 
        }).replace(/\./g, '/').replace(/\s/g, '').replace(/\/$/, ''),
        end: endDate.toLocaleDateString('ko-KR', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit' 
        }).replace(/\./g, '/').replace(/\s/g, '').replace(/\/$/, '')
      };
    }
    
    // 기본값
    return { start: '2025/06/29', end: '2025/07/06' };
  };
  
  const quarterName = getQuarterName(currentQuarter);
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

  // 데이터 로드 후 탭 자동 설정 (홈페이지 로직과 동일)
  useEffect(() => {
    if (data?.pages?.[0]?.result) {
      const animeCornerData = data.pages[0].result.animeTrendRankPreviews || [];
      const anilabData = data.pages[0].result.aniLabRankPreviews || [];
      
      const hasAnilab = anilabData.length > 0;
      const hasAnimeCorner = animeCornerData.length > 0;
      
      if (hasAnilab && !hasAnimeCorner) {
        // Anilab만 있는 경우
        setSelectedTab('anilab');
      } else if (hasAnimeCorner) {
        // Anime Corner가 있는 경우 (둘 다 있거나 Anime Corner만 있는 경우)
        setSelectedTab('anime-corner');
      } else if (hasAnilab) {
        // Anilab만 있는 경우 (fallback)
        setSelectedTab('anilab');
      }
    }
  }, [data]);

  if (isLoading) {
    return (
      <div className="bg-gray-50 flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-800"></div>
        <span className="ml-3 text-gray-600">차트 데이터 로딩 중...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 flex items-center justify-center py-20">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-2">⚠️</div>
          <h3 className="text-lg font-semibold text-red-600 mb-2">데이터 로딩 실패</h3>
          <p className="text-sm text-gray-600 mb-4">차트 데이터를 불러올 수 없습니다.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-rose-500 text-white rounded hover:bg-rose-600 text-sm"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  // 덕스타 차트와 해외 차트 데이터 확인
  const duckstarData = data?.pages?.[0]?.result?.animeRankDtos || [];
  const animeCornerData = data?.pages?.[0]?.result?.animeTrendRankPreviews || [];
  const anilabData = data?.pages?.[0]?.result?.aniLabRankPreviews || [];
  
  // 모든 차트 데이터가 없는 경우에만 "데이터 없음" 표시
  if (duckstarData.length === 0 && animeCornerData.length === 0 && anilabData.length === 0) {
    return (
      <div className="bg-gray-50 flex items-center justify-center py-20">
        <div className="text-center">
          <div className="text-gray-500 text-4xl mb-2">📊</div>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">데이터 없음</h3>
          <p className="text-sm text-gray-500">차트 데이터가 없습니다.</p>
        </div>
      </div>
    );
  }

  // 모든 페이지의 애니메이션 데이터를 합치기
  const allAnimeList = data.pages.flatMap(page => page.result.animeRankDtos || []);

  // 1등 애니메이션 (Winner) - 첫 번째 페이지만
  const firstPageAnimes = data.pages[0]?.result?.animeRankDtos || [];
  const winnerAnime = firstPageAnimes[0];

  // winnerAnime가 있을 때만 winnerMedals 생성
  const winnerMedals = winnerAnime?.medalPreviews?.map((medal, index) => ({
    id: `winner-medal-${index}`,
    type: convertMedalType(medal.type),
    title: winnerAnime.rankPreviewDto.title,
    image: winnerAnime.rankPreviewDto.mainThumbnailUrl,
    rank: medal.rank,
    year: medal.year,
    quarter: medal.quarter,
    week: medal.week,
  })) || [];

  return (
    <div className="bg-gray-50">
      <div className="w-full">
        {/* 배너 */}
        <div className="flex justify-center mb-4">
          <div className="relative w-full h-[99px] overflow-hidden">
            <img 
              src="/banners/chart-banner.svg" 
              alt="차트 배너" 
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
            {/* 배너 텍스트 오버레이 */}
            <div className="absolute inset-0 inline-flex flex-col justify-center items-center">
              <div className="justify-center text-white text-4xl font-bold font-['Pretendard'] leading-[50.75px]">
                {currentYear} {quarterName} {currentWeek}주차 애니메이션 순위
              </div>
              <div className="self-stretch h-6 text-center justify-center text-white text-base font-light font-['Pretendard'] -mt-[5px] tracking-wide">
                {dateRange.start} - {dateRange.end}
              </div>
            </div>
          </div>
        </div>

        {/* 차트 헤더 배경 */}
        <div className="flex justify-center mb-8">
          <div className="relative w-full h-[48px] overflow-hidden">
            <img 
              src="/banners/chart-header-bg.svg" 
              alt="차트 헤더 배경" 
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
            
            {/* 홈페이지 헤더 컴포넌트들 오버레이 */}
            <div className="absolute inset-0 flex items-center justify-center">
              {/* 왼쪽 프레임 - 애니메이션 순위 (768px 너비) */}
              <div className="w-[768px] flex justify-start items-center pl-2">
                <div className="w-44 h-12 relative overflow-hidden">
                  <div className="relative size-full">
                    <p className="absolute font-['Pretendard'] font-semibold leading-[22px] not-italic text-[#FED783] text-[20px] text-center text-nowrap translate-x-[-50%] whitespace-pre" style={{ top: "calc(50% - 11px)", left: "calc(50% + 0.5px)" }}>
                      DUCK★STAR
                    </p>
                  </div>
                  <div aria-hidden="true" className="absolute border-[#FED783] border-[0px_0px_3px] border-solid inset-0 pointer-events-none" />
                </div>
              </div>
              
              {/* 간격 46px */}
              <div className="w-[48px]"></div>
              
              {/* 오른쪽 프레임 - 해외 랭킹 메뉴들 (352px 너비) */}
              <div className="w-[352px] flex justify-center items-center">
                <div className="h-12 inline-flex justify-start items-center pl-2">
                  {/* Anime Corner 탭 */}
                  <div className="w-44 h-12 relative">
                    <button 
                      onClick={() => setSelectedTab('anime-corner')}
                      className="w-full h-full px-2.5 py-3 inline-flex flex-col justify-center items-center cursor-pointer"
                    >
                      <div className={`self-stretch justify-start text-xl font-['Pretendard'] leading-snug ${
                        selectedTab === 'anime-corner' 
                          ? 'text-[#FED783] font-semibold' 
                          : 'text-gray-400 font-normal'
                      }`}>
                        Anime Corner
                      </div>
                    </button>
                    {selectedTab === 'anime-corner' && (
                      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#FED783]"></div>
                    )}
                  </div>
                  
                  {/* AniLab 탭 */}
                  <div className="w-44 h-12 relative">
                    <button 
                      onClick={() => setSelectedTab('anilab')}
                      className="w-full h-full px-9 py-3 inline-flex flex-col justify-center items-center cursor-pointer"
                    >
                      <div className={`self-stretch text-center justify-start text-xl font-['Pretendard'] leading-snug ${
                        selectedTab === 'anilab' 
                          ? 'text-[#FED783] font-semibold' 
                          : 'text-gray-400 font-normal'
                      }`}>
                        AniLab
                      </div>
                    </button>
                    {selectedTab === 'anilab' && (
                      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#FED783]"></div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 메인 컨텐츠 - 차트 리스트와 해외 랭킹 나란히 */}
        <div className="flex gap-[70px] items-start justify-center mt-[46px] pb-12">
          {/* 차트 리스트 - 1등부터 쭉 간격 20 */}
          <div className="flex flex-col gap-5 items-center">
          {/* 덕스타 차트가 있는 경우에만 Winner 표시, 없으면 스켈레톤 */}
          {winnerAnime ? (
            <Winner
            medals={winnerMedals}
            rank={winnerAnime.rankPreviewDto.rank}
            rankDiff={winnerAnime.rankPreviewDto.rankDiff || 0}
            rankDiffType={getRankDiffType(winnerAnime.rankPreviewDto.rankDiff)}
            title={winnerAnime.rankPreviewDto.title}
            studio={winnerAnime.rankPreviewDto.subTitle}
            image={winnerAnime.rankPreviewDto.mainThumbnailUrl}
            rating={Math.round(winnerAnime.starInfoDto.starAverage * 10) / 10}
            debutRank={winnerAnime.animeStatDto.debutRank}
            debutDate={winnerAnime.animeStatDto.debutDate}
            peakRank={winnerAnime.animeStatDto.peakRank}
            peakDate={winnerAnime.animeStatDto.peakDate}
            top10Weeks={winnerAnime.animeStatDto.weeksOnTop10}
            week="25년 4분기 1주차"
            averageRating={winnerAnime.starInfoDto.starAverage * 2}
            participantCount={winnerAnime.starInfoDto.voterCount}
            distribution={createDistributionArray(winnerAnime.starInfoDto, "25년 4분기 1주차")}
            animeId={winnerAnime.rankPreviewDto.contentId}
          />
          ) : (
            /* 덕스타 차트가 없을 때 스켈레톤 */
            <div className="w-[768px] h-[200px] bg-gray-200 rounded-lg flex items-center justify-center">
              <div className="text-gray-500">덕스타 차트 데이터 없음</div>
            </div>
          )}

          {/* 2등 이하 RankCard들 - 덕스타 차트가 있는 경우에만 표시 */}
          {allAnimeList.slice(1).map((anime, index) => {
            const animeMedals = anime.medalPreviews.map((medal, medalIndex) => ({
              id: `anime-${anime.rankPreviewDto.contentId}-medal-${medalIndex}`,
              type: convertMedalType(medal.type),
              title: anime.rankPreviewDto.title,
              image: anime.rankPreviewDto.mainThumbnailUrl,
              rank: medal.rank,
              year: medal.year,
              quarter: medal.quarter,
              week: medal.week,
            }));

            return (
              <RankCard
                key={`${anime.rankPreviewDto.contentId}-${index}`}
                medals={animeMedals}
                rank={anime.rankPreviewDto.rank}
                rankDiff={anime.rankPreviewDto.rankDiff || 0}
                rankDiffType={getRankDiffType(anime.rankPreviewDto.rankDiff)}
                title={anime.rankPreviewDto.title}
                studio={anime.rankPreviewDto.subTitle}
                image={anime.rankPreviewDto.mainThumbnailUrl}
                rating={Math.round(anime.starInfoDto.starAverage * 10) / 10}
                debutRank={anime.animeStatDto.debutRank}
                debutDate={anime.animeStatDto.debutDate}
                peakRank={anime.animeStatDto.peakRank}
                peakDate={anime.animeStatDto.peakDate}
                top10Weeks={anime.animeStatDto.weeksOnTop10}
                week="25년 4분기 1주차"
                averageRating={anime.starInfoDto.starAverage * 2}
                participantCount={anime.starInfoDto.voterCount}
                distribution={createDistributionArray(anime.starInfoDto, "25년 4분기 1주차")}
                animeId={anime.rankPreviewDto.contentId}
              />
            );
          })}
          
          {/* 로딩 인디케이터 */}
          {isFetchingNextPage && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-800"></div>
              <span className="ml-3 text-gray-600">더 많은 데이터 로딩 중...</span>
            </div>
          )}
          
          {/* 더 이상 데이터가 없을 때 */}
          {!hasNextPage && allAnimeList.length > 1 && (
            <div className="text-center py-8 text-gray-500">
              모든 차트 데이터를 불러왔습니다.
            </div>
          )}
          </div>

          {/* 해외 랭킹 리스트 */}
          <div className="flex flex-col gap-5 items-center">
            {(() => {
              // 선택된 탭에 따라 모든 페이지의 데이터 합치기
              const abroadData = selectedTab === 'anime-corner' 
                ? data.pages.flatMap(page => page.result?.animeTrendRankPreviews || [])
                : data.pages.flatMap(page => page.result?.aniLabRankPreviews || []);
              
              // 데이터가 없을 때 스켈레톤 UI 표시
              if (abroadData.length === 0) {
                return (
                  <div className="w-[370px] h-[220px] relative">
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
                      {selectedTab === 'anilab' ? (
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
                );
              }
              
              return abroadData.map((rankPreview, index) => {
                const isWinner = index === 0; // 1등만 Winner
                
                // rankDiff 타입 결정 (기존 로직 재사용)
                const safeRankDiff = rankPreview.rankDiff ?? 0;
                const safeConsecutiveWeeks = rankPreview.consecutiveWeeksAtSameRank ?? 0;
                const isAnilab = selectedTab === 'anilab';
                
                const getRankDiffType = (rankDiff: number, consecutiveWeeks: number, isAnilab: boolean = false): "new" | "up-greater-equal-than-5" | "up-less-than-5" | "down-less-than-5" | "down-greater-equal-than-5" | "same-rank" | "Zero" => {
                  if (rankDiff > 0) {
                    return rankDiff >= 5 ? "up-greater-equal-than-5" : "up-less-than-5";
                  }
                  if (rankDiff < 0) {
                    return rankDiff <= -5 ? "down-greater-equal-than-5" : "down-less-than-5";
                  }
                  
                  if (consecutiveWeeks >= 2) {
                    return "same-rank";
                  }
                  
                  if (consecutiveWeeks === 1 && !isAnilab) {
                    return "new";
                  }
                  
                  return "Zero";
                };
                
                const finalRankDiffType = getRankDiffType(safeRankDiff, safeConsecutiveWeeks, isAnilab);
                
                return (
                  <AbroadRankCard
                    key={rankPreview.contentId || `abroad-${index}`}
                    rank={rankPreview.rank}
                    rankDiff={finalRankDiffType}
                    rankDiffValue={finalRankDiffType === "same-rank" ? safeConsecutiveWeeks.toString() : safeRankDiff.toString()}
                    title={rankPreview.title}
                    studio={rankPreview.subTitle}
                    image={rankPreview.mainThumbnailUrl}
                    weeks={safeConsecutiveWeeks}
                    contentId={rankPreview.contentId}
                    isWinner={isWinner}
                  />
                );
              });
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
