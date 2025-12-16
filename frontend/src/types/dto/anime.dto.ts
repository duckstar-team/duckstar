import { Anime, MedalPreviewDto, OttDto, SeasonDto, WeekDto } from '@/types';

// Anime Info DTO (home, detail)
export interface AnimeInfoDto extends Anime {
  status: 'UPCOMING' | 'NOW_SHOWING' | 'COOLING' | 'ENDED';
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

// Anime Preview DTO (search)
export interface AnimePreviewDto extends Anime {
  episodeId: number;
  status: 'UPCOMING' | 'NOW_SHOWING' | 'COOLING' | 'ENDED';
  isBreak: boolean;
  isRescheduled: boolean | null;
  scheduledAt: string;
  ottDtos: OttDto[];
}

// Anime Preview List DTO
export interface AnimePreviewListDto {
  year: number;
  quarter: number;
  schedule: {
    [key: string]: AnimePreviewDto[];
  };
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
  type: 'ANIME' | 'HERO' | 'HEROINE';
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
  bannerType: 'HOT' | 'NOTICEABLE';
  contentType: 'ANIME' | 'HERO' | 'HEROINE';
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

// Vote Ratio DTO
export interface VoteRatioDto {
  votePercent: number;
  malePercent: number;
  femalePercent: number;
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
  animeId: number;
  rankPreviewDto: RankPreviewDto;
  medalPreviews: MedalPreviewDto[];
  animeStatDto: AnimeStatDto;
  voteRatioDto: VoteRatioDto;
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
  scheduledAt: string; // ISO 8601 형식 (LocalDateTime)
  isRescheduled: boolean | null;
  nextEpScheduledAt?: string; // ISO 8601 형식 (LocalDateTime)
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
