'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

interface QueryProviderProps {
  children: React.ReactNode;
}

export default function QueryProvider({ children }: QueryProviderProps) {
  // QueryClient를 컴포넌트 내부에서 생성하여 SSR 이슈 방지
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5분간 fresh 상태 유지
            gcTime: 10 * 60 * 1000, // 10분간 캐시 유지
            refetchOnWindowFocus: false, // 윈도우 포커스 시 재요청 비활성화
            refetchOnReconnect: true, // 네트워크 재연결 시 재요청
            retry: 3, // 에러 시 3번 재시도
            retryDelay: 5000, // 재시도 간격 5초
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}

      {/* React Query DevTools - 개발 환경에서만 표시 */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
