import { ApiResponse } from './search';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// 댓글 관련 타입 정의
export interface CommentRequestDto {
  episodeId?: number;
  attachedImageUrl?: string;
  body: string;
}

export interface ReplyRequestDto {
  listenerId?: number;
  commentRequestDto: CommentRequestDto;
}

export interface CommentDto {
  status: string;
  commentId: number;
  canDeleteThis: boolean;
  isLiked: boolean;
  commentLikeId?: number;
  likeCount: number;
  authorId: number;
  nickname: string;
  profileImageUrl?: string;
  voteCount: number;
  episodeNumber?: number;
  createdAt: string;
  attachedImageUrl?: string;
  body: string;
  replyCount: number;
}

export interface ReplyDto {
  status: string;
  replyId: number;
  canDeleteThis: boolean;
  isLiked: boolean;
  replyLikeId?: number;
  likeCount: number;
  authorId: number;
  nickname: string;
  profileImageUrl?: string;
  voteCount: number;
  createdAt: string;
  listenerId?: number;
  attachedImageUrl?: string;
  body: string;
}

export interface PageInfo {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface AnimeCommentSliceDto {
  totalCount?: number;
  commentDtos: CommentDto[];
  pageInfo: PageInfo;
}

export interface ReplySliceDto {
  replyDtos: ReplyDto[];
  pageInfo: PageInfo;
}

export interface DeleteResultDto {
  status: string;
  createdAt: string;
  deletedAt: string;
}

// 댓글 조회 API
export async function getAnimeComments(
  animeId: number,
  episodeIds?: number[],
  sortBy: string = 'RECENT',
  page: number = 0,
  size: number = 10
): Promise<AnimeCommentSliceDto> {
  try {
    const params = new URLSearchParams({
      sortBy,
      page: page.toString(),
      size: size.toString(),
    });

    if (episodeIds && episodeIds.length > 0) {
      episodeIds.forEach(id => params.append('episodeIds', id.toString()));
    }

    const response = await fetch(`${BASE_URL}/api/v1/animes/${animeId}/comments?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const apiResponse: ApiResponse<AnimeCommentSliceDto> = await response.json();
    
    if (!apiResponse.isSuccess) {
      throw new Error(apiResponse.message);
    }

    return apiResponse.result;
  } catch (error) {
    console.error('Failed to fetch anime comments:', error);
    throw error;
  }
}

// 댓글 작성 API
export async function createComment(
  animeId: number,
  request: CommentRequestDto
): Promise<CommentDto> {
  try {
    const response = await fetch(`${BASE_URL}/api/v1/animes/${animeId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const apiResponse: ApiResponse<CommentDto> = await response.json();
    
    if (!apiResponse.isSuccess) {
      throw new Error(apiResponse.message);
    }

    return apiResponse.result;
  } catch (error) {
    console.error('Failed to create comment:', error);
    throw error;
  }
}

// 댓글 삭제 API
export async function deleteComment(commentId: number): Promise<DeleteResultDto> {
  try {
    const response = await fetch(`${BASE_URL}/api/v1/comments/${commentId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const apiResponse: ApiResponse<DeleteResultDto> = await response.json();
    
    if (!apiResponse.isSuccess) {
      throw new Error(apiResponse.message);
    }

    return apiResponse.result;
  } catch (error) {
    console.error('Failed to delete comment:', error);
    throw error;
  }
}

// 답글 조회 API
export async function getReplies(
  commentId: number,
  page: number = 0,
  size: number = 10
): Promise<ReplySliceDto> {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    const response = await fetch(`${BASE_URL}/api/v1/comments/${commentId}/replies?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const apiResponse: ApiResponse<ReplySliceDto> = await response.json();
    
    if (!apiResponse.isSuccess) {
      throw new Error(apiResponse.message);
    }

    return apiResponse.result;
  } catch (error) {
    console.error('Failed to fetch replies:', error);
    throw error;
  }
}

// 답글 작성 API
export async function createReply(
  commentId: number,
  request: ReplyRequestDto
): Promise<ReplyDto> {
  try {
    const response = await fetch(`${BASE_URL}/api/v1/comments/${commentId}/replies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const apiResponse: ApiResponse<ReplyDto> = await response.json();
    
    if (!apiResponse.isSuccess) {
      throw new Error(apiResponse.message);
    }

    return apiResponse.result;
  } catch (error) {
    console.error('Failed to create reply:', error);
    throw error;
  }
}

// 답글 삭제 API
export async function deleteReply(replyId: number): Promise<DeleteResultDto> {
  try {
    const response = await fetch(`${BASE_URL}/api/v1/comments/0/replies/${replyId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const apiResponse: ApiResponse<DeleteResultDto> = await response.json();
    
    if (!apiResponse.isSuccess) {
      throw new Error(apiResponse.message);
    }

    return apiResponse.result;
  } catch (error) {
    console.error('Failed to delete reply:', error);
    throw error;
  }
}
