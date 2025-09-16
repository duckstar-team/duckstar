'use client';

import { useState, useEffect } from 'react';

interface NetworkInfo {
  effectiveType: '2g' | '3g' | '4g' | 'slow-2g' | 'unknown';
  downlink: number;
  rtt: number;
  saveData: boolean;
}

interface OptimizationConfig {
  prefetchEnabled: boolean;
  prefetchDelay: number;
  imageQuality: 'high' | 'medium' | 'low';
  animationReduced: boolean;
  preloadLimit: number;
}

export const useNetworkOptimization = () => {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0,
    saveData: false
  });

  const [config, setConfig] = useState<OptimizationConfig>({
    prefetchEnabled: true,
    prefetchDelay: 0,
    imageQuality: 'high',
    animationReduced: false,
    preloadLimit: 20
  });

  useEffect(() => {
    if (typeof navigator === 'undefined') return;

    const connection = (navigator as any).connection;
    
    if (connection) {
      const updateNetworkInfo = () => {
        setNetworkInfo({
          effectiveType: connection.effectiveType || 'unknown',
          downlink: connection.downlink || 0,
          rtt: connection.rtt || 0,
          saveData: connection.saveData || false
        });
      };

      // 초기 설정
      updateNetworkInfo();

      // 네트워크 상태 변경 감지
      connection.addEventListener('change', updateNetworkInfo);

      return () => {
        connection.removeEventListener('change', updateNetworkInfo);
      };
    }
  }, []);

  // 네트워크 상태에 따른 최적화 설정
  useEffect(() => {
    const { effectiveType, downlink, saveData } = networkInfo;

    let newConfig: OptimizationConfig = {
      prefetchEnabled: true,
      prefetchDelay: 0,
      imageQuality: 'high',
      animationReduced: false,
      preloadLimit: 20
    };

    // 4G 환경
    if (effectiveType === '4g' && downlink > 1.5) {
      newConfig = {
        prefetchEnabled: true,
        prefetchDelay: 0,
        imageQuality: 'high',
        animationReduced: false,
        preloadLimit: 50
      };
    }
    // 3G 환경
    else if (effectiveType === '3g' || (effectiveType === '4g' && downlink <= 1.5)) {
      newConfig = {
        prefetchEnabled: true,
        prefetchDelay: 500,
        imageQuality: 'medium',
        animationReduced: false,
        preloadLimit: 20
      };
    }
    // 2G 환경
    else if (effectiveType === '2g' || effectiveType === 'slow-2g') {
      newConfig = {
        prefetchEnabled: false,
        prefetchDelay: 1000,
        imageQuality: 'low',
        animationReduced: true,
        preloadLimit: 5
      };
    }

    // 데이터 절약 모드
    if (saveData) {
      newConfig.prefetchEnabled = false;
      newConfig.preloadLimit = Math.min(newConfig.preloadLimit, 10);
      newConfig.imageQuality = 'low';
    }

    setConfig(newConfig);
  }, [networkInfo]);

  return {
    networkInfo,
    config,
    isSlowNetwork: networkInfo.effectiveType === '2g' || networkInfo.effectiveType === 'slow-2g',
    isMediumNetwork: networkInfo.effectiveType === '3g',
    isFastNetwork: networkInfo.effectiveType === '4g' && networkInfo.downlink > 1.5
  };
};
