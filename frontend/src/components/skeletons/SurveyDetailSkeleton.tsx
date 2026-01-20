import React from 'react';

export default function SurveyDetailSkeleton() {
  return (
    <main className="max-width">
      {/* 안내 메시지 섹션 */}
      <section className="mb-4 flex justify-center">
        <div className="h-10 w-80 animate-pulse rounded-md bg-brand-zinc-200" />
      </section>

      {/* 투표 상태 섹션 */}
      <section className="@container mt-4 border-b border-brand-zinc-200 bg-white dark:bg-zinc-800 py-4">
        <div className="flex items-center justify-between gap-8 @max-lg:flex-col @lg:gap-16">
          {/* Vote Status */}
          <div className="order-2 w-full @lg:w-auto">
            <div className="flex flex-col items-center gap-2 @sm:flex-row">
              <div className="h-12 w-32 animate-pulse rounded-lg bg-brand-zinc-200" />
            </div>
          </div>

          {/* Search Bar */}
          <div className="order-1 flex w-full items-center justify-between gap-3 p-4 @lg:order-2 @lg:w-auto">
            <div className="min-w-2/3 @lg:min-w-100">
              <div className="h-10 w-full animate-pulse rounded-lg bg-brand-zinc-200" />
            </div>
            <div className="h-10 w-20 animate-pulse rounded-lg bg-brand-zinc-200" />
          </div>
        </div>
      </section>

      {/* 애니메이션 카드 목록 */}
      <section className="py-6">
        <div className="mb-6 h-4 w-48 animate-pulse rounded bg-brand-zinc-200" />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="rounded-xl border border-brand-zinc-200 bg-white dark:bg-zinc-800 p-4 shadow"
            >
              <div className="flex items-center gap-4">
                <div className="h-36 w-28 animate-pulse rounded-md bg-brand-zinc-200" />
                <div className="flex-1">
                  <div className="mb-2 h-6 animate-pulse rounded bg-brand-zinc-200" />
                  <div className="h-4 w-3/4 animate-pulse rounded bg-brand-zinc-200" />
                  <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-brand-zinc-200" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
