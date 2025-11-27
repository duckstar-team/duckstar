import { EvaluateState, StarInfoDto } from './api';

export interface CandidateListDto {
  episodeId: number;
  state: EvaluateState;
  hasVoted: boolean;
  mainThumbnailUrl: string;
  titleKor: string;
}

export interface VoteResultDto {
  isLateParticipating?: boolean | null;
  voterCount: number;
  info?: StarInfoDto | null;
  voteUpdatedAt?: string | null;
  commentId?: number | null;
  body?: string | null;
}

export interface CandidateDto {
  episodeId: number;
  voterCount: number;
  animeId: number;
  mainThumbnailUrl: string;
  result: VoteResultDto;
}
