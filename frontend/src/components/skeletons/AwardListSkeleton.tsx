import React from 'react';

interface AwardListSkeletonProps {
  cardCount?: number;
  className?: string;
}

export default function AwardListSkeleton({
  cardCount = 6,
  className = '',
}: AwardListSkeletonProps) {
  return (
    <main className={`max-width ${className}`}>
      <div className="flex flex-col gap-10 @lg:flex-row @lg:items-start @lg:gap-8">
        {/* 덕스타 어워드 리스트 (좌측) */}
        <div className="flex-1">
          <div className="mb-5 h-8 w-48 animate-pulse rounded bg-brand-zinc-200" />
          <div className="grid grid-cols-1 gap-4 @sm:grid-cols-2">
            {Array.from({ length: cardCount }).map((_, index) => (
              <div
                key={index}
                className="group flex min-h-32 flex-col overflow-hidden rounded-lg bg-white dark:bg-zinc-800 dark:shadow-none shadow-lg shadow-brand-zinc-200/80 @lg:min-h-48"
              >
                {/* 이미지 썸네일 */}
                <div className="relative w-full">
                  <div className="h-32 w-full animate-pulse bg-brand-zinc-200 @lg:h-48" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
                </div>

                {/* 카드 내용 */}
                <div className="flex w-full flex-col justify-between gap-4 p-3 @md:p-4">
                  <div className="flex flex-col gap-2">
                    {/* 상태 배지 + 제목 */}
                    <div className="flex flex-col gap-2 @sm:flex-row @sm:items-center @md:gap-3">
                      <div className="h-6 w-16 animate-pulse rounded-md bg-brand-zinc-200" />
                      <div className="h-6 w-40 animate-pulse rounded bg-brand-zinc-200 @sm:h-7 @md:h-8" />
                    </div>
                    {/* 날짜 */}
                    <div className="h-4 w-48 animate-pulse rounded bg-brand-zinc-200 @max-sm:h-3" />
                  </div>

                  {/* 버튼 */}
                  <div className="mt-2 h-10 w-full animate-pulse rounded-full bg-brand-zinc-200" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 커스텀 어워드 투표 링크 (우측 패널) */}
        <div className="w-full @lg:w-[373px]">
          <div className="mb-5 h-8 w-48 animate-pulse rounded bg-brand-zinc-200" />
          <div className="flex w-full flex-col gap-4">
            {Array.from({ length: 2 }).map((_, index) => (
              <div
                key={index}
                className="flex h-20 rounded-lg bg-white dark:bg-zinc-800 dark:shadow-none shadow-lg shadow-brand-zinc-200/80"
              >
                <div className="flex flex-1 items-center gap-4 p-3 @md:p-4">
                  <div className="size-5 animate-pulse rounded bg-brand-zinc-200" />
                  <div className="h-6 flex-1 animate-pulse rounded bg-brand-zinc-200" />
                  <div className="size-5 animate-pulse rounded bg-brand-zinc-200" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
