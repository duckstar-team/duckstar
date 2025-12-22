import { Anime, StarInfoDto, VoteResultDto, WeekDto } from '@/types';

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

// 투표 상태 Enum
type EvaluateState =
  | 'CLOSED' // 투표 종료
  | 'VOTING_WINDOW' // 투표 진행 중
  | 'LOGIN_REQUIRED' // 로그인 필요(늦참 투표)
  | 'ALWAYS_OPEN'; // 항상 투표 진행

// 투표 후보자 목록 DTO
export interface CandidateListDto {
  episodeId: number;
  state: EvaluateState;
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
}

export enum BallotType {
  Bonus = 'BONUS',
  Normal = 'NORMAL',
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
  memberGender: MemberGender;
  memberAgeGroup?: MemberAgeGroup;
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

export enum Medium {
  Movie = 'MOVIE',
  Tva = 'TVA',
}

export enum MemberAgeGroup {
  Age15_19 = 'AGE_15_19',
  Age20_24 = 'AGE_20_24',
  Age25_29 = 'AGE_25_29',
  Age30_34 = 'AGE_30_34',
  Over35 = 'OVER_35',
  Under14 = 'UNDER_14',
}

export enum MemberGender {
  Female = 'FEMALE',
  Male = 'MALE',
  Unknown = 'UNKNOWN',
}

/**
 * SurveyDto
 */
export interface SurveyDto {
  surveyId: number;
  hasVoted: boolean;
  status: VoteStatusType;
  year: number;
  type: SurveyType;
  startDate: string;
  endDate: string;
}

export enum VoteStatusType {
  Closed = 'CLOSED',
  Open = 'OPEN',
  Paused = 'PAUSED',
}

export enum SurveyType {
  Anticipated = 'ANTICIPATED',
  Q1End = 'Q1_END',
  Q2End = 'Q2_END',
  Q3End = 'Q3_END',
  Q4End = 'Q4_END',
  YearEnd = 'YEAR_END',
}
