import React from 'react';

// 이미지 assets - 답글 펼치기/접기 아이콘
const textBalloonImg = "/icons/textBalloon.svg";
const moreImg = "/icons/icon-more.svg";

interface OpenOrFoldRepliesProps {
  isOpen: boolean;
  replyCount: number;
  hasMoreReplies?: boolean; // 더 많은 답글이 있는지 여부
  onToggle: () => void;
  onLoadMore?: () => void; // 더보기 버튼 클릭 시 호출
}

const OpenOrFoldReplies: React.FC<OpenOrFoldRepliesProps> = ({
  isOpen,
  replyCount,
  hasMoreReplies = false,
  onToggle,
  onLoadMore
}) => {
  const element = (
    <div className="flex h-4 items-center justify-center relative shrink-0 w-[50px]">
      <div className="w-[50px] h-px bg-[#adb5bd]"></div>
    </div>
  );

  if (isOpen) {
    return (
      <div className="box-border content-stretch flex gap-[25px] items-center justify-start pl-[84px] pr-0 py-0 relative size-full">
        {hasMoreReplies && onLoadMore ? (
          // 더보기 버튼 (더 많은 답글이 있을 때)
          <button 
            onClick={onLoadMore}
            className="w-[546px] h-9 inline-flex justify-start items-center gap-6 hover:opacity-70 transition-opacity cursor-pointer"
          >
            <div className="size- flex justify-start items-center gap-3.5">
              <div className="w-12 flex justify-center items-center gap-2.5">
                <div className="size-5 relative overflow-hidden">
                  <img src={moreImg} alt="더보기"/>
                </div>
              </div>
              <div className="justify-start pt-3 text-[#ADB5BD] text-base font-semibold font-['Pretendard'] leading-snug">
                답글 더 보기
              </div>
            </div>
          </button>
        ) : (
          // 숨기기 버튼 (더 이상 답글이 없을 때)
          <button 
            onClick={onToggle}
            className="content-stretch flex gap-[15px] items-center justify-start relative shrink-0 hover:opacity-70 transition-opacity cursor-pointer"
          >
            {element}
            <div className="justify-start text-[#adb5bd] text-[16px] font-semibold font-['Pretendard'] leading-snug">
              <p className="leading-[22px] whitespace-pre">답글 숨기기</p>
            </div>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="box-border content-stretch flex gap-[25px] items-center justify-start pl-[84px] pr-0 py-0 relative size-full">
      <button 
        onClick={onToggle}
        className="content-stretch flex gap-[15px] items-center justify-start relative shrink-0 hover:opacity-70 transition-opacity cursor-pointer"
      >
        {element}
        <div className="justify-start text-[#adb5bd] text-[16px] font-semibold font-['Pretendard'] leading-snug">
          <p className="leading-[22px] whitespace-pre">답글 {replyCount}개 더 보기</p>
        </div>
      </button>
    </div>
  );
};

export default OpenOrFoldReplies;
