import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Season configuration
const SEASON_CONFIG = {
  SPRING: { startMonth: 3, startDay: 20, endMonth: 6, endDay: 20 },
  SUMMER: { startMonth: 6, startDay: 21, endMonth: 9, endDay: 21 },
  AUTUMN: { startMonth: 9, startDay: 22, endMonth: 12, endDay: 20 },
  WINTER: { startMonth: 12, startDay: 21, endMonth: 3, endDay: 19 },
} as const;

export type Season = keyof typeof SEASON_CONFIG;

type SeasonConfig = {
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
};

/**
 * 시작 날짜를 기반으로 계절을 계산합니다.
 * @param startDate - 시작 날짜 (YYYY-MM-DD 형식)
 * @returns 계절 ("SPRING" | "SUMMER" | "AUTUMN" | "WINTER")
 */
export function getSeasonFromDate(startDate: string): Season {
  const date = new Date(startDate);
  const month = date.getMonth() + 1; // getMonth()는 0부터 시작하므로 +1
  const day = date.getDate();

  // Check if date falls within each season
  if (isInSeason(month, day, SEASON_CONFIG.SPRING)) return "SPRING";
  if (isInSeason(month, day, SEASON_CONFIG.SUMMER)) return "SUMMER";
  if (isInSeason(month, day, SEASON_CONFIG.AUTUMN)) return "AUTUMN";
  
  return "WINTER"; // Default to winter
}

/**
 * 주어진 월과 일이 특정 계절에 속하는지 확인합니다.
 */
function isInSeason(month: number, day: number, season: SeasonConfig): boolean {
  const { startMonth, startDay, endMonth, endDay } = season;
  
  // Same month check
  if (month === startMonth) return day >= startDay;
  if (month === endMonth) return day <= endDay;
  
  // Different months check
  if (startMonth < endMonth) {
    // Normal case (e.g., Spring: March to June)
    return month > startMonth && month < endMonth;
  } else {
    // Wrapped case (e.g., Winter: December to March)
    return month > startMonth || month < endMonth;
  }
}

/**
 * 계절을 한글로 변환합니다.
 * @param season - 영문 계절
 * @returns 한글 계절
 */
export function getSeasonInKorean(season: "SPRING" | "SUMMER" | "AUTUMN" | "WINTER"): string {
  const seasonMap = {
    "SPRING": "SPRING",
    "SUMMER": "SUMMER", 
    "AUTUMN": "AUTUMN",
    "WINTER": "WINTER"
  };
  return seasonMap[season];
}
