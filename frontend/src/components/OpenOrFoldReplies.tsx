import React from 'react';

// 이미지 assets - 답글 펼치기/접기 아이콘
const img = "/icons/textBalloon.svg";

interface OpenOrFoldRepliesProps {
  isOpen: boolean;
  replyCount: number;
  onToggle: () => void;
}

const OpenOrFoldReplies: React.FC<OpenOrFoldRepliesProps> = ({
  isOpen,
  replyCount,
  onToggle
}) => {
  const element = (
    <div className="flex h-4 items-center justify-center relative shrink-0 w-[50px]">
      <div className="w-[50px] h-px bg-[#adb5bd]"></div>
    </div>
  );

  if (isOpen) {
    return (
      <div className="box-border content-stretch flex gap-[25px] items-center justify-start pl-[84px] pr-0 py-0 relative size-full">
        <button 
          onClick={onToggle}
          className="content-stretch flex gap-[15px] items-center justify-start relative shrink-0 hover:opacity-70 transition-opacity cursor-pointer"
        >
          {element}
          <div className="justify-start text-[#adb5bd] text-[16px] font-semibold font-['Pretendard'] leading-snug">
            <p className="leading-[22px] whitespace-pre">답글 숨기기</p>
          </div>
        </button>
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
