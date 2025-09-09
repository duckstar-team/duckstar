import { getCurrentYearAndQuarter } from '@/lib/quarterUtils';
import type { AnimePreviewDto, OttDto, WeekDto, AnimePreviewListDto } from '@/types/api';

export interface ApiResponse<T> {
  isSuccess: boolean;
  code: string;
  message: string;
  result: T;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

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
  const { year, quarter } = getCurrentYearAndQuarter();
  return getScheduleByQuarter(year, quarter);
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
