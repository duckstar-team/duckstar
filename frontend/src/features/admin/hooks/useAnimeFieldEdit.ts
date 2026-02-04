import { useState } from 'react';
import { updateAnimeInfo, updateAnimeTotalEpisodes } from '@/api/admin';
import { Schemas } from '@/types';
import {
  InfoRequestDtoStatus,
  PostRequestDtoDayOfWeek,
} from '@/types/generated/api';
import { showToast } from '@/components/common/Toast';
import { parseAirTime, airTimeToString } from '@/features/admin/utils';

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
  setAnimes: React.Dispatch<React.SetStateAction<Schemas['AdminAnimeDto'][]>>,
  onSuccess?: () => void
) {
  const [editingField, setEditingField] = useState<EditingField | null>(null);
  const [editingValues, setEditingValues] = useState<EditingValues>({});

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

  const handleFieldSave = async (animeId: number, field: EditableField) => {
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

      try {
        const res = await updateAnimeTotalEpisodes(animeId, newTotal);
        if (res.isSuccess) {
          showToast.success('총 화수가 수정되었습니다.');
          setAnimes((prev) =>
            prev.map((a) =>
              a.animeId === animeId ? { ...a, totalEpisodes: newTotal } : a
            )
          );
        } else {
          showToast.error('총 화수 수정에 실패했습니다.');
        }
      } catch (e) {
        showToast.error('총 화수 수정에 실패했습니다.');
      } finally {
        setEditingField(null);
        setEditingValues({});
      }

      return;
    }

    const value = editingValues[field];
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
      const parsedTime = parseAirTime(value as string);
      if (!parsedTime) {
        showToast.error('올바른 시간 형식을 입력하세요 (예: 23:00)');
        return;
      }
      const currentTime = anime.airTime;
      if (
        !currentTime ||
        currentTime.hour !== parsedTime.hour ||
        currentTime.minute !== parsedTime.minute
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

    try {
      const updateData: Schemas['InfoRequestDto'] =
        {} as Schemas['InfoRequestDto'];

      if (field === 'airTime') {
        const parsedTime = parseAirTime(value as string);
        if (!parsedTime) {
          showToast.error('올바른 시간 형식을 입력하세요 (예: 23:00)');
          return;
        }
        updateData.airTime = parsedTime;
        updateData.dayOfWeek = anime.dayOfWeek as PostRequestDtoDayOfWeek;
        updateData.status = anime.status as InfoRequestDtoStatus;
        updateData.corp = anime.corp ?? '';
      } else if (field === 'corp') {
        updateData.corp = value as string;
        updateData.dayOfWeek = anime.dayOfWeek as PostRequestDtoDayOfWeek;
        updateData.status = anime.status as InfoRequestDtoStatus;
        updateData.airTime = anime.airTime as Schemas['LocalTime'];
      } else if (field === 'dayOfWeek') {
        updateData.dayOfWeek = value as PostRequestDtoDayOfWeek;
        updateData.status = anime.status as InfoRequestDtoStatus;
        updateData.airTime = anime.airTime as Schemas['LocalTime'];
        updateData.corp = anime.corp ?? '';
      } else if (field === 'status') {
        updateData.status = value as InfoRequestDtoStatus;
        updateData.dayOfWeek = anime.dayOfWeek as PostRequestDtoDayOfWeek;
        updateData.airTime = anime.airTime as Schemas['LocalTime'];
        updateData.corp = anime.corp ?? '';
      }

      const res = await updateAnimeInfo(animeId, updateData);
      if (res.isSuccess) {
        showToast.success('수정되었습니다.');
        onSuccess?.();
      } else {
        showToast.error('수정에 실패했습니다.');
      }
    } catch (e) {
      showToast.error('수정에 실패했습니다.');
    } finally {
      setEditingField(null);
      setEditingValues({});
    }
  };

  const handleFieldCancel = () => {
    setEditingField(null);
    setEditingValues({});
  };

  return {
    editingField,
    editingValues,
    setEditingValues,
    handleFieldEdit,
    handleFieldSave,
    handleFieldCancel,
  };
}
