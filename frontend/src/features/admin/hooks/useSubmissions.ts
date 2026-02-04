import { useState, useEffect, useCallback } from 'react';
import { getSubmissionCountGroupByIp } from '@/api/admin';
import { SubmissionCountDto } from '@/types';
import {
  SUBMISSIONS_PAGE_SIZE,
  SCROLL_THRESHOLD,
} from '@/features/admin/constants';

export function useSubmissions() {
  const [submissions, setSubmissions] = useState<SubmissionCountDto[]>([]);
  const [submissionsPage, setSubmissionsPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const loadSubmissions = useCallback(
    async (page: number = 0, reset: boolean = false) => {
      if (reset) {
        setIsLoadingSubmissions(true);
      } else {
        setIsLoadingMore(true);
      }
      try {
        const response = await getSubmissionCountGroupByIp(
          page,
          SUBMISSIONS_PAGE_SIZE
        );
        if (response.isSuccess) {
          if (reset) {
            setSubmissions(response.result.submissionCountDtos);
          } else {
            setSubmissions((prev) => [
              ...prev,
              ...response.result.submissionCountDtos,
            ]);
          }
          setHasNextPage(response.result.pageInfo.hasNext);
          setSubmissionsPage(page);
        }
      } catch (error) {
        console.error('제출 현황 조회 실패:', error);
        if (reset) {
          setSubmissions([]);
        }
      } finally {
        setIsLoadingSubmissions(false);
        setIsLoadingMore(false);
      }
    },
    []
  );

  // 제출 현황 조회 (초기 로드)
  useEffect(() => {
    loadSubmissions(0, true);
  }, [loadSubmissions]);

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
        !isLoadingMore &&
        !isLoadingSubmissions &&
        !isRequestingSubmissions
      ) {
        isRequestingSubmissions = true;
        try {
          await loadSubmissions(submissionsPage + 1, false);
        } catch (error) {
          console.error('제출 현황 조회 실패:', error);
        } finally {
          isRequestingSubmissions = false;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [
    hasNextPage,
    isLoadingMore,
    isLoadingSubmissions,
    submissionsPage,
    loadSubmissions,
  ]);

  return {
    submissions,
    setSubmissions,
    isLoadingSubmissions,
    isLoadingMore,
    loadSubmissions,
  };
}
