import { useState } from 'react';
import { getEpisodesByAnimeAdmin } from '@/api/admin';
import { AdminEpisodeDto } from '@/types';

export function useEpisodesByAnime() {
  const [episodesByAnime, setEpisodesByAnime] = useState<
    Record<number, AdminEpisodeDto[]>
  >({});
  const [loadingEpisodes, setLoadingEpisodes] = useState<
    Record<number, boolean>
  >({});

  const loadEpisodes = async (animeId: number) => {
    if (episodesByAnime[animeId]) return;

    setLoadingEpisodes((prev) => ({ ...prev, [animeId]: true }));
    try {
      const res = await getEpisodesByAnimeAdmin(animeId);
      if (res.isSuccess && res.result?.adminEpisodeDtos) {
        setEpisodesByAnime((prev) => ({
          ...prev,
          [animeId]: res.result!.adminEpisodeDtos!,
        }));
      }
    } catch (e) {
      // 에러 처리
    } finally {
      setLoadingEpisodes((prev) => ({ ...prev, [animeId]: false }));
    }
  };

  const refreshEpisodes = async (animeId: number) => {
    setLoadingEpisodes((prev) => ({ ...prev, [animeId]: true }));
    try {
      const res = await getEpisodesByAnimeAdmin(animeId);
      if (res.isSuccess && res.result?.adminEpisodeDtos) {
        setEpisodesByAnime((prev) => ({
          ...prev,
          [animeId]: res.result!.adminEpisodeDtos!,
        }));
      }
    } catch (e) {
      // 에러 처리
    } finally {
      setLoadingEpisodes((prev) => ({ ...prev, [animeId]: false }));
    }
  };

  return {
    episodesByAnime,
    loadingEpisodes,
    loadEpisodes,
    refreshEpisodes,
  };
}
