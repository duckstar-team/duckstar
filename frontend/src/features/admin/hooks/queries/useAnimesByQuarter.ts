import { useQuery } from '@tanstack/react-query';
import { getAnimesByQuarter } from '@/api/admin';
import { QuarterOption } from './useQuarters';
import { queryConfig } from '@/lib';

export function useAnimesByQuarter(selectedQuarter: QuarterOption | null) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: [
      'admin',
      'animes',
      selectedQuarter?.year,
      selectedQuarter?.quarter,
    ],
    queryFn: async () => {
      if (!selectedQuarter) return [];
      const res = await getAnimesByQuarter(
        selectedQuarter.year,
        selectedQuarter.quarter,
        0,
        100
      );
      if (res.isSuccess && res.result?.adminAnimeDtos) {
        return res.result.adminAnimeDtos;
      }
      return [];
    },
    enabled: selectedQuarter !== null,
    ...queryConfig.search,
  });

  return {
    animes: data?.sort((a, b) => b.animeId - a.animeId) ?? [],
    loading: isLoading,
    refetch,
  };
}
