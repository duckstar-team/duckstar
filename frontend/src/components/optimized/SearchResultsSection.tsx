'use client';

import React, { memo, useMemo } from 'react';
import { AnimePreviewDto } from '@/types/api';
import AnimeCard from '@/components/anime/AnimeCard';
import { extractChosung } from '@/lib/searchUtils';

interface SearchResultsSectionProps {
  animes: AnimePreviewDto[];
  searchQuery: string;
  isSearchLoading: boolean;
  className?: string;
}

/**
 * 메모이제이션된 검색 결과 섹션
 * 검색어가 변경될 때만 리렌더링
 */
const SearchResultsSection = memo<SearchResultsSectionProps>(({ 
  animes, 
  searchQuery, 
  isSearchLoading,
  className = ''
}) => {
  // 검색 결과 필터링 (메모이제이션)
  const filteredAnimes = useMemo(() => {
    if (!searchQuery.trim()) return animes;
    
    return animes.filter(anime => {
      const titleMatch = anime.titleKor.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        anime.titleOrigin.toLowerCase().includes(searchQuery.toLowerCase());
      
      const chosungMatch = extractChosung(anime.titleKor).includes(searchQuery.toUpperCase());
      
      return titleMatch || chosungMatch;
    });
  }, [animes, searchQuery]);

  if (isSearchLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">검색 중...</p>
        </div>
      </div>
    );
  }

  if (filteredAnimes.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-gray-500">
          {searchQuery.trim() ? `"${searchQuery}"에 대한 검색 결과가 없습니다.` : '검색어를 입력해주세요.'}
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-sm text-gray-600 mb-4">
        {searchQuery.trim() && `${filteredAnimes.length}개의 결과를 찾았습니다.`}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredAnimes.map((anime) => (
          <AnimeCard
            key={anime.animeId}
            anime={anime}
            isCurrentSeason={false}
          />
        ))}
      </div>
    </div>
  );
});

SearchResultsSection.displayName = 'SearchResultsSection';

export default SearchResultsSection;
