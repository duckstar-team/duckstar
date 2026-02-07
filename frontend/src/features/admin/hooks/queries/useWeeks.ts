import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getWeeks } from '@/api/chart';
import { WeekDto } from '@/types';
import { toWeekOptionValue } from '@/features/admin/utils';
import { formatWeekLabel, queryConfig } from '@/lib';

export interface WeekOption {
  /** API에 넘길 weekId */
  weekId: number;
  label: string;
  week: WeekDto;
  /** 드롭다운 옵션 구분용 */
  optionValue: number;
}

export function useWeeks() {
  const [selectedWeek, setSelectedWeek] = useState<WeekOption | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'weeks'],
    queryFn: async () => {
      const res = await getWeeks(false);
      if (!res.isSuccess || !res.result) return [];
      return (res.result as WeekDto[]).map((w) => ({
        weekId: w.id ?? 0,
        label: formatWeekLabel(w.year, w.quarter, w.week),
        week: w,
        optionValue: toWeekOptionValue(w),
      }));
    },
    ...queryConfig.search,
  });

  const weekOptions = data?.sort((a, b) => b.weekId - a.weekId) ?? [];

  // 첫 번째 주차를 기본 선택
  useEffect(() => {
    if (weekOptions.length > 0 && selectedWeek === null) {
      setSelectedWeek(weekOptions[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return {
    weekOptions,
    selectedWeek,
    setSelectedWeek,
    loading: isLoading,
  };
}
