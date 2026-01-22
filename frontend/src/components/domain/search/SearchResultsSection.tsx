import AnimeGrid from './AnimeGrid';
import { Schemas } from '@/types';

interface SearchResultsSectionProps {
  searchQuery: string;
  animes: Schemas['AnimePreviewDto'][];
  isCurrentSeason: boolean;
}

export default function SearchResultsSection({
  searchQuery,
  animes,
  isCurrentSeason,
}: SearchResultsSectionProps) {
  return (
    <div className="space-y-4">
      <div className="py-8 text-center">
        <div className="mb-4 text-sm text-gray-600">
          &quot;{searchQuery}&quot;에 대한 검색 결과
        </div>
        {animes.length > 0 ? (
          <AnimeGrid
            animes={animes}
            isCurrentSeason={isCurrentSeason}
            showDataAttribute
          />
        ) : (
          <div className="py-8 text-center">
            <p className="text-gray-500">
              &quot;{searchQuery}&quot;에 대한 검색 결과가 없습니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
