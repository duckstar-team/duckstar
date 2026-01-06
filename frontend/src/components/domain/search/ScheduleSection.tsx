import AnimeGrid from './AnimeGrid';
import type { AnimePreviewDto } from '@/types/dtos';
import { DayOfWeek } from './DaySelection';

interface ScheduleSectionProps {
  day: string;
  dayAnimes: AnimePreviewDto[];
  isCurrentSeason: boolean;
  sectionId: string;
  onDayClick: (day: DayOfWeek) => void;
}

const DAY_LABELS: Record<string, string> = {
  UPCOMING: '곧 시작',
  SUN: '일요일',
  MON: '월요일',
  TUE: '화요일',
  WED: '수요일',
  THU: '목요일',
  FRI: '금요일',
  SAT: '토요일',
  SPECIAL: '특별편성 및 극장판',
};

const DAY_TO_KOREAN: Record<string, DayOfWeek> = {
  UPCOMING: '곧 시작',
  SUN: '일',
  MON: '월',
  TUE: '화',
  WED: '수',
  THU: '목',
  FRI: '금',
  SAT: '토',
  SPECIAL: '특별편성 및 극장판',
};

export default function ScheduleSection({
  day,
  dayAnimes,
  isCurrentSeason,
  sectionId,
  onDayClick,
}: ScheduleSectionProps) {
  const dayInKorean = DAY_LABELS[day];
  const koreanDay = DAY_TO_KOREAN[day];

  return (
    <div>
      <div key={day} id={sectionId} className="mb-6 flex items-end gap-3">
        <h2
          className="cursor-pointer text-lg font-bold text-gray-900 transition-colors hover:text-blue-600 sm:text-2xl"
          onClick={() => koreanDay && onDayClick(koreanDay)}
        >
          {dayInKorean}
        </h2>
        {day === 'UPCOMING' && (
          <span className="text-[12px] font-normal text-[#868E96]">
            앞으로 12시간 이내
          </span>
        )}
      </div>

      <AnimeGrid animes={dayAnimes} isCurrentSeason={isCurrentSeason} />

      {day !== 'SPECIAL' && (
        <div className="h-6 border-t border-gray-200"></div>
      )}
    </div>
  );
}
