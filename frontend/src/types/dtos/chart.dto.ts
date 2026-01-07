import {
  AnimeCandidateDto,
  AnimeRankDto,
  CommentDto,
  PageInfo,
  VoteRatioDto,
} from '@/types/dtos';

export interface ChartAnimeDto {
  animeRankDtos: AnimeRankDto[];
  animeTrendRankPreviews: any[];
  aniLabRankPreviews: any[];
  pageInfo: PageInfo;
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
