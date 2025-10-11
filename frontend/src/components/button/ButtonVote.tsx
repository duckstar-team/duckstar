'use client';

import { useRouter } from 'next/navigation';
import { WeekDto } from '@/types/api';

interface ButtonVoteProps {
  weekDtos: WeekDto[];
  title?: string;
  subtitle?: string;
  iconSrc?: string;
  className?: string;
  onClick?: () => void;
}

export default function ButtonVote({ 
  weekDtos,
  title, 
  subtitle, 
  iconSrc = "/icons/icon-vote-hand.svg",
  className = "",
  onClick
}: ButtonVoteProps) {
  const router = useRouter();
  
  // 현재 주차 찾기 (OPEN 상태인 주차)
  const currentWeek = weekDtos.find(week => week.voteStatus === 'OPEN');
  const isVoteOpen = !!currentWeek;
  
  // 투표 상태에 따른 텍스트 설정
  const voteTitle = title || (isVoteOpen ? "애니메이션 투표" : "투표 준비중");
  const voteSubtitle = subtitle || (isVoteOpen 
    ? `${currentWeek?.year}년 ${currentWeek?.quarter}분기 ${currentWeek?.week}주차`
    : "투표가 시작되면 알려드릴게요!");

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (isVoteOpen) {
      // 투표가 열려있으면 투표 페이지로 이동
      router.push('/vote');
    }
  };
  return (
    <button 
      className={`h-20 sm:h-24 px-7 pt-1.5 pb-2.5 bg-gradient-to-r from-pink-700 to-pink-950 rounded-xl inline-flex justify-start items-center gap-6 sm:gap-12 overflow-hidden cursor-pointer hover:brightness-110 transition-all ${className}`}
      onClick={handleClick}
    >
      {/* 텍스트 영역 */}
      <div className="h-20 sm:h-24 inline-flex flex-col justify-center items-start">
        <div className="text-white text-md sm:text-2xl font-semibold font-['Pretendard'] leading-snug">
          {voteTitle}
        </div>
        <div className="text-white text-xs sm:text-sm font-medium font-['Pretendard'] leading-snug">
          {voteSubtitle}
        </div>
      </div>
      
      {/* 아이콘 영역 */}
      <div className="size-16 sm:size-20 relative">
        <img className="size-16 sm:size-20 left-0 top-0 absolute blur-[2.22px]" src={iconSrc} />
        <img className="size-16 sm:size-20 left-0 top-0 absolute" src={iconSrc} />
      </div>
    </button>
  );
}
