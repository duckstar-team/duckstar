'use client';

import Image from 'next/image';
import { forwardRef } from 'react';

interface VoteStampProps {
  type: 'normal' | 'bonus';
  isActive: boolean;
  currentVotes: number;
  maxVotes: number;
  bonusVotesUsed?: number;
  showResult?: boolean; // 투표 결과 모드 (× 기호 사용, 분모 제거)
}

const VoteStamp = forwardRef<HTMLDivElement, VoteStampProps>(({ 
  type, 
  isActive, 
  currentVotes, 
  maxVotes, 
  bonusVotesUsed = 0,
  showResult = false
}, ref) => {
  if (type === 'normal') {
    return (
      <div className="flex items-center gap-[16px]">
        {/* Normal Vote Stamp */}
        <div className={`flex items-center justify-center w-[54px] h-[54px] rounded-[30px] ${
          isActive 
            ? 'bg-[rgba(153,0,51,0.15)]' 
            : 'bg-neutral-600/20'
        }`}>
          <Image
            src={isActive 
              ? "/icons/voteSection-normal-default.svg" 
              : "/icons/voteSection-normal-full.svg"
            }
            alt="Normal Vote Stamp"
            width={54}
            height={54}
            className="w-full h-full object-cover rounded-[30px]"
          />
        </div>
        
        {/* Vote Count Text */}
        <div className="flex items-center gap-[13px]">
          {showResult ? (
            // 투표 결과 모드: × 기호와 표 수를 하나의 프레임으로 묶음
            <div className="flex items-center gap-[13px]">
              <div className="pt-2.5 pb-[5px] flex justify-center items-center">
                <span className={`text-right justify-center text-[32px] font-bold font-['Pretendard'] leading-none ${
                  isActive ? 'text-[#990033]' : 'text-neutral-600'
                }`}>
                  ×
                </span>
              </div>
              
              <div className="pt-2.5 pb-[5px] flex justify-center items-center">
                <span className={`text-right justify-center text-[32px] font-bold font-['Pretendard'] leading-none ${
                  isActive ? 'text-[#990033]' : 'text-neutral-600'
                }`}>
                  {currentVotes}표
                </span>
              </div>
            </div>
          ) : (
            // 기존 모드: 분자/분모 사용
            <>
              <div className="w-16 pt-2.5 pb-[5px] flex justify-center items-center">
                <span className={`text-right justify-center text-[32px] font-bold font-['Pretendard'] leading-none ${
                  isActive ? 'text-[#990033]' : 'text-neutral-600'
                }`}>
                  {currentVotes}표
                </span>
              </div>
              
              <div className="w-2 self-stretch pt-3 flex flex-col justify-center items-center">
                <span className="self-stretch h-9 text-right justify-center text-black text-xl font-bold font-['Pretendard'] leading-none translate-y-2">
                  /
                </span>
              </div>
              
              <div className="pt-3 flex flex-col justify-center items-center">
                <span className="text-right justify-center text-black text-xl font-bold font-['Pretendard'] leading-none">
                  {maxVotes}표
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  if (type === 'bonus') {
    return (
      <div className="flex items-center gap-[16px]">
        {/* Bonus Vote Stamp */}
        <div 
          ref={ref}
          className="flex items-center justify-center w-[67px] h-[67.275px]"
        >
          <Image
            src="/icons/voteSection-bonus-stamp.svg"
            alt="Bonus Stamp"
            width={67}
            height={67}
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Bonus Vote Count */}
        <div className="flex items-center gap-[13px]">
          {showResult ? (
            // 투표 결과 모드: × 기호와 표 수를 하나의 프레임으로 묶음
            <div className="flex items-center gap-[13px]">
              <div className="pt-2.5 pb-[5px] flex justify-center items-center">
                <span className="font-['Pretendard',_sans-serif] font-bold text-[32px] text-[#ffb310]">
                  ×
                </span>
              </div>
              
              <div className="pt-2.5 pb-[5px] flex justify-center items-center">
                <span className="font-['Pretendard',_sans-serif] font-bold text-[#ffb310] text-[32px]">
                  {bonusVotesUsed}표
                </span>
              </div>
            </div>
          ) : (
            // 기존 모드: 분자/분모 사용
            <>
              <div className="w-16 pt-2.5 pb-[5px] flex justify-center items-center">
                <span className="font-['Pretendard',_sans-serif] font-bold text-[32px] text-[#ffb310]">
                  {bonusVotesUsed}표
                </span>
              </div>
              
              <div className="w-2 self-stretch pt-3 flex flex-col justify-center items-center">
                <span className="self-stretch h-9 text-right justify-center text-[#ffb310] text-xl font-bold font-['Pretendard'] leading-none translate-y-2">
                  /
                </span>
              </div>
              
              <div className="pt-3 flex flex-col justify-center items-center">
                <div className="w-6 h-6 relative overflow-hidden">
                  <Image
                    src="/icons/voteSection-infinity.svg"
                    alt="Infinity Icon"
                    width={24}
                    height={24}
                    className="w-full h-full"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return null;
});

VoteStamp.displayName = 'VoteStamp';

export default VoteStamp;
