import { useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { getSubmissionCountGroupByIp } from '@/api/admin';
import { SubmissionCountDto } from '@/types';
import {
  SUBMISSIONS_PAGE_SIZE,
  SCROLL_THRESHOLD,
} from '@/features/admin/constants';
import { queryConfig } from '@/lib';

export function useSubmissions() {
  const { data, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['admin', 'submissions'],
      queryFn: async ({ pageParam = 0 }) => {
        const response = await getSubmissionCountGroupByIp(
          pageParam as number,
          SUBMISSIONS_PAGE_SIZE
        );
        if (response.isSuccess) {
          return {
            submissions: response.result.submissionCountDtos,
            hasNext: response.result.pageInfo.hasNext,
          };
        }
        return { submissions: [], hasNext: false };
      },
      initialPageParam: 0,
      getNextPageParam: (lastPage, allPages) => {
        return lastPage.hasNext ? allPages.length : undefined;
      },
      ...queryConfig.search,
    });

  const submissions: SubmissionCountDto[] =
    data?.pages.flatMap((page) => page.submissions) ?? [];

  // 무한 스크롤 처리
  useEffect(() => {
    let isRequestingSubmissions = false;

    const handleScroll = async () => {
      const { scrollTop, scrollHeight, clientHeight } =
        document.documentElement;
      const isNearBottom =
        scrollHeight - scrollTop - clientHeight < SCROLL_THRESHOLD;

      if (
        isNearBottom &&
        hasNextPage &&
        !isFetchingNextPage &&
        !isFetching &&
        !isRequestingSubmissions
      ) {
        isRequestingSubmissions = true;
        try {
          await fetchNextPage();
        } catch (error) {
          console.error('제출 현황 조회 실패:', error);
        } finally {
          isRequestingSubmissions = false;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasNextPage, isFetchingNextPage, isFetching, fetchNextPage]);

  return {
    submissions,
    isLoadingSubmissions: isFetching && !isFetchingNextPage,
    isLoadingMore: isFetchingNextPage,
  };
}
