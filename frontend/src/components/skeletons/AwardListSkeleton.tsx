import React from 'react';
import BannerSkeleton from './BannerSkeleton';

interface AwardListSkeletonProps {
  showBanner?: boolean;
  cardCount?: number;
  className?: string;
}

export default function AwardListSkeleton({
  showBanner = true,
  cardCount = 6,
  className = '',
}: AwardListSkeletonProps) {
  return (
    <main className={`w-full ${className}`}>
      {showBanner && <BannerSkeleton />}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: cardCount }).map((_, index) => (
          <div
            key={index}
            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="mb-4 h-6 w-3/4 animate-pulse rounded bg-gray-200" />
            <div className="mb-2 h-4 w-1/2 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
          </div>
        ))}
      </div>
    </main>
  );
}

