import { getSeasonFromDate } from '@/lib/utils';

/**
 * 시즌과 연도에 따른 투표 도장 이미지 경로를 생성합니다.
 * @param year 연도
 * @param startDate 시작 날짜 (YYYY-MM-DD 형식)
 * @param isBonus 보너스 투표 여부
 * @returns 투표 도장 이미지 경로
 */
export function getVoteStampImagePath(
  year: number, 
  startDate: string, 
  isBonus: boolean = false
): string {
  const season = getSeasonFromDate(startDate);
  const seasonLower = season.toLowerCase();
  
  const stampType = isBonus ? 'voted-bonus' : 'voted-normal';
  
  return `/${stampType}-${year}-${seasonLower}.svg`;
}

/**
 * 현재 시즌 정보를 기반으로 투표 도장 이미지 경로를 생성합니다.
 * @param weekDto 주차 정보 객체
 * @param isBonus 보너스 투표 여부
 * @returns 투표 도장 이미지 경로
 */
export function getCurrentVoteStampImagePath(
  weekDto: { year: number; startDate: string } | null | undefined,
  isBonus: boolean = false
): string {
  if (!weekDto) {
    // 기본값: 2025년 가을
    return isBonus ? '/voted-bonus-2025-autumn.svg' : '/voted-normal-2025-autumn.svg';
  }
  
  return getVoteStampImagePath(weekDto.year, weekDto.startDate, isBonus);
}
