/**
 * 어워드 투표 세션키 관리 유틸리티
 * 로그인하지 않은 사용자의 투표 이력을 endDate까지 유효한 세션키로 관리
 */

import { SurveyType } from '@/types';

const SESSION_KEY_PREFIX = 'survey_session_';

/**
 * 세션키 이름 생성
 * @param surveyType 어워드 타입
 * @returns 세션키 이름
 */
function getSessionKeyName(surveyType: SurveyType): string {
  return `${SESSION_KEY_PREFIX}${surveyType.toUpperCase()}`;
}

/**
 * 세션키 저장 (endDate까지 유효)
 * @param surveyType 어워드 타입
 * @param endDate 어워드 종료일 (Date 객체)
 * @param isVoteHistorySaved 투표 내역 저장 여부 (기본값: false)
 */
export function setSurveySession(
  surveyType: SurveyType,
  endDate: Date,
  isVoteHistorySaved: boolean = false
): void {
  if (typeof window === 'undefined') return;

  // 이미 유효한 세션키가 있으면 저장하지 않음
  if (hasValidSurveySession(surveyType)) {
    return;
  }

  try {
    const key = getSessionKeyName(surveyType);
    const sessionData = {
      endDate,
      createdAt: Date.now(),
      isVoteHistorySaved,
    };
    localStorage.setItem(key, JSON.stringify(sessionData));
  } catch (error) {
    console.error('세션키 저장 실패:', error);
  }
}

/**
 * 세션키 조회 및 유효성 검사
 * @param surveyType 어워드 타입
 * @returns 세션키가 유효하면 true, 아니면 false
 */
export function hasValidSurveySession(surveyType: SurveyType): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const key = getSessionKeyName(surveyType);
    const stored = localStorage.getItem(key);
    if (!stored) return false;

    const sessionData = JSON.parse(stored);
    const now = Date.now();
    const endDate = sessionData.endDate;

    // endDate가 지났으면 세션키 삭제 및 false 반환
    if (now > endDate) {
      localStorage.removeItem(key);
      return false;
    }

    return true;
  } catch (error) {
    console.error('세션키 조회 실패:', error);
    return false;
  }
}

/**
 * 세션키의 투표 내역 저장 여부 조회
 * @param surveyType 어워드 타입
 * @returns 투표 내역이 저장되었으면 true, 아니면 false
 */
export function isVoteHistorySaved(surveyType: SurveyType): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const key = getSessionKeyName(surveyType);
    const stored = localStorage.getItem(key);
    if (!stored) return false;

    const sessionData = JSON.parse(stored);
    return sessionData.isVoteHistorySaved === true;
  } catch (error) {
    console.error('투표 내역 저장 여부 조회 실패:', error);
    return false;
  }
}

/**
 * 세션키의 투표 내역 저장 여부 업데이트
 * @param surveyType 어워드 타입
 */
export function updateSurveySessionVoteHistory(surveyType: SurveyType): void {
  if (typeof window === 'undefined') return;

  try {
    const key = getSessionKeyName(surveyType);
    const stored = localStorage.getItem(key);
    if (!stored) return;

    const sessionData = JSON.parse(stored);
    const now = Date.now();
    const endDate = sessionData.endDate;

    // endDate가 지났으면 업데이트하지 않음
    if (now > endDate) {
      return;
    }

    // 투표 내역 저장 여부 업데이트
    sessionData.isVoteHistorySaved = true;
    localStorage.setItem(key, JSON.stringify(sessionData));
  } catch (error) {
    console.error('투표 내역 저장 여부 업데이트 실패:', error);
  }
}

/**
 * 세션키 삭제 (미사용)
 * @param surveyType 어워드 타입
 */
export function removeSurveySession(surveyType: SurveyType): void {
  if (typeof window === 'undefined') return;

  try {
    const key = getSessionKeyName(surveyType);
    localStorage.removeItem(key);
  } catch (error) {
    console.error('세션키 삭제 실패:', error);
  }
}

/**
 * 모든 세션키 삭제 (미사용)
 */
export function clearAllSurveySessions(): void {
  if (typeof window === 'undefined') return;

  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(SESSION_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('세션키 전체 삭제 실패:', error);
  }
}
