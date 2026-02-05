import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  breakEpisode,
  deleteEpisode,
  patchEpisode,
  queueEpisode,
} from '@/api/admin';
import { showToast } from '@/components/common/Toast';
import { Schemas } from '@/types';

export function useEpisodeActions() {
  const queryClient = useQueryClient();

  const queueEpisodeMutation = useMutation({
    mutationFn: queueEpisode,
    onSuccess: (_, animeId) => {
      showToast.success('에피소드가 추가되었습니다.');
      queryClient.invalidateQueries({
        queryKey: ['admin', 'animes'],
      });
      queryClient.invalidateQueries({
        queryKey: ['admin', 'episodes', animeId],
      });
    },
    onError: () => {
      showToast.error('에피소드 추가에 실패했습니다.');
    },
  });

  const breakEpisodeMutation = useMutation({
    mutationFn: ({
      episodeId,
    }: {
      episodeId: number;
      animeId?: number;
      weekId?: number;
    }) => breakEpisode(episodeId),
    onSuccess: (_, { animeId, weekId }) => {
      showToast.success('휴방 처리되었습니다.');
      if (animeId != null) {
        queryClient.invalidateQueries({
          queryKey: ['admin', 'animes', animeId],
        });
        queryClient.invalidateQueries({
          queryKey: ['admin', 'animes'],
        });
        queryClient.invalidateQueries({
          queryKey: ['admin', 'episodes', animeId],
        });
      }
      if (weekId != null) {
        queryClient.invalidateQueries({
          queryKey: ['admin', 'schedule', weekId],
        });
      }
    },
    onError: () => {
      showToast.error('휴방 처리에 실패했습니다.');
    },
  });

  const deleteEpisodeMutation = useMutation({
    mutationFn: ({
      episodeId,
    }: {
      episodeId: number;
      animeId?: number;
      weekId?: number;
    }) => deleteEpisode(episodeId),
    onSuccess: (_, { animeId, weekId }) => {
      showToast.success('에피소드가 삭제되었습니다.');
      if (animeId != null) {
        queryClient.invalidateQueries({
          queryKey: ['admin', 'animes', animeId],
        });
        queryClient.invalidateQueries({
          queryKey: ['admin', 'animes'],
        });
        queryClient.invalidateQueries({
          queryKey: ['admin', 'episodes', animeId],
        });
      }
      if (weekId != null) {
        queryClient.invalidateQueries({
          queryKey: ['admin', 'schedule', weekId],
        });
      }
    },
    onError: () => {
      showToast.error('에피소드 삭제에 실패했습니다.');
    },
  });

  const patchEpisodeMutation = useMutation({
    mutationFn: ({
      episodeId,
      body,
    }: {
      episodeId: number;
      body: Partial<Schemas['ModifyRequestDto']>;
      animeId?: number;
      weekId?: number;
    }) => patchEpisode(episodeId, body as Schemas['ModifyRequestDto']),
    onSuccess: (_, { animeId, weekId }) => {
      showToast.success('에피소드가 수정되었습니다.');
      if (animeId != null) {
        queryClient.invalidateQueries({
          queryKey: ['admin', 'animes', animeId],
        });
        queryClient.invalidateQueries({
          queryKey: ['admin', 'episodes', animeId],
        });
      }
      queryClient.invalidateQueries({
        queryKey: ['admin', 'animes'],
      });
      if (weekId != null) {
        queryClient.invalidateQueries({
          queryKey: ['admin', 'schedule', weekId],
        });
      }
      // 어떤 수정이든 주차별 편성표에 영향을 줄 수 있으므로 전체 스케줄 쿼리도 무효화
      queryClient.invalidateQueries({
        queryKey: ['admin', 'schedule'],
      });
    },
    onError: () => {
      showToast.error('에피소드 수정에 실패했습니다.');
    },
  });

  const handleQueueEpisode = (animeId: number) => {
    queueEpisodeMutation.mutate(animeId);
  };

  const handleBreakEpisode = (
    episodeId: number,
    options?: { animeId?: number; weekId?: number }
  ) => {
    breakEpisodeMutation.mutate({ episodeId, ...options });
  };

  const handleDeleteEpisode = (
    episodeId: number,
    options?: { animeId?: number; weekId?: number }
  ) => {
    if (!confirm('이 에피소드를 삭제하시겠습니까?')) return;
    deleteEpisodeMutation.mutate({ episodeId, ...options });
  };

  const handleUpdateEpisode = (
    episodeId: number,
    body: Partial<Schemas['ModifyRequestDto']>,
    options?: { animeId?: number; weekId?: number }
  ) => {
    patchEpisodeMutation.mutate({ episodeId, body, ...options });
  };

  return {
    handleQueueEpisode,
    handleBreakEpisode,
    handleDeleteEpisode,
    handleUpdateEpisode,
  };
}
