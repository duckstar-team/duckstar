'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { SurveyDto, SurveyType } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { queryConfig } from '@/lib/queryConfig';
import { useAuth } from '@/context/AuthContext';
import VoteResultView from './_components/VoteResultView';
import VoteFormView from './_components/VoteFormView';
import { SurveyDetailSkeleton } from '@/components/skeletons';
import { useModal } from '@/components/layout/AppContainer';
import {
  hasValidSurveySession,
  isVoteHistorySaved,
  updateSurveySessionVoteHistory,
} from '@/lib/surveySessionStorage';
import SurveyCountdown from './_components/SurveyCountdown';

export default function SurveyPage() {
  const params = useParams();
  const surveyId = params.surveyId ? parseInt(params.surveyId as string) : null;
  const surveyType = params.surveyType as SurveyType | undefined;

  const { isAuthenticated } = useAuth();
  const { openLoginModal } = useModal();
  const [isRevoteMode, setIsRevoteMode] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // 투표 상태 조회 (hasVoted 확인)
  const { data: surveyStatusData, isLoading: isSurveyStatusLoading } =
    useQuery<SurveyDto>({
      queryKey: ['survey-status', surveyId],
      queryFn: async () => {
        if (!surveyId) throw new Error('Survey ID가 없습니다');
        const response = await fetch(`/api/v1/vote/surveys/${surveyId}`);
        if (!response.ok) throw new Error('투표 상태 조회 실패');
        const result = await response.json();
        return result.result || result;
      },
      enabled: !!surveyId,
      ...queryConfig.vote,
    });

  // 로그인 시 세션키의 투표 내역 저장 여부 업데이트
  useEffect(() => {
    if (
      isAuthenticated &&
      surveyStatusData?.hasVoted &&
      surveyStatusData?.type
    ) {
      updateSurveySessionVoteHistory(surveyStatusData.type);
    }
  }, [isAuthenticated, surveyStatusData?.hasVoted, surveyStatusData?.type]);

  // 로딩 상태
  if (isSurveyStatusLoading || !surveyId || !surveyType) {
    return <SurveyDetailSkeleton />;
  }

  // 세션키 및 투표 내역 저장 여부 확인
  const hasValidSession = hasValidSurveySession(surveyType);
  const voteHistorySaved = isVoteHistorySaved(surveyType);

  // 로그인=false, 투표내역저장=true → 메세지창
  if (!isAuthenticated && voteHistorySaved) {
    return (
      <main className="max-width px-10!">
        <div className="flex flex-col items-center gap-2 rounded border border-gray-200 bg-white p-6 shadow-lg">
          <div className="text-2xl">😎</div>
          <h2 className="text-xl font-semibold">
            기존 투표 이력이 확인되었습니다
          </h2>
          <p className="mb-6 text-gray-600">로그인 시 재투표가 가능합니다.</p>
          <button
            onClick={openLoginModal}
            className="rounded-lg bg-amber-400/40 px-6 py-2 font-semibold text-black transition hover:bg-amber-400/70"
          >
            로그인하기
          </button>
        </div>
      </main>
    );
  }

  if (surveyStatusData?.status === 'NOT_YET') {
    return (
      <main className="max-width px-10!">
        <div className="flex flex-col items-center justify-center gap-2 rounded border border-gray-200 bg-white p-6 shadow-lg">
          <img
            src="/survey_not_yet.jpeg"
            alt="survey-not-yet"
            className="mb-4 aspect-video w-1/3 object-cover @max-sm:w-1/2"
          />
          <h2 className="text-xl font-semibold text-black">
            투표 오픈 전입니다
          </h2>
          <p className="my-6 text-center text-gray-600">
            <SurveyCountdown
              startDate={surveyStatusData?.startDateTime}
              className="text-[1.5rem] font-bold! text-red-400! @md:text-[2rem]"
            />
          </p>
        </div>
      </main>
    );
  }

  // 재투표 모드=false, 세션키=true → 결과창 표시
  if (!isRevoteMode && (hasValidSession || surveyStatusData?.hasVoted)) {
    return (
      <VoteResultView
        surveyId={surveyId}
        endDate={surveyStatusData?.endDateTime}
        onRevoteClick={() => {
          setIsRevoteMode(true);
          setShowConfetti(false);
        }}
        showConfetti={showConfetti}
        onConfettiComplete={() => setShowConfetti(false)}
      />
    );
  }

  // 기본값: 투표창
  return (
    <VoteFormView
      surveyId={surveyId}
      isRevoteMode={isRevoteMode}
      onRevoteSuccess={() => {
        setShowConfetti(true);
        setIsRevoteMode(false);
      }}
      voteStatus={surveyStatusData?.status}
      surveyType={surveyType}
      surveyEndDate={surveyStatusData?.endDateTime}
    />
  );
}
