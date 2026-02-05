import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { PostRequestDtoMedium } from '@/types/generated/api';
import { Schemas } from '@/types';

/** PostRequestDto + airTime을 string으로 처리 (기존 방식) */
export type AnimeFormData = Omit<Schemas['PostRequestDto'], 'airTime'> & {
  airTime?: string;
};

const getDefaultAnimeData = (): AnimeFormData => ({
  titleKor: '',
  titleOrigin: '',
  titleEng: '',
  medium: PostRequestDtoMedium.TVA,
  corp: '',
  director: '',
  genre: '',
  author: '',
  synopsis: '',
  ottDtos: [],
});

export function useAnimeForm() {
  const [animeData, setAnimeData] = useState<AnimeFormData>(() =>
    getDefaultAnimeData()
  );
  const mainImageRef = useRef<File | null>(null);
  const [message, setMessage] = useState('');

  const submitMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/admin/animes', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        try {
          const errorData = await response.json();
          throw new Error(
            errorData.message || '애니메이션 추가에 실패했습니다.'
          );
        } catch (jsonError) {
          throw new Error(
            `애니메이션 추가에 실패했습니다. (상태 코드: ${response.status})`
          );
        }
      }

      try {
        const result = await response.json();
        return result;
      } catch (jsonError) {
        return { result: null };
      }
    },
    onSuccess: (result) => {
      setMessage(
        result.result
          ? `애니메이션이 성공적으로 추가되었습니다. (ID: ${result.result})`
          : '애니메이션이 성공적으로 추가되었습니다.'
      );
      resetForm();
    },
    onError: (error: Error) => {
      setMessage(`오류: ${error.message}`);
    },
  });

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === 'file') {
      const fileInput = e.target as HTMLInputElement;
      mainImageRef.current = fileInput.files?.[0] ?? null;
    } else if (type === 'number') {
      setAnimeData((prev) => ({
        ...prev,
        [name]: value ? parseInt(value) : undefined,
      }));
    } else if (name === 'premiereDateTime') {
      setAnimeData((prev) => {
        const newData = { ...prev, premiereDateTime: value || undefined };
        if (prev.medium !== 'MOVIE' && value) {
          const [date, time] = value.split('T');
          if (date && time) {
            const fullDateTime = new Date(`${date}T${time}`);
            const dayOfWeek = fullDateTime
              .toLocaleDateString('en-US', { weekday: 'short' })
              .toUpperCase();
            return {
              ...newData,
              dayOfWeek: dayOfWeek as Schemas['PostRequestDto']['dayOfWeek'],
              airTime: time,
            };
          }
        }
        return newData;
      });
    } else if (name === 'airTime') {
      setAnimeData((prev) => ({
        ...prev,
        airTime: value || undefined,
      }));
    } else {
      setAnimeData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const resetForm = () => {
    setAnimeData(getDefaultAnimeData());
    mainImageRef.current = null;
    setMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (!animeData.titleKor || !animeData.titleKor.trim()) {
      setMessage('한국어 제목은 필수입니다.');
      return;
    }

    if (!animeData.medium) {
      setMessage('매체는 필수입니다.');
      return;
    }

    const formData = new FormData();

    formData.append('titleKor', animeData.titleKor.trim());
    formData.append('medium', animeData.medium);

    if (animeData.titleOrigin)
      formData.append('titleOrigin', animeData.titleOrigin);
    if (animeData.titleEng) formData.append('titleEng', animeData.titleEng);
    if (animeData.airTime) formData.append('airTime', animeData.airTime);
    if (animeData.premiereDateTime) {
      const dt =
        animeData.premiereDateTime.length > 16
          ? animeData.premiereDateTime
          : `${animeData.premiereDateTime}:00`;
      formData.append('premiereDateTime', dt);
    }
    if (animeData.dayOfWeek)
      formData.append('dayOfWeek', animeData.dayOfWeek);
    if (animeData.totalEpisodes)
      formData.append('totalEpisodes', animeData.totalEpisodes.toString());
    if (animeData.corp) formData.append('corp', animeData.corp);
    if (animeData.director) formData.append('director', animeData.director);
    if (animeData.genre) formData.append('genre', animeData.genre);
    if (animeData.author) formData.append('author', animeData.author);
    if (animeData.minAge)
      formData.append('minAge', animeData.minAge.toString());
    if (animeData.synopsis) formData.append('synopsis', animeData.synopsis);
    if (mainImageRef.current)
      formData.append('mainImage', mainImageRef.current);

    if (animeData.ottDtos && animeData.ottDtos.length > 0) {
      animeData.ottDtos.forEach((ott, index) => {
        formData.append(`ottDtos[${index}].ottType`, ott.ottType);
        formData.append(`ottDtos[${index}].watchUrl`, ott.watchUrl);
      });
    }

    if (animeData.officialSiteString)
      formData.append('officialSiteString', animeData.officialSiteString);

    submitMutation.mutate(formData);
  };

  return {
    animeData,
    mainImageRef,
    isLoading: submitMutation.isPending,
    message,
    setMessage,
    handleInputChange,
    handleSubmit,
    resetForm,
  };
}
