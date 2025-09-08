'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // URL에서 accessToken 파라미터 추출
        const accessToken = searchParams.get('accessToken');
        
        if (accessToken) {
          // 토큰을 localStorage에 저장 (선택사항)
          localStorage.setItem('accessToken', accessToken);
          
          // 사용자 정보를 가져와서 AuthContext에 설정
          // 백엔드에서 쿠키로 JWT 토큰을 설정했으므로 별도의 Authorization 헤더 없이 호출
          const response = await fetch('/api/v1/members/me', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          });

          if (response.ok) {
            const userData = await response.json();
            // API 응답에서 실제 사용자 데이터 추출
            const user = userData.data || userData;
            login(user);
            
            // 로그인 성공 후 홈페이지로 리다이렉트
            router.push('/');
          } else {
            router.push('/');
          }
        } else {
          router.push('/');
        }
      } catch (error) {
        router.push('/');
      }
    };

    handleCallback();
  }, [searchParams, login, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">로그인 처리 중...</p>
      </div>
    </div>
  );
}
