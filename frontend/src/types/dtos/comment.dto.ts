import { PageInfo } from '@/types/dtos';
import { CommentStatus } from '../enums';

export interface CommentDto {
  status: CommentStatus;
  commentId: number;
  canDeleteThis: boolean;
  isLiked: boolean;
  commentLikeId: number;
  likeCount: number;
  authorId: number;
  nickname: string;
  profileImageUrl: string;
  voteCount: number;
  episodeNumber?: number | null;
  createdAt: string;
  attachedImageUrl?: string;
  body: string;
  replyCount: number;
  starScore?: number;
  isLateParticipating?: boolean;
  surveyCandidateId: number | null;
}

export interface ReplyDto {
  status: CommentStatus;
  replyId: number;
  canDeleteThis: boolean;
  isLiked: boolean;
  replyLikeId?: number;
  likeCount: number;
  authorId: number;
  nickname: string;
  profileImageUrl: string;
  voteCount: number;
  createdAt: string;
  listenerNickname?: string;
  attachedImageUrl?: string;
  body: string;
}

export interface CommentRequestDto {
  episodeId?: number;
  attachedImage?: File;
  body: string;
}

export interface ReplyRequestDto {
  listenerId?: number;
  commentRequestDto: CommentRequestDto;
}

export interface AnimeCommentSliceDto {
  totalCount: number;
  commentDtos: CommentDto[];
  pageInfo: PageInfo;
}

export interface ReplySliceDto {
  totalCount?: number;
  replyDtos: ReplyDto[];
  pageInfo: PageInfo;
}

export interface DeleteResultDto {
  status: CommentStatus;
  createdAt: string;
  deletedAt?: string;
}

export interface LikeResultDto {
  likeId?: number;
  likeCount: number;
  likedAt?: string;
}

export interface DiscardLikeResultDto {
  likeCount: number;
  discardedAt?: string;
}

export interface SurveyCommentDto {
  commentCreatedAt: string | null;
  commentId: number | null;
  body: string | null;
}
