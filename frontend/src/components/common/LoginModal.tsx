'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { startKakaoLogin, startGoogleLogin, startNaverLogin } from '@/api/client';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  backdropStyle?: 'dark' | 'blur' | 'glass' | 'gradient';
}

export default function LoginModal({ isOpen, onClose, backdropStyle = 'blur' }: LoginModalProps) {
  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // 모달이 열릴 때 body 스크롤 방지
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleKakaoLogin = () => {
    startKakaoLogin();
  };

  const handleGoogleLogin = () => {
    startGoogleLogin();
  };

  const handleNaverLogin = () => {
    startNaverLogin();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // 배경 스타일 클래스 선택
  const getBackdropClass = () => {
    switch (backdropStyle) {
      case 'dark':
        return 'bg-black/50';
      case 'blur':
        return 'bg-white/20 backdrop-blur-md';
      case 'glass':
        return 'bg-white/10 backdrop-blur-lg border border-white/20';
      case 'gradient':
        return 'bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-blue-500/20 backdrop-blur-md';
      default:
        return 'bg-white/20 backdrop-blur-md';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`fixed inset-0 z-50 ${getBackdropClass()}`}
            onClick={handleBackdropClick}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">로그인</h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Login Buttons */}
                <div className="flex justify-center gap-4 mb-6">
                  {/* 구글 로그인 */}
                  <button
                    onClick={handleGoogleLogin}
                    className="w-[72px] h-[72px] flex items-center justify-center bg-[#F2F2F2] hover:bg-[#E8E8E8] rounded-xl transition-colors cursor-pointer shadow-lg hover:shadow-xl"
                  >
                    <img 
                      src="/icons/google-login.svg" 
                      alt="구글 로그인" 
                      className="w-[72px] h-[72px]"
                    />
                  </button>

                  {/* 카카오 로그인 */}
                  <button
                    onClick={handleKakaoLogin}
                    className="w-[72px] h-[72px] flex items-center justify-center bg-[#FEE500] hover:bg-[#FEE500]/90 rounded-xl transition-colors cursor-pointer shadow-lg hover:shadow-xl"
                  >
                    <img 
                      src="/icons/kakao-login.svg" 
                      alt="카카오 로그인" 
                      className="w-[72px] h-[72px]"
                    />
                  </button>

                  {/* 네이버 로그인 */}
                  <button
                    onClick={handleNaverLogin}
                    className="w-[72px] h-[72px] flex items-center justify-center bg-[#03C75A] hover:bg-[#03C75A]/90 rounded-xl transition-colors cursor-pointer shadow-lg hover:shadow-xl"
                  >
                    <img 
                      src="/icons/naver-login.svg" 
                      alt="네이버 로그인" 
                      className="w-[72px] h-[72px]"
                    />
                  </button>
                </div>

                <p className="text-gray-600 text-center">
                  로그인 / 회원가입
                </p>

              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
