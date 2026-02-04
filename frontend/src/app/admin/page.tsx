'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import AnimationManagementTab from './_components/AnimationManagementTab';
import ScheduleManagementTab from './_components/ScheduleManagementTab';
import ContentManagementTab from './_components/ContentManagementTab';
import SubmissionManagementTab from './_components/SubmissionManagementTab';

export default function AdminPage() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    'content' | 'anime' | 'schedule' | 'submissions'
  >('content');

  // 인증 체크 완료 여부 추적
  const [hasCheckedAuth, sethasCheckedAuth] = useState(false);

  // 권한 확인
  useEffect(() => {
    // 로딩 중이면 아무 것도 하지 않음
    if (isAuthLoading) {
      sethasCheckedAuth(false);
      return;
    }
    if (!hasCheckedAuth) {
      sethasCheckedAuth(true);
    }

    // 인증 체크가 완료된 후에만 권한 확인
    if (hasCheckedAuth && (!isAuthenticated || user?.role !== 'ADMIN')) {
      router.push('/');
      return;
    }
  }, [isAuthenticated, user, isAuthLoading, hasCheckedAuth, router]);

  // 인증/권한 체크 중에는 로딩 표시
  if (!hasCheckedAuth || isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
          <p className="mt-2 text-gray-600">권한을 확인하는 중...</p>
        </div>
      </div>
    );
  }

  // 인증/권한 체크가 끝난 뒤, ADMIN 이 아닌 경우에는 아무 것도 렌더링하지 않음
  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen overflow-x-hidden py-8">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">관리자 페이지</h1>
          <p className="mt-2 text-gray-600 dark:text-zinc-400">
            애니메이션 데이터와 제출 현황을 관리할 수 있습니다.
          </p>
        </div>

        {/* 탭 */}
        <div className="border-brand-zinc-200 mb-6 border-b">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('content')}
              className={`border-b-2 px-1 py-4 text-sm font-medium ${
                activeTab === 'content'
                  ? 'border-blue-500 text-blue-600'
                  : 'hover:border-brand-zinc-300 border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-zinc-400'
              }`}
            >
              컨텐츠 관리
            </button>
            <button
              onClick={() => setActiveTab('anime')}
              className={`border-b-2 px-1 py-4 text-sm font-medium ${
                activeTab === 'anime'
                  ? 'border-blue-500 text-blue-600'
                  : 'hover:border-brand-zinc-300 border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-zinc-400'
              }`}
            >
              애니메이션 관리
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`border-b-2 px-1 py-4 text-sm font-medium ${
                activeTab === 'schedule'
                  ? 'border-blue-500 text-blue-600'
                  : 'hover:border-brand-zinc-300 border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-zinc-400'
              }`}
            >
              주차별 편성표 관리
            </button>
            <button
              onClick={() => setActiveTab('submissions')}
              className={`border-b-2 px-1 py-4 text-sm font-medium ${
                activeTab === 'submissions'
                  ? 'border-blue-500 text-blue-600'
                  : 'hover:border-brand-zinc-300 border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-zinc-400'
              }`}
            >
              제출 현황 관리
            </button>
          </nav>
        </div>

        {/* 컨텐츠 관리 탭 */}
        {activeTab === 'content' && <ContentManagementTab />}

        {/* 애니메이션 관리 탭 */}
        {activeTab === 'anime' && <AnimationManagementTab />}

        {/* 주차별 편성표 관리 탭 */}
        {activeTab === 'schedule' && <ScheduleManagementTab />}

        {/* 제출 현황 관리 탭 */}
        {activeTab === 'submissions' && <SubmissionManagementTab />}
      </div>
    </div>
  );
}
