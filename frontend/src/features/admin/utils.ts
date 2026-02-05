import { Schemas, WeekDto } from '@/types';
import { formatAirTime } from '@/lib';

/**
 * 상태 코드를 한글 문자열로 변환
 */
export function formatStatus(s: string): string {
  const map: Record<string, string> = {
    UPCOMING: '예정',
    NOW_SHOWING: '방영중',
    COOLING: '휴방',
    ENDED: '종영',
  };
  return map[s] ?? s;
}

/**
 * 요일 코드를 한글 문자열로 변환
 */
export function formatDayOfWeek(d?: string | null): string {
  const map: Record<string, string> = {
    MON: '월',
    TUE: '화',
    WED: '수',
    THU: '목',
    FRI: '금',
    SAT: '토',
    SUN: '일',
  };
  return map[d ?? ''] ?? d ?? '';
}

/**
 * 드롭다운 옵션 구분용 값 생성 (year*10000+quarter*100+week)
 */
export function toWeekOptionValue(w: WeekDto): number {
  return (w.year ?? 0) * 10000 + (w.quarter ?? 0) * 100 + (w.week ?? 0);
}

/**
 * 분기 옵션 구분용 값 생성 (year*100+quarter)
 */
export function toQuarterOptionValue(year: number, quarter: number): number {
  return year * 100 + quarter;
}

/**
 * airTime 문자열을 LocalTime 객체로 변환
 */
export function parseAirTime(timeStr: string): Schemas['LocalTime'] | null {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  if (minute < 0 || minute > 59) return null;

  // 24:00~28:59는 그대로 유지 (서버에 전송 시 24:00~28:59로 전송)
  if (hour >= 24 && hour <= 28) {
    return { hour, minute, second: 0, nano: 0 };
  }
  // 29:00 이상은 00:00~23:59로 제한
  if (hour >= 29) {
    hour = hour % 24;
  }
  // 0~23 범위 체크
  if (hour < 0 || hour > 23) {
    return null;
  }

  return { hour, minute, second: 0, nano: 0 };
}

/**
 * airTime LocalTime 객체를 문자열로 변환
 */
export function airTimeToString(airTime?: Schemas['LocalTime'] | null): string {
  if (!airTime) return '';
  return formatAirTime(airTime);
}

/**
 * 서버 전송용: 24:00~28:59를 00:00~04:59로 변환
 * 프론트엔드에서는 24:00~28:59로 표시하지만, 서버는 0~23 범위만 받을 수 있음
 */
export function convertAirTimeForServer(
  airTime: Schemas['LocalTime']
): Schemas['LocalTime'] {
  let { hour, minute, second, nano } = airTime;

  // 24:00~28:59를 00:00~04:59로 변환
  if (hour >= 24 && hour <= 28) {
    hour = hour - 24;
  }

  return { hour, minute, second: second ?? 0, nano: nano ?? 0 };
}
