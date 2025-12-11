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

// OTT DTO
export interface OttDto {
  ottType: 'LAFTEL' | 'NETFLIX' | 'WAVVE' | 'TVING' | 'WATCHA' | 'PRIME';
  watchUrl: string;
}

// Medal Preview Dto
export interface MedalPreviewDto {
  type: 'GOLD' | 'SILVER' | 'BRONZE' | 'NONE';
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
  isBlocked?: boolean; // 중복 투표 시도한 경우 차단 처리
  episodeStarId: number; // 별점 투표 기록 ID
  userStarScore: number; // 사용자가 투표한 별점
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
