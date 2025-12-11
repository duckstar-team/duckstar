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
