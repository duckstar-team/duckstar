import React from 'react';
import BannerSkeleton from './BannerSkeleton';

interface CandidateCardSkeletonProps {
  showBanner?: boolean;
  cardCount?: number;
  className?: string;
}

export default function CandidateCardSkeleton({
  showBanner = true,
  cardCount = 6,
  className = '',
}: CandidateCardSkeletonProps) {
  return (
    <main className={`w-full ${className}`}>
      {showBanner && <BannerSkeleton />}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {Array.from({ length: cardCount }).map((_, index) => (
          <div
            key={index}
            className="rounded-xl border border-brand-zinc-200 bg-white dark:bg-zinc-800 p-4 shadow"
          >
            <div className="flex items-center gap-4">
              <div className="h-36 w-28 animate-pulse rounded-md bg-brand-zinc-200" />
              <div className="flex-1">
                <div className="mb-2 h-6 animate-pulse rounded bg-brand-zinc-200" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-brand-zinc-200" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

