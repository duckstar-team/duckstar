import React from 'react';
import { ReplyDto } from '@/api/comments';
import VoteCount from './VoteCount';
import { useLazyImage } from '../hooks/useLazyImage';

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
const imgCommentDelete = '/icons/comment-delete.svg';
const imgCommentUnliked = '/icons/comment-unliked.svg';
const imgCommentLiked = '/icons/comment-liked.svg';

interface ReplyProps {
  reply: ReplyDto;
  onLike?: (replyId: number) => void;
  onReply?: (replyId: number) => void;
  onDelete?: (replyId: number) => void;
}

const Reply: React.FC<ReplyProps> = ({ reply, onLike, onReply, onDelete }) => {
  const {
    replyId,
    nickname: author,
    body: content,
    createdAt: timestamp,
    voteCount,
    likeCount,
    isLiked,
    canDeleteThis,
    profileImageUrl,
    listenerNickname,
    attachedImageUrl,
  } = reply;

  // 답글 첨부 이미지 지연 로딩 (낮은 우선순위)
  const {
    imgRef: attachedImgRef,
    isInView: isAttachedImageInView,
    handleLoad: handleAttachedImageLoad,
    handleError: handleAttachedImageError,
  } = useLazyImage({
    threshold: 0.1,
    rootMargin: '100px', // 답글 이미지는 더 늦게 로딩
    priority: false,
  });

  return (
    <div className="flex w-full flex-col items-end justify-center gap-2.5 pr-[10px]">
      <div className="flex w-[calc(100%-76px)] items-start justify-start gap-3.5 rounded-2xl bg-[#f8f9fa] px-5 py-3">
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
        <div className="relative box-border flex min-h-px min-w-px shrink-0 grow basis-0 flex-col content-stretch items-start justify-start gap-[5px] px-0 pt-[3px] pb-0">
          {/* 헤더 (작성자, 투표, 시간, 삭제 버튼) */}
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
            </div>

            {/* 시간 */}
            <div className="flex-shrink-0 justify-start text-xs leading-snug font-normal whitespace-nowrap text-gray-400">
              {formatTimeAgo(timestamp)}
            </div>

            {/* 삭제 버튼 */}
            {canDeleteThis && (
              <div className="ml-auto flex h-[22px] items-center justify-end">
                <button
                  onClick={() => onDelete?.(replyId)}
                  className="relative size-[17px] shrink-0 cursor-pointer overflow-clip transition-opacity hover:opacity-70"
                  aria-label="답글 삭제"
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
            {/* @이름과 텍스트 내용을 한 줄로 표시 */}
            {(content || attachedImageUrl) && listenerNickname && content ? (
              <div className="justify-start text-base leading-normal font-medium whitespace-pre-wrap text-black">
                <span className="mr-2 inline-flex items-center rounded-md bg-blue-100 px-2 py-1 text-sm font-medium text-blue-600">
                  @{listenerNickname}
                </span>
                {content}
              </div>
            ) : (
              <>
                {/* @이름만 표시 (텍스트가 없는 경우) */}
                {listenerNickname && (
                  <div className="flex justify-start">
                    <span className="inline-flex items-center rounded-md bg-blue-100 px-2 py-1 text-sm font-medium text-blue-600">
                      @{listenerNickname}
                    </span>
                  </div>
                )}

                {/* 텍스트 내용 */}
                {content && (
                  <div className="justify-start text-base leading-normal font-medium whitespace-pre-wrap text-black">
                    {content}
                  </div>
                )}
              </>
            )}

            {/* 첨부 이미지 */}
            {attachedImageUrl && (
              <div className="flex justify-start">
                {isAttachedImageInView ? (
                  <img
                    ref={attachedImgRef}
                    src={attachedImageUrl}
                    alt="답글 첨부 이미지"
                    className="max-h-[250px] max-w-[250px] cursor-pointer rounded-lg object-cover transition-opacity hover:opacity-90"
                    loading="lazy"
                    decoding="async"
                    onLoad={handleAttachedImageLoad}
                    onError={handleAttachedImageError}
                    onClick={() => window.open(attachedImageUrl, '_blank')}
                  />
                ) : (
                  <div className="flex max-h-[250px] max-w-[250px] items-center justify-center rounded-lg bg-gray-200">
                    <span className="text-sm text-gray-400">
                      이미지 로딩 중...
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 푸터 (좋아요, 답글) */}
          <div className="relative flex h-[30px] w-full shrink-0 content-stretch items-center justify-start gap-[25px]">
            {/* 좋아요 */}
            <div className="relative flex shrink-0 content-stretch items-center justify-start gap-2">
              <button
                onClick={() => onLike?.(replyId)}
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
              onClick={() => onReply?.(replyId)}
              className="cursor-pointer justify-start text-base leading-snug font-medium transition-colors hover:text-[#868e96]"
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
