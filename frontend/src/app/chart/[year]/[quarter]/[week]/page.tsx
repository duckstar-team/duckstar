'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useChart } from '@/components/layout/AppContainer';
import ChartPageContent from '@/components/domain/chart/ChartPageContent';

export default function ChartPage() {
  const params = useParams();
  const { setSelectedWeek } = useChart();

  const year = Number(params.year);
  const quarter = Number(params.quarter);
  const week = Number(params.week);

  // URL 파라미터를 기반으로 selectedWeek 설정 (새로고침 시에도 유지)
  useEffect(() => {
    if (year && quarter && week) {
      setSelectedWeek({
        year,
        quarter,
        week,
        startDate: '',
        endDate: '',
      });
    }
  }, [year, quarter, week, setSelectedWeek]);

  const weekLabel = `${year}년 ${quarter}분기 ${week}주차`;

  return (
    <ChartPageContent
      year={year}
      quarter={quarter}
      week={week}
      weekLabel={weekLabel}
    />
  );
}
