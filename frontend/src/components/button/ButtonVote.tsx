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
  iconSrc = '/icons/icon-vote-hand.svg',
  className = '',
  onClick,
}: ButtonVoteProps) {
  const router = useRouter();

  // 현재 주차 찾기 (첫 번째 주차)
  const currentWeek = weekDtos[0];
  const isVoteOpen = !!currentWeek;

  // 투표 상태에 따른 텍스트 설정
  const voteTitle = title || (isVoteOpen ? '애니메이션 투표' : '투표 준비중');
  const voteSubtitle =
    subtitle ||
    (isVoteOpen
      ? `${currentWeek?.year}년 ${currentWeek?.quarter}분기 ${currentWeek?.week}주차`
      : '투표가 시작되면 알려드릴게요!');

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
      className={`inline-flex h-20 cursor-pointer items-center justify-start gap-6 overflow-hidden rounded-xl bg-gradient-to-r from-pink-700 to-pink-950 px-7 pt-1.5 pb-2.5 transition-all hover:brightness-110 sm:h-24 sm:gap-12 ${className}`}
      onClick={handleClick}
    >
      {/* 텍스트 영역 */}
      <div className="inline-flex h-20 flex-col items-start justify-center sm:h-24">
        <div className="text-md font-['Pretendard'] leading-snug font-semibold whitespace-nowrap text-white sm:text-2xl">
          {voteTitle}
        </div>
        <div className="font-['Pretendard'] text-xs leading-snug font-medium text-white sm:text-sm">
          {voteSubtitle}
        </div>
      </div>

      {/* 아이콘 영역 */}
      <div className="relative size-16 sm:size-20">
        <img
          className="absolute top-0 left-0 size-16 blur-[2.22px] sm:size-20"
          src={iconSrc}
        />
        <img
          className="absolute top-0 left-0 size-16 sm:size-20"
          src={iconSrc}
        />
      </div>
    </button>
  );
}
