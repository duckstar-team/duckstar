import { PageInfo } from '@/types/dtos';
import { AdminTaskType } from '../enums';

// Admin Submission API functions
export interface SubmissionCountDto {
  weekId: number;
  year: number;
  quarter: number;
  week: number;
  ipHash: string;
  count: number;
  isBlocked: boolean;
  isAllWithdrawn: boolean;
  firstCreatedAt: string;
  lastCreatedAt: string;
}

export interface SubmissionCountSliceDto {
  submissionCountDtos: SubmissionCountDto[];
  pageInfo: PageInfo;
}

export interface EpisodeStarDto {
  titleKor: string;
  starScore: number;
  isBlocked: boolean;
  createdAt: string;
  updatedAt: string;
}

// IP 관리 로그 관련 타입
export interface IpManagementLogDto {
  logId: number;
  memberId: number;
  profileImageUrl: string;
  managerNickname: string;
  weekId: number | null;
  year: number | null;
  quarter: number | null;
  week: number | null;
  ipHash: string;
  taskType: AdminTaskType;
  reason: string;
  managedAt: string;
  isUndoable: boolean;
}

export interface IpManagementLogSliceDto {
  ipManagementLogDtos: IpManagementLogDto[];
  pageInfo: PageInfo;
}
