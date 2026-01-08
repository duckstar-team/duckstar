import { useState, useCallback, useRef, useEffect } from 'react';
import { CommentDto, CommentRequestDto, ReplyDto } from '@/types/dtos';
import {
  getAnimeComments,
  createComment,
  deleteComment,
  likeComment,
  unlikeComment,
  mapSortOptionToBackend,
} from '@/api/comment';
import { SortOption } from '@/components/common/SortingMenu';
import { useModal } from '@/components/layout/AppContainer';
import { useQueryClient } from '@tanstack/react-query';
import { showToast } from '@/components/common/Toast';

export function useComments(animeId: number) {
  const { openLoginModal } = useModal();
  const queryClient = useQueryClient();

  // 댓글 관련 상태
  const [comments, setComments] = useState<CommentDto[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [totalCommentCount, setTotalCommentCount] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedEpisodeIds, setSelectedEpisodeIds] = useState<number[]>([]);
  const [currentSort, setCurrentSort] = useState<SortOption>('Recent');
  const [replies, setReplies] = useState<{ [commentId: number]: ReplyDto[] }>(
    {}
  );

  // 중복 호출 방지용 ref
  const isLoadingRef = useRef(false);

  // selectedEpisodeIds 최신 값 참조용 ref
  const selectedEpisodeIdsRef = useRef(selectedEpisodeIds);

  // selectedEpisodeIds가 변경될 때마다 ref 업데이트
  useEffect(() => {
    selectedEpisodeIdsRef.current = selectedEpisodeIds;
  }, [selectedEpisodeIds]);

  // 댓글 데이터 로딩
  const loadComments = useCallback(
    async (
      page: number = 0,
      reset: boolean = false,
      resetPage: boolean = true,
      skipLoadingState: boolean = false
    ) => {
      if (!animeId) return;

      // 중복 호출 방지
      if (isLoadingRef.current) {
        return;
      }

      try {
        isLoadingRef.current = true;
        if (reset && !skipLoadingState) {
          setCommentsLoading(true);
        } else if (!skipLoadingState) {
          setLoadingMore(true);
        }
        setCommentsError(null);

        const sortBy = mapSortOptionToBackend(currentSort);
        const data = await getAnimeComments(
          animeId,
          selectedEpisodeIdsRef.current.length > 0
            ? selectedEpisodeIdsRef.current
            : undefined,
          sortBy,
          page,
          10
        );

        if (reset) {
          setComments(data.commentDtos);
          if (resetPage) {
            setCurrentPage(0);
          }
          setTotalCommentCount(data.totalCount || 0);
        } else {
          setComments((prev) => [...prev, ...data.commentDtos]);
          setCurrentPage(page);
        }

        setHasMoreComments(data.pageInfo.hasNext);
      } catch (err) {
        setCommentsError('댓글을 불러오는 중 오류가 발생했습니다.');
      } finally {
        if (!skipLoadingState) {
          setCommentsLoading(false);
          setLoadingMore(false);
        }
        isLoadingRef.current = false;
      }
    },
    [animeId, currentSort]
  ); // selectedEpisodeIds 의존성 제거

  // 초기 댓글 로딩
  useEffect(() => {
    if (animeId) {
      loadComments(0, true);
    }
  }, [animeId]); // loadComments 의존성 제거

  // 정렬 옵션 변경 시 댓글 재로드
  useEffect(() => {
    if (animeId) {
      loadComments(0, true, true, true); // 로딩 상태 건너뛰기
    }
  }, [currentSort, animeId]);

  // 댓글 생성
  const createCommentHandler = useCallback(
    async (request: CommentRequestDto) => {
      await createComment(animeId, request);
      loadComments(0, true);
    },
    [animeId, loadComments]
  );

  // 댓글 삭제
  const deleteCommentHandler = useCallback(
    async (
      commentId: number,
      surveyCandidateId?: number | null,
      surveyId?: number
    ) => {
      const shouldDelete = confirm('댓글을 삭제하시겠습니까?');
      if (!shouldDelete) {
        return;
      }

      try {
        await deleteComment(commentId);
        if (surveyCandidateId) {
          await queryClient.refetchQueries({
            queryKey: ['vote-status', surveyCandidateId],
          });
        }
        if (surveyId) {
          await queryClient.refetchQueries({
            queryKey: ['survey-result', surveyId],
          });
        }
        loadComments(0, true);
        showToast.success('댓글이 삭제되었습니다.');
      } catch (error) {
        showToast.error('댓글 삭제에 실패했습니다. 다시 시도해주세요.');
      }
    },
    [loadComments, queryClient]
  );

  // 댓글 좋아요
  const likeCommentHandler = useCallback(
    async (commentId: number) => {
      try {
        const currentComment = comments.find(
          (c) => c && c.commentId === commentId
        );
        const isCurrentlyLiked = currentComment?.isLiked;
        const currentLikeId = currentComment?.commentLikeId;

        if (isCurrentlyLiked && currentLikeId && currentLikeId > 0) {
          const result = await unlikeComment(commentId, currentLikeId);
          setComments((prevComments) =>
            prevComments.map((comment) =>
              comment && comment.commentId === commentId
                ? {
                    ...comment,
                    isLiked: false,
                    likeCount: result.likeCount,
                    commentLikeId: currentLikeId,
                  }
                : comment
            )
          );
        } else {
          const result = await likeComment(commentId, currentLikeId);
          setComments((prevComments) =>
            prevComments.map((comment) =>
              comment && comment.commentId === commentId
                ? {
                    ...comment,
                    isLiked: true,
                    likeCount: result.likeCount,
                    commentLikeId: result.likeId || currentLikeId || 0,
                  }
                : comment
            )
          );
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('401')) {
          const shouldLogin = confirm(
            '로그인 후에 좋아요를 남길 수 있습니다. 로그인하시겠습니까?'
          );
          if (shouldLogin) {
            openLoginModal();
          }
        } else {
          alert('좋아요 처리에 실패했습니다. 다시 시도해주세요.');
        }
      }
    },
    [comments]
  );

  return {
    comments,
    setComments,
    commentsLoading,
    commentsError,
    currentPage,
    setCurrentPage,
    hasMoreComments,
    totalCommentCount,
    loadingMore,
    selectedEpisodeIds,
    setSelectedEpisodeIds,
    currentSort,
    setCurrentSort,
    replies,
    setReplies,
    loadComments,
    createComment: createCommentHandler,
    deleteComment: deleteCommentHandler,
    likeComment: likeCommentHandler,
  };
}
