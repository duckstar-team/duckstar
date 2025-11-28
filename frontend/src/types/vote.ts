import { EvaluateState, StarInfoDto } from './api';

export interface CandidateListDto {
  episodeId: number;
  state: EvaluateState;
  hasVoted: boolean;
  mainThumbnailUrl: string;
  titleKor: string;
}

export interface VoteResultDto {
  isLateParticipating?: boolean;
  voterCount: number;
  info?: StarInfoDto;
  voteUpdatedAt?: string;
  commentId?: number;
  body?: string;
}

export interface CandidateDto {
  episodeId: number;
  voterCount: number;
  animeId: number;
  mainThumbnailUrl: string;
  result: VoteResultDto;
}
