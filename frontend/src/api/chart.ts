import { Schemas, WeekDto } from '@/types';
import { apiCall } from './http';

export async function getChartData(
  year: number,
  quarter: number,
  week: number,
  page: number = 0
) {
  return apiCall<Schemas['AnimeRankSliceDto']>(
    `/api/v1/chart/${year}/${quarter}/${week}/anime?page=${page}&size=20`
  );
}

export async function getWeeks(isPrepared: boolean = false) {
  const params = new URLSearchParams({
    isPrepared: String(isPrepared),
  });
  return apiCall<WeekDto[]>(`/api/v1/chart/weeks?${params}`);
}

export async function getSurveyResult(
  surveyId: number,
  page: number = 0,
  size: number = 10,
  sort: 'asc' | 'desc' = 'asc'
) {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
    sort: sort,
  });
  return apiCall<Schemas['SurveyRankPage']>(
    `/api/v1/chart/surveys/${surveyId}?${params}`
  );
}
