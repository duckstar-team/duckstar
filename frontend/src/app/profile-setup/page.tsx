'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { updateProfile } from '@/api/client';
import { extractFirstFrameFromGif, isGifFile } from '@/utils/gifFrameExtractor';

export default function ProfileSetupPage() {
  const router = useRouter();
  const { user, updateUser, isAuthenticated, withdraw: withdrawUser, refreshAuthStatus } = useAuth();
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(user?.profileImageUrl || null);
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
      if (response.mePreviewDto) {
        updateUser(response.mePreviewDto);
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
      setError(err instanceof Error ? err.message : '프로필 업데이트에 실패했습니다.');
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
      if (response.mePreviewDto) {
        updateUser(response.mePreviewDto);
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
      setError(err instanceof Error ? err.message : '프로필 설정에 실패했습니다.');
      setIsLoading(false); // 에러 시에만 로딩 상태 해제
    }
  };

  const handleWithdraw = () => {
    if (confirm('정말로 회원탈퇴를 하시겠습니까? 탈퇴 후에는 모든 데이터가 삭제되며 복구할 수 없습니다.')) {
      // AuthContext의 withdrawUser 사용 (provider별 API 호출)
      withdrawUser().then(() => {
        // 탈퇴 성공 시 홈으로 리다이렉트
        window.location.href = '/';
      }).catch((error) => {
error('회원탈퇴 실패:', error);
        alert(`회원탈퇴에 실패했습니다: ${error.message || '알 수 없는 오류가 발생했습니다.'}`);
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-2 sm:p-4 lg:pl-0">
      <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-8 w-full max-w-md lg:max-w-lg">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            프로필 설정
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            프로필 사진과 닉네임을 설정해주세요
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* 프로필 사진 업로드 */}
          <div className="text-center">
            <div className="relative inline-block">
              <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="프로필 미리보기"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-1.5 sm:p-2 lg:p-2.5 shadow-lg hover:bg-blue-600 transition-colors cursor-pointer"
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
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
            
            <div className="mt-2 sm:mt-3 space-x-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
              >
                사진 변경
              </button>
              {previewUrl && previewUrl !== user?.profileImageUrl && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="text-xs sm:text-sm text-red-600 hover:text-red-700 font-medium cursor-pointer"
                >
                  제거
                </button>
              )}
            </div>
          </div>

          {/* 닉네임 입력 */}
          <div>
            <label htmlFor="nickname" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              닉네임
            </label>
            <input
              type="text"
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="닉네임을 입력해주세요 (2자 이상)"
              className="w-full px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 lg:py-4 text-sm sm:text-base lg:text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              maxLength={20}
              minLength={2}
            />
            <p className="text-xs text-gray-500 mt-1">
              {nickname.length}/20자 (최소 2자 이상)
            </p>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-2 sm:p-3">
              <p className="text-xs sm:text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* 버튼들 */}
          <div className="space-y-2 sm:space-y-3">
            <button
              type="submit"
              disabled={isLoading || (!nickname.trim() && !profileImage) || (!!nickname.trim() && nickname.trim().length < 2)}
              className="w-full bg-blue-600 text-white py-2.5 sm:py-3 lg:py-4 rounded-lg text-sm sm:text-base lg:text-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
              className="w-full text-gray-600 py-2.5 sm:py-3 lg:py-4 rounded-lg text-sm sm:text-base lg:text-lg font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>설정 중...</span>
                </>
              ) : (
                '나중에 설정하기'
              )}
            </button>
          </div>
        </form>

        <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
          <p className="text-xs text-gray-500">
            프로필은 언제든지 설정에서 변경할 수 있습니다
          </p>
          {/* 신규 회원가입이 아닌 경우에만 회원탈퇴 버튼 표시 */}
          {user?.isProfileInitialized && (
            <button
              onClick={handleWithdraw}
              className="text-xs text-red-600 hover:text-red-700 transition-colors cursor-pointer self-end sm:self-auto"
            >
              회원탈퇴
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
