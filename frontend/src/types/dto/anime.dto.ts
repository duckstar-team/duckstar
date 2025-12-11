import { MedalPreviewDto, OttDto, WeekDto } from '@/types';

// Ballot Request DTO
export interface BallotRequestDto {
  candidateId: number;
  ballotType: 'NORMAL' | 'BONUS';
}

// Anime Vote Request
export interface AnimeVoteRequest {
  weekId: number;
  gender: 'MALE' | 'FEMALE' | 'NONE';
  ballotRequests: BallotRequestDto[];
}

// Vote Receipt DTO
export interface VoteReceiptDto {
  submissionId: number;
  weekDto: WeekDto;
  category: 'ANIME' | 'HERO' | 'HEROINE';
  normalCount: number;
  bonusCount: number;
  submittedAt: string;
}

// Anime Candidate DTO
export interface AnimeCandidateDto {
  animeCandidateId: number;
  mainThumbnailUrl: string;
  titleKor: string;
  medium: 'TVA' | 'MOVIE';
}

// Anime Preview DTO
export interface AnimePreviewDto {
  animeId: number;
  episodeId: number;
  mainThumbnailUrl: string;
  status?: 'UPCOMING' | 'NOW_SHOWING' | 'COOLING' | 'ENDED';
  isBreak?: boolean;
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
  scheduledAt: string;
  isRescheduled?: boolean;
  airTime: string; // 방영시간 (HH:mm 형식)
  genre: string;
  medium: 'TVA' | 'MOVIE' | 'OVA' | 'SPECIAL';
  ottDtos: OttDto[];
}

// Anime Preview List DTO
export interface AnimePreviewListDto {
  weekDto: WeekDto;
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

// Season DTO
export interface SeasonDto {
  year: number;
  seasonType: 'SPRING' | 'SUMMER' | 'AUTUMN' | 'WINTER';
}

// Anime Info DTO
export interface AnimeInfoDto {
  medium: 'TVA' | 'MOVIE';
  status: 'UPCOMING' | 'NOW_SHOWING' | 'COOLING' | 'ENDED';
  totalEpisodes: number;
  premiereDateTime: string;
  titleKor: string;
  titleOrigin: string;
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
  airTime: string;
  corp: string;
  director: string;
  genre: string;
  author: string;
  minAge: number;
  officalSite: Record<string, string>;
  mainImageUrl: string;
  mainThumbnailUrl: string;
  seasonDtos: SeasonDto[];
  ottDtos: OttDto[];
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
