import React from 'react';
import { CommentDto } from '@/api/comments';
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
const imgIconEpisode = "/icons/episode-polygon.svg";
const imgCommentDelete = "/icons/comment-delete.svg";
const imgCommentUnliked = "/icons/comment-unliked.svg";
const imgCommentLiked = "/icons/comment-liked.svg";

interface CommentProps {
  comment: CommentDto;
  onLike?: (commentId: number) => void;
  onReply?: (commentId: number) => void;
  onDelete?: (commentId: number) => void;
}

const Comment: React.FC<CommentProps> = ({
  comment,
  onLike,
  onReply,
  onDelete
}) => {
  const {
    commentId,
    status,
    nickname: author,
    body: content,
    createdAt: timestamp,
    voteCount,
    likeCount,
    isLiked,
    canDeleteThis,
    profileImageUrl,
    episodeNumber
  } = comment;

  // 삭제된 댓글인지 확인
  const isDeleted = status !== 'NORMAL';
  
  // 삭제된 댓글의 경우 적절한 메시지와 닉네임 설정
  const getDeletedCommentInfo = () => {
    switch (status) {
      case 'DELETED':
        return {
          message: '삭제된 내용입니다.',
          nickname: '삭제된 댓글'
        };
      case 'ADMIN_DELETED':
        return {
          message: '관리자에 의해 삭제된 내용입니다.',
          nickname: '관리자 삭제'
        };
      default:
        return {
          message: '삭제된 내용입니다.',
          nickname: '삭제된 댓글'
        };
    }
  };

  const deletedInfo = isDeleted ? getDeletedCommentInfo() : null;
  
  // 삭제된 댓글의 경우 다른 UI 렌더링
  if (isDeleted && deletedInfo) {
    return (
      <div className="bg-white box-border content-stretch flex gap-5 items-start justify-start pb-2 relative w-full h-full">
        <div className="content-stretch flex gap-[15px] items-start justify-start relative shrink-0 w-full h-full pl-[31px] pr-[20px]">
          {/* 프로필 이미지 */}
          <div className="relative shrink-0 size-10">
            <img 
              alt={`${deletedInfo.nickname}의 프로필`} 
              className="block max-w-none size-full rounded-full opacity-50" 
              height="40" 
              src={imgProfileDefault} 
              width="40" 
            />
          </div>
          
          {/* 삭제된 댓글 내용 */}
          <div className="basis-0 box-border content-stretch flex flex-col gap-2.5 grow items-start justify-start min-h-px min-w-px pb-0 pt-[3px] px-0 relative shrink-0">
            {/* 헤더 (작성자, 에피소드, 시간) */}
            <div className="content-stretch flex gap-[15px] items-center justify-start relative shrink-0 w-full">
              <div className="content-stretch flex gap-[5px] items-center justify-start relative shrink-0">
                {/* 작성자명 */}
                <div className="justify-start text-gray-400 text-base font-semibold font-['Pretendard'] leading-snug">
                  {deletedInfo.nickname}
                </div>
                
                {/* 투표 수 */}
                {voteCount > 0 && (
                  <div className="h-[22px] relative shrink-0">
                    <VoteCount voteCount={voteCount} />
                  </div>
                )}
                
                {/* 에피소드 번호 */}
                {episodeNumber != null && (
                  <div className="h-[22px] relative shrink-0 w-[57px]">
                    <div className="absolute h-3 left-0 top-[5px] w-6">
                      <img alt="에피소드 아이콘" className="block max-w-none size-full" src={imgIconEpisode} />
                    </div>
                    <div className="absolute justify-start text-[#ffb310] text-[16px] font-semibold font-['Pretendard'] leading-snug left-[25px] top-0">
                      <p className="leading-[22px] whitespace-pre">{episodeNumber}화</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* 시간 */}
              <div className="flex items-center justify-start text-gray-400 text-xs font-normal font-['Pretendard'] leading-snug">
                {formatTimeAgo(timestamp)}
              </div>
            </div>
            
            {/* 삭제된 댓글 메시지 */}
            <div className="self-stretch justify-start text-gray-400 text-base font-medium font-['Pretendard'] leading-normal italic">
              {deletedInfo.message}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white box-border content-stretch flex gap-5 items-start justify-start pb-2 relative w-full h-full">
      <div className="content-stretch flex gap-[15px] items-start justify-start relative shrink-0 w-full h-full pl-[31px] pr-[20px]">
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
        <div className="basis-0 box-border content-stretch flex flex-col gap-2.5 grow items-start justify-start min-h-px min-w-px pb-0 pt-[3px] px-0 relative shrink-0">
          {/* 헤더 (작성자, 에피소드, 시간, 삭제 버튼) */}
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
              
              {/* 에피소드 번호 */}
              {episodeNumber != null && (
                <div className="h-[22px] relative shrink-0 w-[57px]">
                  <div className="absolute h-3 left-0 top-[5px] w-6">
                    <img alt="에피소드 아이콘" className="block max-w-none size-full" src={imgIconEpisode} />
                  </div>
                  <div className="absolute justify-start text-[#ffb310] text-[16px] font-semibold font-['Pretendard'] leading-snug left-[25px] top-0">
                    <p className="leading-[22px] whitespace-pre">{episodeNumber}화</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* 시간 */}
            <div className="flex items-center justify-start text-gray-400 text-xs font-normal font-['Pretendard'] leading-snug">
              {formatTimeAgo(timestamp)}
            </div>
            
            {/* 삭제 버튼 */}
            {canDeleteThis && (
              <div className="basis-0 box-border content-stretch flex gap-2.5 grow h-[22px] items-center justify-end min-h-px min-w-px pl-[267px] pr-0 py-0 relative shrink-0">
                <button 
                  onClick={() => onDelete?.(commentId)}
                  className="overflow-clip relative shrink-0 size-[17px] hover:opacity-70 transition-opacity cursor-pointer"
                  aria-label="댓글 삭제"
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
          <div className="self-stretch justify-start text-black text-base font-medium font-['Pretendard'] leading-normal whitespace-pre-wrap">
            {content}
          </div>
          
          {/* 푸터 (좋아요, 답글) */}
          <div className="content-stretch flex gap-[25px] h-[30px] items-center justify-start relative shrink-0 w-full">
            {/* 좋아요 */}
            <div className="content-stretch flex gap-2 items-center justify-start relative shrink-0">
              <button 
                onClick={() => onLike?.(commentId)}
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
              onClick={() => onReply?.(commentId)}
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

export default Comment;
