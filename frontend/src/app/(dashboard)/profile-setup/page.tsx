'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { updateProfile } from '@/api/member';
import { extractFirstFrameFromGif, isGifFile } from '@/lib';

export default function ProfileSetupPage() {
  const router = useRouter();
  const {
    user,
    updateUser,
    withdraw: withdrawUser,
    refreshAuthStatus,
  } = useAuth();
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    user?.profileImageUrl || null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 사용자 정보가 로드되면 초기값 설정
  React.useEffect(() => {
    if (user) {
      setNickname(user.nickname || '');
      setPreviewUrl(user.profileImageUrl || null);
    }
  }, [user]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 파일 크기 검증 (20MB 제한)
      if (file.size > 20 * 1024 * 1024) {
        setError('파일 크기는 20MB 이하여야 합니다.');
        return;
      }

      // 파일 타입 검증
      if (!file.type.startsWith('image/')) {
        setError('이미지 파일만 업로드 가능합니다.');
        return;
      }

      let processedFile = file;

      // GIF 파일인 경우 첫 번째 프레임 추출
      if (isGifFile(file)) {
        setError('GIF 파일을 정적 이미지로 변환 중...');

        try {
          const result = await extractFirstFrameFromGif(file);

          if (result.success && result.file) {
            processedFile = result.file;
            setError(null);
          } else {
            setError(result.error || 'GIF 프레임 추출에 실패했습니다.');
            return;
          }
        } catch (error) {
          setError('GIF 파일 처리 중 오류가 발생했습니다.');
          return;
        }
      }

      setProfileImage(processedFile);
      setError(null);

      // 미리보기 URL 생성
      const url = URL.createObjectURL(processedFile);
      setPreviewUrl(url);
    }
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
    setPreviewUrl(user?.profileImageUrl || null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const trimmedNickname = nickname.trim();

      // 유효성 검사
      if (!trimmedNickname && !profileImage) {
        setError('닉네임 또는 프로필 사진을 변경해주세요.');
        setIsLoading(false);
        return;
      }

      if (trimmedNickname && trimmedNickname.length < 2) {
        setError('닉네임은 2자 이상 입력해주세요.');
        setIsLoading(false);
        return;
      }

      const formData = new FormData();

      // isSkip 필드 추가 (프로필 저장 시 false)
      formData.append('isSkip', 'false');

      if (trimmedNickname) {
        formData.append('nickname', trimmedNickname);
      }

      if (profileImage) {
        formData.append('image', profileImage);
      }

      const response = await updateProfile(formData);

      // 🔑 사용자 정보 업데이트 및 인증 상태 재확인
      if (response.result.mePreviewDto) {
        updateUser(response.result.mePreviewDto);
      }

      // 🔑 인증 상태 재확인 (헤더에 프로필 정보 표시를 위해)
      await refreshAuthStatus();

      // 🔑 인증 상태 재확인 완료 후 리다이렉트 (클라이언트 사이드 라우팅)
      const returnUrl = sessionStorage.getItem('returnUrl');
      if (returnUrl) {
        sessionStorage.removeItem('returnUrl');
        router.push(returnUrl);
      } else {
        router.push('/');
      }
      // 성공 시에는 로딩 상태를 유지 (리다이렉트까지)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '프로필 업데이트에 실패했습니다.'
      );
      setIsLoading(false); // 에러 시에만 로딩 상태 해제
    }
  };

  const handleSkip = async () => {
    // 이미 프로필이 초기화된 경우에도 인증 상태 재확인 후 이동
    if (user?.isProfileInitialized) {
      // 🔑 인증 상태 재확인 (헤더에 프로필 정보 표시를 위해)
      await refreshAuthStatus();

      const returnUrl = sessionStorage.getItem('returnUrl');
      if (returnUrl) {
        sessionStorage.removeItem('returnUrl');
        router.push(returnUrl);
      } else {
        router.push('/');
      }
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();

      // isSkip 필드 추가 (건너뛰기 시 true)
      formData.append('isSkip', 'true');

      const response = await updateProfile(formData);

      // 🔑 사용자 정보 업데이트 및 인증 상태 재확인
      if (response.result.mePreviewDto) {
        updateUser(response.result.mePreviewDto);
      }

      // 🔑 인증 상태 재확인 (헤더에 프로필 정보 표시를 위해)
      await refreshAuthStatus();

      // 🔑 인증 상태 재확인 완료 후 리다이렉트 (클라이언트 사이드 라우팅)
      const returnUrl = sessionStorage.getItem('returnUrl');
      if (returnUrl) {
        sessionStorage.removeItem('returnUrl');
        router.push(returnUrl);
      } else {
        router.push('/');
      }
      // 성공 시에는 로딩 상태를 유지 (리다이렉트까지)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '프로필 설정에 실패했습니다.'
      );
      setIsLoading(false); // 에러 시에만 로딩 상태 해제
    }
  };

  const handleWithdraw = () => {
    if (
      confirm(
        '정말로 회원탈퇴를 하시겠습니까? 탈퇴 후에는 모든 데이터가 삭제되며 복구할 수 없습니다.'
      )
    ) {
      // AuthContext의 withdrawUser 사용 (provider별 API 호출)
      withdrawUser()
        .then(() => {
          // 탈퇴 성공 시 홈으로 리다이렉트
          window.location.href = '/';
        })
        .catch((error) => {
          error('회원탈퇴 실패:', error);
          alert(
            `회원탈퇴에 실패했습니다: ${error.message || '알 수 없는 오류가 발생했습니다.'}`
          );
        });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-2 sm:p-4 lg:pl-0">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-800 p-4 shadow-xl sm:p-8 lg:max-w-lg">
        <div className="mb-6 text-center sm:mb-8">
          <h1 className="mb-2 text-xl font-bold sm:text-2xl">
            프로필 설정
          </h1>
          <p className="text-sm text-gray-600 dark:text-zinc-400 sm:text-base">
            프로필 사진과 닉네임을 설정해주세요
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* 프로필 사진 업로드 */}
          <div className="text-center">
            <div className="relative inline-block">
              <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-brand-zinc-200 shadow-lg sm:h-24 sm:w-24 lg:h-28 lg:w-28">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="프로필 미리보기"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-gray-400">
                    <svg
                      className="h-8 w-8"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -right-1 -bottom-1 cursor-pointer rounded-full bg-blue-500 p-1.5 text-white shadow-lg transition-colors hover:bg-blue-600 sm:p-2 lg:p-2.5"
              >
                <svg
                  className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />

            <div className="mt-2 space-x-2 sm:mt-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer text-xs font-medium text-blue-600 hover:text-blue-700 sm:text-sm"
              >
                사진 변경
              </button>
              {previewUrl && previewUrl !== user?.profileImageUrl && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="cursor-pointer text-xs font-medium text-red-600 hover:text-red-700 sm:text-sm"
                >
                  제거
                </button>
              )}
            </div>
          </div>

          {/* 닉네임 입력 */}
          <div>
            <label
              htmlFor="nickname"
              className="mb-2 block text-xs font-medium text-gray-700 dark:text-zinc-300 sm:text-sm"
            >
              닉네임
            </label>
            <input
              type="text"
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="닉네임을 입력해주세요 (2자 이상)"
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-2.5 text-sm text-gray-900 dark:text-zinc-300 transition-colors focus:border-transparent focus:ring-2 focus:ring-blue-500 sm:px-4 sm:py-3 sm:text-base lg:px-6 lg:py-4 lg:text-lg"
              maxLength={20}
              minLength={2}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">
              {nickname.length}/20자 (최소 2자 이상)
            </p>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-2 sm:p-3">
              <p className="text-xs text-red-600 sm:text-sm">{error}</p>
            </div>
          )}

          {/* 버튼들 */}
          <div className="space-y-2 sm:space-y-3">
            <button
              type="submit"
              disabled={
                isLoading ||
                (!nickname.trim() && !profileImage) ||
                (!!nickname.trim() && nickname.trim().length < 2)
              }
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-gray-300 sm:py-3 sm:text-base lg:py-4 lg:text-lg"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  <span>설정 중...</span>
                </>
              ) : (
                '프로필 저장'
              )}
            </button>

            <button
              type="button"
              onClick={handleSkip}
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium text-gray-600 transition-colors hover:text-zinc-400 disabled:opacity-50 sm:py-3 sm:text-base lg:py-4 lg:text-lg"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent"></div>
                  <span>설정 중...</span>
                </>
              ) : (
                '나중에 설정하기'
              )}
            </button>
          </div>
        </form>

        <div className="mt-4 flex flex-col items-start justify-between gap-2 sm:mt-6 sm:flex-row sm:items-center sm:gap-0">
          <p className="text-xs text-gray-500">
            프로필은 언제든지 설정에서 변경할 수 있습니다
          </p>
          {/* 신규 회원가입이 아닌 경우에만 회원탈퇴 버튼 표시 */}
          {user?.isProfileInitialized && (
            <button
              onClick={handleWithdraw}
              className="cursor-pointer self-end text-xs text-red-600 transition-colors hover:text-red-700 sm:self-auto"
            >
              회원탈퇴
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
