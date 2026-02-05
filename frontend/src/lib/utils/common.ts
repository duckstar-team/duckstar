import { Schemas } from '@/types';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 방영 시간 포맷팅
 */
export function formatAirTime(airTime?: Schemas['LocalTime'] | string | null) {
  if (!airTime) {
    return '';
  }

  let hours: number;
  let minutes: number;

  // 문자열 형태로 오는 경우 (예: "20:00:00" 또는 "20:00")
  if (typeof airTime === 'string') {
    const timeMatch = airTime.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (!timeMatch) {
      return '';
    }
    hours = parseInt(timeMatch[1], 10);
    minutes = parseInt(timeMatch[2], 10);
  }
  // 객체 형태로 오는 경우
  else {
    if (airTime.hour === undefined || airTime.minute === undefined) {
      return '';
    }
    hours = airTime.hour;
    minutes = airTime.minute;
  }

  // 00:00 ~ 04:59인 경우 24시간 더하기
  if (hours < 5) {
    hours += 24;
  }

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * 주차 라벨 포맷팅
 */
export function formatWeekLabel(year: number, quarter: number, week: number) {
  const shortYear = year?.toString().slice(-2) ?? '';
  return `${shortYear ?? ''}년 ${quarter ?? ''}분기 ${week ?? ''}주차`;
}
