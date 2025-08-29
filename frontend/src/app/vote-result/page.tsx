'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface VoteResult {
  normalVotes: number;
  bonusVotes: number;
  submissionDateTime: string;
}

export default function VoteResultPage() {
  const searchParams = useSearchParams();
  const [voteResult, setVoteResult] = useState<VoteResult | null>(null);

  useEffect(() => {
    const normalVotes = parseInt(searchParams.get('normalVotes') || '0');
    const bonusVotes = parseInt(searchParams.get('bonusVotes') || '0');
    const submissionDateTime = searchParams.get('submissionDateTime') || '';

    setVoteResult({
      normalVotes,
      bonusVotes,
      submissionDateTime,
    });
  }, [searchParams]);

  if (!voteResult) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#990033] mx-auto mb-4"></div>
          <p className="text-gray-600">투표 결과를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const totalVotes = voteResult.normalVotes + voteResult.bonusVotes;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-[1240px] mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/vote" className="flex items-center gap-2 text-[#990033] hover:text-[#7a0029] transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">투표로 돌아가기</span>
            </Link>
            <h1 className="text-lg font-bold text-gray-900">투표 완료</h1>
            <div className="w-20"></div> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1240px] mx-auto px-4 py-6">
        {/* Success Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 overflow-visible">
          <div className="text-center">
            {/* Success Icon */}
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">소중한 참여 감사합니다!</h2>
            <p className="text-gray-600 text-xs sm:text-sm">
              {voteResult.submissionDateTime}
            </p>
          </div>
        </div>

        {/* Vote Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 overflow-visible">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">투표 요약</h3>
          
          <div className="space-y-3 sm:space-y-4">
            {/* Total Votes */}
            <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#990033] rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm sm:text-base">총 투표 수</p>
                  <p className="text-xs sm:text-sm text-gray-600">일반 + 보너스</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl sm:text-2xl font-bold text-[#990033]">{totalVotes}표</p>
              </div>
            </div>

            {/* Normal Votes */}
            <div className="flex items-center justify-between p-3 sm:p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm sm:text-base">일반 투표</p>
                  <p className="text-xs sm:text-sm text-gray-600">1표 = 1점</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl sm:text-2xl font-bold text-blue-600">{voteResult.normalVotes}표</p>
              </div>
            </div>

            {/* Bonus Votes */}
            {voteResult.bonusVotes > 0 && (
              <div className="flex items-center justify-between p-3 sm:p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm sm:text-base">보너스 투표</p>
                    <p className="text-xs sm:text-sm text-gray-600">2표 = 1점</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl sm:text-2xl font-bold text-yellow-600">{voteResult.bonusVotes}표</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link 
            href="/vote" 
            className="w-full bg-[#990033] text-white py-3 px-6 rounded-lg font-semibold text-center hover:bg-[#7a0029] transition-colors block"
          >
            다시 투표하기
          </Link>
          
          <Link 
            href="/" 
            className="w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold text-center hover:bg-gray-300 transition-colors block"
          >
            홈으로 돌아가기
          </Link>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="w-4 h-4 sm:w-5 sm:h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-blue-900 mb-1 text-sm sm:text-base">투표 결과 확인</h4>
              <p className="text-xs sm:text-sm text-blue-800">
                투표 결과는 실시간으로 집계되며, 최종 결과는 분기 종료 후 공개됩니다.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
