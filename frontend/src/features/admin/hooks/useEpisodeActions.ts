import { useMutation, useQueryClient } from '@tanstack/react-query';
import { breakEpisode, deleteEpisode, queueEpisode } from '@/api/admin';
import { showToast } from '@/components/common/Toast';

export function useEpisodeActions() {
  const queryClient = useQueryClient();

  const queueEpisodeMutation = useMutation({
    mutationFn: queueEpisode,
    onSuccess: (_, animeId) => {
      showToast.success('에피소드가 추가되었습니다.');
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

  return {
    handleQueueEpisode,
    handleBreakEpisode,
    handleDeleteEpisode,
  };
}
