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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#990033] mx-auto mb-4"></div>
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">마이페이지</h1>
          
          <div className="space-y-6">
            <div className="border-b pb-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">프로필 정보</h2>
              <div className="flex items-center space-x-4">
                {user?.profileImageUrl && (
                  <img 
                    src={user.profileImageUrl} 
                    alt="프로필 이미지" 
                    className="w-16 h-16 rounded-full object-cover"
                  />
                )}
                <div>
                  <p className="text-gray-900 font-medium">{user?.nickname}</p>
                  <p className="text-sm text-gray-500">ID: {user?.id}</p>
                </div>
              </div>
            </div>

            <div className="border-b pb-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">계정 설정</h2>
              <div className="space-y-2">
                <button className="text-[#990033] hover:text-[#7a0026] transition-colors">
                  프로필 수정
                </button>
                <br />
                <button className="text-red-600 hover:text-red-700 transition-colors">
                  회원탈퇴
                </button>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">활동 내역</h2>
              <p className="text-gray-600">투표 및 댓글 내역이 여기에 표시됩니다.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
