/**
 * 분기 계산 유틸리티
 * 백엔드의 QuarterUtil과 동일한 로직을 구현
 */

export interface YQWRecord {
  yearValue: number;
  quarterValue: number;
  weekValue: number;
}

/**
 * 특정 날짜의 분기 시작일을 계산합니다.
 */
function getStartDateOfQuarter(date: Date): Date {
  const monthValue = date.getMonth() + 1; // getMonth()는 0부터 시작
  let month = 1;
  
  switch (monthValue) {
    case 1:
    case 2:
    case 3:
      month = 1;
      break;
    case 4:
    case 5:
    case 6:
      month = 4;
      break;
    case 7:
    case 8:
    case 9:
      month = 7;
      break;
    case 10:
    case 11:
    case 12:
      month = 10;
      break;
  }
  
  return new Date(date.getFullYear(), month - 1, 1);
}

/**
 * 특정 날짜의 분기 값 (1~4)을 계산합니다.
 */
function getQuarterValue(date: Date): number {
  const quarterStart = getStartDateOfQuarter(date);
  return Math.floor((quarterStart.getMonth()) / 3) + 1;
}

/**
 * 주의 초반인지 확인합니다 (일요일, 월요일, 화요일, 수요일)
 */
function isEarlyInWeek(dayOfWeek: number): boolean {
  return dayOfWeek === 0 || dayOfWeek === 1 || dayOfWeek === 2 || dayOfWeek === 3;
}

/**
 * 특정 날짜의 주차 번호를 계산합니다.
 */
function getWeekNumberOf(weekStartDate: Date): number {
  const quarterStartDate = getStartDateOfQuarter(weekStartDate);
  
  // 분기 시작일의 이전 또는 같은 일요일 찾기
  const quarterStartDay = quarterStartDate.getDay();
  const daysToSubtract = quarterStartDay === 0 ? 0 : quarterStartDay;
  const lastSunday = new Date(quarterStartDate);
  lastSunday.setDate(quarterStartDate.getDate() - daysToSubtract);
  
  // 주차 계산
  const timeDiff = weekStartDate.getTime() - lastSunday.getTime();
  const weeks = Math.floor(timeDiff / (1000 * 60 * 60 * 24 * 7));
  
  return isEarlyInWeek(quarterStartDate.getDay()) ? weeks + 1 : weeks;
}

/**
 * 비즈니스 규칙에 맞는 연도, 분기, 주차 계산
 * 백엔드의 getThisWeekRecord와 동일한 로직
 */
export function getThisWeekRecord(time: Date): YQWRecord {
  // 주 시작(일요일)과 종료(토요일)
  const weekStartDate = new Date(time);
  weekStartDate.setDate(time.getDate() - time.getDay());
  
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekStartDate.getDate() + 6);

  const startQuarterValue = getQuarterValue(weekStartDate);
  const endQuarterValue = getQuarterValue(weekEndDate);

  // 분기 변경 주
  if (startQuarterValue !== endQuarterValue) {
    // 경계일 요일 판단
    const borderDate = getStartDateOfQuarter(weekEndDate);
    if (isEarlyInWeek(borderDate.getDay())) {
      return {
        yearValue: weekEndDate.getFullYear(),
        quarterValue: endQuarterValue,
        weekValue: 1
      };
    }
  }

  return {
    yearValue: weekStartDate.getFullYear(),
    quarterValue: startQuarterValue,
    weekValue: getWeekNumberOf(weekStartDate)
  };
}

/**
 * 현재 날짜를 기반으로 연도와 분기를 계산합니다.
 */
export function getCurrentYearAndQuarter(): { year: number; quarter: number } {
  const now = new Date();
  const record = getThisWeekRecord(now);
  return { year: record.yearValue, quarter: record.quarterValue };
}
