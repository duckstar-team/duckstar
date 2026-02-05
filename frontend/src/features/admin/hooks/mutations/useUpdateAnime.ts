import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  setAnimeTotalEpisodesUnknown,
  updateAnimeInfo,
  updateAnimeTotalEpisodes,
  updateAnimeImage,
} from '@/api/admin';
import { Schemas } from '@/types';
import {
  InfoRequestDtoStatus,
  PostRequestDtoDayOfWeek,
} from '@/types/generated/api';
import { showToast } from '@/components/common/Toast';
import {
  parseAirTime,
  airTimeToString,
  convertAirTimeForServer,
} from '@/features/admin/utils';
import { QuarterOption } from '../queries/useQuarters';

type EditableField =
  | 'dayOfWeek'
  | 'status'
  | 'airTime'
  | 'corp'
  | 'totalEpisodes';

interface EditingField {
  animeId: number;
  field: EditableField;
}

interface EditingValues {
  dayOfWeek?: PostRequestDtoDayOfWeek;
  status?: InfoRequestDtoStatus;
  airTime?: string;
  corp?: string;
  totalEpisodes?: string;
}

export function useAnimeFieldEdit(
  animes: Schemas['AdminAnimeDto'][],
  selectedQuarter: QuarterOption | null,
  onSuccess?: () => void
) {
  const queryClient = useQueryClient();
  const [editingField, setEditingField] = useState<EditingField | null>(null);
  const [editingValues, setEditingValues] = useState<EditingValues>({});

  const updateAnimeInfoMutation = useMutation({
    mutationFn: ({
      animeId,
      updateData,
    }: {
      animeId: number;
      updateData: Schemas['InfoRequestDto'];
    }) => updateAnimeInfo(animeId, updateData),
    onSuccess: () => {
      showToast.success('수정되었습니다.');
      // 애니메이션 목록 쿼리 무효화
      if (selectedQuarter) {
        queryClient.invalidateQueries({
          queryKey: [
            'admin',
            'animes',
            selectedQuarter.year,
            selectedQuarter.quarter,
          ],
        });
      }
      // 관리 로그도 함께 무효화
      queryClient.invalidateQueries({
        queryKey: ['admin', 'logs'],
      });
      onSuccess?.();
    },
    onError: () => {
      showToast.error('수정에 실패했습니다.');
    },
  });

  const updateTotalEpisodesMutation = useMutation({
    mutationFn: ({
      animeId,
      totalEpisodes,
    }: {
      animeId: number;
      totalEpisodes: number;
    }) => updateAnimeTotalEpisodes(animeId, totalEpisodes),
    onSuccess: async (_, { animeId }) => {
      showToast.success('총 화수가 수정되었습니다.');
      // 애니메이션 목록 쿼리 무효화 및 refetch
      if (selectedQuarter) {
        await queryClient.invalidateQueries({
          queryKey: [
            'admin',
            'animes',
            selectedQuarter.year,
            selectedQuarter.quarter,
          ],
        });
        // 명시적으로 refetch
        await queryClient.refetchQueries({
          queryKey: [
            'admin',
            'animes',
            selectedQuarter.year,
            selectedQuarter.quarter,
          ],
        });
      }
      // 에피소드 목록도 함께 무효화
      queryClient.invalidateQueries({
        queryKey: ['admin', 'episodes', animeId],
      });
      // 관리 로그도 함께 무효화
      queryClient.invalidateQueries({
        queryKey: ['admin', 'logs'],
      });
    },
    onError: () => {
      showToast.error('총 화수 수정에 실패했습니다.');
    },
  });

  const setAnimeTotalEpisodesUnknownMutation = useMutation({
    mutationFn: ({ animeId }: { animeId: number }) =>
      setAnimeTotalEpisodesUnknown(animeId),
    onSuccess: (_, { animeId }) => {
      showToast.success('총 화수가 수정되었습니다.');
      // 애니메이션 목록 쿼리 무효화
      if (selectedQuarter) {
        queryClient.invalidateQueries({
          queryKey: [
            'admin',
            'animes',
            selectedQuarter.year,
            selectedQuarter.quarter,
          ],
        });
      }
      // 에피소드 목록도 함께 무효화
      queryClient.invalidateQueries({
        queryKey: ['admin', 'episodes', animeId],
      });
      // 관리 로그도 함께 무효화
      queryClient.invalidateQueries({
        queryKey: ['admin', 'logs'],
      });
      onSuccess?.();
    },
    onError: () => {
      showToast.error('총 화수 수정에 실패했습니다.');
    },
  });

  const handleFieldEdit = (
    animeId: number,
    field: EditableField,
    currentValue: any
  ) => {
    setEditingField({ animeId, field });
    if (field === 'airTime') {
      setEditingValues({ airTime: airTimeToString(currentValue) });
    } else if (field === 'corp') {
      setEditingValues({ corp: currentValue ?? '' });
    } else if (field === 'dayOfWeek') {
      setEditingValues({ dayOfWeek: currentValue });
    } else if (field === 'status') {
      setEditingValues({ status: currentValue });
    } else if (field === 'totalEpisodes') {
      setEditingValues({
        totalEpisodes:
          currentValue === null || currentValue === undefined
            ? ''
            : String(currentValue),
      });
    }
  };

  const handleFieldSave = async (
    animeId: number,
    field: EditableField,
    valueOverride?: any
  ) => {
    if (field === 'totalEpisodes') {
      const valueStr = (editingValues.totalEpisodes ?? '').trim();

      const anime = animes.find((a) => a.animeId === animeId);
      if (!anime) {
        setEditingField(null);
        setEditingValues({});
        return;
      }

      if (!valueStr) {
        setEditingField(null);
        setEditingValues({});
        return;
      }

      const newTotal = Number(valueStr);
      if (!Number.isFinite(newTotal) || newTotal <= 0) {
        showToast.error('올바른 총 화수를 입력하세요.');
        return;
      }

      if ((anime.totalEpisodes ?? null) === newTotal) {
        setEditingField(null);
        setEditingValues({});
        return;
      }

      updateTotalEpisodesMutation.mutate(
        { animeId, totalEpisodes: newTotal },
        {
          onSettled: () => {
            setEditingField(null);
            setEditingValues({});
          },
        }
      );

      return;
    }

    const value =
      valueOverride !== undefined ? valueOverride : editingValues[field];
    if (value === undefined) {
      setEditingField(null);
      setEditingValues({});
      return;
    }

    const anime = animes.find((a) => a.animeId === animeId);
    if (!anime) {
      setEditingField(null);
      setEditingValues({});
      return;
    }

    // 값 변화 체크
    let hasChanged = false;
    if (field === 'airTime') {
      const timeStr = (value as string).trim();
      if (!timeStr) {
        showToast.error('올바른 시간 형식을 입력하세요 (예: 23:00 또는 24:00~28:59)');
        return;
      }
      const parsedTime = parseAirTime(timeStr);
      if (!parsedTime) {
        showToast.error('올바른 시간 형식을 입력하세요 (예: 23:00 또는 24:00~28:59)');
        return;
      }

      // 기존 airTime은 문자열("HH:mm:ss") 또는 LocalTime 객체일 수 있으므로
      // 둘 다 hour/minute 기준으로 비교해서 실제로 변했을 때만 변경으로 간주
      // 서버에서 온 값이 0~4인 경우(formatAirTime이 24~28로 표시), 사용자 입력(24~28)과 비교하기 위해
      // 서버 값도 24시간 형식으로 변환하여 비교
      const rawCurrentTime: any = anime.airTime;
      let currentTimeHour: number | null = null;
      let currentTimeMinute: number | null = null;

      if (typeof rawCurrentTime === 'string') {
        const [h, m] = rawCurrentTime.split(':');
        const hourNum = parseInt(h, 10);
        const minuteNum = parseInt(m, 10);
        // 서버에서 온 값이 0~4인 경우 24~28로 변환하여 비교
        if (hourNum >= 0 && hourNum < 5) {
          currentTimeHour = hourNum + 24;
        } else {
          currentTimeHour = hourNum;
        }
        currentTimeMinute = minuteNum;
      } else if (
        rawCurrentTime &&
        typeof rawCurrentTime.hour === 'number' &&
        typeof rawCurrentTime.minute === 'number'
      ) {
        // 서버에서 온 값이 0~4인 경우 24~28로 변환하여 비교
        if (rawCurrentTime.hour >= 0 && rawCurrentTime.hour < 5) {
          currentTimeHour = rawCurrentTime.hour + 24;
        } else {
          currentTimeHour = rawCurrentTime.hour;
        }
        currentTimeMinute = rawCurrentTime.minute;
      }

      if (
        currentTimeHour === null ||
        currentTimeMinute === null ||
        currentTimeHour !== parsedTime.hour ||
        currentTimeMinute !== parsedTime.minute
      ) {
        hasChanged = true;
      }
    } else if (field === 'corp') {
      if ((anime.corp ?? '') !== (value as string)) {
        hasChanged = true;
      }
    } else if (field === 'dayOfWeek') {
      if (anime.dayOfWeek !== (value as PostRequestDtoDayOfWeek)) {
        hasChanged = true;
      }
    } else if (field === 'status') {
      if (anime.status !== (value as InfoRequestDtoStatus)) {
        hasChanged = true;
      }
    }

    // 값 변화가 없으면 요청하지 않음
    if (!hasChanged) {
      setEditingField(null);
      setEditingValues({});
      return;
    }

    const updateData: any = {};

    if (field === 'airTime') {
      const timeStr = (value as string).trim();
      const parsedTime = parseAirTime(timeStr);
      if (!parsedTime) {
        showToast.error('올바른 시간 형식을 입력하세요 (예: 23:00 또는 24:00~28:59)');
        return;
      }
      // 서버 전송 시 24:00~28:59를 00:00~04:59로 변환
      const serverTime = convertAirTimeForServer(parsedTime);
      // 백엔드 @JsonFormat이 "HH:mm:ss" 형식의 문자열을 기대함
      updateData.airTime = `${String(serverTime.hour).padStart(2, '0')}:${String(serverTime.minute).padStart(2, '0')}:00`;
      // 00:00~28:59 입력 시 요일 변화 없음
      updateData.dayOfWeek = anime.dayOfWeek as PostRequestDtoDayOfWeek;
      updateData.status = anime.status as InfoRequestDtoStatus;
      updateData.corp = anime.corp ?? '';
    } else if (field === 'corp') {
      updateData.corp = value as string;
      updateData.dayOfWeek = anime.dayOfWeek as PostRequestDtoDayOfWeek;
      updateData.status = anime.status as InfoRequestDtoStatus;
      // 기존 airTime 그대로 전송 (백엔드가 보낸 형식을 유지)
      const airTime: any = anime.airTime;
      if (typeof airTime === 'string') {
        // 예: "23:00:00" 그대로 사용
        updateData.airTime = airTime;
      } else if (
        airTime &&
        typeof airTime.hour === 'number' &&
        typeof airTime.minute === 'number'
      ) {
        // LocalTime 객체 형태인 경우 "HH:mm:00"로 변환
        updateData.airTime = `${String(airTime.hour).padStart(2, '0')}:${String(
          airTime.minute
        ).padStart(2, '0')}:00`;
      }
    } else if (field === 'dayOfWeek') {
      updateData.dayOfWeek = value as PostRequestDtoDayOfWeek;
      updateData.status = anime.status as InfoRequestDtoStatus;
      // 기존 airTime 그대로 전송
      const airTime: any = anime.airTime;
      if (typeof airTime === 'string') {
        updateData.airTime = airTime;
      } else if (
        airTime &&
        typeof airTime.hour === 'number' &&
        typeof airTime.minute === 'number'
      ) {
        updateData.airTime = `${String(airTime.hour).padStart(
          2,
          '0'
        )}:${String(airTime.minute).padStart(2, '0')}:00`;
      }
      updateData.corp = anime.corp ?? '';
    } else if (field === 'status') {
      updateData.status = value as InfoRequestDtoStatus;
      updateData.dayOfWeek = anime.dayOfWeek as PostRequestDtoDayOfWeek;
      // 기존 airTime 그대로 전송
      const airTime: any = anime.airTime;
      if (typeof airTime === 'string') {
        updateData.airTime = airTime;
      } else if (
        airTime &&
        typeof airTime.hour === 'number' &&
        typeof airTime.minute === 'number'
      ) {
        updateData.airTime = `${String(airTime.hour).padStart(
          2,
          '0'
        )}:${String(airTime.minute).padStart(2, '0')}:00`;
      }
      updateData.corp = anime.corp ?? '';
    }

    updateAnimeInfoMutation.mutate(
      { animeId, updateData },
      {
        onSettled: () => {
          setEditingField(null);
          setEditingValues({});
        },
      }
    );
  };

  const handleFieldCancel = () => {
    setEditingField(null);
    setEditingValues({});
  };

  const handleSetTotalEpisodesUnknown = (animeId: number) => {
    const anime = animes.find((a) => a.animeId === animeId);
    if (!anime) return;

    // 이미 unknown이면 요청하지 않음
    if (anime.totalEpisodes === null || anime.totalEpisodes === undefined) {
      return;
    }

    setAnimeTotalEpisodesUnknownMutation.mutate(
      { animeId },
      {
        onSettled: () => {
          setEditingField(null);
          setEditingValues({});
        },
      }
    );
  };

  const updateAnimeImageMutation = useMutation({
    mutationFn: ({
      animeId,
      imageFile,
    }: {
      animeId: number;
      imageFile: File;
    }) => updateAnimeImage(animeId, imageFile),
    onSuccess: () => {
      showToast.success('이미지가 업로드되었습니다.');
      // 애니메이션 목록 쿼리 무효화
      if (selectedQuarter) {
        queryClient.invalidateQueries({
          queryKey: [
            'admin',
            'animes',
            selectedQuarter.year,
            selectedQuarter.quarter,
          ],
        });
      }
      // 관리 로그도 함께 무효화
      queryClient.invalidateQueries({
        queryKey: ['admin', 'logs'],
      });
      onSuccess?.();
    },
    onError: () => {
      showToast.error('이미지 업로드에 실패했습니다.');
    },
    onSettled: () => {
      // 업로드 완료 후 상태 초기화는 컴포넌트에서 처리
    },
  });

  const handleUpdateAnimeImage = (animeId: number, imageFile: File) => {
    updateAnimeImageMutation.mutate({ animeId, imageFile });
  };

  return {
    editingField,
    editingValues,
    setEditingValues,
    handleFieldEdit,
    handleFieldSave,
    handleFieldCancel,
    handleSetTotalEpisodesUnknown,
    handleUpdateAnimeImage,
    isUploadingImage: updateAnimeImageMutation.isPending,
  };
}
