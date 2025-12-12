import React from 'react';

interface SearchLoadingSkeletonProps {
  showBanner?: boolean;
  cardCount?: number;
  className?: string;
}

export default function SearchLoadingSkeleton({
  showBanner = true,
  cardCount = 12,
  className = '',
}: SearchLoadingSkeletonProps) {
  return (
    <div className={`w-full ${className}`}>
      {/* 상단 배너 스켈레톤 */}
      {showBanner && (
        <section>
          <div className="h-24 w-full animate-pulse bg-gradient-to-r from-gray-200 to-gray-300" />
        </section>
      )}

      {/* 메인 컨텐츠 영역 */}
      <div className="mx-auto w-full max-w-7xl px-6 py-6">
        {/* 검색 필터 영역 스켈레톤 */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-center gap-4">
            <div className="h-8 w-32 animate-pulse rounded bg-gray-200" />
            <div className="h-8 w-24 animate-pulse rounded bg-gray-200" />
            <div className="h-8 w-28 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="mx-auto w-full max-w-2xl">
            <div className="h-16 animate-pulse rounded-lg bg-gray-200" />
          </div>
        </div>

        {/* 요일 선택 영역 스켈레톤 */}
        <div className="mb-8 flex justify-center">
          <div className="flex gap-2">
            {Array.from({ length: 9 }).map((_, index) => (
              <div
                key={index}
                className="h-10 w-16 animate-pulse rounded-lg bg-gray-200"
              />
            ))}
          </div>
        </div>

        {/* 애니메이션 카드 그리드 스켈레톤 */}
        <div className="grid grid-cols-1 gap-[30px] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: cardCount }).map((_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
            >
              {/* 이미지 영역 */}
              <div className="h-48 w-full animate-pulse bg-gray-200" />

              {/* 텍스트 영역 */}
              <div className="p-4">
                <div className="mb-2 h-5 animate-pulse rounded bg-gray-200" />
                <div className="mb-2 h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
              </div>

              {/* OTT 태그 영역 */}
              <div className="px-4 pb-4">
                <div className="flex gap-2">
                  <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
                  <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
                  <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
