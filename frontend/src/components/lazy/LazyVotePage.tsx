'use client';

import { lazy, Suspense } from 'react';
import SearchLoadingSkeleton from '@/components/common/SearchLoadingSkeleton';

// 투표 페이지 컴포넌트를 동적으로 임포트
const VotePageContent = lazy(() => import('@/app/vote/page').then(module => ({ default: module.default })));

/**
 * 지연 로딩된 투표 페이지 컴포넌트
 * 필요할 때만 로딩하여 초기 번들 크기 감소
 */
export default function LazyVotePage() {
  return (
    <Suspense fallback={<SearchLoadingSkeleton />}>
      <VotePageContent />
    </Suspense>
  );
}
