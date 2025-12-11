import { CommentDto, PageInfo, ReplyDto } from '@/types';

// 댓글 작성 DTO
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
  totalCount?: number; // 첫 슬라이스에서만 답글 개수 보내기
  replyDtos: ReplyDto[];
  pageInfo: PageInfo;
}

export interface DeleteResultDto {
  status: 'NORMAL' | 'DELETED' | 'ADMIN_DELETED';
  createdAt: string;
  deletedAt?: string;
}

export interface LikeRequestDto {
  likeId?: number;
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
