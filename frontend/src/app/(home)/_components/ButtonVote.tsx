'use client';

import { useRouter } from 'next/navigation';
import { WeekDto } from '@/types';

interface ButtonVoteProps {
  weekDtos: WeekDto[];
}

export default function ButtonVote({ weekDtos }: ButtonVoteProps) {
  const router = useRouter();

  // 현재 주차 찾기 (첫 번째 주차)
  const currentWeek = weekDtos[0];
  const isVoteOpen = !!currentWeek;

  // 투표 상태에 따른 텍스트 설정
  const voteTitle = isVoteOpen ? '애니메이션 투표' : '투표 준비중';
  const voteSubtitle = isVoteOpen
    ? `${currentWeek?.year}년 ${currentWeek?.quarter}분기 ${currentWeek?.week}주차`
    : '투표가 시작되면 알려드릴게요!';

  const handleClick = () => {
    if (isVoteOpen) {
      // 투표가 열려있으면 투표 페이지로 이동
      router.push('/vote');
    }
  };
  return (
    <button
      className="inline-flex h-20 shrink-0 cursor-pointer items-center justify-start gap-6 overflow-hidden rounded-xl bg-gradient-to-r from-pink-700 to-pink-950 px-7 pt-1.5 pb-2.5 transition-all hover:brightness-110 sm:h-24 sm:gap-12"
      onClick={handleClick}
    >
      {/* 텍스트 영역 */}
      <div className="inline-flex h-20 flex-col items-start justify-center sm:h-24">
        <div className="text-md leading-snug font-semibold whitespace-nowrap text-white sm:text-2xl">
          {voteTitle}
        </div>
        <div className="text-xs leading-snug font-medium text-white sm:text-sm">
          {voteSubtitle}
        </div>
      </div>

      {/* 아이콘 영역 */}
      <div className="relative size-16 sm:size-20">
        <img
          className="absolute top-0 left-0 size-16 blur-[2.22px] sm:size-20"
          src="/icons/icon-vote-hand.svg"
        />
        <img
          className="absolute top-0 left-0 size-16 sm:size-20"
          src="/icons/icon-vote-hand.svg"
        />
      </div>
    </button>
  );
}
