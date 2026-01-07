'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import SearchPageContent from '@/components/domain/search/SearchPageContent';
import { SearchSkeleton } from '@/components/skeletons';

export default function SeasonPage() {
  const params = useParams();
  const year = parseInt(params.year as string);
  const quarter = parseInt(params.quarter as string);

  return (
    <Suspense fallback={<SearchSkeleton />}>
      <SearchPageContent year={year} quarter={quarter} />
    </Suspense>
  );
}
