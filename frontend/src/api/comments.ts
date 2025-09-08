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

// 정렬 옵션 매핑 함수
export function mapSortOptionToBackend(sortOption: string): string {
  switch (sortOption) {
    case 'Popular':
      return 'POPULAR';
    case 'Recent':
      return 'RECENT';
    case 'Oldest':
      return 'OLDEST';
    default:
      return 'RECENT';
  }
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
    throw error;
  }
}

// 댓글 작성 API
export async function createComment(
  animeId: number,
  request: CommentRequestDto
): Promise<CommentDto> {
  try {
    // FormData 생성
    const formData = new FormData();
    
    
    // body 필드 추가
    if (request.body) {
      formData.append('body', request.body);
    } else {
    }
    
    // episodeId 필드 추가 (있는 경우)
    if (request.episodeId) {
      formData.append('episodeId', request.episodeId.toString());
    }
    
    // 이미지 파일 추가 (있는 경우)
    if (request.attachedImageUrl) {
      // 이미지 URL이 있는 경우, File 객체로 변환하거나 다른 방식으로 처리
      // 현재는 이미지 업로드가 구현되지 않았으므로 일단 제외
    }
    

    const response = await fetch(`${BASE_URL}/api/v1/animes/${animeId}`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${errorText || response.statusText}`);
    }

    const apiResponse: ApiResponse<CommentDto> = await response.json();
    
    if (!apiResponse.isSuccess) {
      throw new Error(apiResponse.message);
    }

    return apiResponse.result;
  } catch (error) {
    throw error;
  }
}

// 댓글 삭제 API
export async function deleteComment(commentId: number): Promise<DeleteResultDto> {
  try {
    const url = `${BASE_URL}/api/v1/comments/${commentId}`;
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });


    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${errorText || response.statusText}`);
    }

    const apiResponse: ApiResponse<DeleteResultDto> = await response.json();
    
    if (!apiResponse.isSuccess) {
      throw new Error(apiResponse.message);
    }

    return apiResponse.result;
  } catch (error) {
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
    throw error;
  }
}

// 답글 작성 API
export async function createReply(
  commentId: number,
  request: ReplyRequestDto
): Promise<ReplyDto> {
  try {
    // FormData 생성
    const formData = new FormData();
    
    
    // listenerId 필드 추가 (있는 경우)
    if (request.listenerId) {
      formData.append('listenerId', request.listenerId.toString());
    }
    
    // commentRequestDto 필드들 추가
    if (request.commentRequestDto) {
      const commentDto = request.commentRequestDto;
      
      // body 필드 추가
      if (commentDto.body) {
        formData.append('commentRequestDto.body', commentDto.body);
      } else {
      }
      
      // episodeId 필드 추가 (있는 경우)
      if (commentDto.episodeId) {
        formData.append('commentRequestDto.episodeId', commentDto.episodeId.toString());
      }
      
      // 이미지 파일 추가 (있는 경우)
      if (commentDto.attachedImageUrl) {
        // 이미지 URL이 있는 경우, File 객체로 변환하거나 다른 방식으로 처리
        // 현재는 이미지 업로드가 구현되지 않았으므로 일단 제외
      }
    }
    

    const response = await fetch(`${BASE_URL}/api/v1/comments/${commentId}/replies`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const apiResponse: ApiResponse<ReplyDto> = await response.json();
    
    if (!apiResponse.isSuccess) {
      throw new Error(apiResponse.message);
    }

    return apiResponse.result;
  } catch (error) {
    throw error;
  }
}

// 답글 삭제 API
export async function deleteReply(replyId: number): Promise<DeleteResultDto> {
  try {
    const url = `${BASE_URL}/api/v1/comments/0/replies/${replyId}`;
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });


    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${errorText || response.statusText}`);
    }

    const apiResponse: ApiResponse<DeleteResultDto> = await response.json();
    
    if (!apiResponse.isSuccess) {
      throw new Error(apiResponse.message);
    }

    return apiResponse.result;
  } catch (error) {
    throw error;
  }
}

// 댓글 좋아요 API
export async function likeComment(commentId: number, likeId?: number): Promise<LikeResultDto> {
  try {
    const url = `${BASE_URL}/api/v1/comments/${commentId}/like`;
    
    const requestBody: LikeRequestDto = {};
    if (likeId && likeId > 0) {
      requestBody.likeId = likeId;
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${errorText || response.statusText}`);
    }

    const apiResponse: ApiResponse<LikeResultDto> = await response.json();
    
    if (!apiResponse.isSuccess) {
      throw new Error(apiResponse.message);
    }

    return apiResponse.result;
  } catch (error) {
    throw error;
  }
}

// 댓글 좋아요 취소 API
export async function unlikeComment(commentId: number, commentLikeId: number): Promise<DiscardLikeResultDto> {
  try {
    const url = `${BASE_URL}/api/v1/comments/${commentId}/like/${commentLikeId}`;
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${errorText || response.statusText}`);
    }

    const apiResponse: ApiResponse<DiscardLikeResultDto> = await response.json();
    
    if (!apiResponse.isSuccess) {
      throw new Error(apiResponse.message);
    }

    return apiResponse.result;
  } catch (error) {
    throw error;
  }
}

// 답글 좋아요 API
export async function likeReply(replyId: number, likeId?: number): Promise<LikeResultDto> {
  try {
    const url = `${BASE_URL}/api/v1/replies/${replyId}/like`;
    
    const requestBody: LikeRequestDto = {};
    if (likeId && likeId > 0) {
      requestBody.likeId = likeId;
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${errorText || response.statusText}`);
    }

    const apiResponse: ApiResponse<LikeResultDto> = await response.json();
    
    if (!apiResponse.isSuccess) {
      throw new Error(apiResponse.message);
    }

    return apiResponse.result;
  } catch (error) {
    throw error;
  }
}

// 답글 좋아요 취소 API
export async function unlikeReply(replyId: number, replyLikeId: number): Promise<DiscardLikeResultDto> {
  try {
    const url = `${BASE_URL}/api/v1/replies/${replyId}/like/${replyLikeId}`;
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${errorText || response.statusText}`);
    }

    const apiResponse: ApiResponse<DiscardLikeResultDto> = await response.json();
    
    if (!apiResponse.isSuccess) {
      throw new Error(apiResponse.message);
    }

    return apiResponse.result;
  } catch (error) {
    throw error;
  }
}
