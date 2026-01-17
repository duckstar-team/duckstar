import AnimeGrid from './AnimeGrid';
import type { AnimePreviewDto } from '@/types/dtos';

interface ScheduleSectionProps {
  day: string;
  dayAnimes: AnimePreviewDto[];
  isCurrentSeason: boolean;
  sectionId: string;
}

const DAY_LABELS: Record<string, string> = {
  NONE: '곧 시작',
  SUN: '일요일',
  MON: '월요일',
  TUE: '화요일',
  WED: '수요일',
  THU: '목요일',
  FRI: '금요일',
  SAT: '토요일',
  SPECIAL: '특별편성 및 극장판',
};

export default function ScheduleSection({
  day,
  dayAnimes,
  isCurrentSeason,
  sectionId,
}: ScheduleSectionProps) {
  const dayInKorean = DAY_LABELS[day];

  return (
    <div>
      <div key={day} id={sectionId} className="mb-6 flex items-end gap-3">
        <h2 className="text-lg font-bold sm:text-2xl">{dayInKorean}</h2>
        {day === 'NONE' && (
          <span className="text-[12px] font-normal text-[#868E96]">
            앞으로 12시간 이내
          </span>
        )}
      </div>

      <AnimeGrid
        animes={dayAnimes}
        isCurrentSeason={isCurrentSeason}
        isUpcomingGroup={day === 'NONE'}
      />

      {day !== 'SPECIAL' && (
        <div className="my-10 h-px w-full bg-gray-200 dark:bg-zinc-800"></div>
      )}
    </div>
  );
}
