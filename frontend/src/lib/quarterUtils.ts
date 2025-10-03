/**
 * 분기 계산 유틸리티
 * 백엔드의 QuarterUtil과 정확히 동일한 로직을 구현
 */

export interface YQWRecord {
  yearValue: number;
  quarterValue: number;
  weekValue: number;
}

export interface AnchorInfo {
  year: number;
  quarter: number;
  anchorStart: Date;
}

// ---- helpers ----
/**
 * 달력 분기 계산 (1~4)
 */
function calendarQuarter(month: number): number {
  return Math.floor((month - 1) / 3) + 1;
}

/**
 * 분기 첫날 계산
 */
function firstDayOfQuarter(year: number, quarter: number): Date {
  const month = (quarter - 1) * 3 + 1; // 1,4,7,10
  return new Date(year, month - 1, 1);
}

/**
 * 분기 앵커: 첫날이 토 → 이전 금 19:00, 그 외 → 다음(또는 같은) 금 19:00
 */
function anchorForQuarter(year: number, quarter: number): Date {
  const first = firstDayOfQuarter(year, quarter);
  const dow = first.getDay(); // 0=일요일, 6=토요일

  let anchorDate: Date;
  if (dow === 6) { // 토요일
    // 이전 금요일
    anchorDate = new Date(first);
    anchorDate.setDate(first.getDate() - 1);
  } else {
    // 다음 또는 같은 금요일
    const daysToFriday = (5 - dow + 7) % 7; // 금요일까지의 일수
    anchorDate = new Date(first);
    anchorDate.setDate(first.getDate() + daysToFriday);
  }

  // 19:00으로 설정
  anchorDate.setHours(19, 0, 0, 0);
  return anchorDate;
}

/**
 * time 이 속한 "비즈니스 분기"의 (연도, 분기, 앵커 시작시각)을 판정
 * 구간 정의: [anchor(y,q), anchor(y',q'))  (좌측 포함, 우측 배타)
 */
function resolveAnchor(time: Date): AnchorInfo {
  const y = time.getFullYear();
  const q = calendarQuarter(time.getMonth() + 1);

  const currAnchor = anchorForQuarter(y, q);
  const nextQ = q === 4 ? 1 : q + 1;
  const nextY = q === 4 ? y + 1 : y;
  const nextAnchor = anchorForQuarter(nextY, nextQ);

  if (time.getTime() >= nextAnchor.getTime()) { // time >= nextAnchor → 다음 분기
    return { year: nextY, quarter: nextQ, anchorStart: nextAnchor };
  }
  if (time.getTime() < currAnchor.getTime()) { // time < 현재 분기 앵커 → 이전 분기
    const prevQ = q === 1 ? 4 : q - 1;
    const prevY = q === 1 ? y - 1 : y;
    const prevAnchor = anchorForQuarter(prevY, prevQ);
    return { year: prevY, quarter: prevQ, anchorStart: prevAnchor };
  }
  return { year: y, quarter: q, anchorStart: currAnchor }; // currAnchor ≤ time < nextAnchor
}

/**
 * 분기 주차: 앵커 기준 7일 단위, 1부터 시작
 */
function weekOfQuarter(time: Date, anchor: Date): number {
  const days = Math.floor((time.getTime() - anchor.getTime()) / (1000 * 60 * 60 * 24));
  return Math.floor(days / 7) + 1;
}

// ---- Public API ----
/**
 * 백엔드의 getThisWeekRecord와 정확히 동일한 로직
 */
export function getThisWeekRecord(time: Date): YQWRecord {
  const ai = resolveAnchor(time);
  const week = weekOfQuarter(time, ai.anchorStart);
  // 분기 "연도"는 항상 firstDayOfQuarter의 연도로 정의 (앵커가 전월일 수 있으므로 주의)
  const quarterYear = firstDayOfQuarter(ai.year, ai.quarter).getFullYear();
  return { yearValue: quarterYear, quarterValue: ai.quarter, weekValue: week };
}

/**
 * 현재 날짜를 기반으로 연도와 분기를 계산합니다.
 */
export function getCurrentYearAndQuarter(): { year: number; quarter: number } {
  const now = new Date();
  const record = getThisWeekRecord(now);
  return { year: record.yearValue, quarter: record.quarterValue };
}
