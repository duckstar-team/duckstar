import { ApiResponse, HomeDto, RankPreviewDto, WeeklyTopDto } from '@/types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface HomeApiResponse {
  isSuccess: boolean;
  code: string;
  message: string;
  result: HomeDto;
}

export const homeApi = {
  /**
   * 홈페이지 초기 데이터 조회
   * @param size - 조회할 데이터 개수 (기본값: 10, 최대: 50)
   */
  async getHome(size: number = 10): Promise<HomeApiResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/home?size=${size}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Anilab 순위 데이터 조회
   * @param year - 년도
   * @param quarter - 분기
   * @param week - 주차
   * @param size - 조회할 데이터 개수 (기본값: 10, 최대: 50)
   */
  async getAnilabRank(year: number, quarter: number, week: number, size: number = 10): Promise<{ isSuccess: boolean; code: string; message: string; result: RankPreviewDto[] }> {
    const response = await fetch(`${API_BASE_URL}/api/v1/home/${year}/${quarter}/${week}/anilab?size=${size}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Anime 순위 데이터 조회
   * @param year - 년도
   * @param quarter - 분기
   * @param week - 주차
   * @param size - 조회할 데이터 개수 (기본값: 10, 최대: 50)
   */
  async getAnimeRank(year: number, quarter: number, week: number, size: number = 10): Promise<{ isSuccess: boolean; code: string; message: string; result: WeeklyTopDto }> {
    const response = await fetch(`${API_BASE_URL}/api/v1/home/${year}/${quarter}/${week}/anime?size=${size}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
    }

    return response.json();
  },

};
