'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AnimeCard from '@/components/domain/anime/AnimeCard';
import DaySelection, {
  DayOfWeek,
} from '@/components/domain/search/DaySelection';
import SearchFilters from '@/components/domain/search/SearchFilters';
import SearchBar from '@/components/domain/search/SearchBar';
import {
  getCurrentSchedule,
  getScheduleByYearAndQuarter,
  searchAnimes,
} from '@/api/search';
import SeasonSelector from '@/components/domain/search/SeasonSelector';
import type {
  AnimePreviewDto,
  AnimePreviewListDto,
  AnimeSearchListDto,
} from '@/types/dtos';
import { extractChosung, queryConfig } from '@/lib';
import { useImagePreloading } from '@/hooks/useImagePreloading';
import { useQuery } from '@tanstack/react-query';
import { SearchSkeleton } from '@/components/skeletons';
import { ChevronLeft, FileSearch } from 'lucide-react';

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
  const searchParams = useSearchParams();
  const isThisWeek = year === null || quarter === null;

  // 상태 관리
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('월');
  const [selectedOttServices, setSelectedOttServices] = useState<string[]>([]);
  const [randomAnimeTitle, setRandomAnimeTitle] = useState<string>('');
  const [showOnlyAiring, setShowOnlyAiring] = useState(false);
  const [isInitialized, setIsInitialized] = useState(!isThisWeek);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isDaySelectionSticky, setIsDaySelectionSticky] = useState(false);
  const [isSeasonSelectorSticky, setIsSeasonSelectorSticky] = useState(false);
  const [seasonSelectorHeight, setSeasonSelectorHeight] = useState(0);
  const [isMobileMenuSticky, setIsMobileMenuSticky] = useState(false);
  const [isSmallDesktop, setIsSmallDesktop] = useState(false);

  // Refs
  const daySelectionRef = useRef<HTMLDivElement>(null);
  const seasonSelectorRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // 뷰포트 설정 (두 페이지 동일)
  useEffect(() => {
    const head = document.head;
    if (!head) return;

    const existing = document.querySelector(
      'meta[name="viewport"]'
    ) as HTMLMetaElement | null;
    const prevContent = existing?.getAttribute('content') || '';

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

    const body = document.body;
    const originalMinWidth = body.style.minWidth;
    const originalOverflowX = body.style.overflowX;

    body.style.minWidth = 'auto';
    body.style.overflowX = 'hidden';

    return () => {
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

      body.style.minWidth = originalMinWidth;
      body.style.overflowX = originalOverflowX;
    };
  }, []);

  // 화면 크기 감지
  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallDesktop(window.innerWidth < 1440);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

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
    ...(isThisWeek
      ? {
          staleTime: 2 * 60 * 1000,
          gcTime: 10 * 60 * 1000,
          refetchOnWindowFocus: false,
          refetchOnReconnect: true,
          retry: 2,
          retryDelay: 3000,
        }
      : queryConfig.search),
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
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 1,
    retryDelay: 2000,
  });

  // 이미지 프리로딩
  const { preloadSearchResults } = useImagePreloading();

  // URL 쿼리 파라미터 처리
  useEffect(() => {
    const queryParam = searchParams?.get('q');
    const keywordParam = searchParams?.get('keyword');
    const fromAnimeDetail = sessionStorage.getItem('from-anime-detail');
    const fromHeaderSearch = sessionStorage.getItem('from-header-search');

    if (keywordParam) {
      setSearchQuery(keywordParam);
      setSearchInput(keywordParam);
      setIsSearching(true);

      if (fromAnimeDetail === 'true') {
        sessionStorage.removeItem('from-anime-detail');
      }
      if (fromHeaderSearch === 'true') {
        sessionStorage.removeItem('from-header-search');
      }
    } else if (
      queryParam &&
      (fromHeaderSearch === 'true' || fromAnimeDetail !== 'true')
    ) {
      setSearchQuery(queryParam);
      setSearchInput(queryParam);
      setIsSearching(true);

      if (fromHeaderSearch === 'true') {
        sessionStorage.removeItem('from-header-search');
      }
    }
  }, [searchParams]);

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
  const currentData = isSearchMode ? searchData : scheduleData;
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

  // 요일 키 매핑 함수
  const getDayKey = (day: DayOfWeek): string => {
    const dayMapping: Record<string, string> = {
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

    return dayMapping[day] || day;
  };

  // 섹션 ID 생성 함수
  const getSectionId = (baseId: string): string => {
    if (isThisWeek) {
      return baseId;
    }
    return `${baseId}-${year}-${quarter}`;
  };

  // 빈 요일 확인
  const emptyDays = useMemo(() => {
    if (!processedData || !('schedule' in processedData) || isSearchMode) {
      return new Set<DayOfWeek>();
    }

    const emptyDaysSet = new Set<DayOfWeek>();
    const dayOrder: (keyof typeof processedData.schedule)[] = [
      'MON',
      'TUE',
      'WED',
      'THU',
      'FRI',
      'SAT',
      'SUN',
      'SPECIAL',
    ];

    dayOrder.forEach((day) => {
      let dayAnimes = processedData.schedule[day] || [];

      if (day === 'SPECIAL') {
        const movieAnimes = Object.values(processedData.schedule)
          .flat()
          .filter((anime) => anime.medium === 'MOVIE');

        const uniqueMovieAnimes = movieAnimes.filter(
          (anime) =>
            !processedData.schedule['SPECIAL']?.some(
              (special: any) => special.animeId === anime.animeId
            )
        );

        dayAnimes = [...dayAnimes, ...uniqueMovieAnimes];
      }

      const filteredAnimes = showOnlyAiring
        ? dayAnimes.filter((anime) => anime.status === 'NOW_SHOWING')
        : dayAnimes;

      const finalAnimes =
        selectedOttServices.length > 0
          ? filteredAnimes.filter((anime) => {
              const hasMatchingOtt = selectedOttServices.some((selectedOtt) =>
                anime.ottDtos?.some(
                  (ott: any) =>
                    ott.ottType && ott.ottType.toLowerCase() === selectedOtt
                )
              );
              return hasMatchingOtt;
            })
          : filteredAnimes;

      if (finalAnimes.length === 0) {
        const dayInKorean = {
          SUN: '일',
          MON: '월',
          TUE: '화',
          WED: '수',
          THU: '목',
          FRI: '금',
          SAT: '토',
          SPECIAL: '특별편성 및 극장판',
        }[day];

        if (dayInKorean) {
          emptyDaysSet.add(dayInKorean as DayOfWeek);
        }
      }
    });

    // "곧 시작" 그룹 확인 (이번 주만)
    if (isThisWeek && selectedOttServices.length === 0) {
      const upcomingAnimes = Object.values(processedData.schedule)
        .flat()
        .filter((anime) => {
          if (anime.status !== 'NOW_SHOWING' || !anime.scheduledAt)
            return false;

          const now = new Date();
          const scheduled = new Date(anime.scheduledAt);

          if (isNaN(scheduled.getTime())) return false;

          const targetDayOfWeek = scheduled.getDay();
          const targetHours = scheduled.getHours();
          const targetMinutes = scheduled.getMinutes();

          const getThisWeekScheduledTime = () => {
            const thisWeekScheduled = new Date(now);
            thisWeekScheduled.setHours(targetHours, targetMinutes, 0, 0);

            const currentDayOfWeek = now.getDay();
            let daysUntilTarget = targetDayOfWeek - currentDayOfWeek;

            if (daysUntilTarget < 0) {
              daysUntilTarget += 7;
            }

            thisWeekScheduled.setDate(now.getDate() + daysUntilTarget);
            return thisWeekScheduled;
          };

          const getNextWeekScheduledTime = () => {
            const nextWeekScheduled = new Date(now);
            nextWeekScheduled.setHours(targetHours, targetMinutes, 0, 0);

            const currentDayOfWeek = now.getDay();
            let daysUntilTarget = targetDayOfWeek - currentDayOfWeek;

            if (daysUntilTarget <= 0) {
              daysUntilTarget += 7;
            } else {
              daysUntilTarget += 7;
            }

            nextWeekScheduled.setDate(now.getDate() + daysUntilTarget);
            return nextWeekScheduled;
          };

          const thisWeekScheduledTime = getThisWeekScheduledTime();
          const nextWeekScheduledTime = getNextWeekScheduledTime();

          const thisWeekEndTime = new Date(
            thisWeekScheduledTime.getTime() + 23 * 60 * 1000 + 59 * 1000
          );
          const isCurrentlyAiring =
            now >= thisWeekScheduledTime && now <= thisWeekEndTime;

          if (isCurrentlyAiring) return true;

          if (now > thisWeekEndTime) {
            const diff = nextWeekScheduledTime.getTime() - now.getTime();
            const twelveHoursInMs = 12 * 60 * 60 * 1000;

            return diff <= twelveHoursInMs && diff >= 0;
          }

          return false;
        });

      if (upcomingAnimes.length === 0) {
        emptyDaysSet.add('곧 시작');
      }
    }

    return emptyDaysSet;
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

    // 검색 중일 때
    if (isSearchMode) {
      if (searchResults.length > 0) {
        return {
          SEARCH_RESULTS: searchResults,
        };
      }
      return {};
    }

    // 일반 스케줄 데이터 처리
    if (!('schedule' in processedData)) {
      return {};
    }

    const dayOrder: (keyof typeof processedData.schedule)[] = [
      'MON',
      'TUE',
      'WED',
      'THU',
      'FRI',
      'SAT',
      'SUN',
      'SPECIAL',
    ];
    const grouped: { [key: string]: AnimePreviewDto[] } = {};

    // 방영 중 필터링 함수
    const filterAiringAnimes = (animes: AnimePreviewDto[]) => {
      if (showOnlyAiring) {
        return animes.filter((anime) => anime.status === 'NOW_SHOWING');
      }
      return animes;
    };

    // OTT 필터링 함수
    const filterOttAnimes = (animes: AnimePreviewDto[]) => {
      if (selectedOttServices.length === 0) {
        return animes;
      }

      return animes.filter((anime) => {
        if (!anime.ottDtos || anime.ottDtos.length === 0) {
          return false;
        }

        return anime.ottDtos.some((ott) =>
          selectedOttServices.includes(ott.ottType.toLowerCase())
        );
      });
    };

    // 검색 필터링 함수
    const filterSearchAnimes = (animes: AnimePreviewDto[]) => {
      if (!searchQuery.trim()) {
        return animes;
      }

      return animes.filter((anime) => {
        const titleMatch =
          anime.titleKor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (anime as any).titleOrigin
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase());

        const chosungMatch = extractChosung(anime.titleKor || '').includes(
          searchQuery.toUpperCase()
        );

        return titleMatch || chosungMatch;
      });
    };

    // "곧 시작" 그룹 추가 (이번 주만)
    if (isThisWeek && selectedOttServices.length === 0 && !isSearchMode) {
      const upcomingAnimes = Object.values(processedData.schedule)
        .flat()
        .filter((anime) => {
          if (
            (anime.status !== 'NOW_SHOWING' && anime.status !== 'UPCOMING') ||
            !anime.scheduledAt
          )
            return false;

          const now = new Date();
          const scheduled = new Date(anime.scheduledAt);

          if (isNaN(scheduled.getTime())) return false;

          const targetDayOfWeek = scheduled.getDay();
          const targetHours = scheduled.getHours();
          const targetMinutes = scheduled.getMinutes();

          const getThisWeekScheduledTime = () => {
            const thisWeekScheduled = new Date(now);
            thisWeekScheduled.setHours(targetHours, targetMinutes, 0, 0);

            const currentDayOfWeek = now.getDay();
            let daysUntilTarget = targetDayOfWeek - currentDayOfWeek;

            if (daysUntilTarget < 0) {
              daysUntilTarget += 7;
            }

            thisWeekScheduled.setDate(now.getDate() + daysUntilTarget);
            return thisWeekScheduled;
          };

          const getNextWeekScheduledTime = () => {
            const nextWeekScheduled = new Date(now);
            nextWeekScheduled.setHours(targetHours, targetMinutes, 0, 0);

            const currentDayOfWeek = now.getDay();
            let daysUntilTarget = targetDayOfWeek - currentDayOfWeek;

            if (daysUntilTarget <= 0) {
              daysUntilTarget += 7;
            } else {
              daysUntilTarget += 7;
            }

            nextWeekScheduled.setDate(now.getDate() + daysUntilTarget);
            return nextWeekScheduled;
          };

          const thisWeekScheduledTime = getThisWeekScheduledTime();
          const nextWeekScheduledTime = getNextWeekScheduledTime();

          const thisWeekEndTime = new Date(
            thisWeekScheduledTime.getTime() + 23 * 60 * 1000 + 59 * 1000
          );
          const isCurrentlyAiring =
            now >= thisWeekScheduledTime && now <= thisWeekEndTime;

          if (isCurrentlyAiring) return true;

          if (now > thisWeekEndTime) {
            const diff = nextWeekScheduledTime.getTime() - now.getTime();
            const twelveHoursInMs = 12 * 60 * 60 * 1000;

            return diff <= twelveHoursInMs && diff >= 0;
          }

          if (thisWeekScheduledTime > now) {
            const diff = thisWeekScheduledTime.getTime() - now.getTime();
            const twelveHoursInMs = 12 * 60 * 60 * 1000;

            return diff <= twelveHoursInMs && diff >= 0;
          }

          return false;
        });

      if (upcomingAnimes.length > 0) {
        upcomingAnimes.sort((a, b) => {
          if (!a.scheduledAt || !b.scheduledAt) return 0;

          const now = new Date();

          const getActualScheduledTime = (anime: any) => {
            const scheduled = new Date(anime.scheduledAt);
            const targetDayOfWeek = scheduled.getDay();
            const targetHours = scheduled.getHours();
            const targetMinutes = scheduled.getMinutes();

            const currentDayOfWeek = now.getDay();
            let daysUntilTarget = targetDayOfWeek - currentDayOfWeek;

            if (daysUntilTarget < 0) {
              daysUntilTarget += 7;
            }

            const actualScheduled = new Date(now);
            actualScheduled.setHours(targetHours, targetMinutes, 0, 0);
            actualScheduled.setDate(now.getDate() + daysUntilTarget);

            return actualScheduled;
          };

          const aActualScheduled = getActualScheduledTime(a);
          const bActualScheduled = getActualScheduledTime(b);

          const aEndTime = new Date(
            aActualScheduled.getTime() + 24 * 60 * 60 * 1000
          );
          const bEndTime = new Date(
            bActualScheduled.getTime() + 24 * 60 * 60 * 1000
          );
          const aIsCurrentlyAiring = now >= aActualScheduled && now <= aEndTime;
          const bIsCurrentlyAiring = now >= bActualScheduled && now <= bEndTime;

          if (aIsCurrentlyAiring && !bIsCurrentlyAiring) return -1;
          if (!aIsCurrentlyAiring && bIsCurrentlyAiring) return 1;

          const aTimeRemaining = aActualScheduled.getTime() - now.getTime();
          const bTimeRemaining = bActualScheduled.getTime() - now.getTime();

          if (aTimeRemaining !== bTimeRemaining) {
            return aTimeRemaining - bTimeRemaining;
          }

          return a.titleKor.localeCompare(b.titleKor);
        });

        grouped['UPCOMING'] = upcomingAnimes;
      }
    }

    // 각 요일별 처리
    dayOrder.forEach((day) => {
      if (day === 'SPECIAL') {
        const specialAnimes = processedData.schedule['SPECIAL'] || [];
        const movieAnimes = Object.values(processedData.schedule)
          .flat()
          .filter((anime) => anime.medium === 'MOVIE');

        const uniqueMovieAnimes = movieAnimes.filter(
          (anime) =>
            !processedData.schedule['SPECIAL']?.some(
              (special: AnimePreviewDto) => special.animeId === anime.animeId
            )
        );

        let allAnimes = [...specialAnimes, ...uniqueMovieAnimes];
        allAnimes = filterSearchAnimes(
          filterOttAnimes(filterAiringAnimes(allAnimes))
        );

        if (allAnimes.length > 0) {
          if (!isThisWeek) {
            allAnimes.sort((a, b) => {
              if (a.status === 'NOW_SHOWING' && b.status !== 'NOW_SHOWING')
                return -1;
              if (a.status !== 'NOW_SHOWING' && b.status === 'NOW_SHOWING')
                return 1;

              if (!a.scheduledAt || !b.scheduledAt) return 0;
              const aTime = new Date(a.scheduledAt);
              const bTime = new Date(b.scheduledAt);
              return aTime.getTime() - bTime.getTime();
            });
          }

          grouped[day] = allAnimes;
        }
      } else if (
        processedData.schedule[day] &&
        processedData.schedule[day].length > 0
      ) {
        let dayAnimes = [...processedData.schedule[day]];
        dayAnimes = filterSearchAnimes(
          filterOttAnimes(filterAiringAnimes(dayAnimes))
        );

        if (dayAnimes.length > 0) {
          if (!isThisWeek) {
            dayAnimes.sort((a, b) => {
              if (a.status === 'NOW_SHOWING' && b.status !== 'NOW_SHOWING')
                return -1;
              if (a.status !== 'NOW_SHOWING' && b.status === 'NOW_SHOWING')
                return 1;

              if (!a.scheduledAt || !b.scheduledAt) return 0;
              const aTime = new Date(a.scheduledAt);
              const bTime = new Date(b.scheduledAt);
              return aTime.getTime() - bTime.getTime();
            });
          } else {
            // 이번 주는 시간순 정렬
            dayAnimes.sort((a, b) => {
              const aStatus = a.status === 'NOW_SHOWING' ? 0 : 1;
              const bStatus = b.status === 'NOW_SHOWING' ? 0 : 1;

              if (aStatus !== bStatus) {
                return aStatus - bStatus;
              }

              if (aStatus === 0 && bStatus === 0) {
                const aTime = a.airTime || '00:00';
                const bTime = b.airTime || '00:00';
                return aTime.localeCompare(bTime);
              }

              if (aStatus === 1 && bStatus === 1) {
                const aTime = a.airTime || '00:00';
                const bTime = b.airTime || '00:00';
                return aTime.localeCompare(bTime);
              }

              return a.titleKor.localeCompare(b.titleKor);
            });
          }

          grouped[day] = dayAnimes;
        }
      }
    });

    return grouped;
  }, [
    processedData,
    selectedOttServices,
    showOnlyAiring,
    isSearchMode,
    searchResults,
    searchQuery,
    isThisWeek,
  ]);

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
      setIsDaySelectionSticky(false);
      setIsSeasonSelectorSticky(false);

      const animeItems = document.querySelectorAll('[data-anime-item]');
      animeItems.forEach((item) => {
        (item as HTMLElement).style.transition = 'opacity 0.2s ease-out';
        (item as HTMLElement).style.opacity = '0';
      });

      setTimeout(() => {
        setSearchQuery(query);
        setIsSearching(true);
        if (isThisWeek) {
          router.push(`/search?keyword=${encodeURIComponent(query)}`);
        } else {
          // 시즌별 페이지에서는 검색 시 URL 업데이트 불필요 (선택적)
        }
      }, 200);
    } else {
      setSearchQuery('');
      setIsSearching(false);
    }
  };

  const handleSearchReset = () => {
    setIsDaySelectionSticky(false);
    setIsSeasonSelectorSticky(false);

    const animeItems = document.querySelectorAll('[data-anime-item]');
    animeItems.forEach((item) => {
      (item as HTMLElement).style.transition = 'opacity 0.2s ease-out';
      (item as HTMLElement).style.opacity = '0';
    });

    setTimeout(() => {
      setSearchQuery('');
      setSearchInput('');
      setIsSearching(false);
      if (isThisWeek) {
        router.push('/search');
      }
    }, 200);
  };

  const handleDaySelect = (day: DayOfWeek) => {
    setSelectedDay(day);

    const dayKey = getDayKey(day);

    if (day === '월' || (day === '일' && !isThisWeek)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

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

  // 1. DaySelection 스티키 처리 (1440px 미만에서 독립 스티키)
  useEffect(() => {
    const handleStickyScroll = () => {
      if (!daySelectionRef.current) return;

      const daySelectionRect = daySelectionRef.current.getBoundingClientRect();

      if (isSmallDesktop) {
        // 1440px 미만: 독립 스티키 (SeasonSelector와 분리)
        const shouldBeSticky =
          daySelectionRect.top <= 108 && window.scrollY > 100; // SeasonSelector 바로 아래에 배치

        if (shouldBeSticky !== isDaySelectionSticky) {
          setIsDaySelectionSticky(shouldBeSticky);
        }
      } else {
        // 1440px 이상: 기존 로직 (SeasonSelector와 함께)
        const shouldBeSticky =
          daySelectionRect.bottom < 0 && window.scrollY > 100;

        if (shouldBeSticky !== isDaySelectionSticky) {
          setIsDaySelectionSticky(shouldBeSticky);
        }
      }
    };

    // 초기 체크는 제거하고 스크롤 이벤트만 등록
    // 초기 체크 제거로 인한 스티키 메뉴 자동 출력 방지

    // 스크롤 이벤트 리스너
    window.addEventListener('scroll', handleStickyScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleStickyScroll);
    };
  }, [isDaySelectionSticky, isSmallDesktop]);

  // 2. SeasonSelector 스티키 처리 (1440px 미만에서 독립 스티키)
  useEffect(() => {
    const handleSeasonSelectorStickyScroll = () => {
      if (!seasonSelectorRef.current) return;

      const seasonSelectorRect =
        seasonSelectorRef.current.getBoundingClientRect();

      if (isSmallDesktop) {
        // 1440px 미만: 독립 스티키 (요일 셀렉터와 분리)
        const shouldBeSticky =
          seasonSelectorRect.top <= 60 && window.scrollY > 50;

        if (shouldBeSticky !== isSeasonSelectorSticky) {
          setIsSeasonSelectorSticky(shouldBeSticky);
        }
      } else {
        // 1440px 이상: 기존 로직 (요일 셀렉터와 함께)
        const shouldBeSticky =
          seasonSelectorRect.top <= 60 && window.scrollY > 50;

        if (shouldBeSticky !== isSeasonSelectorSticky) {
          setIsSeasonSelectorSticky(shouldBeSticky);
        }
      }
    };

    // 초기 체크는 제거하고 스크롤 이벤트만 등록
    // 초기 체크 제거로 인한 스티키 메뉴 자동 출력 방지

    // 스크롤 이벤트 리스너
    window.addEventListener('scroll', handleSeasonSelectorStickyScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener('scroll', handleSeasonSelectorStickyScroll);
    };
  }, [isSeasonSelectorSticky, isSmallDesktop]);

  useEffect(() => {
    const updateHeights = () => {
      if (seasonSelectorRef.current) {
        setSeasonSelectorHeight(seasonSelectorRef.current.offsetHeight);
      }
    };

    updateHeights();
    window.addEventListener('resize', updateHeights);

    return () => {
      window.removeEventListener('resize', updateHeights);
    };
  }, [isSeasonSelectorSticky]);

  // 3. 모바일 메뉴 스티키 처리
  useEffect(() => {
    const handleMobileMenuStickyScroll = () => {
      if (!mobileMenuRef.current) return;

      const scrollY = window.scrollY;
      const mobileMenuRect = mobileMenuRef.current.getBoundingClientRect();
      const mobileMenuTop = mobileMenuRect.top + scrollY;

      // 모바일 메뉴가 화면 상단에서 60px 지점을 지나면 스티키
      const shouldBeSticky = scrollY >= mobileMenuTop - 60;

      if (shouldBeSticky !== isMobileMenuSticky) {
        setIsMobileMenuSticky(shouldBeSticky);
      }
    };

    // 초기 체크
    handleMobileMenuStickyScroll();

    // 스크롤 이벤트 리스너
    window.addEventListener('scroll', handleMobileMenuStickyScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener('scroll', handleMobileMenuStickyScroll);
    };
  }, [isMobileMenuSticky]);

  // 스크롤-요일 네비게이션 연동
  useEffect(() => {
    if (!groupedAnimes || Object.keys(groupedAnimes).length === 0) return;

    const timeout = setTimeout(() => {
      const handleNavigationScroll = () => {
        const scrollY = window.scrollY;

        const hasUpcomingGroup =
          isThisWeek &&
          groupedAnimes['UPCOMING'] &&
          groupedAnimes['UPCOMING'].length > 0;

        const sections = hasUpcomingGroup
          ? [
              { id: getSectionId('upcoming'), day: '곧 시작' },
              { id: getSectionId('mon'), day: '월' },
              { id: getSectionId('tue'), day: '화' },
              { id: getSectionId('wed'), day: '수' },
              { id: getSectionId('thu'), day: '목' },
              { id: getSectionId('fri'), day: '금' },
              { id: getSectionId('sat'), day: '토' },
              { id: getSectionId('sun'), day: '일' },
              { id: getSectionId('special'), day: '특별편성 및 극장판' },
            ]
          : [
              { id: getSectionId('mon'), day: '월' },
              { id: getSectionId('tue'), day: '화' },
              { id: getSectionId('wed'), day: '수' },
              { id: getSectionId('thu'), day: '목' },
              { id: getSectionId('fri'), day: '금' },
              { id: getSectionId('sat'), day: '토' },
              { id: getSectionId('sun'), day: '일' },
              { id: getSectionId('special'), day: '특별편성 및 극장판' },
            ];

        const sectionPositions = sections
          .map(({ id, day }) => {
            const element = document.getElementById(id);
            if (!element) return null;

            const offset = 380;

            return {
              id,
              day,
              top: element.offsetTop - offset,
            };
          })
          .filter(Boolean);

        let activeSection = sections[0];

        if (scrollY === 0) {
          for (let i = 0; i < sections.length; i++) {
            const section = sections[i];
            const element = document.getElementById(section.id);
            if (element && element.children.length > 0) {
              activeSection = section;
              break;
            }
          }
        } else {
          for (let i = sectionPositions.length - 1; i >= 0; i--) {
            const section = sectionPositions[i];
            if (section && scrollY >= section.top) {
              activeSection = { id: section.id, day: section.day };
              break;
            }
          }
        }

        setSelectedDay((prevSelectedDay) => {
          if (activeSection.day !== prevSelectedDay) {
            return activeSection.day as DayOfWeek;
          }
          return prevSelectedDay;
        });
      };

      handleNavigationScroll();

      window.addEventListener('scroll', handleNavigationScroll, {
        passive: true,
      });

      return () => {
        window.removeEventListener('scroll', handleNavigationScroll);
      };
    }, 10);

    return () => {
      clearTimeout(timeout);
    };
  }, [groupedAnimes, isThisWeek, year, quarter]);

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

  // UI 렌더링 부분은 원본과 동일하게 유지하되, props 기반으로 분기 처리
  // 전체 UI 코드는 매우 길어서 여기서는 핵심 구조만 작성
  // 실제로는 두 원본 파일의 UI 부분을 그대로 가져와서 props로 분기 처리하면 됩니다.

  return (
    <main
      className="min-h-screen w-full overflow-x-hidden overflow-y-visible"
      style={{ backgroundColor: '#F8F9FA' }}
    >
      {/* SearchSection */}
      <div className="relative h-[170px] w-full bg-[#F1F3F5] md:h-[196px]">
        <div className="absolute top-5 left-0 z-10 h-[100px] w-full border-t border-b border-[#DADCE0] bg-white" />

        <div className="absolute top-[40px] left-0 z-10 flex w-full justify-center px-6">
          <div className="w-full max-w-[852px]">
            <div className="mb-4">
              <div className="flex h-[36px] w-full max-w-[383.98px] items-center justify-between">
                <SearchFilters
                  selectedOttServices={selectedOttServices}
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
                  className="w-full"
                />
              </div>
            </div>

            <div className="relative">
              <SearchBar
                value={searchInput}
                onChange={handleSearchInputChange}
                onSearch={handleSearch}
                placeholder={
                  randomAnimeTitle || '분기 신작 애니/캐릭터를 검색해보세요...'
                }
              />
            </div>
          </div>
        </div>

        {/* SeasonSelector 영역 */}
        <div className="absolute -bottom-6 left-0 z-20 hidden w-full md:block">
          <div className="mx-auto max-w-7xl px-6">
            <div
              className={
                isThisWeek
                  ? 'flex items-center justify-start gap-5'
                  : 'flex flex-row items-center justify-between gap-5'
              }
              ref={seasonSelectorRef}
            >
              <div className="flex flex-row items-center gap-5">
                {searchQuery.trim() ? (
                  <div className="relative box-border flex w-fit content-stretch items-center justify-center gap-2.5 rounded-[12px] bg-white px-[25px] py-2.5">
                    <button
                      onClick={handleSearchReset}
                      className="flex cursor-pointer items-center gap-2 text-gray-600 transition-colors hover:text-gray-800"
                    >
                      <ChevronLeft className="size-4.5" />
                      <span className="font-medium">이전</span>
                    </button>
                  </div>
                ) : (
                  <div className="relative box-border flex w-fit content-stretch items-center justify-center gap-2.5 rounded-[12px] bg-white px-[25px] py-2.5">
                    <SeasonSelector
                      onSeasonSelect={handleSeasonSelect}
                      className="w-fit"
                      currentYear={isThisWeek ? undefined : year || undefined}
                      currentQuarter={
                        isThisWeek ? undefined : quarter || undefined
                      }
                    />
                  </div>
                )}

                {!isThisWeek &&
                  !searchQuery.trim() &&
                  selectedOttServices.length === 0 && (
                    <div className="relative box-border flex w-fit content-stretch items-center justify-center gap-2 rounded-[12px] bg-white px-[25px] py-2.5">
                      <input
                        type="checkbox"
                        id="showOnlyAiring"
                        checked={showOnlyAiring}
                        onChange={(e) =>
                          handleShowOnlyAiringChange(e.target.checked)
                        }
                        className="h-4 w-4 accent-[#990033]"
                      />
                      <label
                        htmlFor="showOnlyAiring"
                        className="cursor-pointer text-sm font-medium text-gray-700"
                      >
                        방영 중 애니만 보기
                      </label>
                    </div>
                  )}
              </div>

              {/* 모바일에서 DaySelection을 SeasonSelector 우측에 위치 (이번 주만) */}
              {isThisWeek && !searchQuery.trim() && (
                <div className="ml-6 flex justify-end pr-4 md:hidden">
                  <div className="relative box-border flex w-fit content-stretch items-center justify-center gap-2.5 rounded-[12px] bg-white px-[25px] py-2.5">
                    <DaySelection
                      selectedDay={selectedDay}
                      onDaySelect={handleDaySelect}
                      emptyDays={emptyDays}
                      isThisWeek={isThisWeek}
                      isSticky={true}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search and Content Section */}
      <div className="w-full bg-white md:h-[95px]">
        <div className="mx-auto max-w-7xl px-6 pt-[15px] md:pt-[50px] md:pb-[8px]">
          {/* 모바일 전용 드롭다운 버튼 영역 */}
          <div className="mb-[40px] w-full md:hidden" ref={mobileMenuRef}>
            <div className="space-y-4 rounded-lg bg-gray-50">
              {/* 첫 번째 줄: 이번주 / 요일 */}
              <div className="flex items-center gap-3">
                {/* 검색 중일 때는 돌아가기 버튼, 아니면 시즌 선택 드롭다운 */}
                {searchQuery.trim() ? (
                  <button
                    onClick={handleSearchReset}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-gray-600 transition-colors hover:bg-white hover:text-gray-800"
                  >
                    <ChevronLeft className="size-4.5" />
                    <span className="font-medium">이전</span>
                  </button>
                ) : (
                  <div className="flex-1">
                    <SeasonSelector
                      onSeasonSelect={handleSeasonSelect}
                      className="w-full"
                      currentYear={isThisWeek ? undefined : year || undefined}
                      currentQuarter={
                        isThisWeek ? undefined : quarter || undefined
                      }
                    />
                  </div>
                )}

                {/* 요일 선택 (모바일에서만 표시) */}
                {!searchQuery.trim() && selectedOttServices.length === 0 && (
                  <div className="flex-1">
                    <div className="relative rounded-lg border border-gray-300 bg-white px-3 py-2">
                      <select
                        value={selectedDay}
                        onChange={(e) =>
                          handleDaySelect(e.target.value as DayOfWeek)
                        }
                        className="w-full cursor-pointer appearance-none border-none bg-transparent pr-6 text-sm font-medium text-gray-900 outline-none"
                      >
                        {isThisWeek && <option value="곧 시작">곧 시작</option>}
                        <option value="월">월</option>
                        <option value="화">화</option>
                        <option value="수">수</option>
                        <option value="목">목</option>
                        <option value="금">금</option>
                        <option value="토">토</option>
                        <option value="일">일</option>
                        <option value="특별편성 및 극장판">
                          특별편성 및 극장판
                        </option>
                      </select>
                      <div className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 transform">
                        <svg
                          className="h-3 w-3 text-gray-400"
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
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Day Selection 또는 OTT 필터 큐 - 데스크톱에서만 표시 */}
          {selectedOttServices.length === 0 && !searchQuery.trim() ? (
            <div
              ref={daySelectionRef}
              className="mb-[40px] hidden justify-center md:flex"
            >
              <DaySelection
                selectedDay={selectedDay}
                onDaySelect={handleDaySelect}
                emptyDays={emptyDays}
                isThisWeek={isThisWeek}
              />
            </div>
          ) : selectedOttServices.length > 0 ? (
            <div className="mb-[40px] flex justify-start">
              <div className="flex items-center gap-3">
                {/* 선택됨 텍스트 */}
                <span className="text-sm font-medium text-gray-700">
                  선택됨:
                </span>

                {/* OTT 필터 아이콘들 */}
                <div className="flex items-center gap-2">
                  {selectedOttServices.map((ottService, index) => (
                    <div key={index} className="relative">
                      <div
                        onClick={() =>
                          setSelectedOttServices((prev) =>
                            prev.filter((id) => id !== ottService)
                          )
                        }
                        className="h-9 w-9 cursor-pointer overflow-hidden rounded-full transition-transform hover:scale-105"
                      >
                        <img
                          src={`/icons/${ottService.toLowerCase()}-logo.svg`}
                          alt={ottService}
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <img
                        src="/icons/remove-filter.svg"
                        alt="제거"
                        className="pointer-events-none absolute -top-1 -right-1 h-[17px] w-[17px]"
                      />
                    </div>
                  ))}
                </div>

                {/* 필터 초기화 버튼 */}
                <button
                  onClick={() => setSelectedOttServices([])}
                  className="cursor-pointer text-sm whitespace-nowrap text-gray-500 underline hover:text-gray-700"
                >
                  필터 초기화
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Anime Grid Section */}
      <div className="w-full" style={{ backgroundColor: '#F8F9FA' }}>
        <div className="mx-auto max-w-7xl px-3 pt-2 pb-0 sm:px-6 md:pt-8 md:pb-8">
          {searchQuery.trim() ? (
            <div className="space-y-4" data-content-loaded>
              <div className="py-8 text-center">
                <div className="mb-4 text-sm text-gray-600">
                  "{searchQuery}"에 대한 검색 결과
                </div>
                <div className="grid grid-cols-2 justify-items-center gap-[15px] sm:gap-[30px] lg:grid-cols-3 xl:grid-cols-4">
                  {Object.values(groupedAnimes)
                    .flat()
                    .map((anime) => (
                      <AnimeCard
                        key={anime.animeId}
                        anime={anime}
                        isCurrentSeason={isThisWeek}
                        data-anime-item
                      />
                    ))}
                </div>
                {Object.values(groupedAnimes).flat().length === 0 && (
                  <div className="py-8 text-center">
                    <p className="text-gray-500">
                      "{searchQuery}"에 대한 검색 결과가 없습니다.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : groupedAnimes && Object.keys(groupedAnimes).length > 0 ? (
            <div className="space-y-0" data-content-loaded>
              {selectedOttServices.length > 0 ? (
                <div>
                  <div className="mb-6 flex items-end gap-3">
                    <h2 className="text-lg font-bold text-gray-900 sm:text-2xl">
                      필터링 결과
                    </h2>
                    <span className="text-[12px] font-normal text-[#868E96]">
                      {Object.values(groupedAnimes).flat().length}개의
                      애니메이션
                    </span>
                  </div>
                  <div className="grid grid-cols-2 justify-items-center gap-[15px] sm:gap-[30px] lg:grid-cols-3 xl:grid-cols-4">
                    {Object.values(groupedAnimes)
                      .flat()
                      .map((anime) => (
                        <AnimeCard
                          key={anime.animeId}
                          anime={anime}
                          isCurrentSeason={isThisWeek}
                        />
                      ))}
                  </div>
                </div>
              ) : (
                Object.entries(groupedAnimes).map(([day, dayAnimes], index) => {
                  const dayInKorean = {
                    UPCOMING: '곧 시작',
                    SUN: '일요일',
                    MON: '월요일',
                    TUE: '화요일',
                    WED: '수요일',
                    THU: '목요일',
                    FRI: '금요일',
                    SAT: '토요일',
                    SPECIAL: '특별편성 및 극장판',
                  }[day];

                  const baseSectionId =
                    day === 'UPCOMING'
                      ? 'upcoming'
                      : day === 'SPECIAL'
                        ? 'special'
                        : day.toLowerCase();
                  const sectionId = getSectionId(baseSectionId);

                  return (
                    <div key={day} id={sectionId}>
                      <div className="mb-6 flex items-end gap-3">
                        <h2
                          className="cursor-pointer text-lg font-bold text-gray-900 transition-colors hover:text-blue-600 sm:text-2xl"
                          onClick={() => {
                            const dayToKorean = {
                              UPCOMING: '곧 시작',
                              SUN: '일',
                              MON: '월',
                              TUE: '화',
                              WED: '수',
                              THU: '목',
                              FRI: '금',
                              SAT: '토',
                              SPECIAL: '특별편성 및 극장판',
                            };

                            const koreanDay =
                              dayToKorean[day as keyof typeof dayToKorean];
                            if (koreanDay) {
                              setSelectedDay(koreanDay as DayOfWeek);
                            }
                          }}
                        >
                          {dayInKorean}
                        </h2>
                        {day === 'UPCOMING' && (
                          <span className="text-[12px] font-normal text-[#868E96]">
                            앞으로 12시간 이내
                          </span>
                        )}
                      </div>

                      <div className="mb-12 grid grid-cols-2 gap-[15px] sm:gap-[30px] lg:grid-cols-3 xl:grid-cols-4">
                        {dayAnimes.map((anime) => (
                          <AnimeCard
                            key={anime.animeId}
                            anime={anime}
                            isCurrentSeason={isThisWeek}
                          />
                        ))}
                      </div>

                      {day !== 'SPECIAL' && (
                        <div className="h-6 border-t border-gray-200"></div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <FileSearch className="mb-4 size-10 stroke-[1.5] text-gray-600" />
              <h3 className="text-lg font-medium text-gray-900">
                {isThisWeek
                  ? '데이터가 없습니다.'
                  : `${year}년 ${quarter}분기 데이터가 없습니다.`}
              </h3>
              <p className="text-sm text-gray-600">
                {isThisWeek
                  ? '다시 시도해주세요.'
                  : '다른 시즌을 선택해보세요.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Combined Section - 헤더 60px 아래에 고정 (PC 전용) - 시즌별 페이지용 2줄 레이아웃 */}
      {!isThisWeek && (isSeasonSelectorSticky || isDaySelectionSticky) && (
        <div
          className="fixed top-[60px] left-0 z-40 hidden w-full backdrop-blur-[6px] md:block lg:left-[200px] lg:w-[calc(100vw-200px)]"
          style={{
            top: '60px',
            zIndex: 40,
            transition: 'all 0.3s ease-in-out',
          }}
        >
          <div className="absolute inset-0 bg-white opacity-80 backdrop-blur-[12px]"></div>
          <div className="relative z-10 mx-auto max-w-7xl px-6">
            {selectedOttServices.length === 0 && !searchQuery.trim() ? (
              <div className="space-y-3">
                <div className="flex justify-center">
                  {searchQuery.trim() ? (
                    <div className="relative box-border flex w-fit content-stretch items-center justify-center gap-2.5 rounded-[12px] bg-white px-[25px] py-2.5">
                      <button
                        onClick={handleSearchReset}
                        className="flex cursor-pointer items-center gap-2 text-gray-600 transition-colors hover:text-gray-800"
                      >
                        <ChevronLeft className="size-4.5" />
                        <span className="font-medium">이전</span>
                      </button>
                    </div>
                  ) : (
                    <div className="relative box-border flex w-fit content-stretch items-center justify-center gap-2.5 rounded-[12px] bg-white px-[25px] py-2.5">
                      <SeasonSelector
                        onSeasonSelect={handleSeasonSelect}
                        className="w-fit"
                        currentYear={year || undefined}
                        currentQuarter={quarter || undefined}
                      />
                    </div>
                  )}
                </div>
                <div className="flex justify-center">
                  <DaySelection
                    selectedDay={selectedDay}
                    onDaySelect={handleDaySelect}
                    initialPosition={true}
                    emptyDays={emptyDays}
                    isThisWeek={false}
                    isSticky={true}
                    className="w-fit"
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-5">
                {searchQuery.trim() ? (
                  <div className="relative box-border flex w-fit content-stretch items-center justify-center gap-2.5 rounded-[12px] bg-white px-[25px] py-2.5">
                    <button
                      onClick={handleSearchReset}
                      className="flex cursor-pointer items-center gap-2 text-gray-600 transition-colors hover:text-gray-800"
                    >
                      <ChevronLeft className="size-4.5" />
                      <span className="font-medium">이전</span>
                    </button>
                  </div>
                ) : (
                  <div className="relative box-border flex w-fit content-stretch items-center justify-center gap-2.5 rounded-[12px] bg-white px-[25px] py-2.5">
                    <SeasonSelector
                      onSeasonSelect={handleSeasonSelect}
                      className="w-fit"
                      currentYear={year || undefined}
                      currentQuarter={quarter || undefined}
                    />
                  </div>
                )}

                {selectedOttServices.length > 0 && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700">
                      선택됨:
                    </span>
                    <div className="flex items-center gap-2">
                      {selectedOttServices.map((ottService, index) => (
                        <div key={index} className="relative">
                          <div
                            onClick={() =>
                              handleOttFilterChange(ottService, false)
                            }
                            className="h-9 w-9 cursor-pointer overflow-hidden rounded-full transition-transform hover:scale-105"
                          >
                            <img
                              src={`/icons/${ottService.toLowerCase()}-logo.svg`}
                              alt={ottService}
                              className="h-full w-full object-contain"
                            />
                          </div>
                          <img
                            src="/icons/remove-filter.svg"
                            alt="제거"
                            className="pointer-events-none absolute -top-1 -right-1 h-[17px] w-[17px]"
                          />
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => setSelectedOttServices([])}
                      className="cursor-pointer text-sm whitespace-nowrap text-gray-500 underline hover:text-gray-700"
                    >
                      필터 초기화
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sticky SeasonSelector - 1440px 미만에서 독립 스티키 (이번 주 페이지) */}
      {isThisWeek && isSeasonSelectorSticky && isSmallDesktop && (
        <div
          className="fixed top-[60px] left-0 z-50 hidden w-full backdrop-blur-[6px] md:block lg:left-[200px] lg:w-[calc(100vw-200px)]"
          style={{
            top: '60px',
            zIndex: 50,
            transition: 'all 0.3s ease-in-out',
          }}
        >
          <div className="absolute inset-0 bg-white opacity-80 backdrop-blur-[12px]"></div>
          <div className="relative z-10 mx-auto max-w-7xl px-6">
            <div className="flex justify-center">
              <div className="relative box-border flex w-fit content-stretch items-center justify-center gap-2.5 rounded-[12px] bg-white px-[25px] py-2.5">
                {searchQuery.trim() ? (
                  <button
                    onClick={handleSearchReset}
                    className="flex cursor-pointer items-center gap-2 text-gray-600 transition-colors hover:text-gray-800"
                  >
                    <ChevronLeft className="size-4.5" />
                    <span className="font-medium">이전</span>
                  </button>
                ) : (
                  <SeasonSelector
                    onSeasonSelect={handleSeasonSelect}
                    className="w-fit"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sticky SeasonSelector - 1440px 이상에서 기존 로직 (이번 주 페이지) */}
      {isThisWeek && isSeasonSelectorSticky && !isSmallDesktop && (
        <div
          className="fixed top-[60px] left-0 z-40 hidden w-full backdrop-blur-[6px] md:block lg:left-[200px] lg:w-[calc(100vw-200px)]"
          style={{
            top: '60px',
            zIndex: 40,
            transition: 'all 0.3s ease-in-out',
          }}
        >
          <div className="absolute inset-0 bg-white opacity-80 backdrop-blur-[12px]"></div>
          <div className="relative z-10 mx-auto max-w-7xl px-6">
            <div className="flex max-w-full items-center justify-between gap-5 md:justify-start lg:justify-between">
              <div className="flex flex-shrink-0 items-center gap-5">
                {searchQuery.trim() ? (
                  <div className="relative box-border flex w-fit content-stretch items-center justify-center gap-2.5 rounded-[12px] bg-white px-[25px] py-2.5">
                    <button
                      onClick={handleSearchReset}
                      className="flex cursor-pointer items-center gap-2 text-gray-600 transition-colors hover:text-gray-800"
                    >
                      <ChevronLeft className="size-4.5" />
                      <span className="font-medium">이전</span>
                    </button>
                  </div>
                ) : (
                  <div className="relative box-border flex w-fit content-stretch items-center justify-center gap-2.5 rounded-[12px] bg-white px-[25px] py-2.5">
                    <SeasonSelector
                      onSeasonSelect={handleSeasonSelect}
                      className="w-fit"
                    />
                  </div>
                )}
              </div>

              {!searchQuery.trim() && (
                <>
                  <div className="flex justify-end md:hidden">
                    <div className="relative box-border flex w-fit content-stretch items-center justify-center gap-2.5 rounded-[12px] bg-white px-[25px] py-2.5">
                      <DaySelection
                        selectedDay={selectedDay}
                        onDaySelect={handleDaySelect}
                        initialPosition={true}
                        emptyDays={emptyDays}
                        isThisWeek={isThisWeek}
                        isSticky={true}
                        className="w-fit"
                      />
                    </div>
                  </div>

                  <div className="absolute left-1/2 hidden -translate-x-1/2 transform md:block lg:left-1/2 lg:-translate-x-1/2 lg:transform">
                    <DaySelection
                      selectedDay={selectedDay}
                      onDaySelect={handleDaySelect}
                      initialPosition={true}
                      emptyDays={emptyDays}
                      isThisWeek={isThisWeek}
                      isSticky={true}
                      className="w-fit"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sticky DaySelection - 1440px 미만에서 독립 스티키 (이번 주 페이지) */}
      {isThisWeek && isDaySelectionSticky && isSmallDesktop && (
        <div
          className="fixed top-[120px] left-0 z-40 hidden w-full backdrop-blur-[6px] md:block lg:left-[200px] lg:w-[calc(100vw-200px)]"
          style={{
            top: '108px',
            zIndex: 40,
            transition: 'all 0.3s ease-in-out',
          }}
        >
          <div className="absolute inset-0 bg-white opacity-80 backdrop-blur-[12px]"></div>
          <div className="relative z-10 mx-auto max-w-7xl px-6">
            <div className="flex justify-center">
              <DaySelection
                selectedDay={selectedDay}
                onDaySelect={handleDaySelect}
                initialPosition={true}
                emptyDays={emptyDays}
                isThisWeek={isThisWeek}
                isSticky={true}
                className="w-fit"
              />
            </div>
          </div>
        </div>
      )}

      {/* 모바일 전용 스티키 메뉴 */}
      {isMobileMenuSticky && (
        <div className="fixed top-[60px] left-0 z-40 w-full backdrop-blur-[6px] md:hidden">
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[12px]"></div>
          <div className="relative z-10 mx-auto max-w-7xl px-6 py-3">
            <div className="space-y-3 rounded-lg bg-gray-50 p-3">
              <div className="flex items-center gap-3">
                {searchQuery.trim() ? (
                  <button
                    onClick={handleSearchReset}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-gray-600 transition-colors hover:bg-white hover:text-gray-800"
                  >
                    <ChevronLeft className="size-4.5" />
                    <span className="font-medium">이전</span>
                  </button>
                ) : (
                  <div className="flex-1">
                    <SeasonSelector
                      onSeasonSelect={handleSeasonSelect}
                      className="w-full"
                      currentYear={isThisWeek ? undefined : year || undefined}
                      currentQuarter={
                        isThisWeek ? undefined : quarter || undefined
                      }
                    />
                  </div>
                )}

                {!searchQuery.trim() && selectedOttServices.length === 0 && (
                  <div className="flex-1">
                    <div className="relative rounded-lg border border-gray-300 bg-white px-3 py-2">
                      <select
                        value={selectedDay}
                        onChange={(e) =>
                          handleDaySelect(e.target.value as DayOfWeek)
                        }
                        className="w-full cursor-pointer appearance-none border-none bg-transparent pr-6 text-sm font-medium text-gray-900 outline-none"
                      >
                        {isThisWeek && <option value="곧 시작">곧 시작</option>}
                        <option value="월">월</option>
                        <option value="화">화</option>
                        <option value="수">수</option>
                        <option value="목">목</option>
                        <option value="금">금</option>
                        <option value="토">토</option>
                        <option value="일">일</option>
                        <option value="특별편성 및 극장판">
                          특별편성 및 극장판
                        </option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {!isThisWeek &&
                !searchQuery.trim() &&
                selectedOttServices.length === 0 && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="showOnlyAiringMobileSticky"
                      checked={showOnlyAiring}
                      onChange={(e) =>
                        handleShowOnlyAiringChange(e.target.checked)
                      }
                      className="h-4 w-4 accent-[#990033]"
                    />
                    <label
                      htmlFor="showOnlyAiringMobileSticky"
                      className="cursor-pointer text-sm font-medium text-gray-700"
                    >
                      방영 중 애니만 보기
                    </label>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
