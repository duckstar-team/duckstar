import {
  AnimeCandidateDto,
  CommentDto,
  MedalPreviewDto,
  PageInfo,
  VoteRatioDto,
  VoteResultDto,
} from '@/types';

interface AnimeRankDto {
  rankPreviewDto: {
    type: string;
    contentId: number;
    rank: number;
    rankDiff: number | null;
    consecutiveWeeksAtSameRank: number;
    mainThumbnailUrl: string;
    title: string;
    subTitle: string;
  };
  medalPreviews: MedalPreviewDto[];
  animeStatDto: {
    debutRank: number;
    debutDate: string;
    peakRank: number;
    peakDate: string;
    weeksOnTop10: number;
  };
  voteResultDto: VoteResultDto;
}

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
