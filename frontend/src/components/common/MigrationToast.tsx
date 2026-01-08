'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { getLoginState, clearLoginState } from '@/lib';

export default function MigrationToast() {
  const [showToast, setShowToast] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 이미 토스트가 표시되었는지 확인
    const toastAlreadyShown = sessionStorage.getItem('migration_toast_shown');
    if (toastAlreadyShown === 'true') {
      return; // 이미 표시되었으면 더 이상 표시하지 않음
    }

    // 로그인 시점에서 마이그레이션 정보 확인
    // URL 파라미터나 세션 스토리지에서 마이그레이션 완료 정보 확인
    const migrationCompleted = searchParams.get('migration_completed');
    const sessionMigrationCompleted = sessionStorage.getItem(
      'migration_completed'
    );

    // 개발 환경에서 마이그레이션 토스트 테스트 (임시)
    if (process.env.NODE_ENV === 'development') {
      const testMigration = searchParams.get('test_migration');
      if (testMigration === 'true') {
        setShowToast(true);

        // 6초 후 자동으로 토스트 숨기기
        timerRef.current = setTimeout(() => {
          setShowToast(false);
          timerRef.current = null;
        }, 6000);

        // URL에서 파라미터 제거
        const url = new URL(window.location.href);
        url.searchParams.delete('test_migration');
        window.history.replaceState({}, '', url.toString());
        return;
      }
    }

    if (migrationCompleted === 'true' || sessionMigrationCompleted === 'true') {
      setShowToast(true);

      // 토스트가 표시되었음을 기록
      sessionStorage.setItem('migration_toast_shown', 'true');

      // 6초 후 자동으로 토스트 숨기기
      timerRef.current = setTimeout(() => {
        setShowToast(false);
        timerRef.current = null;
      }, 6000);

      // URL에서 파라미터 제거
      if (migrationCompleted === 'true') {
        const url = new URL(window.location.href);
        url.searchParams.delete('migration_completed');
        window.history.replaceState({}, '', url.toString());
      }

      // 세션 스토리지에서 플래그 제거
      if (sessionMigrationCompleted === 'true') {
        sessionStorage.removeItem('migration_completed');
      }
      return;
    }

    // LOGIN_STATE 쿠키 확인
    const loginState = getLoginState();

    if (loginState) {
      // isNewUser이면 프로필 설정 페이지로 이동 (returnUrl 보존)
      if (loginState.isNewUser) {
        // isMigrated=true인 경우에만 토스트 표시 플래그 설정
        if (loginState.isMigrated) {
          sessionStorage.setItem('pendingMigrationToast', 'true');
        }

        clearLoginState();
        // returnUrl은 보존 (프로필 설정 완료 후 사용)
        router.push('/profile-setup');
        return;
      }

      // isMigrated이면 토스트 표시
      if (loginState.isMigrated) {
        setShowToast(true);

        // 6초 후 자동으로 토스트 숨기기
        timerRef.current = setTimeout(() => {
          setShowToast(false);
          timerRef.current = null;
        }, 6000);
      }

      // returnUrl이 있으면 해당 페이지로 이동
      const returnUrl = sessionStorage.getItem('returnUrl');
      if (returnUrl && returnUrl !== window.location.href) {
        sessionStorage.removeItem('returnUrl');
        router.replace(returnUrl);
        return;
      }

      // LOGIN_STATE 쿠키 삭제
      clearLoginState();
    } else {
      // 프로필 설정 완료 후 토스트 표시 (isMigrated=true인 경우)
      const pendingMigrationToast = sessionStorage.getItem(
        'pendingMigrationToast'
      );

      if (pendingMigrationToast === 'true') {
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
            ease: 'easeOut',
          }}
          className="fixed top-20 right-4 z-[9998] rounded-lg bg-green-500 px-4 py-2 text-white shadow-lg"
        >
          <div className="flex items-center gap-2">
            <span>비로그인 투표 내역이 계정에 안전하게 연결되었습니다.</span>
            <button
              onClick={() => setShowToast(false)}
              className="ml-2 text-white transition-colors duration-200 hover:text-gray-200"
            >
              ×
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
