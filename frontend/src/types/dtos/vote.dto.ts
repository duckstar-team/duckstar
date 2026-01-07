import {
  Anime,
  CommentDto,
  StarInfoDto,
  SurveyCommentDto,
  VoteResultDto,
  WeekDto,
} from '@/types/dtos';
import {
  BallotType,
  EpEvaluateState,
  Medium,
  AgeGroup,
  Gender,
  SurveyType,
  SurveyStatus,
} from '../enums';

// 실시간 투표 후보자 목록 DTO
export interface LiveCandidateListDto {
  weekDto: WeekDto;
  currentWeekLiveCandidates: LiveCandidateDto[];
  lastWeekLiveCandidates: LiveCandidateDto[];
}

// 실시간 투표 후보자 DTO
export interface LiveCandidateDto extends Anime {
  year: number;
  quarter: number;
  week: number;
  episodeId: number;
  animeId: number;
  mainThumbnailUrl: string;
  scheduledAt: string;
  result: VoteResultDto;
}

// 투표 후보자 목록 DTO
export interface CandidateListDto {
  episodeId: number;
  state: EpEvaluateState;
  hasVoted: boolean;
  mainThumbnailUrl: string;
  titleKor: string;
}

// 투표 후보자 DTO
export interface CandidateDto {
  episodeId: number;
  voterCount: number;
  animeId: number;
  mainThumbnailUrl: string;
  result: LiveVoteResultDto;
}

// 실시간 투표 결과 DTO
export interface LiveVoteResultDto {
  isLateParticipating?: boolean;
  voterCount: number;
  info?: StarInfoDto;
  voteUpdatedAt?: string;
  commentId?: number;
  body?: string;
}

/**
 * AnimeVoteHistoryDto
 */
export interface AnimeVoteHistoryDto {
  animeBallotDtos: AnimeBallotDto[];
  bonusCount: number;
  memberId: number | null;
  nickName: string | null;
  normalCount: number;
  submissionId?: number | null;
  type: string;
  year: number;
  submittedAt: string | Date;
}

/**
 * AnimeBallotDto
 */
export interface AnimeBallotDto {
  animeCandidateId: number;
  animeId: number;
  ballotType: BallotType;
  mainThumbnailUrl: string;
  titleKor: string;
  totalEpisodes?: number | null;
  year: number;
  quarter: number;
  medium: Medium;
  surveyCommentDto: SurveyCommentDto;
}

// 애니메이션 투표 상태 응답 DTO
export interface ApiResponseAnimeVoteHistoryDto {
  isSuccess: boolean;
  code: string;
  message: string;
  result: AnimeVoteHistoryDto;
}

// 애니메이션 후보 목록 응답 DTO
export interface ApiResponseAnimeCandidateListDto {
  isSuccess: boolean;
  code: string;
  message: string;
  result: AnimeCandidateListDto;
}

/**
 * AnimeCandidateListDto
 */
export interface AnimeCandidateListDto {
  animeCandidates: AnimeCandidateDto[];
  candidatesCount: number;
  memberGender: Gender;
  memberAgeGroup?: AgeGroup;
}

/**
 * AnimeCandidateDto
 */
export interface AnimeCandidateDto {
  animeCandidateId: number;
  mainThumbnailUrl: string;
  medium: Medium;
  titleKor: string;
  year: number;
  quarter: number;
}

/**
 * SurveyDto
 */
export interface SurveyDto {
  surveyId: number;
  hasVoted: boolean;
  status: SurveyStatus;
  year: number;
  type: SurveyType;
  startDateTime: Date;
  endDateTime: Date;
  thumbnailUrl: string | null;
}

/**
 * SurveyRankDto
 */
export interface SurveyRankDto {
  rank: number;
  animeId: number;
  animeCandidateDto: AnimeCandidateDto;
  voteRatioDto: VoteRatioDto;
  commentDtos: CommentDto[];
  commentTotalCount: number;
}

/**
 * SurveyResultDto
 */
export interface SurveyResultDto {
  isFirst: boolean;
  isLast: boolean;
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
  voteTotalCount: number;
  surveyRankDtos: SurveyRankDto[];
}

export interface VoteRatioDto {
  votePercent: number;
  normalPercent: number;
  bonusPercent: number;
  malePercent: number;
  femalePercent: number;
  under14Percent: number;
  to19Percent: number;
  to24Percent: number;
  to29Percent: number;
  to34Percent: number;
  over35Percent: number;
}
