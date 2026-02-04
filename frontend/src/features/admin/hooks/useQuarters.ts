import { useState, useEffect } from 'react';
import { getQuarters } from '@/api/search';
import { Schemas } from '@/types';
import { toQuarterOptionValue } from '@/features/admin/utils';

export interface QuarterOption {
  label: string;
  year: number;
  quarter: number;
  /** 드롭다운 옵션 구분용 (year*100+quarter) */
  optionValue: number;
}

export function useQuarters() {
  const [quarterOptions, setQuarterOptions] = useState<QuarterOption[]>([]);
  const [selectedQuarter, setSelectedQuarter] = useState<QuarterOption | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchQuarters = async () => {
      setLoading(true);
      try {
        const res = await getQuarters();
        if (cancelled || !res.isSuccess || !res.result) return;
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
        setQuarterOptions(list);
        if (list.length > 0 && selectedQuarter === null) {
          setSelectedQuarter(list[0]);
        }
      } catch (e) {
        // 에러 처리
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    fetchQuarters();
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    quarterOptions,
    selectedQuarter,
    setSelectedQuarter,
    loading,
  };
}
