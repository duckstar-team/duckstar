import { SurveyDto, SurveyType, VoteStatus } from '@/types';

/**
 * SurveyType을 한글 라벨로 변환
 */
export function getSurveyTypeLabel(type: SurveyType | string): string {
  switch (String(type)) {
    case 'Q1_END':
      return '1분기 어워드';
    case 'Q2_END':
      return '2분기 어워드';
    case 'Q3_END':
      return '3분기 어워드';
    case 'Q4_END':
      return '4분기 어워드';
    case 'YEAR_END':
      return '연말 어워드';
    case 'ANTICIPATED':
      return '기대작 투표';
    default:
      return '어워드';
  }
}

/**
 * SurveyDto를 받아서 배너 제목 반환
 */
export function getBannerTitle(surveyData: SurveyDto | undefined): string {
  if (!surveyData) return '2025 덕스타 어워드';

  const surveyTypeLabel = getSurveyTypeLabel(surveyData.type);
  return `${surveyData.year} ${surveyTypeLabel}`;
}

/**
 * Category를 한글 텍스트로 변환
 */
export function getCategoryText(category: string): string {
  switch (category) {
    case 'ANIME':
      return '애니메이션';
    case 'HERO':
      return '남성 캐릭터';
    case 'HEROINE':
      return '여성 캐릭터';
    default:
      return '애니메이션';
  }
}

/**
 * VoteStatus를 한글 텍스트로 변환
 */
export function getStatusText(status: VoteStatus | string): string {
  switch (String(status)) {
    case 'OPEN':
      return '진행중';
    case 'PAUSED':
      return '일시 중지';
    case 'CLOSED':
      return '종료';
    default:
      return '알 수 없음';
  }
}
