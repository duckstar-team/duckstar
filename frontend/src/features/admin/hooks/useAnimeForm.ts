import { useState, useRef } from 'react';
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
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

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

  return {
    animeData,
    mainImageRef,
    isLoading,
    setIsLoading,
    message,
    setMessage,
    handleInputChange,
    resetForm,
  };
}
