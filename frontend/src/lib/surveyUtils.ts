import { SurveyDto, SurveyType, VoteStatusType } from '@/types';
import { format } from 'date-fns';

/**
 * SurveyType을 한글 라벨로 변환
 */
export function getSurveyTypeLabel(
  type: SurveyType | string,
  full: boolean = false
): string {
  switch (String(type)) {
    case 'Q1_END':
      return full ? '1분기 애니메이션 어워드' : '1분기 어워드';
    case 'Q2_END':
      return full ? '2분기 애니메이션 어워드' : '2분기 어워드';
    case 'Q3_END':
      return full ? '3분기 애니메이션 어워드' : '3분기 어워드';
    case 'Q4_END':
      return full ? '4분기 애니메이션 어워드' : '4분기 어워드';
    case 'YEAR_END':
      return full ? '연말 애니메이션 어워드' : '연말 어워드';
    case 'ANTICIPATED':
      return full ? '기대작 애니메이션 어워드' : '기대작 투표';
    default:
      return full ? '애니메이션 어워드' : '어워드';
  }
}

/**
 * SurveyDto를 받아서 배너 서브타이틀(기간 + 결산 유형) 반환
 * 예시: "2025/12/22 - 2025/12/28 | 4분기 결산"
 */
export function getBannerSubtitle(
  surveyData: SurveyDto | undefined
): string | undefined {
  if (!surveyData) return undefined;

  const rangeText = `${format(surveyData.startDateTime, 'yyyy/MM/dd')} - ${format(
    surveyData.endDateTime,
    'yyyy/MM/dd'
  )}`;

  let summaryText: string;
  switch (surveyData.type) {
    case SurveyType.Q1End:
      summaryText = '1분기 결산';
      break;
    case SurveyType.Q2End:
      summaryText = '2분기 결산';
      break;
    case SurveyType.Q3End:
      summaryText = '3분기 결산';
      break;
    case SurveyType.Q4End:
      summaryText = '4분기 결산';
      break;
    case SurveyType.YearEnd:
      summaryText = '연말 결산';
      break;
    case SurveyType.Anticipated:
      summaryText = '기대작 투표';
      break;
    default:
      summaryText = '어워드';
  }

  return `${rangeText} | ${summaryText}`;
}

/**
 * SurveyDto를 받아서 배너 제목 반환
 */
export function getBannerTitle(
  surveyData: SurveyDto | undefined,
  isFull?: boolean
): string {
  if (!surveyData) return '2025 애니메이션 덕스타 어워드';

  const surveyTypeLabel = getSurveyTypeLabel(surveyData.type, isFull);
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
export function getStatusText(status: VoteStatusType | string): string {
  switch (String(status)) {
    case 'OPEN':
      return '진행중';
    case 'PAUSED':
      return '일시 중지';
    case 'CLOSED':
      return '종료';
    default:
      return '오픈 예정';
  }
}

/**
 * VoteStatusType에 따른 뱃지 배경색 클래스 반환
 * @param status VoteStatusType
 * @returns string
 */
export const getStatusBadge = (status: VoteStatusType) => {
  const colorVariants = {
    OPEN: 'bg-rose-100 text-rose-500',
    PAUSED: 'bg-yellow-100 text-amber-500',
    CLOSED: 'bg-gray-100 text-gray-800',
    NOT_YET: 'bg-blue-100 text-blue-500',
  };

  return colorVariants[status as keyof typeof colorVariants] || '';
};

/**
 * VoteStatusType에 따른 버튼 텍스트 반환
 * @param status VoteStatusType
 * @param hasVoted boolean
 * @returns string
 */
export const getButtonText = (status: VoteStatusType, hasVoted: boolean) => {
  if (status === VoteStatusType.Open && hasVoted) {
    return '투표 완료';
  } else if (status === VoteStatusType.Open && !hasVoted) {
    return '투표 하기';
  } else if (status === VoteStatusType.Closed) {
    return '결과 보기';
  } else if (status === VoteStatusType.ResultOpen) {
    return '결과 공개 - 18:00';
  }
  return '';
};
