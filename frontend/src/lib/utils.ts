import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export type Season = "SPRING" | "SUMMER" | "AUTUMN" | "WINTER";

/**
 * 분기를 기반으로 계절을 결정합니다.
 * @param quarter - 분기 (1~4)
 * @returns 계절 ("SPRING" | "SUMMER" | "AUTUMN" | "WINTER")
 */
export function getSeasonFromQuarter(quarter: number): Season {
  const seasonMap: { [key: number]: Season } = {
    1: "WINTER",  // 1분기 -> 겨울
    2: "SPRING",  // 2분기 -> 봄
    3: "SUMMER",  // 3분기 -> 여름
    4: "AUTUMN"   // 4분기 -> 가을
  };
  return seasonMap[quarter] || "WINTER";
}

/**
 * 시작 날짜를 기반으로 계절을 계산합니다.
 * @param startDate - 시작 날짜 (YYYY-MM-DD 형식)
 * @returns 계절 ("SPRING" | "SUMMER" | "AUTUMN" | "WINTER")
 */
export function getSeasonFromDate(startDate: string): Season {
  const date = new Date(startDate);
  const month = date.getMonth() + 1; // getMonth()는 0부터 시작하므로 +1
  
  // 월을 기반으로 분기 계산
  const quarter = Math.ceil(month / 3);
  
  return getSeasonFromQuarter(quarter);
}

/**
 * 계절을 그대로 반환합니다.
 * @param season - 영문 계절
 * @returns 영문 계절
 */
export function getSeasonInKorean(season: Season): string {
  return season;
}
