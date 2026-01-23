import { Schemas } from '@/types';
import { ApiResponse } from './http';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

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
): Promise<Schemas['AnimeCommentSliceDto']> {
  try {
    const params = new URLSearchParams({
      sortBy,
      page: page.toString(),
      size: size.toString(),
    });

    if (episodeIds && episodeIds.length > 0) {
      episodeIds.forEach((id) => params.append('episodeIds', id.toString()));
    }

    const response = await fetch(
      `${BASE_URL}/api/v1/animes/${animeId}/comments?${params}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const apiResponse: ApiResponse<Schemas['AnimeCommentSliceDto']> =
      await response.json();

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
  request: Schemas['CommentRequestDto']
): Promise<Schemas['CommentDto']> {
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
    if (request.attachedImage) {
      formData.append('attachedImage', request.attachedImage);
    }

    const response = await fetch(`${BASE_URL}/api/v1/animes/${animeId}`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `HTTP error! status: ${response.status} - ${errorText || response.statusText}`
      );
    }

    const apiResponse: ApiResponse<Schemas['CommentDto']> =
      await response.json();

    if (!apiResponse.isSuccess) {
      throw new Error(apiResponse.message);
    }

    return apiResponse.result;
  } catch (error) {
    throw error;
  }
}

// 댓글 삭제 API
export async function deleteComment(
  commentId: number
): Promise<Schemas['DeleteResultDto']> {
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
      throw new Error(
        `HTTP error! status: ${response.status} - ${errorText || response.statusText}`
      );
    }

    const apiResponse: ApiResponse<Schemas['DeleteResultDto']> =
      await response.json();

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
): Promise<Schemas['ReplySliceDto']> {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    const response = await fetch(
      `${BASE_URL}/api/v1/comments/${commentId}/replies?${params}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const apiResponse: ApiResponse<Schemas['ReplySliceDto']> =
      await response.json();

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
  request: Schemas['ReplyRequestDto']
): Promise<Schemas['ReplyDto']> {
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
        formData.append(
          'commentRequestDto.episodeId',
          commentDto.episodeId.toString()
        );
      }

      // 이미지 파일 추가 (있는 경우)
      if (commentDto.attachedImage) {
        formData.append(
          'commentRequestDto.attachedImage',
          commentDto.attachedImage
        );
      }
    }

    const response = await fetch(
      `${BASE_URL}/api/v1/comments/${commentId}/replies`,
      {
        method: 'POST',
        credentials: 'include',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const apiResponse: ApiResponse<Schemas['ReplyDto']> = await response.json();

    if (!apiResponse.isSuccess) {
      throw new Error(apiResponse.message);
    }

    return apiResponse.result;
  } catch (error) {
    throw error;
  }
}

// 답글 삭제 API
export async function deleteReply(
  replyId: number
): Promise<Schemas['DeleteResultDto']> {
  try {
    const url = `${BASE_URL}/api/v1/replies/${replyId}`;

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `HTTP error! status: ${response.status} - ${errorText || response.statusText}`
      );
    }

    const apiResponse: ApiResponse<Schemas['DeleteResultDto']> =
      await response.json();

    if (!apiResponse.isSuccess) {
      throw new Error(apiResponse.message);
    }

    return apiResponse.result;
  } catch (error) {
    throw error;
  }
}

// 댓글 좋아요 API
export async function likeComment(
  commentId: number,
  likeId?: number
): Promise<Schemas['LikeResultDto']> {
  try {
    const url = `${BASE_URL}/api/v1/comments/${commentId}/like`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ likeId: likeId || null }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `HTTP error! status: ${response.status} - ${errorText || response.statusText}`
      );
    }

    const apiResponse: ApiResponse<Schemas['LikeResultDto']> =
      await response.json();

    if (!apiResponse.isSuccess) {
      throw new Error(apiResponse.message);
    }

    return apiResponse.result;
  } catch (error) {
    throw error;
  }
}

// 댓글 좋아요 취소 API
export async function unlikeComment(
  commentId: number,
  commentLikeId: number
): Promise<Schemas['DiscardLikeResultDto']> {
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
      throw new Error(
        `HTTP error! status: ${response.status} - ${errorText || response.statusText}`
      );
    }

    const apiResponse: ApiResponse<Schemas['DiscardLikeResultDto']> =
      await response.json();

    if (!apiResponse.isSuccess) {
      throw new Error(apiResponse.message);
    }

    return apiResponse.result;
  } catch (error) {
    throw error;
  }
}

// 답글 좋아요 API
export async function likeReply(
  replyId: number,
  likeId?: number
): Promise<Schemas['LikeResultDto']> {
  try {
    const url = `${BASE_URL}/api/v1/replies/${replyId}/like`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ likeId: likeId || null }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `HTTP error! status: ${response.status} - ${errorText || response.statusText}`
      );
    }

    const apiResponse: ApiResponse<Schemas['LikeResultDto']> =
      await response.json();

    if (!apiResponse.isSuccess) {
      throw new Error(apiResponse.message);
    }

    return apiResponse.result;
  } catch (error) {
    throw error;
  }
}

// 답글 좋아요 취소 API
export async function unlikeReply(
  replyId: number,
  replyLikeId: number
): Promise<Schemas['DiscardLikeResultDto']> {
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
      throw new Error(
        `HTTP error! status: ${response.status} - ${errorText || response.statusText}`
      );
    }

    const apiResponse: ApiResponse<Schemas['DiscardLikeResultDto']> =
      await response.json();

    if (!apiResponse.isSuccess) {
      throw new Error(apiResponse.message);
    }

    return apiResponse.result;
  } catch (error) {
    throw error;
  }
}
