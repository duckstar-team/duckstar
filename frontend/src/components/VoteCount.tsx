import React from 'react';

// 이미지 assets
const img = "/icons/vote-icon.svg";

interface VoteCountProps {
  voteCount: number;
}

const VoteCount: React.FC<VoteCountProps> = ({ voteCount }) => {
  const element = (
    <div className="justify-start text-[#adb5bd] text-[14px] font-normal font-['Pretendard'] leading-snug">
      <p className="leading-[22px] whitespace-pre">·</p>
    </div>
  );

  const iconVote = (
    <div className="relative shrink-0 size-[22px]">
      <img alt="투표 아이콘" className="block max-w-none size-full" src={img} />
    </div>
  );

  // 4개 이상인 경우 +N 형태로 표시
  if (voteCount > 3) {
    const remainingCount = voteCount - 3;
    return (
      <div className="content-stretch flex gap-[5px] items-center justify-start relative size-full">
        {element}
        <div className="content-stretch flex items-center justify-start relative shrink-0">
          {iconVote}
          {iconVote}
          {iconVote}
          <div className="box-border content-stretch flex flex-col gap-2.5 items-end justify-center pl-0.5 pr-0 py-0 relative shrink-0">
            <div className="bg-[#990033] box-border content-stretch flex gap-2.5 h-4 items-center justify-center px-1 py-0 relative rounded-[6px] shrink-0">
              <div className="justify-start text-white text-[13px] font-semibold font-['Pretendard'] leading-snug">
                +{remainingCount}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3개 이하인 경우 아이콘만 표시
  return (
    <div className="content-stretch flex gap-[5px] items-center justify-start relative size-full">
      {element}
      <div className="content-stretch flex items-center justify-start relative shrink-0">
        {Array.from({ length: Math.min(voteCount, 3) }, (_, index) => (
          <div key={index} className="relative shrink-0 size-[22px]">
            <img alt="투표 아이콘" className="block max-w-none size-full" src={img} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default VoteCount;
