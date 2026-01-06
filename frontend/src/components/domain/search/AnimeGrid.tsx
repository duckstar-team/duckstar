import AnimeCard from '@/components/domain/anime/AnimeCard';
import type { AnimePreviewDto } from '@/types/dtos';

interface AnimeGridProps {
  animes: AnimePreviewDto[];
  isCurrentSeason: boolean;
  showDataAttribute?: boolean;
}

export default function AnimeGrid({
  animes,
  isCurrentSeason,
  showDataAttribute = false,
}: AnimeGridProps) {
  return (
    <div className="grid grid-cols-2 justify-items-center gap-[15px] sm:gap-[30px] lg:grid-cols-3 xl:grid-cols-4">
      {animes.map((anime) => (
        <AnimeCard
          key={anime.animeId}
          anime={anime}
          isCurrentSeason={isCurrentSeason}
          {...(showDataAttribute && { 'data-anime-item': true })}
        />
      ))}
    </div>
  );
}
