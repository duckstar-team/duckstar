'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { pageview } from '@/utils/gtag';

/**
 * 페이지뷰 자동 추적 컴포넌트
 * Next.js App Router에서 페이지 네비게이션 시 자동으로 페이지뷰를 추적합니다.
 */
export default function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // URL 생성 (쿼리 파라미터 포함)
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    
    // 페이지뷰 추적
    pageview(url);
  }, [pathname, searchParams]);

  return null;
}

