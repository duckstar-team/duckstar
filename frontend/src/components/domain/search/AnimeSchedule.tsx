import SearchResultsSection from './SearchResultsSection';
import FilteredResultsSection from './FilteredResultsSection';
import ScheduleSection from './ScheduleSection';
import EmptyState from './EmptyState';
import type { AnimePreviewDto } from '@/types/dtos';
import { DayOfWeek } from './DaySelection';

interface AnimeScheduleProps {
  isThisWeek: boolean;
  year: number | null;
  quarter: number | null;
  searchQuery: string;
  selectedOttServices: string[];
  groupedAnimes: { [key: string]: AnimePreviewDto[] };
  getSectionId: (baseId: string) => string;
  onDayClick: (day: DayOfWeek) => void;
}

export default function AnimeSchedule({
  isThisWeek,
  year,
  quarter,
  searchQuery,
  selectedOttServices,
  groupedAnimes,
  getSectionId,
  onDayClick,
}: AnimeScheduleProps) {
  if (searchQuery.trim()) {
    return (
      <SearchResultsSection
        searchQuery={searchQuery}
        animes={Object.values(groupedAnimes).flat()}
        isCurrentSeason={isThisWeek}
      />
    );
  }

  if (!groupedAnimes || Object.keys(groupedAnimes).length === 0) {
    return <EmptyState isThisWeek={isThisWeek} year={year} quarter={quarter} />;
  }

  if (selectedOttServices.length > 0) {
    return (
      <FilteredResultsSection
        animes={Object.values(groupedAnimes).flat()}
        isCurrentSeason={isThisWeek}
      />
    );
  }

  return (
    <>
      {Object.entries(groupedAnimes).map(([day, dayAnimes]) => {
        const baseSectionId =
          day === 'UPCOMING'
            ? 'upcoming'
            : day === 'SPECIAL'
              ? 'special'
              : day.toLowerCase();
        const sectionId = getSectionId(baseSectionId);

        return (
          <ScheduleSection
            key={day}
            day={day}
            dayAnimes={dayAnimes}
            isCurrentSeason={isThisWeek}
            sectionId={sectionId}
            onDayClick={onDayClick}
          />
        );
      })}
    </>
  );
}
