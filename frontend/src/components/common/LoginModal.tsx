'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { startKakaoLogin, startGoogleLogin, startNaverLogin } from '@/api/auth';
import { useModal } from '@/components/layout/AppContainer';
import { X } from 'lucide-react';

export default function LoginModal() {
  const { isLoginModalOpen, closeLoginModal } = useModal();

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeLoginModal();
      }
    };

    if (isLoginModalOpen) {
      document.addEventListener('keydown', handleEscape);
      // 모달이 열릴 때 body 스크롤 방지
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isLoginModalOpen, closeLoginModal]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    // 모달 컨텐츠가 아닌 배경 영역을 클릭했을 때만 닫기
    if (e.target === e.currentTarget) {
      closeLoginModal();
    }
  };

  return (
    <AnimatePresence>
      {isLoginModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={handleBackdropClick}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
            className="mx-auto w-full max-w-md rounded-2xl bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900">로그인</h2>
              <button
                onClick={closeLoginModal}
                className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-gray-100"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Login Buttons */}
              <div className="mb-6 flex justify-center gap-4">
                {/* 구글 로그인 */}
                <button onClick={startGoogleLogin}>
                  <img
                    src="/icons/google-login.svg"
                    alt="구글 로그인"
                    className="size-18"
                  />
                </button>

                {/* 카카오 로그인 */}
                <button onClick={startKakaoLogin}>
                  <img
                    src="/icons/kakao-login.svg"
                    alt="카카오 로그인"
                    className="size-18"
                  />
                </button>

                {/* 네이버 로그인 */}
                <button onClick={startNaverLogin}>
                  <img
                    src="/icons/naver-login.svg"
                    alt="네이버 로그인"
                    className="size-18"
                  />
                </button>
              </div>

              <p className="text-center text-gray-600">로그인 / 회원가입</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
