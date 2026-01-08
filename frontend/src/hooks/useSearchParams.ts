import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * URL 쿼리 파라미터에서 검색어를 가져오는 훅
 */
export function useSearchQuery() {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    const queryParam = searchParams?.get('q');
    const keywordParam = searchParams?.get('keyword');
    const fromAnimeDetail = sessionStorage.getItem('from-anime-detail');
    const fromHeaderSearch = sessionStorage.getItem('from-header-search');

    if (keywordParam) {
      setSearchQuery(keywordParam);
      setSearchInput(keywordParam);

      if (fromAnimeDetail === 'true') {
        sessionStorage.removeItem('from-anime-detail');
      }
      if (fromHeaderSearch === 'true') {
        sessionStorage.removeItem('from-header-search');
      }
    } else if (
      queryParam &&
      (fromHeaderSearch === 'true' || fromAnimeDetail !== 'true')
    ) {
      setSearchQuery(queryParam);
      setSearchInput(queryParam);

      if (fromHeaderSearch === 'true') {
        sessionStorage.removeItem('from-header-search');
      }
    }
  }, [searchParams]);

  return { searchQuery, searchInput, setSearchQuery, setSearchInput };
}
