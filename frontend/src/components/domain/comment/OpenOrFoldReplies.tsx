import React from 'react';

// 이미지 assets - 답글 펼치기/접기 아이콘
const moreImg = '/icons/icon-more.svg';

interface OpenOrFoldRepliesProps {
  isOpen: boolean;
  replyCount: number;
  hasMoreReplies?: boolean; // 더 많은 답글이 있는지 여부
  onToggle: () => void;
  onLoadMore?: () => void; // 더보기 버튼 클릭 시 호출
}

export default function OpenOrFoldReplies({
  isOpen,
  replyCount,
  hasMoreReplies = false,
  onToggle,
  onLoadMore,
}: OpenOrFoldRepliesProps) {
  const element = (
    <div className="relative flex h-4 w-[50px] shrink-0 items-center justify-center">
      <div className="h-px w-[50px] bg-gray-400"></div>
    </div>
  );

  if (isOpen) {
    return (
      <div className="relative flex size-full content-stretch items-center justify-start gap-[25px] py-0 pr-0 pl-[84px]">
        {hasMoreReplies && onLoadMore ? (
          // 더보기 버튼 (더 많은 답글이 있을 때)
          <button
            onClick={onLoadMore}
            className="inline-flex h-9 w-[546px] cursor-pointer items-center justify-start gap-6 transition-opacity hover:opacity-70"
          >
            <div className="size- flex items-center justify-start gap-3.5">
              <div className="flex w-12 items-center justify-center gap-2.5">
                <div className="relative size-5 overflow-hidden">
                  <img src={moreImg} alt="더보기" />
                </div>
              </div>
              <div className="justify-start pt-3 text-base leading-snug font-semibold text-[#ADB5BD]">
                답글 더 보기
              </div>
            </div>
          </button>
        ) : (
          // 숨기기 버튼 (더 이상 답글이 없을 때)
          <button
            onClick={onToggle}
            className="relative flex shrink-0 content-stretch items-center justify-start gap-[15px] transition-opacity hover:opacity-70"
          >
            {element}
            <div className="justify-start text-sm font-medium text-gray-500">
              답글 숨기기
            </div>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative flex size-full content-stretch items-center justify-start gap-[25px] py-0 pr-0 pl-[84px]">
      <button
        onClick={onToggle}
        className="relative flex shrink-0 content-stretch items-center justify-start gap-[15px] transition-opacity hover:opacity-70"
      >
        {element}
        <div className="justify-start text-sm font-medium text-gray-500">
          답글 {replyCount}개 더 보기
        </div>
      </button>
    </div>
  );
}
