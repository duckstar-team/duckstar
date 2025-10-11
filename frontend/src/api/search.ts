import { getCurrentYearAndQuarter } from '@/lib/quarterUtils';
import type { AnimePreviewDto, OttDto, WeekDto, AnimePreviewListDto, AnimeSearchListDto } from '@/types/api';

export interface ApiResponse<T> {
  isSuccess: boolean;
  code: string;
  message: string;
  result: T;
}

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
    const response = await fetch(`${BASE_URL}/api/v1/search/${year}/${quarter}`, {
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
 * 현재 분기의 편성표를 조회합니다.
 * @returns 현재 분기 애니메이션 편성표
 */
export async function getCurrentSchedule(): Promise<AnimePreviewListDto> {
  try {
    // '이번 주' 메뉴에서는 offset을 00시 00분으로 설정
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

    return apiResponse.result;
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
): Promise<AnimePreviewListDto> {
  return getScheduleByQuarter(year, quarter);
}

/**
 * 시즌 목록을 조회합니다.
 * @returns 연도별 시즌 목록
 */
export async function getSeasons(): Promise<{ [year: number]: string[] }> {
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

    const apiResponse: ApiResponse<{ [year: number]: string[] }> = await response.json();
    
    if (!apiResponse.isSuccess) {
      throw new Error(apiResponse.message);
    }

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
    const response = await fetch(`${BASE_URL}/api/v1/search/animes?query=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

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
    const response = await fetch(`${BASE_URL}/api/v1/animes/${animeId}/episodes`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

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
export async function updateAnimeTotalEpisodes(animeId: number, totalEpisodes: number): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${BASE_URL}/api/admin/${animeId}/total-episodes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ totalEpisodes }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const apiResponse: ApiResponse<{ success: boolean; message: string }> = await response.json();
    
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
export async function setAnimeTotalEpisodesUnknown(animeId: number): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${BASE_URL}/api/admin/${animeId}/total-episodes/unknown`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const apiResponse: ApiResponse<{ success: boolean; message: string }> = await response.json();
    
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
export async function getAnimeDetail(animeId: number): Promise<unknown> {
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

    const apiResponse: ApiResponse<unknown> = await response.json();
    
    if (!apiResponse.isSuccess) {
      throw new Error(apiResponse.message);
    }

    return apiResponse.result;
  } catch (error) {
    throw error;
  }
}
