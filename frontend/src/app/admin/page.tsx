'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import AnimationManagementTab from '@/features/admin/components/AnimationManagementTab';
import ScheduleManagementTab from '@/features/admin/components/ScheduleManagementTab';
import ContentManagementTab from '@/features/admin/components/ContentManagementTab';
import SubmissionManagementTab from '@/features/admin/components/SubmissionManagementTab';
import { ADMIN_TABS } from '@/features/admin/constants';

type AdminTab = (typeof ADMIN_TABS)[number]['value'];

export default function AdminPage() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>(ADMIN_TABS[0].value);

  // 인증 체크 완료 여부 추적
  const [hasCheckedAuth, sethasCheckedAuth] = useState(false);

  // activeTab 초기화
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const saved = window.sessionStorage.getItem('admin-active-tab');
    if (
      saved === 'content' ||
      saved === 'anime' ||
      saved === 'schedule' ||
      saved === 'submissions'
    ) {
      setActiveTab(saved);
    }
  }, []);

  // activeTab 저장
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.sessionStorage.setItem('admin-active-tab', activeTab);
  }, [activeTab]);

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
        <nav className="border-brand-zinc-200 mb-6 flex border-b">
          {ADMIN_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`-mb-px border-b-2 p-4 text-sm font-medium ${
                activeTab === tab.value
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-black dark:border-none dark:hover:text-zinc-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

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
