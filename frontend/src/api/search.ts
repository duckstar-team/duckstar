import type {
  AnimePreviewListDto,
  AnimeSearchListDto,
  AnimeHomeDto,
  EpisodeDto,
} from '@/types';
import { ApiResponse } from './http';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://duckstar.kr';

/**
 * 분류된 편성표 조회 API
 * @param year 연도
 * @param quarter 분기 (1~4)
 * @returns 애니메이션 편성표 목록
 */
export async function getScheduleByQuarter(
  year: number,
  quarter: number
): Promise<AnimePreviewListDto> {
  try {
    const response = await fetch(
      `${BASE_URL}/api/v1/search/${year}/${quarter}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const apiResponse: ApiResponse<AnimePreviewListDto> = await response.json();

    if (!apiResponse.isSuccess) {
      throw new Error(apiResponse.message);
    }

    return apiResponse.result;
  } catch (error) {
    throw error;
  }
}

/**
 * 현재 분기의 편성표를 조회합니다.
 * @returns 현재 분기 애니메이션 편성표
 */
export async function getCurrentSchedule() {
  // '이번 주' 메뉴에서는 offset을 18시 00분으로 설정
  // return apiCall<AnimePreviewListDto>(`/api/v1/search?hour=0&minute=0`);
  try {
    const response = await fetch(`${BASE_URL}/api/v1/search?hour=18&minute=0`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const apiResponse: ApiResponse<AnimePreviewListDto> = await response.json();

    if (!apiResponse.isSuccess) {
      throw new Error(apiResponse.message);
    }

    return apiResponse.result;
  } catch (error) {
    throw error;
  }
}

/**
 * "곧 시작" 그룹의 애니메이션 데이터를 조회합니다.
 * 12시간 이내 방영 예정인 애니메이션들을 반환합니다.
 * @returns 곧 시작 그룹 애니메이션 목록
 */
export async function getUpcomingAnimes(): Promise<AnimePreviewListDto> {
  try {
    // '이번 주' 메뉴에서 곧 시작 그룹 데이터를 가져옴
    const response = await fetch(`${BASE_URL}/api/v1/search?hour=0&minute=0`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const apiResponse: ApiResponse<AnimePreviewListDto> = await response.json();

    if (!apiResponse.isSuccess) {
      throw new Error(apiResponse.message);
    }

    // 곧 시작 그룹만 필터링 (12시간 이내 방영 예정)
    const now = new Date();
    const upcomingAnimes = Object.values(apiResponse.result.schedule)
      .flat()
      .filter((anime) => {
        if (
          (anime.status !== 'NOW_SHOWING' && anime.status !== 'UPCOMING') ||
          !anime.scheduledAt
        )
          return false;

        const scheduled = new Date(anime.scheduledAt);
        if (isNaN(scheduled.getTime())) return false;

        // 12시간 이내 방영 예정인 애니메이션만 필터링
        const timeDiff = scheduled.getTime() - now.getTime();
        return timeDiff >= 0 && timeDiff <= 12 * 60 * 60 * 1000; // 12시간 = 12 * 60 * 60 * 1000ms
      });

    return {
      ...apiResponse.result,
      schedule: {
        '곧 시작': upcomingAnimes,
      },
    };
  } catch (error) {
    throw error;
  }
}

/**
 * 특정 연도와 분기의 편성표를 조회합니다.
 * @param year 연도
 * @param quarter 분기 (1~4)
 * @returns 해당 분기 애니메이션 편성표
 */
export async function getScheduleByYearAndQuarter(
  year: number,
  quarter: number
) {
  return getScheduleByQuarter(year, quarter);
}

export interface SeasonResponseItem {
  year: number;
  types: string[];
}

/**
 * 시즌 목록을 조회합니다.
 * @returns 연도별 시즌 목록 (백엔드 정렬 순서 유지)
 */
export async function getSeasons(): Promise<SeasonResponseItem[]> {
  try {
    const response = await fetch(`${BASE_URL}/api/v1/search/seasons`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const apiResponse: ApiResponse<SeasonResponseItem[]> =
      await response.json();

    if (!apiResponse.isSuccess) {
      throw new Error(apiResponse.message);
    }

    // 백엔드에서 정렬된 순서를 그대로 유지
    return apiResponse.result;
  } catch (error) {
    throw error;
  }
}

/**
 * 애니메이션 검색 API
 * @param query 검색어
 * @returns 검색된 애니메이션 목록
 */
export async function searchAnimes(query: string): Promise<AnimeSearchListDto> {
  try {
    const response = await fetch(
      `${BASE_URL}/api/v1/search/animes?query=${encodeURIComponent(query)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const apiResponse: ApiResponse<AnimeSearchListDto> = await response.json();

    if (!apiResponse.isSuccess) {
      throw new Error(apiResponse.message);
    }

    return apiResponse.result;
  } catch (error) {
    throw error;
  }
}

/**
 * 애니메이션 에피소드 목록 조회 API
 * @param animeId 애니메이션 ID
 * @returns 에피소드 목록
 */
export async function getAnimeEpisodes(animeId: number): Promise<EpisodeDto[]> {
  try {
    const response = await fetch(
      `${BASE_URL}/api/v1/animes/${animeId}/episodes`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const apiResponse: ApiResponse<EpisodeDto[]> = await response.json();

    if (!apiResponse.isSuccess) {
      throw new Error(apiResponse.message);
    }

    return apiResponse.result;
  } catch (error) {
    throw error;
  }
}

/**
 * 관리자용 애니메이션 총 화수 업데이트 API
 * @param animeId 애니메이션 ID
 * @param totalEpisodes 총 화수
 * @returns 업데이트 결과
 */
export async function updateAnimeTotalEpisodes(
  animeId: number,
  totalEpisodes: number
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(
      `${BASE_URL}/api/admin/${animeId}/total-episodes`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ totalEpisodes }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const apiResponse: ApiResponse<{ success: boolean; message: string }> =
      await response.json();

    if (!apiResponse.isSuccess) {
      throw new Error(apiResponse.message);
    }

    return apiResponse.result;
  } catch (error) {
    throw error;
  }
}

/**
 * 관리자용 애니메이션 총 화수를 "모름"으로 설정하는 API
 * @param animeId 애니메이션 ID
 * @returns 업데이트 결과
 */
export async function setAnimeTotalEpisodesUnknown(
  animeId: number
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(
      `${BASE_URL}/api/admin/${animeId}/total-episodes/unknown`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const apiResponse: ApiResponse<{ success: boolean; message: string }> =
      await response.json();

    if (!apiResponse.isSuccess) {
      throw new Error(apiResponse.message);
    }

    return apiResponse.result;
  } catch (error) {
    throw error;
  }
}

/**
 * 애니메이션 상세 정보를 조회합니다.
 * @param animeId 애니메이션 ID
 * @returns 애니메이션 상세 정보
 */
export async function getAnimeDetail(animeId: number): Promise<AnimeHomeDto> {
  try {
    const response = await fetch(`${BASE_URL}/api/v1/animes/${animeId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const apiResponse: ApiResponse<AnimeHomeDto> = await response.json();

    if (!apiResponse.isSuccess) {
      throw new Error(apiResponse.message);
    }

    return apiResponse.result;
  } catch (error) {
    throw error;
  }
}
