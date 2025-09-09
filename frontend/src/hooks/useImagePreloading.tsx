'use client';

import { useCallback } from 'react';
import type { AnimePreviewDto } from '@/types/api';

export function useImagePreloading() {
  // 이미지 프리로딩 함수
  const preloadImage = useCallback((src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });
  }, []);

  // 검색 결과 이미지 프리로딩
  const preloadSearchResults = useCallback((animes: AnimePreviewDto[]) => {
    const imageUrls = animes
      .map(anime => anime.mainThumbnailUrl)
      .filter(url => url && url.trim() !== '');

    // 배치로 이미지 프리로딩 (너무 많은 동시 요청 방지)
    const batchSize = 5;
    for (let i = 0; i < imageUrls.length; i += batchSize) {
      const batch = imageUrls.slice(i, i + batchSize);
      batch.forEach(url => {
        preloadImage(url).catch(error => {
          console.warn('Image preload failed:', error);
        });
      });
    }
  }, [preloadImage]);

  // 애니메이션 상세 이미지 프리로딩
  const preloadAnimeDetails = useCallback((anime: AnimePreviewDto) => {
    if (anime.mainThumbnailUrl) {
      preloadImage(anime.mainThumbnailUrl).catch(error => {
        console.warn('Anime detail image preload failed:', error);
      });
    }
  }, [preloadImage]);

  return {
    preloadImage,
    preloadSearchResults,
    preloadAnimeDetails
  };
}
