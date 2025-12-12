import React from 'react';

// 이미지 assets
const img = '/icons/vote-icon.svg';

interface VoteCountProps {
  voteCount: number;
}

const VoteCount: React.FC<VoteCountProps> = ({ voteCount }) => {
  const element = (
    <div className="justify-start text-[14px] leading-snug font-normal text-[#adb5bd]">
      <p className="leading-[22px] whitespace-pre">·</p>
    </div>
  );

  const iconVote = (
    <div className="relative size-[22px] shrink-0">
      <img alt="투표 아이콘" className="block size-full max-w-none" src={img} />
    </div>
  );

  // 4개 이상인 경우 +N 형태로 표시
  if (voteCount > 3) {
    const remainingCount = voteCount - 3;
    return (
      <div className="relative flex size-full content-stretch items-center justify-start gap-[5px]">
        {element}
        <div className="relative flex shrink-0 content-stretch items-center justify-start">
          {iconVote}
          {iconVote}
          {iconVote}
          <div className="relative box-border flex shrink-0 flex-col content-stretch items-end justify-center gap-2.5 py-0 pr-0 pl-0.5">
            <div className="relative box-border flex h-4 shrink-0 content-stretch items-center justify-center gap-2.5 rounded-[6px] bg-[#990033] px-1 py-0">
              <div className="justify-start text-[13px] leading-snug font-semibold text-white">
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
    <div className="relative flex size-full content-stretch items-center justify-start gap-[5px]">
      {element}
      <div className="relative flex shrink-0 content-stretch items-center justify-start">
        {Array.from({ length: Math.min(voteCount, 3) }, (_, index) => (
          <div key={index} className="relative size-[22px] shrink-0">
            <img
              alt="투표 아이콘"
              className="block size-full max-w-none"
              src={img}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default VoteCount;
