'use client';

import Image from 'next/image';

interface VoteStampProps {
  type: 'normal' | 'bonus';
  isActive: boolean;
  currentVotes: number;
  maxVotes: number;
  bonusVotesUsed?: number;
}

export default function VoteStamp({ 
  type, 
  isActive, 
  currentVotes, 
  maxVotes, 
  bonusVotesUsed = 0 
}: VoteStampProps) {
  if (type === 'normal') {
    return (
      <div className="flex items-center gap-4">
        {/* Normal Vote Stamp */}
        <div className={`flex items-center justify-center w-14 h-14 rounded-[30px] ${
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
            width={56}
            height={56}
            className="w-full h-full object-cover rounded-[30px]"
          />
        </div>
        
        {/* Vote Count Text */}
        <div className="flex items-center gap-2">
          <div className="w-16 pt-2.5 pb-[5px] flex justify-center items-center">
            <span className={`text-right justify-center text-3xl font-bold font-['Pretendard'] leading-none ${
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
        </div>
      </div>
    );
  }

  if (type === 'bonus') {
    return (
      <div className="flex items-center gap-4">
        {/* Bonus Vote Stamp */}
        <div className="flex items-center justify-center w-[67px] h-[67px]">
          <Image
            src="/icons/voteSection-bonus-stamp.svg"
            alt="Bonus Stamp"
            width={67}
            height={67}
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Bonus Vote Count */}
        <div className="flex items-center gap-2">
          <div className="w-16 pt-2.5 pb-[5px] flex justify-center items-center">
            <span className="font-['Pretendard',_sans-serif] font-bold text-3xl text-[#ffb310]">
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
        </div>
      </div>
    );
  }

  return null;
}
