// 댓글 DTO
export interface CommentDto {
  status: 'NORMAL' | 'DELETED' | 'ADMIN_DELETED';
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
}

// 답글 DTO
export interface ReplyDto {
  status: 'NORMAL' | 'DELETED' | 'ADMIN_DELETED';
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
