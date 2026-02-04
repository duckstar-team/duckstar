'use client';

import { useState, useRef } from 'react';
import { PostRequestDtoMedium } from '@/types/generated/api';
import { Schemas } from '@/types';

/** PostRequestDto + airTime을 string으로 처리 (기존 방식) */
type AnimeFormData = Omit<Schemas['PostRequestDto'], 'airTime'> & {
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

export default function ContentManagementTab() {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      if (!animeData.titleKor || !animeData.titleKor.trim()) {
        setMessage('한국어 제목은 필수입니다.');
        setIsLoading(false);
        return;
      }

      if (!animeData.medium) {
        setMessage('매체는 필수입니다.');
        setIsLoading(false);
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

      const response = await fetch('/api/admin/animes', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (response.ok) {
        try {
          const result = await response.json();
          setMessage(
            `애니메이션이 성공적으로 추가되었습니다. (ID: ${result.result})`
          );
        } catch (jsonError) {
          setMessage('애니메이션이 성공적으로 추가되었습니다.');
        }

        setAnimeData(getDefaultAnimeData());
        mainImageRef.current = null;
      } else {
        try {
          const errorData = await response.json();
          setMessage(
            `오류: ${errorData.message || '애니메이션 추가에 실패했습니다.'}`
          );
        } catch (jsonError) {
          setMessage(
            `오류: 애니메이션 추가에 실패했습니다. (상태 코드: ${response.status})`
          );
        }
      }
    } catch (error) {
      console.error('API 호출 오류:', error);
      setMessage('네트워크 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border-brand-zinc-200 rounded-lg border p-6 shadow-sm dark:border-none dark:bg-zinc-800">
      <h2 className="mb-6 text-xl font-semibold">새 애니메이션 등록</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label
              htmlFor="titleKor"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-400"
            >
              한국어 제목 *
            </label>
            <input
              type="text"
              id="titleKor"
              name="titleKor"
              value={animeData.titleKor}
              onChange={handleInputChange}
              required
              className="border-brand-zinc-300 w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="한국어 제목을 입력하세요"
            />
          </div>

          <div>
            <label
              htmlFor="titleOrigin"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-400"
            >
              원제
            </label>
            <input
              type="text"
              id="titleOrigin"
              name="titleOrigin"
              value={animeData.titleOrigin}
              onChange={handleInputChange}
              className="border-brand-zinc-300 w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="원제를 입력하세요"
            />
          </div>

          <div>
            <label
              htmlFor="titleEng"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-400"
            >
              영어 제목
            </label>
            <input
              type="text"
              id="titleEng"
              name="titleEng"
              value={animeData.titleEng}
              onChange={handleInputChange}
              className="border-brand-zinc-300 w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="영어 제목을 입력하세요"
            />
          </div>

          <div>
            <label
              htmlFor="medium"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-400"
            >
              매체 *
            </label>
            <select
              id="medium"
              name="medium"
              value={animeData.medium}
              onChange={handleInputChange}
              required
              className="border-brand-zinc-300 w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="TVA">TV 애니메이션</option>
              <option value="MOVIE">영화</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label
              htmlFor="premiereDateTime"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-400"
            >
              첫 방영일시
            </label>
            <input
              type="datetime-local"
              id="premiereDateTime"
              name="premiereDateTime"
              value={animeData.premiereDateTime?.slice(0, 16) ?? ''}
              onChange={handleInputChange}
              className="border-brand-zinc-300 w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">
              {animeData.medium === 'MOVIE'
                ? '극장판은 방영 시간과 요일이 자동 설정되지 않습니다'
                : '입력 시 방영 요일과 방영 시간이 자동으로 설정됩니다'}
            </p>
          </div>

          <div>
            <label
              htmlFor="airTime"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-400"
            >
              방영 시간{' '}
              {animeData.medium === 'MOVIE' && (
                <span className="text-gray-500 dark:text-zinc-400">
                  (극장판은 해당 없음)
                </span>
              )}
            </label>
            <input
              type="text"
              id="airTime"
              name="airTime"
              value={animeData.airTime ?? ''}
              onChange={handleInputChange}
              disabled={animeData.medium === 'MOVIE'}
              className={`border-brand-zinc-300 w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                animeData.medium === 'MOVIE'
                  ? 'cursor-not-allowed bg-gray-100'
                  : ''
              }`}
              placeholder={
                animeData.medium === 'MOVIE'
                  ? '극장판은 해당 없음'
                  : '예: 23:00'
              }
            />
          </div>

          <div>
            <label
              htmlFor="dayOfWeek"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-400"
            >
              방영 요일{' '}
              {animeData.medium === 'MOVIE' && (
                <span className="text-gray-500 dark:text-zinc-400">
                  (극장판은 해당 없음)
                </span>
              )}
            </label>
            <select
              id="dayOfWeek"
              name="dayOfWeek"
              value={animeData.dayOfWeek || ''}
              onChange={handleInputChange}
              disabled={animeData.medium === 'MOVIE'}
              className={`border-brand-zinc-300 w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                animeData.medium === 'MOVIE'
                  ? 'cursor-not-allowed bg-gray-100'
                  : ''
              }`}
            >
              <option value="">
                {animeData.medium === 'MOVIE'
                  ? '극장판은 해당 없음'
                  : '선택하세요'}
              </option>
              <option value="MON">월요일</option>
              <option value="TUE">화요일</option>
              <option value="WED">수요일</option>
              <option value="THU">목요일</option>
              <option value="FRI">금요일</option>
              <option value="SAT">토요일</option>
              <option value="SUN">일요일</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="totalEpisodes"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-400"
            >
              총 화수{' '}
              {animeData.medium === 'MOVIE' && (
                <span className="text-gray-500 dark:text-zinc-400">
                  (극장판은 해당 없음)
                </span>
              )}
            </label>
            <input
              type="number"
              id="totalEpisodes"
              name="totalEpisodes"
              value={animeData.totalEpisodes || ''}
              onChange={handleInputChange}
              disabled={animeData.medium === 'MOVIE'}
              className={`border-brand-zinc-300 w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                animeData.medium === 'MOVIE'
                  ? 'cursor-not-allowed bg-gray-100'
                  : ''
              }`}
              placeholder={
                animeData.medium === 'MOVIE' ? '극장판은 해당 없음' : '예: 12'
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label
              htmlFor="corp"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-400"
            >
              제작사
            </label>
            <input
              type="text"
              id="corp"
              name="corp"
              value={animeData.corp}
              onChange={handleInputChange}
              className="border-brand-zinc-300 w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="제작사를 입력하세요"
            />
          </div>

          <div>
            <label
              htmlFor="director"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-400"
            >
              감독
            </label>
            <input
              type="text"
              id="director"
              name="director"
              value={animeData.director}
              onChange={handleInputChange}
              className="border-brand-zinc-300 w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="감독을 입력하세요"
            />
          </div>

          <div>
            <label
              htmlFor="genre"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-400"
            >
              장르
            </label>
            <input
              type="text"
              id="genre"
              name="genre"
              value={animeData.genre}
              onChange={handleInputChange}
              className="border-brand-zinc-300 w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="장르를 입력하세요"
            />
          </div>

          <div>
            <label
              htmlFor="author"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-400"
            >
              원작
            </label>
            <input
              type="text"
              id="author"
              name="author"
              value={animeData.author}
              onChange={handleInputChange}
              className="border-brand-zinc-300 w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="원작을 입력하세요"
            />
          </div>

          <div>
            <label
              htmlFor="minAge"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-400"
            >
              시청 등급
            </label>
            <select
              id="minAge"
              name="minAge"
              value={animeData.minAge || ''}
              onChange={handleInputChange}
              className="border-brand-zinc-300 w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">시청 등급을 선택하세요</option>
              <option value="0">전체이용가</option>
              <option value="7">7세 이상</option>
              <option value="12">12세 이상</option>
              <option value="15">15세 이상</option>
              <option value="19">19세 이상</option>
            </select>
          </div>
        </div>

        <div>
          <label
            htmlFor="synopsis"
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-400"
          >
            시놉시스
          </label>
          <textarea
            id="synopsis"
            name="synopsis"
            value={animeData.synopsis}
            onChange={handleInputChange}
            rows={4}
            className="border-brand-zinc-300 w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="시놉시스를 입력하세요"
          />
        </div>

        <div>
          <label
            htmlFor="mainImage"
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-400"
          >
            메인 이미지
          </label>
          <input
            type="file"
            id="mainImage"
            name="mainImage"
            accept="image/*"
            onChange={handleInputChange}
            className="border-brand-zinc-300 w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {message && (
          <div
            className={`rounded-md p-4 ${
              message.includes('성공')
                ? 'border border-green-200 bg-green-50 text-green-800 dark:bg-green-900/50 dark:text-green-400'
                : 'border border-red-200 bg-red-50 text-red-800'
            }`}
          >
            {message}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-md bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? '등록 중...' : '애니메이션 등록'}
          </button>
        </div>
      </form>
    </div>
  );
}
