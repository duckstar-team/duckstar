import React from 'react';
import { ReplyDto } from '@/types/api';
import VoteCount from './VoteCount';

// 시간 포맷팅 유틸리티 함수
const formatTimeAgo = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return '방금 전';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}일 전`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}개월 전`;
  return `${Math.floor(diffInSeconds / 31536000)}년 전`;
};

// 이미지 assets
const imgProfileDefault = "/icons/profile-default.svg";
const imgCommentDelete = "/icons/comment-delete.svg";
const imgCommentUnliked = "/icons/comment-unliked.svg";
const imgCommentLiked = "/icons/comment-liked.svg";

interface ReplyProps {
  reply: ReplyDto;
  onLike?: (replyId: number) => void;
  onReply?: (replyId: number) => void;
  onDelete?: (replyId: number) => void;
}

const Reply: React.FC<ReplyProps> = ({
  reply,
  onLike,
  onReply,
  onDelete
}) => {
  const {
    replyId,
    nickname: author,
    body: content,
    createdAt: timestamp,
    voteCount,
    likeCount,
    isLiked,
    canDeleteThis,
    profileImageUrl
  } = reply;

  return (
    <div className="w-full flex flex-col justify-center items-end gap-2.5 pr-[10px]">
      <div className="w-[calc(100%-76px)] px-5 py-3 bg-[#f8f9fa] rounded-2xl flex justify-start items-start gap-3.5">
        {/* 프로필 이미지 */}
        <div className="relative shrink-0 size-10">
          <img 
            alt={`${author}의 프로필`} 
            className="block max-w-none size-full rounded-full" 
            height="40" 
            src={profileImageUrl || imgProfileDefault} 
            width="40" 
          />
        </div>
        
        {/* 댓글 내용 */}
        <div className="basis-0 box-border content-stretch flex flex-col gap-[5px] grow items-start justify-start min-h-px min-w-px pb-0 pt-[3px] px-0 relative shrink-0">
          {/* 헤더 (작성자, 투표, 시간, 삭제 버튼) */}
          <div className="content-stretch flex gap-[15px] items-center justify-start relative shrink-0 w-full">
            <div className="content-stretch flex gap-[5px] items-center justify-start relative shrink-0">
              {/* 작성자명 */}
              <div className="justify-start text-black text-base font-semibold font-['Pretendard'] leading-snug">
                {author}
              </div>
              
              {/* 투표 수 */}
              {voteCount > 0 && (
                <div className="h-[22px] relative shrink-0">
                  <VoteCount voteCount={voteCount} />
                </div>
              )}
            </div>
            
            {/* 시간 */}
            <div className="justify-start text-gray-400 text-xs font-normal font-['Pretendard'] leading-snug shrink-0">
              {formatTimeAgo(timestamp)}
            </div>
            
            {/* 삭제 버튼 */}
            {canDeleteThis && (
              <div className="flex-1 flex justify-end items-center h-[22px]">
                <button 
                  onClick={() => onDelete?.(replyId)}
                  className="overflow-clip relative shrink-0 size-[17px] hover:opacity-70 transition-opacity cursor-pointer"
                  aria-label="답글 삭제"
                >
                  <div className="absolute inset-[3.57%]">
                    <div className="absolute inset-[-4.07%]">
                      <img alt="삭제 아이콘" className="block max-w-none size-full" src={imgCommentDelete} />
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>
          
          {/* 댓글 내용 */}
          <div className="self-stretch justify-start text-black text-base font-medium font-['Pretendard'] leading-normal">
            {content}
          </div>
          
          {/* 푸터 (좋아요, 답글) */}
          <div className="content-stretch flex gap-[25px] h-[30px] items-center justify-start relative shrink-0 w-full">
            {/* 좋아요 */}
            <div className="content-stretch flex gap-2 items-center justify-start relative shrink-0">
              <button 
                onClick={() => onLike?.(replyId)}
                className={`overflow-clip relative shrink-0 size-5 hover:opacity-70 transition-opacity cursor-pointer ${isLiked ? 'opacity-100' : 'opacity-60'}`}
                aria-label={isLiked ? '좋아요 취소' : '좋아요'}
              >
                <div className="absolute inset-[9.07%_3.55%_8.86%_3.57%]">
                  <div className="absolute inset-[-4.35%_-3.85%_-4.35%_-3.84%]">
                    <img alt="좋아요 아이콘" className="block max-w-none size-full" src={isLiked ? imgCommentLiked : imgCommentUnliked} />
                  </div>
                </div>
              </button>
              <div className="justify-start text-[#868e96] text-base font-semibold font-['Pretendard'] leading-snug">
                {likeCount}
              </div>
            </div>
            
            {/* 답글 달기 */}
            <button 
              onClick={() => onReply?.(replyId)}
              className="justify-start text-base font-medium font-['Pretendard'] leading-snug hover:text-[#868e96] transition-colors cursor-pointer"
              style={{ color: '#ADB5BD' }}
            >
              답글 달기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reply;
