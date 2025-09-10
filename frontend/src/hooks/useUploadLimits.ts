import { useState, useCallback, useRef } from 'react';

interface UploadLimits {
  maxConcurrentUploads: number;
  dailyUploadLimit: number;
  cooldownPeriod: number; // milliseconds
}

interface UploadStats {
  dailyUploadCount: number;
  lastUploadTime: number;
  currentUploads: number;
}

const DEFAULT_LIMITS: UploadLimits = {
  maxConcurrentUploads: 1, // 댓글당 이미지 1개이므로 동시 업로드도 1개
  dailyUploadLimit: 20,
  cooldownPeriod: 1000 // 1초
};

export function useUploadLimits(limits: Partial<UploadLimits> = {}) {
  const uploadLimits = { ...DEFAULT_LIMITS, ...limits };
  const [uploadStats, setUploadStats] = useState<UploadStats>(() => {
    const today = new Date().toDateString();
    const stored = localStorage.getItem('uploadStats');
    
    if (stored) {
      const parsed = JSON.parse(stored);
      // 날짜가 바뀌었으면 일일 카운트 리셋
      if (parsed.date !== today) {
        return {
          dailyUploadCount: 0,
          lastUploadTime: 0,
          currentUploads: 0
        };
      }
      return parsed.stats;
    }
    
    return {
      dailyUploadCount: 0,
      lastUploadTime: 0,
      currentUploads: 0
    };
  });

  const cooldownRef = useRef<NodeJS.Timeout | null>(null);

  // 업로드 통계를 localStorage에 저장
  const saveStats = useCallback((stats: UploadStats) => {
    const today = new Date().toDateString();
    localStorage.setItem('uploadStats', JSON.stringify({
      date: today,
      stats
    }));
    setUploadStats(stats);
  }, []);

  // 업로드 가능 여부 확인
  const canUpload = useCallback(() => {
    const now = Date.now();
    
    // 쿨다운 체크
    if (now - uploadStats.lastUploadTime < uploadLimits.cooldownPeriod) {
      return {
        canUpload: false,
        reason: '쿨다운',
        message: `업로드 간격을 조금 더 두어주세요. (${Math.ceil((uploadLimits.cooldownPeriod - (now - uploadStats.lastUploadTime)) / 1000)}초 남음)`
      };
    }

    // 동시 업로드 수 체크 (댓글당 이미지 1개이므로 의미상 "이미 업로드 중" 체크)
    if (uploadStats.currentUploads >= uploadLimits.maxConcurrentUploads) {
      return {
        canUpload: false,
        reason: '업로드 중',
        message: '이미 이미지 업로드가 진행 중입니다. 완료 후 다시 시도해주세요.'
      };
    }

    // 일일 업로드 한도 체크
    if (uploadStats.dailyUploadCount >= uploadLimits.dailyUploadLimit) {
      return {
        canUpload: false,
        reason: '일일 한도',
        message: `일일 업로드 한도(${uploadLimits.dailyUploadLimit}개)를 초과했습니다. 내일 다시 시도해주세요.`
      };
    }

    return {
      canUpload: true,
      reason: null,
      message: null
    };
  }, [uploadStats, uploadLimits]);

  // 업로드 시작
  const startUpload = useCallback(() => {
    const check = canUpload();
    if (!check.canUpload) {
      return check;
    }

    const newStats = {
      ...uploadStats,
      currentUploads: uploadStats.currentUploads + 1,
      lastUploadTime: Date.now()
    };
    saveStats(newStats);

    return { canUpload: true, reason: null, message: null };
  }, [uploadStats, canUpload, saveStats]);

  // 업로드 완료
  const finishUpload = useCallback((success: boolean = true) => {
    const newStats = {
      ...uploadStats,
      currentUploads: Math.max(0, uploadStats.currentUploads - 1)
    };

    if (success) {
      newStats.dailyUploadCount = uploadStats.dailyUploadCount + 1;
    }

    saveStats(newStats);
  }, [uploadStats, saveStats]);

  // 쿨다운 타이머 시작
  const startCooldown = useCallback(() => {
    if (cooldownRef.current) {
      clearTimeout(cooldownRef.current);
    }

    cooldownRef.current = setTimeout(() => {
      // 쿨다운 완료 후 상태 업데이트
      setUploadStats(prev => ({ ...prev }));
    }, uploadLimits.cooldownPeriod);
  }, [uploadLimits.cooldownPeriod]);

  // 리셋 (테스트용)
  const resetStats = useCallback(() => {
    const resetStats = {
      dailyUploadCount: 0,
      lastUploadTime: 0,
      currentUploads: 0
    };
    saveStats(resetStats);
    localStorage.removeItem('uploadStats');
  }, [saveStats]);

  return {
    uploadStats,
    canUpload,
    startUpload,
    finishUpload,
    startCooldown,
    resetStats,
    limits: uploadLimits
  };
}
