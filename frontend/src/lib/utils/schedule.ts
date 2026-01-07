import type { AnimePreviewDto } from '@/types/dtos';
import { extractChosung } from '@/lib';

/**
 * 이번 주 스케줄 시간 계산
 */
export function getThisWeekScheduledTime(
  now: Date,
  targetDayOfWeek: number,
  targetHours: number,
  targetMinutes: number
): Date {
  const thisWeekScheduled = new Date(now);
  thisWeekScheduled.setHours(targetHours, targetMinutes, 0, 0);

  const currentDayOfWeek = now.getDay();
  let daysUntilTarget = targetDayOfWeek - currentDayOfWeek;

  if (daysUntilTarget < 0) {
    daysUntilTarget += 7;
  }

  thisWeekScheduled.setDate(now.getDate() + daysUntilTarget);
  return thisWeekScheduled;
}

/**
 * 다음 주 스케줄 시간 계산
 */
export function getNextWeekScheduledTime(
  now: Date,
  targetDayOfWeek: number,
  targetHours: number,
  targetMinutes: number
): Date {
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
}

/**
 * "곧 시작" 애니메이션 필터링 (12시간 이내)
 */
export function isUpcomingAnime(anime: AnimePreviewDto): boolean {
  if (anime.status !== 'NOW_SHOWING' || !anime.scheduledAt) return false;

  const now = new Date();
  const scheduled = new Date(anime.scheduledAt);

  if (isNaN(scheduled.getTime())) return false;

  const targetDayOfWeek = scheduled.getDay();
  const targetHours = scheduled.getHours();
  const targetMinutes = scheduled.getMinutes();

  const thisWeekScheduledTime = getThisWeekScheduledTime(
    now,
    targetDayOfWeek,
    targetHours,
    targetMinutes
  );
  const nextWeekScheduledTime = getNextWeekScheduledTime(
    now,
    targetDayOfWeek,
    targetHours,
    targetMinutes
  );

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
}

/**
 * 실제 스케줄 시간 계산 (정렬용)
 */
export function getActualScheduledTime(anime: AnimePreviewDto): Date | null {
  if (!anime.scheduledAt) return null;

  const now = new Date();
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
}

/**
 * 방영 중 애니메이션 필터링
 */
export function filterAiringAnimes(
  animes: AnimePreviewDto[],
  showOnlyAiring: boolean
): AnimePreviewDto[] {
  if (showOnlyAiring) {
    return animes.filter((anime) => anime.status === 'NOW_SHOWING');
  }
  return animes;
}

/**
 * OTT 서비스 필터링
 */
export function filterOttAnimes(
  animes: AnimePreviewDto[],
  selectedOttServices: string[]
): AnimePreviewDto[] {
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
}

/**
 * 검색어 필터링
 */
export function filterSearchAnimes(
  animes: AnimePreviewDto[],
  searchQuery: string
): AnimePreviewDto[] {
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
}

/**
 * 요일별 애니메이션 정렬 (이번 주)
 */
