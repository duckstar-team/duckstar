'use client';

import { lazy, Suspense } from 'react';
import SearchLoadingSkeleton from '@/components/common/SearchLoadingSkeleton';

// 애니메이션 상세 컴포넌트를 동적으로 임포트
const AnimeDetailClient = lazy(() => import('@/app/animes/[animeId]/AnimeDetailClient'));

/**
 * 지연 로딩된 애니메이션 상세 컴포넌트
 * 필요할 때만 로딩하여 초기 번들 크기 감소
 */
export default function LazyAnimeDetail() {
  return (
    <Suspense fallback={<SearchLoadingSkeleton />}>
      <AnimeDetailClient />
    </Suspense>
  );
}
