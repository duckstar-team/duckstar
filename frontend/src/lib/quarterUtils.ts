/**
 * 분기 계산 유틸리티
 * 백엔드의 QuarterUtil과 동일한 로직을 구현
 */

/**
 * 특정 날짜의 분기 시작일을 계산합니다.
 */
export function getStartDateOfQuarter(date: Date): Date {
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
 * 특정 날짜의 분기 종료일을 계산합니다.
 */
export function getEndDateOfQuarter(date: Date): Date {
  const start = getStartDateOfQuarter(date);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 3);
  end.setDate(end.getDate() - 1);
  return end;
}

/**
 * 특정 날짜의 분기 값 (1~4)을 계산합니다.
 */
export function getQuarterValue(date: Date): number {
  const start = getStartDateOfQuarter(date);
  return Math.floor((start.getMonth()) / 3) + 1;
}

/**
 * 비즈니스 규칙에 맞는 분기를 계산합니다.
 * 주 시작(일요일)과 종료(토요일)를 고려하여 분기 경계에 걸친 주의 경우
 * 더 많은 날짜가 포함된 분기를 선택합니다.
 */
export function getBusinessQuarter(date: Date): number {
  // 주 시작(일요일)과 종료(토요일) 계산
  const dayOfWeek = date.getDay(); // 0: 일요일, 6: 토요일
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() - dayOfWeek);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  const startQuarter = getQuarterValue(weekStart);
  const endQuarter = getQuarterValue(weekEnd);
  
  // 같은 분기면 바로 반환
  if (startQuarter === endQuarter) {
    return startQuarter;
  }
  
  // 분기 경계에 걸친 주 → 각 분기에 며칠씩 포함되는지 비교
  const startQuarterEnd = getEndDateOfQuarter(weekStart);
  const startQuarterDays = Math.floor((startQuarterEnd.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  const endQuarterStart = getStartDateOfQuarter(weekEnd);
  const endQuarterDays = Math.floor((weekEnd.getTime() - endQuarterStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  // 날짜가 더 많은 분기를 선택
  return startQuarterDays >= endQuarterDays ? startQuarter : endQuarter;
}

/**
 * 현재 날짜를 기반으로 연도와 분기를 계산합니다.
 */
export function getCurrentYearAndQuarter(): { year: number; quarter: number } {
  const now = new Date();
  const year = now.getFullYear();
  const quarter = getBusinessQuarter(now);
  
  return { year, quarter };
}

/**
 * 비즈니스 규칙에 따른 분기 주차 계산
 * 백엔드의 calculateBusinessWeekNumber와 동일한 로직
 */
export function calculateBusinessWeekNumber(date: Date): number {
  // 일요일이고 22시 이전이면 하루 전 토요일로 간주
  let adjustedDate = new Date(date);
  if (date.getDay() === 0 && date.getHours() < 22) {
    adjustedDate = new Date(date);
    adjustedDate.setDate(date.getDate() - 1);
  }

  const quarter = getBusinessQuarter(adjustedDate);

  // 분기 시작일 및 첫 번째 일요일 계산
  const quarterStart = new Date(adjustedDate.getFullYear(), (quarter - 1) * 3, 1);
  const firstSunday = new Date(quarterStart);
  firstSunday.setDate(quarterStart.getDate() - (quarterStart.getDay() % 7));

  // 주 시작일
  const weekStart = new Date(adjustedDate);
  weekStart.setDate(adjustedDate.getDate() - (adjustedDate.getDay() % 7));

  // 주차 계산
  const timeDiff = weekStart.getTime() - firstSunday.getTime();
  const weeks = Math.floor(timeDiff / (1000 * 60 * 60 * 24 * 7)) + 1;
  
  return weeks;
}

/**
 * 분기를 한글로 변환합니다.
 */
export function getQuarterInKorean(quarter: number): string {
  switch (quarter) {
    case 1:
      return '1분기';
    case 2:
      return '2분기';
    case 3:
      return '3분기';
    case 4:
      return '4분기';
    default:
      return '알 수 없음';
  }
}
