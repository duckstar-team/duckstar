'use client';

import { Suspense } from 'react';
import Link from 'next/link';

function NotFoundContent() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">페이지를 찾을 수 없습니다</h2>
          <p className="text-gray-600 mb-8">
            요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link 
            href="/"
            className="inline-block bg-[#990033] text-white px-6 py-3 rounded-lg hover:bg-[#7a0026] transition-colors"
          >
            홈으로 돌아가기
          </Link>
          
          <div className="text-sm text-gray-500">
            <Link href="/search" className="hover:text-gray-700 transition-colors">
              애니메이션 검색
            </Link>
            {' • '}
            <Link href="/vote" className="hover:text-gray-700 transition-colors">
              투표하기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NotFound() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-500"></div>
          </div>
          <p className="text-gray-600">페이지를 불러오는 중...</p>
        </div>
      </div>
    }>
      <NotFoundContent />
    </Suspense>
  );
}
