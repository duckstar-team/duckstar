export interface Anime {
  animeId: number; // TODO: 확인 필요
  titleKor: string;
  dayOfWeek:
    | 'MON'
    | 'TUE'
    | 'WED'
    | 'THU'
    | 'FRI'
    | 'SAT'
    | 'SUN'
    | 'SPECIAL'
    | 'NONE';
  airTime: string | null;
  medium: 'SPECIAL' | 'TVA' | 'MOVIE' | 'OVA';
  genre: string;
  mainThumbnailUrl: string;
}