export function sortDayAnimesThisWeek(
  animes: AnimePreviewDto[]
): AnimePreviewDto[] {
  return animes.sort((a, b) => {
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

/**
 * 요일별 애니메이션 정렬 (시즌별)
 */
export function sortDayAnimesBySeason(
  animes: AnimePreviewDto[]
): AnimePreviewDto[] {
  return animes.sort((a, b) => {
    if (a.status === 'NOW_SHOWING' && b.status !== 'NOW_SHOWING') return -1;
    if (a.status !== 'NOW_SHOWING' && b.status === 'NOW_SHOWING') return 1;

    if (!a.scheduledAt || !b.scheduledAt) return 0;
    const aTime = new Date(a.scheduledAt);
    const bTime = new Date(b.scheduledAt);
    return aTime.getTime() - bTime.getTime();
  });
}

/**
 * "곧 시작" 애니메이션 정렬
 */
export function sortUpcomingAnimes(
  animes: AnimePreviewDto[]
): AnimePreviewDto[] {
  return animes.sort((a, b) => {
    if (!a.scheduledAt || !b.scheduledAt) return 0;

    const now = new Date();
    const aActualScheduled = getActualScheduledTime(a);
    const bActualScheduled = getActualScheduledTime(b);

    if (!aActualScheduled || !bActualScheduled) return 0;

    const aEndTime = new Date(aActualScheduled.getTime() + 24 * 60 * 60 * 1000);
    const bEndTime = new Date(bActualScheduled.getTime() + 24 * 60 * 60 * 1000);
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
}

interface ProcessedData {
  schedule: {
    MON?: AnimePreviewDto[];
    TUE?: AnimePreviewDto[];
    WED?: AnimePreviewDto[];
    THU?: AnimePreviewDto[];
    FRI?: AnimePreviewDto[];
    SAT?: AnimePreviewDto[];
    SUN?: AnimePreviewDto[];
    SPECIAL?: AnimePreviewDto[];
  };
}

/**
 * 빈 요일 확인
 */
export function getEmptyDays(
  processedData: ProcessedData | null,
  isSearchMode: boolean,
  showOnlyAiring: boolean,
  selectedOttServices: string[],
  isThisWeek: boolean
): Set<string> {
  if (!processedData || !('schedule' in processedData) || isSearchMode) {
    return new Set();
  }

  const emptyDaysSet = new Set<string>();
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
            (special: AnimePreviewDto) => special.animeId === anime.animeId
          )
      );

      dayAnimes = [...dayAnimes, ...uniqueMovieAnimes];
    }

    const filteredAnimes = filterAiringAnimes(dayAnimes, showOnlyAiring);
    const finalAnimes = filterOttAnimes(filteredAnimes, selectedOttServices);

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
        emptyDaysSet.add(dayInKorean);
      }
    }
  });

  // "곧 시작" 그룹 확인 (이번 주만)
  if (isThisWeek && selectedOttServices.length === 0) {
    const upcomingAnimes = Object.values(processedData.schedule)
      .flat()
      .filter(isUpcomingAnime);

    if (upcomingAnimes.length === 0) {
      emptyDaysSet.add('곧 시작');
    }
  }

  return emptyDaysSet;
}

/**
 * 요일별 애니메이션 그룹핑
 */
export function groupAnimesByDay(
  processedData: ProcessedData | null,
  isSearchMode: boolean,
  searchResults: AnimePreviewDto[],
  searchQuery: string,
  showOnlyAiring: boolean,
  selectedOttServices: string[],
  isThisWeek: boolean
): { [key: string]: AnimePreviewDto[] } {
  if (!processedData) return {};

  // 검색 중일 때
  if (isSearchMode) {
    if (searchResults.length > 0) {
      // 검색 결과에 OTT 필터와 방영 중 필터 적용
      const filteredResults = filterOttAnimes(
        filterAiringAnimes(searchResults, showOnlyAiring),
        selectedOttServices
      );
      
      if (filteredResults.length > 0) {
        return {
          SEARCH_RESULTS: filteredResults,
        };
      }
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
        return isUpcomingAnime(anime);
      });

    if (upcomingAnimes.length > 0) {
      const sorted = sortUpcomingAnimes(upcomingAnimes);
      grouped['UPCOMING'] = sorted;
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
        filterOttAnimes(
          filterAiringAnimes(allAnimes, showOnlyAiring),
          selectedOttServices
        ),
        searchQuery
      );

      if (allAnimes.length > 0) {
        if (!isThisWeek) {
          const sorted = sortDayAnimesBySeason(allAnimes);
          grouped[day] = sorted;
        } else {
          grouped[day] = allAnimes;
        }
      }
    } else if (
      processedData.schedule[day] &&
      processedData.schedule[day].length > 0
    ) {
      let dayAnimes = [...processedData.schedule[day]];
      dayAnimes = filterSearchAnimes(
        filterOttAnimes(
          filterAiringAnimes(dayAnimes, showOnlyAiring),
          selectedOttServices
        ),
        searchQuery
      );

      if (dayAnimes.length > 0) {
        if (!isThisWeek) {
          const sorted = sortDayAnimesBySeason(dayAnimes);
          grouped[day] = sorted;
        } else {
          const sorted = sortDayAnimesThisWeek(dayAnimes);
          grouped[day] = sorted;
        }
      }
    }
  });

  return grouped;
}
