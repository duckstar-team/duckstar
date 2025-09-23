import { useState, useCallback } from 'react';
import { CommentDto, ReplyDto } from '../api/comments';
import { 
  getAnimeComments, 
  createComment, 
  deleteComment, 
  getReplies, 
  createReply, 
  deleteReply,
  likeComment,
  unlikeComment,
  likeReply,
  unlikeReply,
  mapSortOptionToBackend,
  CommentRequestDto,
  ReplyRequestDto,
  PageInfo
} from '../api/comments';
import { SortOption } from '../components/SortingMenu';

export function useComments(animeId: number) {
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
  const [replies, setReplies] = useState<{ [commentId: number]: ReplyDto[] }>({});

  // 댓글 데이터 로딩
  const loadComments = useCallback(async (page: number = 0, reset: boolean = false) => {
    if (!animeId) return;
    
    try {
      if (reset) {
        setCommentsLoading(true);
      } else {
        setLoadingMore(true);
      }
      setCommentsError(null);
      
      const sortBy = mapSortOptionToBackend(currentSort);
      const data = await getAnimeComments(
        animeId,
        selectedEpisodeIds.length > 0 ? selectedEpisodeIds : undefined,
        sortBy,
        page,
        10
      );
      
      if (reset) {
        setComments(data.commentDtos);
        setCurrentPage(0);
        setTotalCommentCount(data.totalCount || 0);
      } else {
        setComments(prev => [...prev, ...data.commentDtos]);
        setCurrentPage(page);
      }
      
      setHasMoreComments(data.pageInfo.hasNext);
      
    } catch (err) {
      setCommentsError('댓글을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setCommentsLoading(false);
      setLoadingMore(false);
    }
  }, [animeId, currentSort, selectedEpisodeIds]);

  // 댓글 생성
  const createCommentHandler = useCallback(async (request: CommentRequestDto) => {
    await createComment(animeId, request);
    loadComments(0, true);
  }, [animeId, loadComments]);

  // 댓글 삭제
  const deleteCommentHandler = useCallback(async (commentId: number) => {
    const shouldDelete = confirm('댓글을 삭제하시겠습니까?');
    if (!shouldDelete) {
      return;
    }
    
    try {
      await deleteComment(commentId);
      loadComments(0, true);
    } catch (error) {
      alert('댓글 삭제에 실패했습니다. 다시 시도해주세요.');
    }
  }, [loadComments]);

  // 댓글 좋아요
  const likeCommentHandler = useCallback(async (commentId: number) => {
    try {
      const currentComment = comments.find(c => c && c.commentId === commentId);
      const isCurrentlyLiked = currentComment?.isLiked;
      const currentLikeId = currentComment?.commentLikeId;
      
      if (isCurrentlyLiked && currentLikeId && currentLikeId > 0) {
        const result = await unlikeComment(commentId, currentLikeId);
        setComments(prevComments => 
          prevComments.map(comment => 
            comment && comment.commentId === commentId 
              ? { 
                  ...comment, 
                  isLiked: false,
                  likeCount: result.likeCount,
                  commentLikeId: currentLikeId
                }
              : comment
          )
        );
      } else {
        const result = await likeComment(commentId, currentLikeId);
        setComments(prevComments => 
          prevComments.map(comment => 
            comment && comment.commentId === commentId 
              ? { 
                  ...comment, 
                  isLiked: true,
                  likeCount: result.likeCount,
                  commentLikeId: result.likeId || currentLikeId || 0
                }
              : comment
          )
        );
      }
    } catch (error) {
      alert('좋아요 처리에 실패했습니다. 다시 시도해주세요.');
    }
  }, [comments]);

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
    likeComment: likeCommentHandler
  };
}
