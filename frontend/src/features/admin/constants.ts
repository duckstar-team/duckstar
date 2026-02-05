import { LogFilterType } from '@/types';
import { ManagerProfileDtoTaskType } from '@/types/generated/api';

export const ADMIN_TABS = [
  {
    label: '컨텐츠 관리',
    value: 'content',
  },
  {
    label: '애니메이션 관리',
    value: 'anime',
  },
  {
    label: '주차별 편성표 관리',
    value: 'schedule',
  },
  {
    label: '제출 현황 관리',
    value: 'submissions',
  },
] as const;

export const ANIME_HEADERS = [
  { label: '애니메이션 ID', key: 'animeId' },
  { label: '애니메이션 제목', key: 'titleKor' },
  { label: '제작사', key: 'corp' },
  { label: '상태', key: 'status' },
  { label: '방영 요일', key: 'dayOfWeek' },
  { label: '방영 시간', key: 'airTime' },
  { label: '총 에피소드 수', key: 'totalEpisodes' },
] as const;

export const REASON_MAX_LENGTH = 300;

export const SUBMISSIONS_PAGE_SIZE = 50;

export const ADMIN_LOG_PAGE_SIZE = 10;

export const SCROLL_THRESHOLD = 200;

export const FILTER_OPTIONS: { value: LogFilterType; label: string }[] = [
  { value: LogFilterType.ALL, label: '전체' },
  { value: LogFilterType.ANIME, label: '애니메이션' },
  { value: LogFilterType.EPISODE, label: '에피소드' },
  { value: LogFilterType.IP, label: 'IP' },
];

export const TASK_TYPE: Record<
  ManagerProfileDtoTaskType,
  { label: string; color: string }
> = {
  BAN: { label: '차단', color: 'text-red-400' },
  UNBAN: { label: '차단 해제', color: 'text-fuchsia-400' },
  WITHDRAW: { label: '표 몰수', color: 'text-orange-400' },
  UNDO_WITHDRAW: { label: '표 몰수 롤백', color: 'text-blue-400' },
  EPISODE_BREAK: { label: '휴방', color: 'text-orange-400' },
  EPISODE_RESCHEDULE: { label: '편성 변경', color: 'text-pink-400' },
  EPISODE_CREATE: { label: '에피소드 추가', color: 'text-blue-500' },
  FUTURE_EPISODE_DELETE: { label: '에피소드 삭제', color: 'text-red-400' },
  EPISODE_MODIFY_NUMBER: { label: '화수 수정', color: 'text-purple-400' },
  ANIME_CREATE: { label: '애니 등록', color: 'text-orange-400' },
  ANIME_INFO_UPDATE: { label: '애니 정보 수정', color: 'text-purple-400' },
  ANIME_STATUS_UPDATE: { label: '애니 상태 수정', color: 'text-pink-400' },
  ANIME_DIRECTION_UPDATE: { label: '애니 방향 수정', color: 'text-yellow-400' },
  ANIME_EPISODE_TOTAL_COUNT: {
    label: '애니 총 화수 수정',
    color: 'text-blue-400',
  },
};
