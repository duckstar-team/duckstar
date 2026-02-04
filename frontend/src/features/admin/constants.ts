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

export const SCROLL_THRESHOLD = 200;
