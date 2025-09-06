import React, { useState } from 'react';
import { CommentDto, ReplyDto } from '@/types/api';
import SortingMenu, { SortOption } from './SortingMenu';
import Comment from './Comment';
import Reply from './Reply';
import OpenOrFoldReplies from './OpenOrFoldReplies';
import CommentPostForm from './anime/CommentPostForm';

interface CommentsBoardProps {
  comments: CommentDto[];
  replies: { [commentId: number]: ReplyDto[] };
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
  onCommentLike?: (commentId: number) => void;
  onCommentReply?: (commentId: number) => void;
  onCommentDelete?: (commentId: number) => void;
  onReplyLike?: (replyId: number) => void;
  onReplyReply?: (replyId: number) => void;
  onReplyDelete?: (replyId: number) => void;
}

const CommentsBoard: React.FC<CommentsBoardProps> = ({
  comments,
  replies,
  currentSort,
  onSortChange,
  onCommentLike,
  onCommentReply,
  onCommentDelete,
  onReplyLike,
  onReplyReply,
  onReplyDelete
}) => {
  const [expandedReplies, setExpandedReplies] = useState<{ [commentId: number]: boolean }>({});
  const [activeReplyForm, setActiveReplyForm] = useState<{ 
    type: 'comment' | 'reply', 
    targetId: number 
  } | null>(null);

  const handleToggleReplies = (commentId: number) => {
    setExpandedReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  const getReplyCount = (commentId: number): number => {
    return replies[commentId]?.length || 0;
  };

  const isRepliesExpanded = (commentId: number): boolean => {
    return expandedReplies[commentId] || false;
  };

  const handleReplyClick = (type: 'comment' | 'reply', targetId: number) => {
    // 이미 같은 대상에 대한 답글 폼이 활성화되어 있으면 닫기
    if (activeReplyForm?.type === type && activeReplyForm.targetId === targetId) {
      setActiveReplyForm(null);
    } else {
      setActiveReplyForm({ type, targetId });
    }
  };

  const handleReplySubmit = (content: string) => {
    if (activeReplyForm) {
      if (activeReplyForm.type === 'comment') {
        onCommentReply?.(activeReplyForm.targetId);
      } else {
        onReplyReply?.(activeReplyForm.targetId);
      }
      setActiveReplyForm(null);
    }
  };

  const handleReplyCancel = () => {
    setActiveReplyForm(null);
  };

  // 답글 작성 폼 컴포넌트
  const ReplyForm = () => (
    <div className="w-full h-auto flex flex-col justify-center items-end gap-2.5">
      <div className="w-full h-auto px-[11px] pt-[10px] pb-[14px] bg-[#F8F9FA] flex flex-col justify-center items-end gap-[10px] overflow-hidden">
        <CommentPostForm 
          variant="forReply"
          onSubmit={handleReplySubmit}
          onImageUpload={(file) => {
            console.log('답글 이미지 업로드:', file);
            // TODO: 이미지 업로드 처리
          }}
          placeholder="답글을 입력하세요..."
        />
      </div>
    </div>
  );

  // 통합 리스트 생성 (댓글 + 답글)
  const createUnifiedList = () => {
    const unifiedList: Array<{ type: 'comment' | 'reply' | 'toggle'; data: CommentDto | ReplyDto; parentCommentId?: number; replyCount?: number }> = [];
    
    comments.forEach(comment => {
      // 메인 댓글 추가
      unifiedList.push({ type: 'comment', data: comment });
      
      // 답글들 추가 (펼쳐진 경우만)
      const commentReplies = replies[comment.commentId] || [];
      const isExpanded = isRepliesExpanded(comment.commentId);
      const replyCount = getReplyCount(comment.commentId);
      
      if (isExpanded && commentReplies.length > 0) {
        commentReplies.forEach(reply => {
          unifiedList.push({ 
            type: 'reply', 
            data: reply, 
            parentCommentId: comment.commentId 
          });
        });
      }
      
      // 답글 펼치기/접기 버튼 추가 (답글이 있는 경우)
      if (replyCount > 0) {
        unifiedList.push({ 
          type: 'toggle', 
          data: comment, 
          parentCommentId: comment.commentId,
          replyCount: replyCount
        });
      }
    });
    
    return unifiedList;
  };

  const unifiedList = createUnifiedList();

  return (
    <div className="w-full h-full bg-white flex flex-col">
      {/* Sticky 정렬 메뉴 */}
      <div className="sticky top-0 z-10 bg-white pl-3.5 py-2 border-b border-gray-100">
        <SortingMenu 
          currentSort={currentSort}
          onSortChange={onSortChange}
        />
      </div>
      
      {/* 댓글 목록 */}
      <div className="flex-1 overflow-y-auto">
        <div className="w-full flex flex-col justify-start items-start">
          {unifiedList.map((item, index) => {
            if (item.type === 'comment') {
              const comment = item.data as CommentDto;
              return (
                <React.Fragment key={`comment-${comment.commentId}`}>
                  <div className="w-full">
                    <Comment
                      comment={comment}
                      episodeNumber="10화" // 실제로는 comment에서 가져와야 함
                      onLike={onCommentLike}
                      onReply={() => handleReplyClick('comment', comment.commentId)}
                      onDelete={onCommentDelete}
                    />
                  </div>
                  {activeReplyForm?.type === 'comment' && activeReplyForm.targetId === comment.commentId && (
                    <ReplyForm />
                  )}
                </React.Fragment>
              );
            } else if (item.type === 'reply') {
              const reply = item.data as ReplyDto;
              return (
                <React.Fragment key={`reply-${reply.replyId}`}>
                  <div className="w-full">
                    <Reply
                      reply={reply}
                      onLike={onReplyLike}
                      onReply={() => handleReplyClick('reply', reply.replyId)}
                      onDelete={onReplyDelete}
                    />
                  </div>
                  {activeReplyForm?.type === 'reply' && activeReplyForm.targetId === reply.replyId && (
                    <ReplyForm />
                  )}
                </React.Fragment>
              );
            } else if (item.type === 'toggle') {
              const comment = item.data as CommentDto;
              const isExpanded = isRepliesExpanded(comment.commentId);
              return (
                <div key={`toggle-${comment.commentId}`} className="h-auto">
                  <OpenOrFoldReplies
                    isOpen={isExpanded}
                    replyCount={item.replyCount || 0}
                    onToggle={() => handleToggleReplies(comment.commentId)}
                  />
                </div>
              );
            }
            return null;
          })}
        </div>
      </div>
    </div>
  );
};

export default CommentsBoard;
