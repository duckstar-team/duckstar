import { apiCall } from './http';
import { ChartAnimeDto, WeekDto } from '@/types';

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
