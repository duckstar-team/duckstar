import {
  AnimeCandidateDto,
  CommentDto,
  MedalPreviewDto,
  PageInfo,
  SurveyDto,
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
  animeCandidateDto: AnimeCandidateDto;
  voteRatioDto: VoteRatioDto;
  totalCount: number;
  commentDto: CommentDto;
}

/**
 * SurveyResultDto
 */
export interface SurveyResultDto {
  surveyDto: SurveyDto;
  surveyRankDtos: SurveyRankDto[];
  pageInfo: PageInfo;
}
