'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { SurveyDto, SurveyType, VoteStatusType } from '@/types';
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
} from '@/lib/surveySessionStorage';
import { useSurveySession } from '@/hooks/useSurveySession';
import SurveyResultChart from './_components/SurveyResultChart';
import SurveyDisabled from './_components/SurveyDisabled';

export default function SurveyPage() {
  const params = useParams();
  const surveyId = params.surveyId ? parseInt(params.surveyId as string) : null;
  const surveyType = params.surveyType as SurveyType | undefined;

  const { isAuthenticated } = useAuth();
  const { openLoginModal } = useModal();
  const [isRevoteMode, setIsRevoteMode] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // 로그인 시 hasVoted=true인 모든 survey에 대해 세션키 생성
  useSurveySession();

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

  // 로딩 상태
  if (isSurveyStatusLoading || !surveyId || !surveyType) {
    return <SurveyDetailSkeleton />;
  }

  // 세션키 및 투표 내역 저장 여부 확인
  const hasValidSession = hasValidSurveySession(surveyType);
  const voteHistorySaved = isVoteHistorySaved(surveyType);

  // 종료된 어워드 결과 차트
  if (surveyStatusData?.status === VoteStatusType.ResultOpen) {
    return <SurveyResultChart surveyId={surveyId} />;
  }

  if (
    surveyStatusData?.status === VoteStatusType.NotYet ||
    surveyStatusData?.status === VoteStatusType.Closed
  ) {
    return <SurveyDisabled survey={surveyStatusData} />;
  }

  // 로그인=false, 투표내역저장=true → 메세지창
  if (!isAuthenticated && voteHistorySaved) {
    return (
      <main className="max-width px-10!">
        <div className="mx-auto flex max-w-md flex-col items-center gap-2 rounded border border-gray-200 bg-white p-6 shadow-lg">
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

  // 재투표 모드=false, 세션키=true, 투표=true → 결과창 표시
  if (!isRevoteMode && hasValidSession && surveyStatusData?.hasVoted) {
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
