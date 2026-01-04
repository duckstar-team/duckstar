'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useChart } from '@/components/layout/AppContainer';
import ChartPageContent from './_components/ChartPageContent';

export default function ChartPage() {
  const params = useParams();
  const { selectedWeek, setSelectedWeek, weeks } = useChart();

  const year = params.year ? Number(params.year) : null;
  const quarter = params.quarter ? Number(params.quarter) : null;
  const week = params.week ? Number(params.week) : null;

  // URL 파라미터를 기반으로 selectedWeek 설정 (새로고침 시에도 유지)
  useEffect(() => {
    if (year && quarter && week) {
      // 현재 selectedWeek와 비교하여 실제로 변경되었을 때만 업데이트
      if (
        selectedWeek?.year !== year ||
        selectedWeek?.quarter !== quarter ||
        selectedWeek?.week !== week
      ) {
        const weekInfo = weeks?.find(
          (w) => w.year === year && w.quarter === quarter && w.week === week
        );

        setSelectedWeek({
          year,
          quarter,
          week,
          startDate: weekInfo?.startDate || selectedWeek?.startDate || '',
          endDate: weekInfo?.endDate || selectedWeek?.endDate || '',
        });
      }
    }
  }, [year, quarter, week, setSelectedWeek, weeks]);

  return <ChartPageContent />;
}
