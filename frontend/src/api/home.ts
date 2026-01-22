import { Schemas } from '@/types';
import { apiCall } from './http';

export const homeApi = {
  /**
   * 홈페이지 초기 데이터 조회
   * @param size - 조회할 데이터 개수 (기본값: 10, 최대: 50)
   */
  async getHome(size: number = 10) {
    return apiCall<Schemas['HomeDto']>(`/api/v1/home?size=${size}`);
  },

  /**
   * Anilab 순위 데이터 조회
   * @param year - 년도
   * @param quarter - 분기
   * @param week - 주차
   * @param size - 조회할 데이터 개수 (기본값: 10, 최대: 50)
   */
  async getAnilabRank(
    year: number,
    quarter: number,
    week: number,
    size: number = 10
  ) {
    return apiCall<Schemas['RankPreviewDto'][]>(
      `/api/v1/home/${year}/${quarter}/${week}/anilab?size=${size}`
    );
  },

  /**
   * 주차별 덕스타 애니메이션 TOP N개 조회 API (with 해외 순위)
   * @param year - 년도
   * @param quarter - 분기
   * @param week - 주차
   * @param size - 조회할 데이터 개수 (기본값: 10, 최대: 50)
   */
  async getAnimeRank(
    year: number,
    quarter: number,
    week: number,
    size: number = 10
  ) {
    return apiCall<Schemas['WeeklyTopDto']>(
      `/api/v1/home/${year}/${quarter}/${week}/anime?size=${size}`
    );
  },
};
