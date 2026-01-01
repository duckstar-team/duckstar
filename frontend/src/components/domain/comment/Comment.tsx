import React from 'react';
import { CommentDto } from '@/types';
import VoteCount from '@/components/domain/vote/VoteCount';
import { cn } from '@/lib/utils';

// 시간 포맷팅 유틸리티 함수
const formatTimeAgo = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return '방금 전';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)}시간 전`;
  if (diffInSeconds < 2592000)
    return `${Math.floor(diffInSeconds / 86400)}일 전`;
  if (diffInSeconds < 31536000)
    return `${Math.floor(diffInSeconds / 2592000)}개월 전`;
  return `${Math.floor(diffInSeconds / 31536000)}년 전`;
};

// 이미지 assets
const imgProfileDefault = '/icons/profile-default.svg';
const imgIconEpisode = '/icons/episode-polygon.svg';
const imgCommentDelete = '/icons/comment-delete.svg';
const imgCommentUnliked = '/icons/comment-unliked.svg';
const imgCommentLiked = '/icons/comment-liked.svg';

interface CommentProps {
  comment: CommentDto;
  onLike?: (commentId: number) => void;
  onReply?: (commentId: number) => void;
  onDelete?: (commentId: number, surveyCandidateId: number | null) => void;
  className?: string;
}

const Comment: React.FC<CommentProps> = ({
  comment,
  onLike,
  onReply,
  onDelete,
  className,
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
    episodeNumber,
    attachedImageUrl,
    surveyCandidateId,
  } = comment;

  // 삭제된 댓글인지 확인
  const isDeleted = status !== 'NORMAL';

  // 삭제된 댓글의 경우 적절한 메시지와 닉네임 설정
  const getDeletedCommentInfo = () => {
    switch (status) {
      case 'DELETED':
        return {
          message: '삭제된 내용입니다.',
          nickname: '삭제된 댓글',
        };
      case 'ADMIN_DELETED':
        return {
          message: '관리자에 의해 삭제된 내용입니다.',
          nickname: '관리자 삭제',
        };
      default:
        return {
          message: '삭제된 내용입니다.',
          nickname: '삭제된 댓글',
        };
    }
  };

  const deletedInfo = isDeleted ? getDeletedCommentInfo() : null;

  // 삭제된 댓글의 경우 다른 UI 렌더링
  if (isDeleted && deletedInfo) {
    return (
      <div className="relative box-border flex h-full w-full content-stretch items-start justify-start gap-5 bg-white pb-2">
        <div className="relative flex h-full w-full shrink-0 content-stretch items-start justify-start gap-[15px] pr-[20px] pl-[31px]">
          {/* 프로필 이미지 */}
          <div className="relative size-10 shrink-0">
            <img
              alt={`${deletedInfo.nickname}의 프로필`}
              className="block size-full max-w-none rounded-full opacity-50"
              height="40"
              src={imgProfileDefault}
              width="40"
            />
          </div>

          {/* 삭제된 댓글 내용 */}
          <div className="relative box-border flex min-h-px min-w-px shrink-0 grow basis-0 flex-col content-stretch items-start justify-start gap-2.5 px-0 pt-[3px] pb-0">
            {/* 헤더 (작성자, 에피소드, 시간) */}
            <div className="relative flex w-full items-center justify-start gap-[15px]">
              <div className="relative flex flex-shrink-0 items-center justify-start gap-[5px]">
                {/* 작성자명 */}
                <div className="justify-start text-base leading-snug font-semibold whitespace-nowrap text-gray-400">
                  {deletedInfo.nickname}
                </div>

                {/* 투표 수 */}
                {voteCount > 0 && (
                  <div className="relative h-[22px] shrink-0">
                    <VoteCount voteCount={voteCount} />
                  </div>
                )}

                {/* 에피소드 번호 */}
                {episodeNumber != null && (
                  <div className="relative h-[22px] w-[57px] shrink-0">
                    <div className="absolute top-[5px] left-0 h-3 w-6">
                      <img
                        alt="에피소드 아이콘"
                        className="block size-full max-w-none"
                        src={imgIconEpisode}
                      />
                    </div>
                    <div className="absolute top-0 left-[25px] justify-start text-[16px] leading-snug font-semibold text-[#ffb310]">
                      <p className="leading-[22px] whitespace-pre">
                        {episodeNumber}화
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* 시간 */}
              <div className="flex flex-shrink-0 items-center justify-start text-xs leading-snug font-normal whitespace-nowrap text-gray-400">
                {formatTimeAgo(timestamp)}
              </div>
            </div>

            {/* 삭제된 댓글 메시지 */}
            <div className="justify-start self-stretch text-base leading-normal font-medium text-gray-400 italic">
              {deletedInfo.message}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative box-border flex h-fit w-full content-stretch items-start justify-start gap-5 bg-white pb-2',
        className
      )}
    >
      <div className="relative flex h-full w-full shrink-0 content-stretch items-start justify-start gap-[15px] pr-[20px] pl-[31px]">
        {/* 프로필 이미지 */}
        <div className="relative size-10 shrink-0">
          <img
            alt={`${author}의 프로필`}
            className="block size-full max-w-none rounded-full"
            height="40"
            src={profileImageUrl || imgProfileDefault}
            width="40"
            loading="lazy"
            decoding="async"
          />
        </div>

        {/* 댓글 내용 */}
        <div className="relative box-border flex min-h-px min-w-px shrink-0 grow basis-0 flex-col content-stretch items-start justify-start gap-2.5 px-0 pt-[3px] pb-0">
          {/* 헤더 (작성자, 에피소드, 시간, 삭제 버튼) */}
          <div className="relative flex w-full items-center justify-start gap-[15px]">
            <div className="relative flex flex-shrink-0 items-center justify-start gap-[5px]">
              {/* 작성자명 */}
              <div className="justify-start text-base leading-snug font-semibold whitespace-nowrap text-black">
                {author}
              </div>

              {/* 투표 수 */}
              {voteCount > 0 && (
                <div className="relative h-[22px] shrink-0">
                  <VoteCount voteCount={voteCount} />
                </div>
              )}

              {/* 에피소드 번호 */}
              {episodeNumber != null && (
                <div className="relative h-[22px] w-[57px] shrink-0">
                  <div className="absolute top-[5px] left-0 h-3 w-6">
                    <img
                      alt="에피소드 아이콘"
                      className="block size-full max-w-none"
                      src={imgIconEpisode}
                    />
                  </div>
                  <div className="absolute top-0 left-[25px] justify-start text-[16px] leading-snug font-semibold text-[#ffb310]">
                    <p className="leading-[22px] whitespace-pre">
                      {episodeNumber}화
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 시간 */}
            <div className="flex flex-shrink-0 items-center justify-start text-xs leading-snug font-normal whitespace-nowrap text-gray-400">
              {formatTimeAgo(timestamp)}
            </div>

            {/* 삭제 버튼 */}
            {canDeleteThis && (
              <div className="ml-auto flex h-[22px] items-center justify-end">
                <button
                  onClick={() => onDelete?.(commentId, surveyCandidateId)}
                  className="relative size-[17px] shrink-0 cursor-pointer overflow-clip transition-opacity hover:opacity-70"
                  aria-label="댓글 삭제"
                >
                  <div className="absolute inset-[3.57%]">
                    <div className="absolute inset-[-4.07%]">
                      <img
                        alt="삭제 아이콘"
                        className="block size-full max-w-none"
                        src={imgCommentDelete}
                      />
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* 댓글 내용 */}
          <div className="flex flex-col gap-2 self-stretch">
            {content && (
              <div className="justify-start text-base leading-normal font-medium whitespace-pre-wrap text-black">
                {content}
              </div>
            )}

            {/* 첨부 이미지 */}
            {attachedImageUrl && (
              <div className="flex justify-start">
                <img
                  src={attachedImageUrl}
                  alt="댓글 첨부 이미지"
                  className="max-h-[300px] max-w-[300px] cursor-pointer rounded-lg object-cover transition-opacity hover:opacity-90"
                  loading="lazy"
                  decoding="async"
                  onClick={() => window.open(attachedImageUrl, '_blank')}
                />
              </div>
            )}
          </div>

          {/* 푸터 (좋아요, 답글) */}
          <div className="relative flex h-[30px] w-full shrink-0 content-stretch items-center justify-start gap-[25px]">
            {/* 좋아요 */}
            <div className="relative flex shrink-0 content-stretch items-center justify-start gap-2">
              <button
                onClick={() => onLike?.(commentId)}
                className={`relative size-5 shrink-0 cursor-pointer overflow-clip transition-opacity hover:opacity-70 ${isLiked ? 'opacity-100' : 'opacity-60'}`}
                aria-label={isLiked ? '좋아요 취소' : '좋아요'}
              >
                <div className="absolute inset-[9.07%_3.55%_8.86%_3.57%]">
                  <div className="absolute inset-[-4.35%_-3.85%_-4.35%_-3.84%]">
                    <img
                      alt="좋아요 아이콘"
                      className="block size-full max-w-none"
                      src={isLiked ? imgCommentLiked : imgCommentUnliked}
                    />
                  </div>
                </div>
              </button>
              <div className="justify-start text-base leading-snug font-semibold text-[#868e96]">
                {likeCount}
              </div>
            </div>

            {/* 답글 달기 */}
            <button
              onClick={() => onReply?.(commentId)}
              className="justify-start text-sm leading-snug font-medium text-gray-400 transition-colors hover:text-[#868e96]"
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
