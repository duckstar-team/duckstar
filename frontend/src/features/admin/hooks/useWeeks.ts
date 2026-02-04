import { useState, useEffect } from 'react';
import { getWeeks } from '@/api/chart';
import { WeekDto } from '@/types';
import { toWeekOptionValue } from '@/features/admin/utils';
import { formatWeekLabel } from '@/lib';

export interface WeekOption {
  /** API에 넘길 weekId */
  weekId: number;
  label: string;
  week: WeekDto;
  /** 드롭다운 옵션 구분용 */
  optionValue: number;
}

export function useWeeks() {
  const [weekOptions, setWeekOptions] = useState<WeekOption[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<WeekOption | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getWeeks().then((res) => {
      if (cancelled || !res.isSuccess || !res.result) return;
      const list = (res.result as WeekDto[]).map((w) => ({
        weekId: w.id ?? 0,
        label: formatWeekLabel(w.year, w.quarter, w.week),
        week: w,
        optionValue: toWeekOptionValue(w),
      }));
      setWeekOptions(list);
      if (list.length > 0 && selectedWeek === null) {
        setSelectedWeek(list[0]);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    weekOptions,
    selectedWeek,
    setSelectedWeek,
    loading,
  };
}
