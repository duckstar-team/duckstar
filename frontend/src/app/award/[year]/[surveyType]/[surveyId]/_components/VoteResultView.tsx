'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AnimeBallotDto, ApiResponseAnimeVoteHistoryDto } from '@/types';
import { ChevronRight, RefreshCcw, Share2 } from 'lucide-react';
import { queryConfig } from '@/lib/queryConfig';
import { getCategoryText, getSurveyTypeLabel } from '@/lib/surveyUtils';
import VoteStamp from './VoteStamp';
import ConfettiEffect from './ConfettiEffect';
import VoteResultCard from './VoteResultCard';
import { useModal } from '@/components/layout/AppContainer';
import { useAuth } from '@/context/AuthContext';

interface VoteResultViewProps {
  surveyId: number;
  onRevoteClick: () => void;
  showConfetti?: boolean;
  onConfettiComplete?: () => void;
}

export default function VoteResultView({
  surveyId,
  onRevoteClick,
  showConfetti = false,
  onConfettiComplete,
}: VoteResultViewProps) {
  const { isAuthenticated } = useAuth();
  const { openLoginModal } = useModal();

  // 투표 내역 조회
  const { data: voteStatusData, isLoading } = useQuery({
    queryKey: ['vote-status', surveyId],
    queryFn: async () => {
      const response = await fetch(`/api/v1/vote/surveys/${surveyId}/me`);
      if (!response.ok) throw new Error('투표 내역 조회 실패');
      return response.json() as Promise<ApiResponseAnimeVoteHistoryDto>;
    },
    enabled: !!surveyId,
    ...queryConfig.vote,
  });

  const voteHistory = voteStatusData?.result;

  const getResultAnnouncementMessage = () => {
    if (!voteHistory) {
      return '덕스타 결과는 일요일 22시에 공개됩니다.';
    }

    return `${voteHistory?.year}년 ${getSurveyTypeLabel(voteHistory?.type)} 결과는 일요일 22시에 공개됩니다.`;
  };

  const categoryText = getCategoryText('ANIME');

  if (isLoading || !voteHistory) {
    return <div className="text-center">투표 기록을 불러오는 중...</div>;
  }

  return (
    <main className="max-width bg-gray-50">
      <ConfettiEffect isActive={showConfetti} onComplete={onConfettiComplete} />
      <div className="relative mb-6 flex w-full flex-col items-center gap-2 rounded-lg bg-gray-100 p-4 sm:gap-3">
        <div className="text-center text-xl font-semibold text-black sm:text-2xl lg:text-3xl">
          {voteHistory.nickName
            ? `${voteHistory.nickName} 님, 소중한 참여 감사합니다!`
            : '소중한 참여 감사합니다!'}
        </div>

        <div className="text-sm sm:text-base">
          {getResultAnnouncementMessage()}
        </div>

        {/* TODO: 공유 기능 (보류) */}
        {/* <button className="absolute top-4 right-4 rounded-full p-2 hover:bg-gray-200">
          <Share2 className="size-5" />
        </button> */}
      </div>

      <div className="flex w-full items-center justify-evenly gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm max-lg:justify-center max-md:flex-col sm:p-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <VoteStamp
            type="normal"
            currentVotes={voteHistory.normalCount || 0}
            showResult={true}
            showGenderSelection={true}
          />

          {voteHistory.bonusCount > 0 && (
            <VoteStamp
              type="bonus"
              currentVotes={voteHistory.bonusCount || 0}
              bonusVotesUsed={voteHistory.bonusCount || 0}
              showResult={true}
            />
          )}
        </div>

        <div className="flex flex-col justify-center rounded-md bg-gray-100 px-4 py-0.5 font-medium text-gray-600 max-md:text-sm">
          제출 시각:{' '}
          {voteHistory.submittedAt
            ? new Date(voteHistory.submittedAt).toLocaleString('ko-KR')
            : '정보 없음'}
        </div>

        {isAuthenticated && (
          <div className="flex justify-center lg:justify-end">
            <button
              onClick={onRevoteClick}
              className="flex items-center gap-2 rounded-lg bg-amber-400 px-2.5 py-1.5 font-semibold text-white transition hover:opacity-60 max-md:text-sm"
            >
              <RefreshCcw className="size-4 md:size-5" />
              재투표하기
            </button>
          </div>
        )}
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-end justify-between sm:mb-4">
          <h2 className="text-lg font-semibold sm:text-xl">
            투표한 {categoryText}
          </h2>

          {!isAuthenticated && (
            <div className="group relative">
              <button
                onClick={openLoginModal}
                className="flex items-center gap-1 border-b border-gray-300 text-base text-gray-500 transition hover:border-gray-500 hover:text-gray-700"
              >
                로그인으로 투표 내역 저장하기
                <ChevronRight className="size-4" />
              </button>

              <div className="pointer-events-none absolute bottom-full left-2/3 z-50 mb-2 -translate-x-1/2 transform opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <div className="relative rounded-lg bg-gray-800 px-3 py-2 text-sm whitespace-nowrap text-white">
                  언제든 재투표 가능!
                  <div className="absolute top-full left-1/2 h-0 w-0 -translate-x-1/2 transform border-t-4 border-r-4 border-l-4 border-transparent border-t-gray-800"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {voteHistory.animeBallotDtos &&
        Array.isArray(voteHistory.animeBallotDtos) &&
        voteHistory.animeBallotDtos.length > 0 ? (
          <div className="grid w-full grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
            {voteHistory.animeBallotDtos.map((ballot: AnimeBallotDto) => (
              <div key={ballot.animeId}>
                <VoteResultCard ballot={ballot} />
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center sm:py-12">
            <p className="text-base text-gray-500 sm:text-lg">
              투표한 {categoryText}이 없습니다.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
