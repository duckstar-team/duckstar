import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getQuarters } from '@/api/search';
import { Schemas } from '@/types';
import { toQuarterOptionValue } from '@/features/admin/utils';
import { queryConfig } from '@/lib';

export interface QuarterOption {
  label: string;
  year: number;
  quarter: number;
  /** 드롭다운 옵션 구분용 (year*100+quarter) */
  optionValue: number;
}

export function useQuarters() {
  const [selectedQuarter, setSelectedQuarter] = useState<QuarterOption | null>(
    null
  );

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'quarters'],
    queryFn: async () => {
      const res = await getQuarters();
      if (!res.isSuccess || !res.result) return [];
      const list: QuarterOption[] = [];
      res.result.forEach((item: Schemas['QuarterResponseDto']) => {
        const year = item.year;
        (item.quarters ?? []).forEach((q: number) => {
          list.push({
            label: `${year}년 ${q}분기`,
            year,
            quarter: q,
            optionValue: toQuarterOptionValue(year, q),
          });
        });
      });
      return list;
    },
    ...queryConfig.search,
  });

  const quarterOptions = data ?? [];

  // 첫 번째 분기를 기본 선택
  useEffect(() => {
    if (quarterOptions.length > 0 && selectedQuarter === null) {
      setSelectedQuarter(quarterOptions[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return {
    quarterOptions,
    selectedQuarter,
    setSelectedQuarter,
    loading: isLoading,
  };
}
