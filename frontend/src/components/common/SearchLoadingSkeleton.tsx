'use client';

import React from 'react';

interface SearchLoadingSkeletonProps {
  showBanner?: boolean;
  cardCount?: number;
  className?: string;
}

export default function SearchLoadingSkeleton({ 
  showBanner = true, 
  cardCount = 12,
  className = ''
}: SearchLoadingSkeletonProps) {
  return (
    <div className={`w-full ${className}`}>
      {/* 상단 배너 스켈레톤 */}
      {showBanner && (
        <section>
          <div className="w-full h-24 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse" />
        </section>
      )}
      
      {/* 메인 컨텐츠 영역 */}
      <div className="w-full max-w-7xl mx-auto px-6 py-6">
        {/* 검색 필터 영역 스켈레톤 */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-32 h-8 bg-gray-200 rounded animate-pulse" />
            <div className="w-24 h-8 bg-gray-200 rounded animate-pulse" />
            <div className="w-28 h-8 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="w-full max-w-2xl mx-auto">
            <div className="h-16 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </div>

        {/* 요일 선택 영역 스켈레톤 */}
        <div className="flex justify-center mb-8">
          <div className="flex gap-2">
            {Array.from({ length: 9 }).map((_, index) => (
              <div key={index} className="w-16 h-10 bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>

        {/* 애니메이션 카드 그리드 스켈레톤 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[30px]">
          {Array.from({ length: cardCount }).map((_, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* 이미지 영역 */}
              <div className="w-full h-48 bg-gray-200 animate-pulse" />
              
              {/* 텍스트 영역 */}
              <div className="p-4">
                <div className="h-5 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
              </div>
              
              {/* OTT 태그 영역 */}
              <div className="px-4 pb-4">
                <div className="flex gap-2">
                  <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
                  <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
                  <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
