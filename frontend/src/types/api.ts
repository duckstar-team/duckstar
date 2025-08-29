// Duckstar API Types - Generated from Swagger JSON

// Base API Response
export interface ApiResponse<T> {
  isSuccess: boolean;
  code: string;
  message: string;
  result: T;
}

// Week DTO
export interface WeekDto {
  year: number;
  quarter: number;
  week: number;
  startDate: string;
  endDate: string;
}

// Ballot Request DTO
export interface BallotRequestDto {
  candidateId: number;
  ballotType: "NORMAL" | "BONUS";
}

// Anime Vote Request
export interface AnimeVoteRequest {
  weekId: number;
  gender: "MALE" | "FEMALE" | "NONE";
  ballotRequests: BallotRequestDto[];
}

// Vote Receipt DTO
export interface VoteReceiptDto {
  submissionId: number;
  weekDto: WeekDto;
  category: "ANIME" | "HERO" | "HEROINE";
  normalCount: number;
  bonusCount: number;
  submittedAt: string;
}

export type ApiResponseVoteReceiptDto = ApiResponse<VoteReceiptDto>;

// Comment Request DTO
export interface CommentRequestDto {
  attachedImageUrl?: string;
  body: string;
}

// Reply Request DTO
export interface ReplyRequestDto {
  listenerId: number;
  commentRequestDto: CommentRequestDto;
}

// Reply DTO
export interface ReplyDto {
  status: "NORMAL" | "DELETED" | "ADMIN_DELETED";
  replyId: number;
  canDeleteThis: boolean;
  isLiked: boolean;
  replyLikeId: number;
  likeCount: number;
  authorId: number;
  nickname: string;
  profileImageUrl: string;
  voteCount: number;
  createdAt: string;
  listenerId: number;
  attachedImageUrl?: string;
  body: string;
}

export type ApiResponseReplyDto = ApiResponse<ReplyDto>;

// Comment DTO
export interface CommentDto {
  status: "NORMAL" | "DELETED" | "ADMIN_DELETED";
  commentId: number;
  canDeleteThis: boolean;
  isLiked: boolean;
  commentLikeId: number;
  likeCount: number;
  authorId: number;
  nickname: string;
  profileImageUrl: string;
  voteCount: number;
  createdAt: string;
  attachedImageUrl?: string;
  body: string;
  replyCount: number;
}

export type ApiResponseCommentDto = ApiResponse<CommentDto>;

// Delete Result DTO
export interface DeleteResultDto {
  status: "NORMAL" | "DELETED" | "ADMIN_DELETED";
  createdAt: string;
  deletedAt?: string;
}

export type ApiResponseDeleteResultDto = ApiResponse<DeleteResultDto>;

// Anime Candidate DTO
export interface AnimeCandidateDto {
  animeCandidateId: number;
  mainThumbnailUrl: string;
  titleKor: string;
  medium: "TVA" | "MOVIE";
}

// Anime Candidate List DTO
export interface AnimeCandidateListDto {
  weekId: number;
  weekDto: WeekDto;
  animeCandidates: AnimeCandidateDto[];
  candidatesCount: number;
}

export type ApiResponseAnimeCandidateListDto = ApiResponse<AnimeCandidateListDto>;

// Anime Vote History DTO
export interface AnimeVoteHistoryDto {
  submissionId: number;
  weekDto: WeekDto;
  category: "ANIME" | "HERO" | "HEROINE";
  submittedAt: string;
  ballotRequests: BallotRequestDto[];
}

// Vote History Ballot DTO (실제 API 응답에서 사용되는 구조)
export interface VoteHistoryBallotDto {
  animeId: number;
  mainThumbnailUrl: string;
  titleKor: string;
  medium: "TVA" | "MOVIE";
  ballotType: "NORMAL" | "BONUS";
}

// Vote History Response DTO
export interface VoteHistoryResponseDto {
  submissionId: number;
  weekDto: WeekDto;
  category: "ANIME" | "HERO" | "HEROINE";
  submittedAt: string;
  normalCount: number;
  bonusCount: number;
  ballotRequests: VoteHistoryBallotDto[];
}

export type ApiResponseVoteHistoryResponseDto = ApiResponse<VoteHistoryResponseDto>;

export type ApiResponseAnimeVoteHistoryDto = ApiResponse<AnimeVoteHistoryDto>;

// Vote Status DTO (통합된 API 응답)
export interface AnimeVoteStatusDto {
  hasVoted: boolean;
  submissionId: number;
  weekDto: WeekDto;
  category: "ANIME" | "HERO" | "HEROINE";
  normalCount: number;
  bonusCount: number;
  submittedAt: string;
  animeBallotDtos: VoteHistoryBallotDto[];
}

export type ApiResponseAnimeVoteStatusDto = ApiResponse<AnimeVoteStatusDto>;

// OTT DTO
export interface OttDto {
  ottType: "LAFTEL" | "NETFLIX" | "WAVVE" | "TVING" | "WATCHA" | "PRIME";
  watchUrl: string;
}

