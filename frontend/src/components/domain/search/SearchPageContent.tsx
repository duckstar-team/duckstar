'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  getCurrentSchedule,
  getScheduleByYearAndQuarter,
  searchAnimes,
} from '@/api/search';
import type { AnimePreviewListDto, AnimeSearchListDto } from '@/types/dtos';
import { extractChosung, queryConfig } from '@/lib';
import { useImagePreloading } from '@/hooks/useImagePreloading';
import { useQuery } from '@tanstack/react-query';
import { SearchSkeleton } from '@/components/skeletons';
import { DayOfWeek } from './DaySelection';
import SearchFilterSection from './SearchFilterSection';
import SeasonDaySelector from './SeasonDaySelector';
import AnimeSchedule from './AnimeSchedule';
import { useSearchQuery } from '@/hooks/useSearchParams';
import { useScrollNavigation } from '@/hooks/useScrollNavigation';
import { getEmptyDays, groupAnimesByDay } from '@/lib';
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

  // 애니메이션 데이터 처리
  const processedData = useMemo(() => {
    if (!scheduleData) return null;

    if (isThisWeek) {
      return {
        schedule: scheduleData.schedule,
      };
    } else {
      return {
        year: year!,
        quarter: quarter!,
        schedule: scheduleData.schedule,
      };
    }
  }, [scheduleData, isThisWeek, year, quarter]);

  // 섹션 ID 생성 함수
  const getSectionId = (baseId: string): string => {
    if (isThisWeek) {
      return baseId;
    }
    return `${baseId}-${year}-${quarter}`;
  };

  // 빈 요일 확인
  const emptyDays = useMemo(() => {
    if (!processedData) return new Set<DayOfWeek>();

    const emptyDaysSet = getEmptyDays(
      processedData,
      isSearchMode,
      showOnlyAiring,
      selectedOttServices,
      isThisWeek
    );

    return new Set(Array.from(emptyDaysSet) as DayOfWeek[]);
  }, [
    processedData,
    showOnlyAiring,
    selectedOttServices,
    isSearchMode,
    isThisWeek,
  ]);

  // 요일별 그룹핑
  const groupedAnimes = useMemo(() => {
    if (!processedData) return {};

    return groupAnimesByDay(
      processedData,
      isSearchMode,
      searchResults,
      searchQuery,
      showOnlyAiring,
      selectedOttServices,
      isThisWeek
    );
  }, [
    processedData,
    selectedOttServices,
    showOnlyAiring,
    isSearchMode,
    searchResults,
    searchQuery,
    isThisWeek,
  ]);

  // 스크롤 네비게이션 섹션 생성
  const navigationSections = useMemo(() => {
    if (!groupedAnimes || Object.keys(groupedAnimes).length === 0) return [];

    const hasUpcomingGroup =
      isThisWeek &&
      groupedAnimes['UPCOMING'] &&
      groupedAnimes['UPCOMING'].length > 0;

    const sections = hasUpcomingGroup
      ? [
          { id: getSectionId('upcoming'), day: '곧 시작' as DayOfWeek },
          { id: getSectionId('mon'), day: '월' as DayOfWeek },
          { id: getSectionId('tue'), day: '화' as DayOfWeek },
          { id: getSectionId('wed'), day: '수' as DayOfWeek },
          { id: getSectionId('thu'), day: '목' as DayOfWeek },
          { id: getSectionId('fri'), day: '금' as DayOfWeek },
          { id: getSectionId('sat'), day: '토' as DayOfWeek },
          { id: getSectionId('sun'), day: '일' as DayOfWeek },
          {
            id: getSectionId('special'),
            day: '특별편성 및 극장판' as DayOfWeek,
          },
        ]
      : [
          { id: getSectionId('mon'), day: '월' as DayOfWeek },
          { id: getSectionId('tue'), day: '화' as DayOfWeek },
          { id: getSectionId('wed'), day: '수' as DayOfWeek },
          { id: getSectionId('thu'), day: '목' as DayOfWeek },
          { id: getSectionId('fri'), day: '금' as DayOfWeek },
          { id: getSectionId('sat'), day: '토' as DayOfWeek },
          { id: getSectionId('sun'), day: '일' as DayOfWeek },
          {
            id: getSectionId('special'),
            day: '특별편성 및 극장판' as DayOfWeek,
          },
        ];

    return sections;
  }, [groupedAnimes, isThisWeek, year, quarter]);

  // 스크롤 네비게이션
  useScrollNavigation(navigationSections, setSelectedDay);

  // "이번 주" 데이터 로드 후 첫 번째 존재하는 섹션으로 요일 설정
  useEffect(() => {
    if (scheduleData && isThisWeek && !searchQuery.trim()) {
      setTimeout(() => {
        const dayOrder = [
          'upcoming',
          'mon',
          'tue',
          'wed',
          'thu',
          'fri',
          'sat',
          'sun',
          'special',
        ];
        const dayMap: { [key: string]: DayOfWeek } = {
          upcoming: '곧 시작',
          mon: '월',
          tue: '화',
          wed: '수',
          thu: '목',
          fri: '금',
          sat: '토',
          sun: '일',
          special: '특별편성 및 극장판',
        };

        for (const day of dayOrder) {
          const element = document.getElementById(day);
          if (element && element.children.length > 0) {
            const firstDay = dayMap[day];
            if (firstDay) {
              setSelectedDay(firstDay);
              break;
            }
          }
        }
      }, 100);
    }
  }, [scheduleData, isThisWeek, searchQuery]);

  // 랜덤 애니메이션 제목 설정 (이번 주만)
  useEffect(() => {
    if (scheduleData && isThisWeek && !randomAnimeTitle) {
      if (scheduleData.schedule) {
        const allAnimes = Object.values(scheduleData.schedule).flat();
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

    const dayKey =
      day === '일'
        ? 'sun'
        : day === '월'
          ? 'mon'
          : day === '화'
            ? 'tue'
            : day === '수'
              ? 'wed'
              : day === '목'
                ? 'thu'
                : day === '금'
                  ? 'fri'
                  : day === '토'
                    ? 'sat'
                    : day === '곧 시작'
                      ? 'upcoming'
                      : 'special';

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
      <div className="relative w-full bg-gray-100">
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
      <div className="mx-auto max-w-7xl px-3 pb-0 sm:px-6">
        <AnimeSchedule
          isThisWeek={isThisWeek}
          year={year}
          quarter={quarter}
          searchQuery={searchQuery}
          selectedOttServices={selectedOttServices}
          groupedAnimes={groupedAnimes}
          getSectionId={getSectionId}
          onDayClick={setSelectedDay}
        />
      </div>
    </main>
  );
}
