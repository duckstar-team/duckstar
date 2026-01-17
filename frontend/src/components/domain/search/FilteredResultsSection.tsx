import AnimeGrid from './AnimeGrid';
import type { AnimePreviewDto } from '@/types/dtos';

interface FilteredResultsSectionProps {
  animes: AnimePreviewDto[];
  isCurrentSeason: boolean;
}

export default function FilteredResultsSection({
  animes,
  isCurrentSeason,
}: FilteredResultsSectionProps) {
  return (
    <div>
      <div className="mb-6 flex items-end gap-3">
        <h2 className="text-lg font-bold sm:text-2xl">필터링 결과</h2>
        <span className="text-[12px] font-normal text-[#868E96]">
          {animes.length}개의 애니메이션
        </span>
      </div>
      <AnimeGrid animes={animes} isCurrentSeason={isCurrentSeason} />
    </div>
  );
}