// Anime Preview DTO
export interface AnimePreviewDto {
  animeId: number;
  mainThumbnailUrl: string;
  status: "UPCOMING" | "NOW_SHOWING" | "COOLING" | "ENDED";
  isBreak: boolean;
  titleKor: string;
  dayOfWeek: "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN" | "SPECIAL" | "NONE";
  scheduledAt: string;
  isRescheduled: boolean;
  genre: string;
  medium: "TVA" | "MOVIE";
  ottDtos: OttDto[];
}

// Anime Preview List DTO
export interface AnimePreviewListDto {
  weekDto: WeekDto;
  schedule: {
    [key: string]: AnimePreviewDto[];
  };
}

export type ApiResponseAnimePreviewListDto = ApiResponse<AnimePreviewListDto>;

// Rank Preview DTO
export interface RankPreviewDto {
  rank: number;
  rankDiff: number;
  consecutiveWeeksAtSameRank: number;
  mainThumbnailUrl: string;
  title: string;
  subTitle: string;
}

// Duckstar Rank Preview DTO
export interface DuckstarRankPreviewDto {
  votePercent: number;
  rankPreviewDto: RankPreviewDto;
}

// Home Banner DTO
export interface HomeBannerDto {
  bannerType: "HOT";
  contentType: "ANIME" | "HERO" | "HEROINE";
  mainTitle: string;
  subTitle: string;
  animeImageUrl: string;
  characterImageUrl: string;
}

// Weekly Top DTO
export interface WeeklyTopDto {
  duckstarRankPreviews: DuckstarRankPreviewDto[];
  crawlerRankDtos: RankPreviewDto[];
}

// Home DTO
export interface HomeDto {
  weeklyTopDto: WeeklyTopDto;
  homeBannerDtos: HomeBannerDto[];
  weekDtos: WeekDto[];
}

export type ApiResponseHomeDto = ApiResponse<HomeDto>;

export type ApiResponseWeeklyTopDto = ApiResponse<WeeklyTopDto>;

export type ApiResponseRankPreviewDto = ApiResponse<RankPreviewDto>;

// Page Info
export interface PageInfo {
  hasNext: boolean;
  page: number;
  size: number;
}

// Reply Slice DTO
export interface ReplySliceDto {
  replyDtos: ReplyDto[];
  pageInfo: PageInfo;
}

export type ApiResponseReplySliceDto = ApiResponse<ReplySliceDto>;

// Character Rank DTO
export interface CharacterRankDto {
  // Empty object in Swagger, will be extended as needed
  _placeholder?: never;
}

// Character Rank Slice DTO
export interface CharacterRankSliceDto {
  characterRankDtos: CharacterRankDto[];
  crawlerRankDtos: RankPreviewDto[];
  pageInfo: PageInfo;
}

export type ApiResponseCharacterRankSliceDto = ApiResponse<CharacterRankSliceDto>;

// Medal Preview DTO
export interface MedalPreviewDto {
  type: "GOLD" | "SILVER" | "BRONZE" | "NONE";
  rank: number;
  year: number;
  quarter: number;
  week: number;
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

// Anime Rank Slice DTO
export interface AnimeRankSliceDto {
  animeRankDtos: AnimeRankDto[];
  animeTrendRankDtos: RankPreviewDto[];
  aniLabRankDtos: RankPreviewDto[];
  pageInfo: PageInfo;
}

export type ApiResponseAnimeRankSliceDto = ApiResponse<AnimeRankSliceDto>;

// Season DTO
export interface SeasonDto {
  year: number;
  seasonType: "SPRING" | "SUMMER" | "AUTUMN" | "WINTER";
}

// Anime Info DTO
export interface AnimeInfoDto {
  medium: "TVA" | "MOVIE";
  status: "UPCOMING" | "NOW_SHOWING" | "COOLING" | "ENDED";
  totalEpisodes: number;
  premiereDateTime: string;
  titleKor: string;
  titleOrigin: string;
  dayOfWeek: "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN" | "SPECIAL" | "NONE";
  airTime: string;
  corp: string;
  director: string;
  genre: string;
  author: string;
  minAge: number;
  officalSite: { [key: string]: string };
  mainImageUrl: string;
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
  episodeNumber: number;
  isBreak: boolean;
  quarter: number;
  week: number;
  scheduledAt: string;
  isRescheduled: boolean;
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
  episodeDtos: EpisodeDto[];
  rackUnitDtos: RackUnitDto[];
  castPreviews: CastPreviewDto[];
}

export type ApiResponseAnimeHomeDto = ApiResponse<AnimeHomeDto>;

// Anime Comment Slice DTO
export interface AnimeCommentSliceDto {
  commentDtos: CommentDto[];
  pageInfo: PageInfo;
}

export type ApiResponseAnimeCommentSliceDto = ApiResponse<AnimeCommentSliceDto>;
