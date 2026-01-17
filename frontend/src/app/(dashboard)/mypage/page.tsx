'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function MyPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="border-brand mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h1 className="mb-6 text-2xl font-bold text-gray-900">마이페이지</h1>

          <div className="space-y-6">
            <div className="border-b pb-4">
              <h2 className="mb-3 text-lg font-semibold text-gray-800">
                프로필 정보
              </h2>
              <div className="flex items-center space-x-4">
                {user?.profileImageUrl && (
                  <img
                    src={user.profileImageUrl}
                    alt="프로필 이미지"
                    className="h-16 w-16 rounded-full object-cover"
                  />
                )}
                <div>
                  <p className="font-medium text-gray-900">{user?.nickname}</p>
                  <p className="text-sm text-gray-500">ID: {user?.id}</p>
                </div>
              </div>
            </div>

            <div className="border-b pb-4">
              <h2 className="mb-3 text-lg font-semibold text-gray-800">
                계정 설정
              </h2>
              <div className="space-y-2">
                <button className="text-brand transition-colors hover:text-[#7a0026]">
                  프로필 수정
                </button>
                <br />
                <button className="text-red-600 transition-colors hover:text-red-700">
                  회원탈퇴
                </button>
              </div>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-semibold text-gray-800">
                활동 내역
              </h2>
              <p className="text-gray-600">
                투표 및 댓글 내역이 여기에 표시됩니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
