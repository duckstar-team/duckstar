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
 * 분기 앵커: 분기 첫날이 포함된 주의 월요일 18:00 (첫날 이전 또는 같은 월요일)
 * 백엔드의 TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)와 동일한 로직
 */
function anchorForQuarter(year: number, quarter: number): Date {
  const first = firstDayOfQuarter(year, quarter); // 1,4,7,10월 1일
  const dow = first.getDay(); // 0=일요일, 1=월요일, ..., 6=토요일

  // previousOrSame(MONDAY) 로직: 월요일이면 그대로, 아니면 이전 월요일
  let daysToMonday: number;
  if (dow === 1) {
    // 월요일
    daysToMonday = 0;
  } else {
    daysToMonday = dow === 0 ? 6 : dow - 1; // 이전 월요일까지의 일수
  }

  const anchorDate = new Date(first);
  anchorDate.setDate(first.getDate() - daysToMonday);

  // 18:00으로 설정
  anchorDate.setHours(18, 0, 0, 0);
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

  if (time.getTime() < currAnchor.getTime()) {
    const prevQ = q === 1 ? 4 : q - 1;
    const prevY = q === 1 ? y - 1 : y;
    const prevAnchor = anchorForQuarter(prevY, prevQ);
    return { year: prevY, quarter: prevQ, anchorStart: prevAnchor };
  }
  if (time.getTime() < nextAnchor.getTime()) {
    return { year: y, quarter: q, anchorStart: currAnchor };
  }
  return { year: nextY, quarter: nextQ, anchorStart: nextAnchor };
}

/**
 * 분기 주차: 앵커 기준 7일(=168시간) 단위, 1부터 시작
 */
function weekOfQuarter(time: Date, anchor: Date): number {
  const hours = Math.floor(
    (time.getTime() - anchor.getTime()) / (1000 * 60 * 60)
  );
  return Math.floor(hours / (7 * 24)) + 1; // 168시간 단위
}

// ---- Public API ----
/**
 * 백엔드의 getThisWeekRecord와 정확히 동일한 로직
 */
export function getThisWeekRecord(time: Date): YQWRecord {
  const ai = resolveAnchor(time);
  const week = weekOfQuarter(time, ai.anchorStart);

  // ✅ 분기 연도를 앵커 연도로 정의
  const quarterYear = ai.anchorStart.getFullYear();

  return { yearValue: quarterYear, quarterValue: ai.quarter, weekValue: week };
}
