'use client';

import { useAnimeForm } from '@/features/admin/hooks/mutations/useAnimeForm';

export default function ContentManagementTab() {
  const { animeData, isLoading, message, handleInputChange, handleSubmit } =
    useAnimeForm();

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
                ? 'border border-green-200 bg-green-100/80 text-green-500 dark:border-green-400/20 dark:bg-green-900/20'
                : 'border border-red-200 bg-red-100/80 text-red-500 dark:border-red-400/20 dark:bg-red-900/20'
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
