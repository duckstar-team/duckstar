'use client';

import { CommentDto, ReplyDto, ReplyRequestDto, PageInfo } from '@/types';
import React, { useState } from 'react';
import Comment from '@/components/domain/comment/Comment';
import Reply from '@/components/domain/comment/Reply';
import OpenOrFoldReplies from '@/components/domain/comment/OpenOrFoldReplies';
import CommentInputForm from './CommentInputForm';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import {
  getReplies,
  createReply,
  likeReply,
  unlikeReply,
  deleteReply,
} from '@/api/comment';
import { showToast } from '@/components/common/Toast';
import { useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useComments } from '@/hooks/useComments';
import { useModal } from '@/components/layout/AppContainer';

interface SurveyResultCommentProps {
  animeId: number;
  commentDtos: CommentDto[];
  commentTotalCount: number;
  surveyCandidateId: number;
}

export default function SurveyResultComment({
  animeId,
  commentDtos,
  commentTotalCount,
  surveyCandidateId,
}: SurveyResultCommentProps) {
  const { isAuthenticated } = useAuth();
  const {
    deleteComment,
    likeComment,
    createComment: createCommentHandler,
  } = useComments(animeId);
  const { openLoginModal } = useModal();
  const [isCommentOpen, setIsCommentOpen] = useState(commentTotalCount > 0);

  // 답글 관련 상태
  const [activeReplyForm, setActiveReplyForm] = useState<{
    commentId: number;
    replyId?: number;
    listenerId?: number;
  } | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<{
    [commentId: number]: boolean;
  }>({});
  const [replies, setReplies] = useState<{ [commentId: number]: ReplyDto[] }>(
    {}
  );
  const [replyPageInfo, setReplyPageInfo] = useState<{
    [commentId: number]: PageInfo;
  }>({});

  const { surveyId: surveyIdParam } = useParams();
  const surveyId = Number(surveyIdParam);
  const queryClient = useQueryClient();

  const handleCommentSubmit = async (commentText: string) => {
    try {
      await createCommentHandler({ body: commentText });
      await queryClient.refetchQueries({
        queryKey: ['survey-result', surveyId],
      });
      showToast.success('댓글이 작성되었습니다.');
    } catch (error) {
      console.error(error);
      showToast.error('댓글 작성에 실패했습니다.');
    }
  };

  const handleReplySubmitWrapper = async (content: string) => {
    if (!activeReplyForm) return;

    if (!isAuthenticated) {
      const shouldLogin = confirm(
        '답글을 작성하려면 로그인이 필요합니다. 로그인하시겠습니까?'
      );
      if (shouldLogin) {
        openLoginModal();
      }
      return;
    }

    try {
      const request: ReplyRequestDto = {
        listenerId: activeReplyForm.listenerId,
        commentRequestDto: {
          body: content,
        },
      };

      await createReply(activeReplyForm.commentId, request);
      setActiveReplyForm(null);

      // 답글을 자동으로 펼치고 답글 목록 조회
      setExpandedReplies((prev) => ({
        ...prev,
        [activeReplyForm.commentId]: true,
      }));

      const replyData = await getReplies(activeReplyForm.commentId, 0, 10);
      setReplies((prev) => ({
        ...prev,
        [activeReplyForm.commentId]: replyData.replyDtos,
      }));

      setReplyPageInfo((prev) => ({
        ...prev,
        [activeReplyForm.commentId]: replyData.pageInfo,
      }));

      await queryClient.refetchQueries({
        queryKey: ['survey-result', surveyId],
      });

      showToast.success('답글이 작성되었습니다.');
    } catch (error) {
      console.error(error);
      showToast.error('답글 작성에 실패했습니다.');
    }
  };

  // 답글 삭제 핸들러
  const handleReplyDelete = async (replyId: number) => {
    const shouldDelete = confirm('답글을 삭제하시겠습니까?');
    if (!shouldDelete) {
      return;
    }

    try {
      await deleteReply(replyId);

      // 삭제된 답글을 replies에서 제거
      setReplies((prevReplies) => {
        const updatedReplies = { ...prevReplies };
        Object.keys(updatedReplies).forEach((commentId) => {
          updatedReplies[parseInt(commentId)] = updatedReplies[
            parseInt(commentId)
          ].filter((reply) => reply && reply.replyId !== replyId);
        });
        return updatedReplies;
      });

      await queryClient.refetchQueries({
        queryKey: ['survey-result', surveyId],
      });

      showToast.success('답글이 삭제되었습니다.');
    } catch (error) {
      console.error(error);
      showToast.error('답글 삭제에 실패했습니다.');
    }
  };

  // 댓글 좋아요 핸들러 - useComments의 likeComment 사용
  const handleLikeComment = async (commentId: number) => {
    try {
      await likeComment(commentId);
      // SurveyResultCard는 props로 받은 commentDtos를 사용하므로 refetch 필요
      await queryClient.refetchQueries({
        queryKey: ['survey-result', surveyId],
      });
    } catch (error) {
      // useComments 내부에서 이미 에러 처리 (로그인 모달 등)
      console.error(error);
    }
  };

  // 답글 토글 핸들러
  const handleToggleReplies = async (commentId: number) => {
    const isCurrentlyExpanded = expandedReplies[commentId];
    const hasLoadedReplies =
      replies[commentId] && replies[commentId].length > 0;

    if (!isCurrentlyExpanded && !hasLoadedReplies) {
      try {
        const replyData = await getReplies(commentId, 0, 10);
        setReplies((prev) => ({
          ...prev,
          [commentId]: replyData.replyDtos,
        }));

        setReplyPageInfo((prev) => ({
          ...prev,
          [commentId]: replyData.pageInfo,
        }));
      } catch (error) {
        showToast.error('답글을 불러오는데 실패했습니다.');
        return;
      }
    }

    setExpandedReplies((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  // 답글 더보기 핸들러
  const handleLoadMoreReplies = async (commentId: number) => {
    try {
      const currentPageInfo = replyPageInfo[commentId];
      const nextPage = currentPageInfo ? currentPageInfo.page + 1 : 0;

      const replyData = await getReplies(commentId, nextPage, 10);

      setReplies((prev) => ({
        ...prev,
        [commentId]: [...(prev[commentId] || []), ...replyData.replyDtos],
      }));

      setReplyPageInfo((prev) => ({
        ...prev,
        [commentId]: replyData.pageInfo,
      }));
    } catch (error) {
      showToast.error('답글을 불러오는데 실패했습니다.');
    }
  };

  // 답글 좋아요 핸들러
  const handleReplyLike = async (replyId: number) => {
    if (!isAuthenticated) {
      const shouldLogin = confirm(
        '로그인 후에 좋아요를 남길 수 있습니다. 로그인하시겠습니까?'
      );
      if (shouldLogin) {
        openLoginModal();
      }
      return;
    }

    try {
      let currentReply: ReplyDto | undefined;
      let currentLikeId: number | undefined;

      Object.values(replies).forEach((replyList) => {
        const reply = replyList.find((r) => r && r.replyId === replyId);
        if (reply) {
          currentReply = reply;
          currentLikeId = reply.replyLikeId;
        }
      });

      if (currentReply?.isLiked && currentLikeId && currentLikeId > 0) {
        const result = await unlikeReply(replyId, currentLikeId);
        setReplies((prevReplies) => {
          const updatedReplies = { ...prevReplies };
          Object.keys(updatedReplies).forEach((commentId) => {
            updatedReplies[parseInt(commentId)] = updatedReplies[
              parseInt(commentId)
            ].map((reply) =>
              reply && reply.replyId === replyId
                ? {
                    ...reply,
                    isLiked: false,
                    likeCount: result.likeCount,
                    replyLikeId: currentLikeId,
                  }
                : reply
            );
          });
          return updatedReplies;
        });
      } else {
        const result = await likeReply(replyId, currentLikeId);
        setReplies((prevReplies) => {
          const updatedReplies = { ...prevReplies };
          Object.keys(updatedReplies).forEach((commentId) => {
            updatedReplies[parseInt(commentId)] = updatedReplies[
              parseInt(commentId)
            ].map((reply) =>
              reply && reply.replyId === replyId
                ? {
                    ...reply,
                    isLiked: true,
                    likeCount: result.likeCount,
                    replyLikeId: result.likeId || currentLikeId || 0,
                  }
                : reply
            );
          });
          return updatedReplies;
        });
      }
    } catch (error) {
      console.error(error);
      showToast.error('좋아요 처리에 실패했습니다.');
    }
  };

  return (
    <>
      {/* 댓글 토글 버튼 */}
      <button
        onClick={() => setIsCommentOpen((prev) => !prev)}
        className="flex items-center justify-between rounded-lg bg-gray-100 px-4 py-2 text-lg font-semibold text-gray-800"
      >
        댓글 {commentTotalCount}개
        <ChevronDown
          className={cn(
            'text-gray-500 transition',
            isCommentOpen && 'rotate-180'
          )}
        />
      </button>

      {/* 댓글 아이템 */}
      <AnimatePresence initial={false}>
        {isCommentOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: 0.2, ease: 'easeInOut' },
              opacity: { duration: 0.2, ease: 'easeInOut' },
            }}
          >
            {commentDtos.map((commentDto) => (
              <div key={commentDto.commentId} className="mb-6">
                <Comment
                  comment={commentDto}
                  className="bg-transparent!"
                  onLike={handleLikeComment}
                  onReply={(commentId) => {
                    setActiveReplyForm(
                      activeReplyForm?.commentId === commentId
                        ? null
                        : { commentId }
                    );
                  }}
                  onDelete={() =>
                    deleteComment(
                      commentDto.commentId,
                      surveyCandidateId,
                      surveyId
                    )
                  }
                />
                {/* 답글 폼 */}
                {activeReplyForm?.commentId === commentDto.commentId &&
                  !activeReplyForm.replyId && (
                    <div className="mb-4 ml-17">
                      <CommentInputForm
                        onSubmit={handleReplySubmitWrapper}
                        placeholder="답글 추가..."
                        onCancel={() => setActiveReplyForm(null)}
                      />
                    </div>
                  )}
                {/* 답글 목록 */}
                {expandedReplies[commentDto.commentId] &&
                  replies[commentDto.commentId] &&
                  replies[commentDto.commentId].length > 0 && (
                    <div className="pl-4">
                      {replies[commentDto.commentId].map((reply) => (
                        <div key={reply.replyId}>
                          <Reply
                            reply={reply}
                            onLike={handleReplyLike}
                            onReply={(replyId) => {
                              // 답글에 답글 달기 - 원래 댓글 ID와 답글 작성자 ID 전달
                              const currentReply = replies[
                                commentDto.commentId
                              ]?.find((r) => r.replyId === replyId);
                              setActiveReplyForm(
                                activeReplyForm?.replyId === replyId
                                  ? null
                                  : {
                                      commentId: commentDto.commentId,
                                      replyId: replyId,
                                      listenerId: currentReply?.authorId,
                                    }
                              );
                            }}
                            onDelete={handleReplyDelete}
                          />
                          {/* 답글에 답글 폼 */}
                          {activeReplyForm?.replyId === reply.replyId && (
                            <div className="mb-6 ml-33">
                              <CommentInputForm
                                onSubmit={handleReplySubmitWrapper}
                                placeholder="답글 추가..."
                                onCancel={() => setActiveReplyForm(null)}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                      {/* 답글 더보기 */}
                      {replyPageInfo[commentDto.commentId]?.hasNext && (
                        <OpenOrFoldReplies
                          isOpen={true}
                          replyCount={0}
                          hasMoreReplies={true}
                          onToggle={() => {}}
                          onLoadMore={() =>
                            handleLoadMoreReplies(commentDto.commentId)
                          }
                        />
                      )}
                    </div>
                  )}
                {/* 답글 펼치기/접기 */}
                {commentDto.replyCount > 0 && (
                  <OpenOrFoldReplies
                    isOpen={expandedReplies[commentDto.commentId] || false}
                    replyCount={commentDto.replyCount}
                    hasMoreReplies={
                      replyPageInfo[commentDto.commentId]?.hasNext || false
                    }
                    onToggle={() => handleToggleReplies(commentDto.commentId)}
                    onLoadMore={() =>
                      handleLoadMoreReplies(commentDto.commentId)
                    }
                  />
                )}
              </div>
            ))}
            <CommentInputForm
              onSubmit={handleCommentSubmit}
              placeholder="댓글 추가..."
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
