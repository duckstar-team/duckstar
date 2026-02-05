import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getEpisodesByAnimeAdmin } from '@/api/admin';
import { queryConfig } from '@/lib';

export function useEpisodesByAnime(animeId: number | null) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'episodes', animeId],
    queryFn: async () => {
      if (!animeId) return null;
      const res = await getEpisodesByAnimeAdmin(animeId);
      if (res.isSuccess && res.result?.adminEpisodeDtos) {
        return res.result.adminEpisodeDtos;
      }
      return null;
    },
    enabled: animeId !== null,
    ...queryConfig.search,
  });

  const refreshEpisodes = useCallback(() => {
    if (animeId !== null) {
      queryClient.invalidateQueries({
        queryKey: ['admin', 'episodes', animeId],
      });
    }
  }, [animeId, queryClient]);

  return {
    episodes: data ?? null,
    loading: isLoading,
    refreshEpisodes,
  };
}
