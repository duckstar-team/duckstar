import { useEffect, useCallback } from 'react';
import { useImageCache } from './useImageCache';

// 이미지 프리로딩 전략
interface PreloadingStrategy {
  // 홈페이지에서 인기 애니메이션들의 썸네일 미리 로드
  preloadPopularAnimeThumbnails: (animeList: unknown[]) => void;
  
  // 검색 결과의 썸네일 미리 로드
  preloadSearchResults: (searchResults: unknown[]) => void;
  
  // 현재 애니메이션의 관련 이미지들 미리 로드
  preloadAnimeDetails: (anime: unknown) => void;
  
  // 다음/이전 애니메이션 이미지 미리 로드
  preloadAdjacentAnime: (currentAnimeId: number, animeList: unknown[]) => void;
}

export const useImagePreloading = (): PreloadingStrategy => {
  const { preloadImages } = useImageCache();

  // 인기 애니메이션 썸네일 프리로딩
  const preloadPopularAnimeThumbnails = useCallback((animeList: unknown[]) => {
    if (!animeList || animeList.length === 0) return;
    
    // 상위 10개 애니메이션의 썸네일만 우선 로드
    const topAnimes = animeList.slice(0, 10);
    const thumbnailUrls = topAnimes
      .map((anime: unknown) => (anime as { mainThumbnailUrl?: string })?.mainThumbnailUrl)
      .filter((url: unknown): url is string => typeof url === 'string' && url.length > 0);
    
    if (thumbnailUrls.length > 0) {
      preloadImages(thumbnailUrls);
    }
  }, [preloadImages]);

  // 검색 결과 프리로딩
  const preloadSearchResults = useCallback((searchResults: Record<string, unknown>[]) => {
    if (!searchResults || searchResults.length === 0) return;
    
    // 검색 결과의 모든 썸네일 프리로딩
    const thumbnailUrls = searchResults
      .map(anime => anime.mainThumbnailUrl as string)
      .filter(Boolean);
    
    if (thumbnailUrls.length > 0) {
      preloadImages(thumbnailUrls);
    }
  }, [preloadImages]);

  // 애니메이션 상세 정보 프리로딩
  const preloadAnimeDetails = useCallback((anime: Record<string, unknown>) => {
    if (!anime) return;
    
    const urlsToPreload: string[] = [];
    
    // 메인 이미지와 썸네일
    if (anime.mainImageUrl) urlsToPreload.push(anime.mainImageUrl as string);
    if (anime.mainThumbnailUrl) urlsToPreload.push(anime.mainThumbnailUrl as string);
    
    // 캐릭터 이미지들
    if (anime.castPreviews) {
      (anime.castPreviews as unknown[]).forEach((cast: unknown) => {
        const castData = cast as Record<string, unknown>;
        if (castData.mainThumbnailUrl) {
          urlsToPreload.push(castData.mainThumbnailUrl as string);
        }
      });
    }
    
    if (urlsToPreload.length > 0) {
      preloadImages(urlsToPreload);
    }
  }, [preloadImages]);

  // 인접 애니메이션 프리로딩
  const preloadAdjacentAnime = useCallback((currentAnimeId: number, animeList: unknown[]) => {
    if (!animeList || animeList.length === 0) return;
    
    const currentIndex = animeList.findIndex(anime => anime.animeId === currentAnimeId);
    if (currentIndex === -1) return;
    
    // 현재 애니메이션의 앞뒤 2개씩 총 4개 애니메이션 프리로딩
    const adjacentAnimes = [];
    for (let i = Math.max(0, currentIndex - 2); i <= Math.min(animeList.length - 1, currentIndex + 2); i++) {
      if (i !== currentIndex) {
        adjacentAnimes.push(animeList[i]);
      }
    }
    
    const urlsToPreload = adjacentAnimes
      .map(anime => [anime.mainImageUrl, anime.mainThumbnailUrl])
      .flat()
      .filter(Boolean);
    
    if (urlsToPreload.length > 0) {
      preloadImages(urlsToPreload);
    }
  }, [preloadImages]);

  return {
    preloadPopularAnimeThumbnails,
    preloadSearchResults,
    preloadAnimeDetails,
    preloadAdjacentAnime
  };
};

// 페이지별 이미지 프리로딩 훅
export const usePageImagePreloading = () => {
  const { preloadImages } = useImageCache();

  // 홈페이지용 프리로딩
  const preloadHomePage = useCallback((data: unknown) => {
    const urlsToPreload: string[] = [];
    
    // 인기 애니메이션 썸네일
    if (data.popularAnimes) {
      (data as { popularAnimes: unknown[] }).popularAnimes.slice(0, 10).forEach((anime: unknown) => {
        if (anime.mainThumbnailUrl) urlsToPreload.push(anime.mainThumbnailUrl);
      });
    }
    
    // 최신 애니메이션 썸네일
    if (data.latestAnimes) {
      (data as { latestAnimes: unknown[] }).latestAnimes.slice(0, 10).forEach((anime: unknown) => {
        if (anime.mainThumbnailUrl) urlsToPreload.push(anime.mainThumbnailUrl);
      });
    }
    
    if (urlsToPreload.length > 0) {
      preloadImages(urlsToPreload);
    }
  }, [preloadImages]);

  // 검색 페이지용 프리로딩
  const preloadSearchPage = useCallback((searchResults: unknown[]) => {
    const urlsToPreload = searchResults
      .slice(0, 20) // 상위 20개만
      .map(anime => anime.mainThumbnailUrl)
      .filter(Boolean);
    
    if (urlsToPreload.length > 0) {
      preloadImages(urlsToPreload);
    }
  }, [preloadImages]);

  return {
    preloadHomePage,
    preloadSearchPage
  };
};

export default useImagePreloading;
