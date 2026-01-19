import {
  MedalPreviewDto,
  OttDto,
  PageInfo,
  SeasonDto,
  VoteRatioDto,
  VoteResultDto,
  WeekDto,
} from '@/types/dtos';
import {
  AnimeStatus,
  BannerType,
  ContentType,
  DayOfWeek,
  Medium,
} from '../enums';

export interface Anime {
  animeId: number; // TODO: 확인 필요
  titleKor: string;
  dayOfWeek: DayOfWeek;
  airTime: string | null;
  medium: Medium;
  genre: string;
  mainThumbnailUrl: string;
}

// Anime Info DTO (home, detail)
export interface AnimeInfoDto extends Anime {
  status: AnimeStatus;
  totalEpisodes: number | null;
  premiereDateTime: string;
  titleOrigin: string;
  synopsis: string | null;
  corp: string;
  director: string;
  author: string;
  minAge: number;
  officalSite: Record<string, string>;
  mainImageUrl: string;
  seasonDtos: SeasonDto[];
  ottDtos: OttDto[];
}

// Anime Preview DTO (search) - 백엔드 SearchResponseDto.AnimePreviewDto와 일치
export interface AnimePreviewDto {
  animeId: number;
  titleKor: string;
  mainThumbnailUrl: string;
  status: AnimeStatus;
  isBreak: boolean;
  isRescheduled: boolean | null;
  genre: string;
  medium: Medium;
  ottDtos: OttDto[];
  dayOfWeek: DayOfWeek;
  scheduledAt: string; // LocalDateTime
  airTime: string | null; // LocalTime (분기 시간표에서만 사용)
}

// Schedule DTO - 백엔드 SearchResponseDto.ScheduleDto와 일치
export interface ScheduleDto {
  dayOfWeekShort: DayOfWeek;
  animePreviews: AnimePreviewDto[];
}

// Anime Preview List DTO - 백엔드 SearchResponseDto.AnimePreviewListDto와 일치
export interface AnimePreviewListDto {
  year: number;
  quarter: number;
  scheduleDtos: ScheduleDto[];
}

// Search API Response DTO
export interface AnimeSearchListDto {
  size: number;
  animePreviews: AnimePreviewDto[];
}

// Duckstar Rank Preview DTO
export interface DuckstarRankPreviewDto {
  votePercent: number;
  rankPreviewDto: RankPreviewDto;
}

// Rank Preview DTO
export interface RankPreviewDto {
  type: ContentType;
  contentId: number;
  rank: number;
  rankDiff: number | null;
  consecutiveWeeksAtSameRank: number | null;
  mainThumbnailUrl: string;
  title: string;
  subTitle: string;
}

// Duckstar Rank Preview DTO
export interface DuckstarRankPreviewDto {
  votePercent: number;
  averageRating: number;
  voterCount: number;
  rankPreviewDto: RankPreviewDto;
}

// Weekly Top DTO
export interface WeeklyTopDto {
  isPrepared: boolean | null;
  duckstarRankPreviews: DuckstarRankPreviewDto[];
  anilabRankPreviews: RankPreviewDto[];
  animeCornerRankPreviews: RankPreviewDto[];
}

// Home Banner DTO
export interface HomeBannerDto {
  bannerType: BannerType;
  contentType: ContentType;
  animeId: number;
  characterId: number;
  mainTitle: string;
  subTitle: string;
  animeImageUrl: string;
  characterImageUrl: string;
}

// Home DTO
export interface HomeDto {
  weeklyTopDto: WeeklyTopDto;
  homeBannerDtos: HomeBannerDto[];
  currentWeekDto: WeekDto;
  pastWeekDtos: WeekDto[];
}

// Anime Stat DTO
export interface AnimeStatDto {
  debutRank: number;
  debutDate: string;
  peakRank: number;
  peakDate: string;
  weeksOnTop10: number;
}

// Anime Rank DTO
export interface AnimeRankDto {
  rankPreviewDto: RankPreviewDto;
  medalPreviews: MedalPreviewDto[];
  animeStatDto: AnimeStatDto;
  voteResultDto: VoteResultDto;
}

// Anime Rank Slice DTO
export interface AnimeRankSliceDto {
  voterCount: number;
  voteTotalCount: number;
  animeRankDtos: AnimeRankDto[];
  animeTrendRankPreviews: RankPreviewDto[];
  aniLabRankPreviews: RankPreviewDto[];
  pageInfo: PageInfo;
}

// Cast Preview DTO
export interface CastPreviewDto {
  mainThumbnailUrl: string;
  nameKor: string;
  cv: string;
}

// Episode DTO
export interface EpisodeDto {
  episodeId: number;
  episodeNumber: number;
  isBreak: boolean;
  scheduledAt: string;
  isRescheduled: boolean | null;
  nextEpScheduledAt?: string;
}

// Rack Unit DTO
export interface RackUnitDto {
  startDate: string;
  endDate: string;
  medalPreviewDto: MedalPreviewDto;
  voteRatioDto: VoteRatioDto;
}

// Anime Home DTO
export interface AnimeHomeDto {
  animeInfoDto: AnimeInfoDto;
  animeStatDto: AnimeStatDto;
  episodeResponseDtos: EpisodeDto[];
  rackUnitDtos: RackUnitDto[];
  castPreviews: CastPreviewDto[];
}
