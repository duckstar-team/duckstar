import { Suspense } from 'react';
import SearchPageContent from '@/components/domain/search/SearchPageContent';
import { SearchSkeleton } from '@/components/skeletons';

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchSkeleton />}>
      <SearchPageContent />
    </Suspense>
  );
}
