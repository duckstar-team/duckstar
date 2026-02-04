import { useState, useEffect } from 'react';
import { getEpisodesByWeek } from '@/api/admin';
import { Schemas } from '@/types';
import { WeekOption } from './useWeeks';

export function useScheduleByWeek(selectedWeek: WeekOption | null) {
  const [schedule, setSchedule] = useState<
    Schemas['AdminScheduleInfoDto'] | null
  >(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedWeek == null) return;
    setLoading(true);
    getEpisodesByWeek(selectedWeek.weekId)
      .then((res) => {
        if (res.isSuccess && res.result) {
          setSchedule(res.result);
        } else {
          setSchedule(null);
        }
      })
      .catch(() => setSchedule(null))
      .finally(() => setLoading(false));
  }, [selectedWeek]);

  const refreshSchedule = () => {
    if (selectedWeek == null) return;
    getEpisodesByWeek(selectedWeek.weekId).then((res) => {
      if (res.isSuccess && res.result) setSchedule(res.result);
    });
  };

  return {
    schedule,
    loading,
    refreshSchedule,
  };
}
