import { SurveyDto } from '@/types/dtos';
import { SurveyType, SurveyStatus } from '@/types/enums';
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
  surveyData: SurveyDto | undefined,
  full: boolean = true
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

  return full ? `${rangeText} | ${summaryText}` : `${summaryText}`;
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
export function getStatusText(status: SurveyStatus | string): string {
  switch (String(status)) {
    case SurveyStatus.Open:
      return '진행중';
    case SurveyStatus.Paused:
      return '일시 중지';
    case SurveyStatus.Closed:
      return '종료';
    default:
      return '오픈 예정';
  }
}

/**
 * SurveyStatus에 따른 뱃지 배경색 클래스 반환
 * @param status SurveyStatus
 * @returns string
 */
export const getStatusBadge = (status: SurveyStatus) => {
  const colorVariants = {
    OPEN: 'bg-rose-100 text-rose-500',
    PAUSED: 'bg-yellow-100 text-amber-500',
    CLOSED: 'bg-gray-100 text-gray-800',
    NOT_YET: 'bg-blue-100 text-blue-500',
  };

  return colorVariants[status as keyof typeof colorVariants] || '';
};

/**
 * SurveyStatus에 따른 버튼 텍스트 반환
 * @param status SurveyStatus
 * @param hasVoted boolean
 * @returns string
 */
export const getButtonText = (
  status: SurveyStatus,
  hasVoted: boolean,
  endDateTime?: Date
) => {
  if (status === SurveyStatus.Open && hasVoted) {
    return '투표 완료';
  } else if (status === SurveyStatus.Open && !hasVoted) {
    return '투표 하기';
  } else if (status === SurveyStatus.Closed && endDateTime) {
    const endDate = format(endDateTime, 'M/d 오후 6시');
    return `결과 공개 - ${endDate}`;
  } else if (status === SurveyStatus.ResultOpen) {
    return '결과 보기';
  }
  return '';
};
