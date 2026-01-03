import { SeasonType } from '@/types/enums';

/**
 * 분기를 기반으로 계절을 결정합니다.
 * @param quarter - 분기 (1~4)
 * @returns 계절 ("SPRING" | "SUMMER" | "AUTUMN" | "WINTER")
 */
export function getSeasonFromQuarter(quarter: number): SeasonType {
  const seasonMap: { [key: number]: SeasonType } = {
    1: SeasonType.Winter, // 1분기 -> 겨울
    2: SeasonType.Spring, // 2분기 -> 봄
    3: SeasonType.Summer, // 3분기 -> 여름
    4: SeasonType.Autumn, // 4분기 -> 가을
  };
  return seasonMap[quarter];
}

/**
 * 시작 날짜를 기반으로 계절을 계산합니다.
 * @param startDate - 시작 날짜 (YYYY-MM-DD 형식)
 * @returns 계절 ("SPRING" | "SUMMER" | "AUTUMN" | "WINTER")
 */
export function getSeasonFromDate(startDate: string): SeasonType {
  const date = new Date(startDate);
  const month = date.getMonth() + 1; // getMonth()는 0부터 시작하므로 +1

  // 월을 기반으로 분기 계산
  const quarter = Math.ceil(month / 3);

  return getSeasonFromQuarter(quarter);
}

/**
 * 계절을 한글로 변환합니다.
 * @param season - 영문 계절 ("SPRING" | "SUMMER" | "AUTUMN" | "WINTER")
 * @returns 한글 계절 ("봄" | "여름" | "가을" | "겨울")
 */
export function getSeasonInKorean(season: SeasonType | string): string {
  const seasonMap: { [key: string]: string } = {
    SPRING: '봄',
    SUMMER: '여름',
    AUTUMN: '가을',
    WINTER: '겨울',
  };
  return seasonMap[season] || season;
}
