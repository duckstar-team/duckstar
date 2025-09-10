'use client';

import { useCallback } from 'react';
import type { AnimePreviewDto } from '@/types/api';
import { useSmartImagePreloader } from './useSmartImagePreloader';
import { imageMemoryManager } from '../utils/imageMemoryManager';

export function useImagePreloading() {
  const { addToQueue, getQueueStatus } = useSmartImagePreloader({
    maxConcurrent: 3,
    batchSize: 2,
    batchDelay: 150
  });

  // 이미지 프리로딩 함수 (메모리 매니저 사용)
  const preloadImage = useCallback(async (src: string): Promise<void> => {
    try {
      await imageMemoryManager.preloadImage(src);
    } catch (error) {
      console.warn(`Failed to preload image: ${src}`, error);
    }
  }, []);

  // 검색 결과 이미지 프리로딩 (우선순위 기반)
  const preloadSearchResults = useCallback((animes: AnimePreviewDto[], priority: 'high' | 'medium' | 'low' = 'medium') => {
    const imageUrls = animes
      .map(anime => anime.mainThumbnailUrl)
      .filter(url => url && url.trim() !== '');

    // 스마트 preloader에 추가
    addToQueue(imageUrls, priority);
  }, [addToQueue]);

  // 애니메이션 상세 이미지 프리로딩 (높은 우선순위)
  const preloadAnimeDetails = useCallback((anime: AnimePreviewDto) => {
    if (anime.mainThumbnailUrl) {
      addToQueue([anime.mainThumbnailUrl], 'high');
    }
  }, [addToQueue]);

  // 배치 프리로딩 (메모리 매니저 사용)
  const preloadBatch = useCallback(async (urls: string[], batchSize = 3) => {
    try {
      await imageMemoryManager.preloadImages(urls, batchSize);
    } catch (error) {
      console.warn('Batch preload failed:', error);
    }
  }, []);

  // 캐시 상태 확인
  const getCacheStatus = useCallback(() => {
    return {
      ...getQueueStatus(),
      memory: imageMemoryManager.getCacheStatus()
    };
  }, [getQueueStatus]);

  // 캐시 정리
  const clearCache = useCallback(() => {
    imageMemoryManager.clearCache();
  }, []);

  return {
    preloadImage,
    preloadSearchResults,
    preloadAnimeDetails,
    preloadBatch,
    getCacheStatus,
    clearCache
  };
}
