import { MedalPreviewDto, PageInfo, VoteResultDto } from '@/types';

export interface ChartAnimeDto {
  animeRankDtos: AnimeRankDto[];
  animeTrendRankPreviews: any[];
  aniLabRankPreviews: any[];
  pageInfo: PageInfo;
}

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
