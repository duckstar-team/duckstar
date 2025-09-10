// API 응답 타입 정의 (백엔드 EpisodeDto와 일치)
export interface EpisodeDto {
  episodeId: number;
  episodeNumber: number;
  isBreak: boolean;
  scheduledAt: string; // ISO 8601 형식 (LocalDateTime)
  isRescheduled: boolean;
  nextEpScheduledAt?: string; // ISO 8601 형식 (LocalDateTime)
}

export interface AnimeInfoDto {
  medium: string;
  status: string;
  totalEpisodes: number;
  premiereDateTime: string;
  titleKor: string;
  titleOrigin?: string;
  dayOfWeek?: string;
  airTime?: string;
  corp?: string;
  director?: string;
  genre?: string;
  author?: string;
  minAge?: number;
  officalSite?: Record<string, string>;
  mainImageUrl?: string;
  mainThumbnailUrl?: string;
  seasonDtos?: Array<{
    year: number;
    seasonType: string;
  }>;
  ottDtos?: Array<{
    ottType: string;
    watchUrl: string;
  }>;
}

export interface AnimeStatDto {
  debutRank?: number;
  debutDate?: string;
  peakRank?: number;
  peakDate?: string;
  weeksOnTop10?: number;
}

export interface AnimeHomeDto {
  animeInfoDto: AnimeInfoDto;
  animeStatDto: AnimeStatDto;
  episodeDtos: EpisodeDto[];
  rackUnitDtos?: unknown[];
  castPreviews?: unknown[];
}

// API 응답 래퍼 (실제 백엔드 응답 구조)
export interface ApiResponse<T> {
  isSuccess: boolean;
  code: string;
  message: string;
  result: T;
}
