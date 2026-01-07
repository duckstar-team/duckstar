import { MedalType, OttType, SeasonType } from '../enums';

// Page Info
export interface PageInfo {
  hasNext: boolean;
  page: number;
  size: number;
}

// Week DTO
export interface WeekDto {
  year: number;
  quarter: number;
  week: number;
  weekNumber?: number;
  startDate: string;
  endDate: string;
}

// Season DTO
export interface SeasonDto {
  year: number;
  seasonType: SeasonType;
}

// OTT DTO
export interface OttDto {
  ottType: OttType;
  watchUrl: string;
}

// Medal Preview Dto
export interface MedalPreviewDto {
  type: MedalType;
  rank: number;
  year: number;
  quarter: number;
  week: number;
}

// Vote Result DTO
export interface VoteResultDto {
  voterCount: number;
  info: StarInfoDto | null;
}

// Star Info DTO
export interface StarInfoDto {
  isBlocked: boolean | null; // 중복 투표 시도한 경우 차단 처리
  episodeStarId: number | null; // 별점 투표 기록 ID
  userStarScore: number | null; // 사용자가 투표한 별점
  starAverage: number;
  star_0_5: number;
  star_1_0: number;
  star_1_5: number;
  star_2_0: number;
  star_2_5: number;
  star_3_0: number;
  star_3_5: number;
  star_4_0: number;
  star_4_5: number;
  star_5_0: number;
}
