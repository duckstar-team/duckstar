import { apiCall } from './http';
import { ChartAnimeDto, SurveyResultDto, WeekDto } from '@/types';

export async function getChartData(
  year: number,
  quarter: number,
  week: number,
  page: number = 0
) {
  return apiCall<ChartAnimeDto>(
    `/api/v1/chart/${year}/${quarter}/${week}/anime?page=${page}&size=20`
  );
}

export async function getWeeks() {
  return apiCall<WeekDto[]>('/api/v1/chart/weeks');
}

export async function getSurveyResult(
  surveyId: number,
  page: number = 0,
  size: number = 20,
  sort: 'asc' | 'desc' = 'asc'
) {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
    sort: sort,
  });
  return apiCall<SurveyResultDto>(
    `/api/v1/chart/surveys/${surveyId}?${params}`
  );
}
