import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 시작 날짜를 기반으로 계절을 계산합니다.
 * @param startDate - 시작 날짜 (YYYY-MM-DD 형식)
 * @returns 계절 ("SPRING" | "SUMMER" | "AUTUMN" | "WINTER")
 */
export function getSeasonFromDate(startDate: string): "SPRING" | "SUMMER" | "AUTUMN" | "WINTER" {
  const date = new Date(startDate);
  const month = date.getMonth() + 1; // getMonth()는 0부터 시작하므로 +1
  const day = date.getDate();

  // 3월 20일 이후
  if ((month === 3 && day >= 20) || month > 3) {
    // 6월 21일 이후
    if ((month === 6 && day >= 21) || month > 6) {
      // 9월 22일 이후
      if ((month === 9 && day >= 22) || month > 9) {
        // 12월 21일 이후
        if ((month === 12 && day >= 21) || month > 12) {
          return "WINTER";
        }
        return "AUTUMN";
      }
      return "SUMMER";
    }
    return "SPRING";
  }
  
  return "WINTER"; // 3월 20일 이전은 겨울
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
