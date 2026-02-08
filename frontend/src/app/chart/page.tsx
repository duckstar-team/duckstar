'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getWeeks } from '@/api/chart';

export default function ChartIndexPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const redirectToLatestWeek = async () => {
      try {
        const response = await getWeeks(true);
        const weeks = response?.result ?? [];

        if (weeks.length > 0) {
          const latest = [...weeks].sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year;
            if (a.quarter !== b.quarter) return b.quarter - a.quarter;
            return b.week - a.week;
          })[0];
          router.replace(
            `/chart/${latest.year}/${latest.quarter}/${latest.week}`
          );
          return;
        }
        setError('주차 데이터가 없습니다.');
      } catch (e) {
        console.error('차트 주차 조회 실패:', e);
        setError('주차 데이터를 불러오지 못했습니다.');
      }
    };

    redirectToLatestWeek();
  }, [router]);

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <p className="text-center text-gray-600 dark:text-gray-400">
          {error}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            다시 시도
          </button>
          <a
            href="/"
            className="rounded border border-gray-300 px-4 py-2 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
          >
            홈으로
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500" />
        <p className="text-gray-600 dark:text-gray-400">
          최신 차트로 이동 중...
        </p>
      </div>
    </div>
  );
}
