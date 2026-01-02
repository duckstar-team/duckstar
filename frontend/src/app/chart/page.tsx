'use client';

import { useEffect } from 'react';
import { useChart } from '@/components/layout/AppContainer';
import ChartPageContent from '@/components/domain/chart/ChartPageContent';

export default function ChartPage() {
  const { selectedWeek, setSelectedWeek, weeks } = useChart();

  // selectedWeek가 없을 때 최신 주차로 설정
  useEffect(() => {
    if (!selectedWeek && weeks && weeks.length > 0) {
      const latestWeek = weeks.slice().sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        if (a.quarter !== b.quarter) return b.quarter - a.quarter;
        return b.week - a.week;
      })[0];
      setSelectedWeek(latestWeek);
    }
  }, [selectedWeek, weeks, setSelectedWeek]);

  const year = selectedWeek?.year ?? 2025;
  const quarter = selectedWeek?.quarter ?? 3;
  const week = selectedWeek?.week ?? 1;

  const weekLabel =
    selectedWeek !== null && selectedWeek !== undefined
      ? `${selectedWeek.year}년 ${selectedWeek.quarter}분기 ${selectedWeek.week}주차`
      : '25년 4분기 1주차';

  return (
    <ChartPageContent
      year={year}
      quarter={quarter}
      week={week}
      weekLabel={weekLabel}
    />
  );
}
