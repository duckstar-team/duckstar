'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  getCurrentSchedule,
  getScheduleByYearAndQuarter,
  searchAnimes,
} from '@/api/search';
import type { AnimePreviewListDto, AnimeSearchListDto } from '@/types/dtos';
import { extractChosung, queryConfig } from '@/lib';
import { isUpcomingAnime, sortUpcomingAnimes } from '@/lib/utils/schedule';
import { useImagePreloading } from '@/hooks/useImagePreloading';
import { useQuery } from '@tanstack/react-query';
import { SearchSkeleton } from '@/components/skeletons';
import { DayOfWeek } from './DaySelection';
import SearchFilterSection from './SearchFilterSection';
import SeasonDaySelector from './SeasonDaySelector';
import AnimeSchedule from './AnimeSchedule';
import { useSearchQuery } from '@/hooks/useSearchParams';
import { useScrollNavigation } from '@/hooks/useScrollNavigation';
import { showToast } from '@/components/common/Toast';

interface SearchPageContentProps {
  /** 연도 (null이면 "이번 주") */
  year?: number | null;
  /** 분기 (null이면 "이번 주") */
  quarter?: number | null;
}

export default function SearchPageContent({
  year = null,
  quarter = null,
}: SearchPageContentProps) {
  const router = useRouter();
  const isThisWeek = year === null || quarter === null;

  // 커스텀 훅
  const { searchQuery, searchInput, setSearchQuery, setSearchInput } =
    useSearchQuery();

  // 상태 관리
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('월');
  const [selectedOttServices, setSelectedOttServices] = useState<string[]>([]);
  const [randomAnimeTitle, setRandomAnimeTitle] = useState<string>('');
  const [showOnlyAiring, setShowOnlyAiring] = useState(false);
  const [isInitialized, setIsInitialized] = useState(!isThisWeek);

  // 초기화
  useEffect(() => {
    if (!isThisWeek) {
      setIsInitialized(true);
    }
  }, [isThisWeek]);

  // React Query 데이터 페칭
  const {
    data: scheduleData,
    error,
    isLoading,
  } = useQuery<AnimePreviewListDto>({
    queryKey: isThisWeek
      ? ['schedule', 'this-week']
      : ['schedule', year, quarter],
    queryFn: isThisWeek
      ? getCurrentSchedule
      : () => getScheduleByYearAndQuarter(year!, quarter!),
    enabled: isThisWeek ? true : isInitialized,
    ...queryConfig.search,
  });

  // 검색 쿼리
  const {
    data: searchData,
    error: searchError,
    isLoading: isSearchLoading,
  } = useQuery<AnimeSearchListDto>({
    queryKey: ['search', searchQuery],
    queryFn: () => searchAnimes(searchQuery),
    enabled: searchQuery.trim().length > 0,
    ...queryConfig.searchQuery,
  });

  // 이미지 프리로딩
  const { preloadSearchResults } = useImagePreloading();

  // 검색 결과 표시 시 페이드 인 효과
  useEffect(() => {
    if (searchQuery.trim()) {
      const timeout = setTimeout(() => {
        const animeItems = document.querySelectorAll('[data-anime-item]');
        animeItems.forEach((item) => {
          (item as HTMLElement).style.transition = 'opacity 0.3s ease-in';
          (item as HTMLElement).style.opacity = '1';
        });
      }, 50);

      return () => clearTimeout(timeout);
    }
  }, [searchQuery]);

  // 데이터 로드 후 요일 상태 복원 (시즌별 페이지만)
  useEffect(() => {
    if (!isThisWeek && scheduleData && !isLoading) {
      const savedDay = sessionStorage.getItem('selected-day');
      if (savedDay) {
        const validDays = [
          '월',
          '화',
          '수',
          '목',
          '금',
          '토',
          '일',
          '특별편성 및 극장판',
        ];
        const isValidDay = validDays.includes(savedDay);

        if (isValidDay) {
          setSelectedDay(savedDay as DayOfWeek);
        } else {
          setSelectedDay('월');
        }

        sessionStorage.removeItem('selected-day');
      }
    }
  }, [scheduleData, isLoading, isThisWeek, year, quarter]);

  // 현재 사용할 데이터 결정
  const isSearchMode = searchQuery.trim().length > 0;
  const currentError = isSearchMode ? searchError : error;
  const currentIsLoading = isSearchMode ? isSearchLoading : isLoading;

  // 검색 결과 데이터
  const searchResults =
    isSearchMode && searchData ? searchData.animePreviews : [];

  // 섹션 ID 생성 함수 (메모이제이션)
  const getSectionId = useCallback(
    (baseId: string): string => {
      if (isThisWeek) {
        return baseId;
      }
      return `${baseId}-${year}-${quarter}`;
    },
    [isThisWeek, year, quarter]
  );

  // 백엔드 응답을 그대로 사용하되, 필터링만 적용
  const filteredScheduleDtos = useMemo(() => {
    if (!scheduleData || isSearchMode) return [];

    return scheduleData.scheduleDtos.map((scheduleDto) => {
      // OTT 필터 적용
      let filteredAnimes = scheduleDto.animePreviews;
      if (selectedOttServices.length > 0) {
        filteredAnimes = filteredAnimes.filter((anime) => {
          if (!anime.ottDtos || anime.ottDtos.length === 0) return false;
          return anime.ottDtos.some((ott) =>
            selectedOttServices.includes(ott.ottType.toLowerCase())
          );
        });
      }

      // 방영 중 필터 적용
      if (showOnlyAiring) {
        filteredAnimes = filteredAnimes.filter(
          (anime) => anime.status === 'NOW_SHOWING'
        );
      }

      return {
        ...scheduleDto,
        animePreviews: filteredAnimes,
      };
    });
  }, [scheduleData, isSearchMode, selectedOttServices, showOnlyAiring]);

  // 빈 요일 확인
  const emptyDays = useMemo(() => {
    if (!scheduleData || isSearchMode) return new Set<DayOfWeek>();

    const emptyDaysSet = new Set<string>();
    const dayMap: Record<string, DayOfWeek> = {
      MON: '월',
      TUE: '화',
      WED: '수',
      THU: '목',
      FRI: '금',
      SAT: '토',
      SUN: '일',
      SPECIAL: '특별편성 및 극장판',
    };

    filteredScheduleDtos.forEach((scheduleDto) => {
      if (scheduleDto.animePreviews.length === 0) {
        const koreanDay = dayMap[scheduleDto.dayOfWeekShort];
        if (koreanDay) {
          emptyDaysSet.add(koreanDay);
        }
      }
    });

    return new Set(Array.from(emptyDaysSet) as DayOfWeek[]);
  }, [
    scheduleData,
    filteredScheduleDtos,
    isSearchMode,
    showOnlyAiring,
    selectedOttServices,
    isThisWeek,
  ]);

  // 그룹핑된 애니메이션 (백엔드 응답을 그대로 사용)
  const groupedAnimes = useMemo(() => {
    if (isSearchMode) {
      // 검색 모드: 검색 결과를 필터링하여 반환
      let filteredResults = searchResults;
      if (selectedOttServices.length > 0) {
        filteredResults = filteredResults.filter((anime) => {
          if (!anime.ottDtos || anime.ottDtos.length === 0) return false;
          return anime.ottDtos.some((ott) =>
            selectedOttServices.includes(ott.ottType.toLowerCase())
          );
        });
      }
      if (showOnlyAiring) {
        filteredResults = filteredResults.filter(
          (anime) => anime.status === 'NOW_SHOWING'
        );
      }
      return filteredResults.length > 0
        ? { SEARCH_RESULTS: filteredResults }
        : {};
    }

    // 스케줄 모드: 백엔드 응답을 그대로 사용하되, "곧 시작" 그룹 추가
    if (!scheduleData) return {};

    const grouped: { [key: string]: typeof searchResults } = {};

    // "곧 시작" 그룹 생성 (이번 주만, OTT 필터가 없을 때)
    if (isThisWeek && selectedOttServices.length === 0) {
      // 모든 scheduleDtos에서 애니메이션을 가져와서 12시간 이내인 것들 필터링
      const allAnimes = filteredScheduleDtos.flatMap(
        (dto) => dto.animePreviews
      );

      const upcomingAnimes = allAnimes.filter((anime) => {
        // NOW_SHOWING 또는 UPCOMING 상태이고 scheduledAt이 있어야 함
        if (
          (anime.status !== 'NOW_SHOWING' && anime.status !== 'UPCOMING') ||
          !anime.scheduledAt
        ) {
          return false;
        }

        // isUpcomingAnime 함수 사용 (12시간 이내 체크)
        return isUpcomingAnime(anime);
      });

      if (upcomingAnimes.length > 0) {
        // 중복 제거 (같은 애니메이션이 여러 그룹에 있을 수 있음)
        const uniqueUpcomingAnimes = Array.from(
          new Map(
            upcomingAnimes.map((anime) => [anime.animeId, anime])
          ).values()
        );

        // 정렬 후 "곧 시작" 그룹에 추가
        const sorted = sortUpcomingAnimes(uniqueUpcomingAnimes);
        grouped['NONE'] = sorted;
      }
    }

    // 백엔드 응답의 scheduleDtos를 그대로 사용
    filteredScheduleDtos.forEach((scheduleDto) => {
      if (scheduleDto.animePreviews.length > 0) {
        grouped[scheduleDto.dayOfWeekShort] = scheduleDto.animePreviews;
      }
    });

    return grouped;
  }, [
    isSearchMode,
    searchResults,
    scheduleData,
    filteredScheduleDtos,
    selectedOttServices,
    showOnlyAiring,
  ]);

  // 스크롤 네비게이션 섹션 생성 (groupedAnimes를 기반으로 생성하여 동기화)
  const navigationSections = useMemo(() => {
    if (!scheduleData || isSearchMode) return [];

    const dayMap: Record<string, { id: string; day: DayOfWeek }> = {
      MON: { id: getSectionId('mon'), day: '월' as DayOfWeek },
      TUE: { id: getSectionId('tue'), day: '화' as DayOfWeek },
      WED: { id: getSectionId('wed'), day: '수' as DayOfWeek },
      THU: { id: getSectionId('thu'), day: '목' as DayOfWeek },
      FRI: { id: getSectionId('fri'), day: '금' as DayOfWeek },
      SAT: { id: getSectionId('sat'), day: '토' as DayOfWeek },
      SUN: { id: getSectionId('sun'), day: '일' as DayOfWeek },
      SPECIAL: {
        id: getSectionId('special'),
        day: '특별편성 및 극장판' as DayOfWeek,
      },
      NONE: { id: getSectionId('upcoming'), day: '곧 시작' as DayOfWeek },
    };

    // groupedAnimes의 키 순서대로 섹션 생성 (실제 표시 순서와 동기화)
    const dayOrder = isThisWeek
      ? ['NONE', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN', 'SPECIAL']
      : ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN', 'SPECIAL'];

    return dayOrder
      .filter(
        (dayKey) => groupedAnimes[dayKey] && groupedAnimes[dayKey].length > 0
      )
      .map((dayKey) => dayMap[dayKey])
      .filter(Boolean);
  }, [
    scheduleData,
    groupedAnimes,
    isSearchMode,
    isThisWeek,
    year,
    quarter,
    getSectionId,
  ]);

  // 스크롤 네비게이션 (offset: 헤더 60 + 요일 선택 바 44 + 여유 공간 50 = 154)
  useScrollNavigation(navigationSections, setSelectedDay, 154);

  // "이번 주" 데이터 로드 후 첫 번째 존재하는 섹션으로 요일 설정
  useEffect(() => {
    if (scheduleData && isThisWeek && !searchQuery.trim()) {
      setTimeout(() => {
        const dayOrder = [
          'NONE',
          'MON',
          'TUE',
          'WED',
          'THU',
          'FRI',
          'SAT',
          'SUN',
          'SPECIAL',
        ];
        const dayMap: Record<string, DayOfWeek> = {
          NONE: '곧 시작',
          MON: '월',
          TUE: '화',
          WED: '수',
          THU: '목',
          FRI: '금',
          SAT: '토',
          SUN: '일',
          SPECIAL: '특별편성 및 극장판',
        };

        for (const dayKey of dayOrder) {
          const scheduleDto = filteredScheduleDtos.find(
            (dto) =>
              dto.dayOfWeekShort === dayKey && dto.animePreviews.length > 0
          );
          if (scheduleDto) {
            const baseId =
              dayKey === 'NONE' ? 'upcoming' : dayKey.toLowerCase();
            const sectionId = getSectionId(baseId);
            const element = document.getElementById(sectionId);
            if (element && element.children.length > 0) {
              const firstDay = dayMap[dayKey];
              if (firstDay) {
                setSelectedDay(firstDay);
                break;
              }
            }
          }
        }
      }, 100);
    }
  }, [
    scheduleData,
    filteredScheduleDtos,
    isThisWeek,
    searchQuery,
    getSectionId,
  ]);

  // 랜덤 애니메이션 제목 설정 (이번 주만)
  useEffect(() => {
    if (scheduleData && isThisWeek && !randomAnimeTitle) {
      if (scheduleData.scheduleDtos) {
        const allAnimes = scheduleData.scheduleDtos.flatMap(
          (dto) => dto.animePreviews
        );
        if (allAnimes.length > 0) {
          preloadSearchResults(allAnimes);
          const randomIndex = Math.floor(Math.random() * allAnimes.length);
          const selectedAnime = allAnimes[randomIndex];

          const chosung = extractChosung(selectedAnime.titleKor);
          const koreanCount = (selectedAnime.titleKor.match(/[가-힣]/g) || [])
            .length;

          const shouldShowChosung = (() => {
            const hasNumbers = /\d/.test(selectedAnime.titleKor);
            const hasSpecialChars =
              /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
                selectedAnime.titleKor
              );

            if (hasNumbers || hasSpecialChars) {
              return false;
            }

            if (koreanCount >= 3 && chosung.length >= 3) {
              return true;
            }

            if (koreanCount >= 2 && chosung.length >= 2) {
              const englishCount = (
                selectedAnime.titleKor.match(/[a-zA-Z]/g) || []
              ).length;
              return englishCount <= koreanCount;
            }

            return false;
          })();

          if (shouldShowChosung) {
            const limitedChosung = chosung.slice(
              0,
              Math.min(4, chosung.length)
            );
            setRandomAnimeTitle(
              `${selectedAnime.titleKor} (예: ${limitedChosung}...)`
            );
          } else {
            setRandomAnimeTitle(selectedAnime.titleKor);
          }
        }
      }
    }
  }, [scheduleData, isThisWeek, randomAnimeTitle, preloadSearchResults]);

  // 핸들러 함수들
  const handleOttFilterChange = (service: string, checked: boolean) => {
    if (checked) {
      setSelectedOttServices((prev) => [...prev, service]);
    } else {
      setSelectedOttServices((prev) => prev.filter((s) => s !== service));
    }
  };

  const handleSearchInputChange = (input: string) => {
    setSearchInput(input);
  };

  const handleSearch = () => {
    const query = searchInput.trim();
    if (query) {
      const animeItems = document.querySelectorAll('[data-anime-item]');
      animeItems.forEach((item) => {
        (item as HTMLElement).style.transition = 'opacity 0.2s ease-out';
        (item as HTMLElement).style.opacity = '0';
      });

      setTimeout(() => {
        setSearchQuery(query);
        if (isThisWeek) {
          router.push(`/search?keyword=${encodeURIComponent(query)}`);
        }
      }, 200);
    } else {
      setSearchQuery('');
    }
  };

  const handleSearchReset = () => {
    const animeItems = document.querySelectorAll('[data-anime-item]');
    animeItems.forEach((item) => {
      (item as HTMLElement).style.transition = 'opacity 0.2s ease-out';
      (item as HTMLElement).style.opacity = '0';
    });

    setTimeout(() => {
      setSearchQuery('');
      setSearchInput('');
      if (isThisWeek) {
        router.push('/search');
      }
    }, 200);
  };

  const handleDaySelect = (day: DayOfWeek) => {
    setSelectedDay(day);

    const dayMap: Record<DayOfWeek, string> = {
      일: 'sun',
      월: 'mon',
      화: 'tue',
      수: 'wed',
      목: 'thu',
      금: 'fri',
      토: 'sat',
      '곧 시작': 'upcoming',
      '특별편성 및 극장판': 'special',
    };

    const dayKey = dayMap[day];
    if (!dayKey) return;

    const sectionId = getSectionId(dayKey);
    const element = document.getElementById(sectionId);

    if (element) {
      const headerHeight = 60;
      const daySelectionHeight = 44;
      const margin = 50;
      const targetY =
        element.offsetTop - headerHeight - daySelectionHeight - margin;

      window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });

      setTimeout(() => {
        const rect = element.getBoundingClientRect();
        const scrollTop =
          window.pageYOffset || document.documentElement.scrollTop;
        const targetScrollTop =
          scrollTop + rect.top - headerHeight - daySelectionHeight - margin;
        window.scrollTo({
          top: Math.max(0, targetScrollTop),
          behavior: 'smooth',
        });
      }, 100);
    } else {
      // 요소를 찾을 수 없으면 토스트 메시지 표시
      showToast.info('해당 요일에 애니메이션이 없습니다.');
      return;
    }
  };

  const handleSeasonSelect = (
    selectedYear: number,
    selectedQuarter: number
  ) => {
    const isThisWeekSelected = selectedYear === 0 && selectedQuarter === 0;

    // 동일한 시즌 클릭 시 아무 반응하지 않음
    if (isThisWeekSelected && isThisWeek) {
      return;
    }
    if (
      !isThisWeekSelected &&
      year === selectedYear &&
      quarter === selectedQuarter
    ) {
      return;
    }

    if (isThisWeekSelected) {
      const dayToSave = selectedDay === '곧 시작' ? '월' : selectedDay;
      sessionStorage.setItem('selected-day', dayToSave);

      const animeItems = document.querySelectorAll('[data-anime-item]');
      animeItems.forEach((item) => {
        (item as HTMLElement).style.transition = 'opacity 0.2s ease-out';
        (item as HTMLElement).style.opacity = '0';
      });

      window.scrollTo({ top: 0, behavior: 'instant' });
      router.push('/search');
    } else {
      const dayToSave = selectedDay === '곧 시작' ? '월' : selectedDay;
      sessionStorage.setItem('selected-day', dayToSave);

      const animeItems = document.querySelectorAll('[data-anime-item]');
      animeItems.forEach((item) => {
        (item as HTMLElement).style.transition = 'opacity 0.2s ease-out';
        (item as HTMLElement).style.opacity = '0';
      });

      window.scrollTo({ top: 0, behavior: 'instant' });
      router.push(`/search/${selectedYear}/${selectedQuarter}`);
    }
  };

  const handleShowOnlyAiringChange = (checked: boolean) => {
    setShowOnlyAiring(checked);
  };

  // 로딩 상태
  if (currentIsLoading) {
    return <SearchSkeleton />;
  }

  // 에러 상태
  if (currentError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">
            데이터를 불러오는 중 오류가 발생했습니다
          </h2>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <main>
      <div className="relative w-full bg-gray-100 dark:bg-zinc-800">
        {/* OTT 필터 탭 + 검색 바 */}
        <SearchFilterSection
          selectedOttServices={selectedOttServices}
          searchInput={searchInput}
          placeholder={
            randomAnimeTitle || '분기 신작 애니/캐릭터를 검색해보세요.'
          }
          onOttFilterChange={(ottService) => {
            if (ottService === 'clear') {
              setSelectedOttServices([]);
            } else {
              handleOttFilterChange(
                ottService,
                !selectedOttServices.includes(ottService)
              );
            }
          }}
          onSearchInputChange={handleSearchInputChange}
          onSearch={handleSearch}
        />

        {/* 시즌 + 요일 선택 (스티키) */}
        <SeasonDaySelector
          isThisWeek={isThisWeek}
          year={year}
          quarter={quarter}
          searchQuery={searchQuery}
          selectedOttServices={selectedOttServices}
          selectedDay={selectedDay}
          emptyDays={emptyDays}
          showOnlyAiring={showOnlyAiring}
          onSeasonSelect={handleSeasonSelect}
          onDaySelect={handleDaySelect}
          onSearchReset={handleSearchReset}
          onShowOnlyAiringChange={handleShowOnlyAiringChange}
          onOttRemove={(service) => handleOttFilterChange(service, false)}
          onOttClear={() => setSelectedOttServices([])}
        />
      </div>

      {/* 애니 시간표 */}
      <div className="mx-auto max-w-7xl px-3 pb-20 sm:px-6">
        <AnimeSchedule
          isThisWeek={isThisWeek}
          year={year}
          quarter={quarter}
          searchQuery={searchQuery}
          selectedOttServices={selectedOttServices}
          groupedAnimes={groupedAnimes}
          getSectionId={getSectionId}
        />
      </div>
    </main>
  );
}
