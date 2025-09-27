'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { getLoginState, clearLoginState } from '@/lib/cookieUtils';

export default function MigrationToast() {
  const [showToast, setShowToast] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const timerRef = useRef<NodeJS.Timeout | null>(null);


  useEffect(() => {
    // LOGIN_STATE 쿠키 확인
    const loginState = getLoginState();
    console.log('MigrationToast - loginState:', loginState);
    
    if (loginState) {
      console.log('MigrationToast - isNewUser:', loginState.isNewUser, 'isMigrated:', loginState.isMigrated);
      
      // isNewUser이면 프로필 설정 페이지로 이동 (returnUrl 보존)
      if (loginState.isNewUser) {
        console.log('MigrationToast - 신규 사용자, 프로필 설정으로 이동');
        
        // isMigrated=true인 경우에만 토스트 표시 플래그 설정
        if (loginState.isMigrated) {
          console.log('MigrationToast - 신규 사용자이지만 마이그레이션됨, 토스트 플래그 설정');
          sessionStorage.setItem('pendingMigrationToast', 'true');
        }
        
        clearLoginState();
        // returnUrl은 보존 (프로필 설정 완료 후 사용)
        router.push('/profile-setup');
        return;
      }
      
      // isMigrated이면 토스트 표시
      if (loginState.isMigrated) {
        console.log('MigrationToast - 마이그레이션 토스트 표시');
        setShowToast(true);
        
        // 6초 후 자동으로 토스트 숨기기
        timerRef.current = setTimeout(() => {
          setShowToast(false);
          timerRef.current = null;
        }, 6000);
      }
      
      // returnUrl이 있으면 해당 페이지로 이동
      const returnUrl = sessionStorage.getItem('returnUrl');
      console.log('MigrationToast - returnUrl:', returnUrl);
      if (returnUrl && returnUrl !== window.location.href) {
        console.log('MigrationToast - returnUrl로 이동');
        sessionStorage.removeItem('returnUrl');
        router.replace(returnUrl);
        return;
      }
      
      // LOGIN_STATE 쿠키 삭제
      clearLoginState();
    } else {
      console.log('MigrationToast - loginState 없음');
      
      // 프로필 설정 완료 후 토스트 표시 (isMigrated=true인 경우)
      const pendingMigrationToast = sessionStorage.getItem('pendingMigrationToast');
      console.log('MigrationToast - pendingMigrationToast:', pendingMigrationToast);
      
      if (pendingMigrationToast === 'true') {
        console.log('MigrationToast - 프로필 설정 완료 후 마이그레이션 토스트 표시');
        setShowToast(true);
        
        // 6초 후 자동으로 토스트 숨기기
        timerRef.current = setTimeout(() => {
          setShowToast(false);
          timerRef.current = null;
        }, 6000);
        
        // 플래그 정리
        sessionStorage.removeItem('pendingMigrationToast');
      }
    }
  }, [router]);

  // 토스트가 표시된 후에만 타이머 설정
  useEffect(() => {
    if (showToast) {
      // 기존 타이머가 있으면 클리어
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      
      // 6초 후 자동으로 토스트 숨기기
      timerRef.current = setTimeout(() => {
        setShowToast(false);
        timerRef.current = null;
      }, 6000);
    }
  }, [showToast]);

  return (
    <AnimatePresence>
      {showToast && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ 
            duration: 0.3,
            ease: "easeOut"
          }}
          className="fixed top-20 right-4 z-[9998] bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg"
        >
          <div className="flex items-center gap-2">
            <span>비로그인 투표 내역이 계정에 안전하게 연결되었습니다.</span>
            <button
              onClick={() => setShowToast(false)}
              className="text-white hover:text-gray-200 ml-2 transition-colors duration-200"
            >
              ×
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
