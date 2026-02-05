import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { PostRequestDtoMedium } from '@/types/generated/api';
import { Schemas } from '@/types';
import { showToast } from '@/components/common/Toast';
import { createAnime } from '@/api/admin';

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
      const { result } = await createAnime(formData);
      return result;
    },
    onSuccess: (animeId) => {
      const successMessage = `id:${animeId} 애니메이션이 성공적으로 등록되었습니다.`;
      setMessage(successMessage);
      showToast.success('애니메이션이 성공적으로 등록되었습니다.');
      // 폼 데이터만 리셋하고 메시지는 유지
      resetForm(true);
      // 5초 후에 메시지도 초기화
      setTimeout(() => {
        setMessage('');
      }, 5000);
    },
    onError: (error: Error) => {
      const errorMessage = `오류: ${error.message}`;
      setMessage(errorMessage);
      showToast.error('애니메이션 등록에 실패하였습니다.');
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

  const resetForm = (keepMessage: boolean = false) => {
    setAnimeData(getDefaultAnimeData());
    mainImageRef.current = null;
    if (!keepMessage) {
      setMessage('');
    }
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
    if (animeData.dayOfWeek) formData.append('dayOfWeek', animeData.dayOfWeek);
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
