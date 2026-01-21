import React from 'react';
import BannerSkeleton from './BannerSkeleton';

export default function SearchSkeleton() {
  return (
    <div className="w-full">
      {/* 상단 배너 스켈레톤 */}
      <BannerSkeleton />

      {/* 메인 컨텐츠 영역 */}
      <div className="mx-auto w-full max-w-7xl px-6 py-6">
        {/* 검색 필터 영역 스켈레톤 */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-center gap-4">
            <div className="bg-brand-zinc-200 h-8 w-32 animate-pulse rounded" />
            <div className="bg-brand-zinc-200 h-8 w-24 animate-pulse rounded" />
            <div className="bg-brand-zinc-200 h-8 w-28 animate-pulse rounded" />
          </div>
          <div className="mx-auto w-full max-w-2xl">
            <div className="bg-brand-zinc-200 h-16 animate-pulse rounded-lg" />
          </div>
        </div>

        {/* 요일 선택 영역 스켈레톤 */}
        <div className="mb-8 flex justify-center">
          <div className="flex gap-2">
            {Array.from({ length: 9 }).map((_, index) => (
              <div
                key={index}
                className="bg-brand-zinc-200 h-10 w-16 animate-pulse rounded-lg"
              />
            ))}
          </div>
        </div>

        {/* 애니메이션 카드 그리드 스켈레톤 */}
        <div className="grid grid-cols-1 gap-[30px] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 12 }).map((_, index) => (
            <div
              key={index}
              className="border-brand-zinc-200 overflow-hidden rounded-xl border bg-white shadow-sm dark:border-none dark:bg-zinc-800"
            >
              {/* 이미지 영역 */}
              <div className="bg-brand-zinc-200 h-48 w-full animate-pulse" />

              {/* 텍스트 영역 */}
              <div className="p-4">
                <div className="bg-brand-zinc-200 mb-2 h-5 animate-pulse rounded" />
                <div className="bg-brand-zinc-200 mb-2 h-4 w-3/4 animate-pulse rounded" />
                <div className="bg-brand-zinc-200 h-4 w-1/2 animate-pulse rounded" />
              </div>

              {/* OTT 태그 영역 */}
              <div className="px-4 pb-4">
                <div className="flex gap-2">
                  <div className="bg-brand-zinc-200 h-8 w-8 animate-pulse rounded-full" />
                  <div className="bg-brand-zinc-200 h-8 w-8 animate-pulse rounded-full" />
                  <div className="bg-brand-zinc-200 h-8 w-8 animate-pulse rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
