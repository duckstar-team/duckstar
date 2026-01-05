'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import SearchPageContent from '@/components/domain/search/SearchPageContent';
import { SearchSkeleton } from '@/components/skeletons';

function SeasonPageContent() {
  const params = useParams();
  const year = parseInt(params.year as string);
  const quarter = parseInt(params.quarter as string);

  return <SearchPageContent year={year} quarter={quarter} />;
}

export default function SeasonPage() {
  return (
    <Suspense fallback={<SearchSkeleton />}>
      <SeasonPageContent />
    </Suspense>
  );
}
