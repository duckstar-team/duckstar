import React from 'react';
import BannerSkeleton from './BannerSkeleton';

export default function SurveyDetailSkeleton() {
  return (
    <main className="w-full">
      <BannerSkeleton />
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 h-8 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
      </div>
    </main>
  );
}
