import { useState, useEffect } from 'react';
import { getAnimesByQuarter } from '@/api/admin';
import { Schemas } from '@/types';
import { QuarterOption } from './useQuarters';

export function useAnimesByQuarter(selectedQuarter: QuarterOption | null) {
  const [animes, setAnimes] = useState<Schemas['AdminAnimeDto'][]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedQuarter == null) return;
    setLoading(true);
    const fetchAnimes = async () => {
      try {
        const res = await getAnimesByQuarter(
          selectedQuarter.year,
          selectedQuarter.quarter,
          0,
          100
        );
        if (res.isSuccess && res.result?.adminAnimeDtos) {
          setAnimes(res.result.adminAnimeDtos);
        } else {
          setAnimes([]);
        }
      } catch (e) {
        setAnimes([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAnimes();
  }, [selectedQuarter]);

  return {
    animes,
    setAnimes,
    loading,
  };
}
