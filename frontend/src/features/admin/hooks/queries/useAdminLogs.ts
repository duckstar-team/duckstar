import { useEffect, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { getAdminLogs } from '@/api/admin';
import { LogFilterType, ManagementLogDto } from '@/types';
import {
  ADMIN_LOG_PAGE_SIZE,
  SCROLL_THRESHOLD,
} from '@/features/admin/constants';
import { queryConfig } from '@/lib';

export function useAdminLogs(
  filterType: LogFilterType,
  scrollRef: React.RefObject<HTMLDivElement | null>
) {
  const isRequestingRef = useRef(false);

  const { data, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['admin', 'logs', filterType],
      queryFn: async ({ pageParam = 0 }) => {
        const res = await getAdminLogs(
          pageParam as number,
          ADMIN_LOG_PAGE_SIZE,
          filterType
        );
        if (res.isSuccess && res.result) {
          return {
            logs: res.result.managementLogDtos ?? [],
            hasNext: res.result.pageInfo?.hasNext ?? false,
          };
        }
        return { logs: [], hasNext: false };
      },
      initialPageParam: 0,
      getNextPageParam: (lastPage, allPages) => {
        return lastPage.hasNext ? allPages.length : undefined;
      },
      ...queryConfig.search,
    });

  const logs: ManagementLogDto[] =
    data?.pages.flatMap((page) => page.logs) ?? [];

  useEffect(() => {
    const el = scrollRef?.current;
    if (!el) return;

    const handleScroll = async () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      if (scrollHeight - scrollTop - clientHeight > SCROLL_THRESHOLD) return;
      if (
        !hasNextPage ||
        isFetchingNextPage ||
        isFetching ||
        isRequestingRef.current
      )
        return;

      isRequestingRef.current = true;
      try {
        await fetchNextPage();
      } catch (e) {
        console.error('로그 조회 실패:', e);
      } finally {
        isRequestingRef.current = false;
      }
    };

    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [hasNextPage, isFetchingNextPage, isFetching, fetchNextPage, scrollRef]);

  return {
    logs,
    isLoading: isFetching && !isFetchingNextPage,
    isLoadingMore: isFetchingNextPage,
  };
}
