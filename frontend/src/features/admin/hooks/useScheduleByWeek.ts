import { useQuery } from '@tanstack/react-query';
import { getEpisodesByWeek } from '@/api/admin';
import { WeekOption } from './useWeeks';
import { queryConfig } from '@/lib';

export function useScheduleByWeek(selectedWeek: WeekOption | null) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin', 'schedule', selectedWeek?.weekId],
    queryFn: async () => {
      if (!selectedWeek) return null;
      const res = await getEpisodesByWeek(selectedWeek.weekId);
      if (res.isSuccess && res.result) {
        return res.result;
      }
      return null;
    },
    enabled: selectedWeek !== null,
    ...queryConfig.search,
  });

  return {
    schedule: data ?? null,
    loading: isLoading,
    refreshSchedule: refetch,
  };
}
