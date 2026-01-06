'use client';

import { cn } from '@/lib';
import SeasonSelector from './SeasonSelector';
import DaySelection, { DayOfWeek } from './DaySelection';
import OttFilterQueue from './OttFilterQueue';
import BackButton from './BackButton';
import AiringCheckbox from './AiringCheckbox';
import { useStickyMenu } from '@/hooks/useStickyMenu';
import { useSidebarWidth } from '@/hooks/useSidebarWidth';

interface SeasonDaySelectorProps {
  isThisWeek: boolean;
  year: number | null;
  quarter: number | null;
  searchQuery: string;
  selectedOttServices: string[];
  selectedDay: DayOfWeek;
  emptyDays: Set<DayOfWeek>;
  showOnlyAiring: boolean;
  onSeasonSelect: (year: number, quarter: number) => void;
  onDaySelect: (day: DayOfWeek) => void;
  onSearchReset: () => void;
  onShowOnlyAiringChange: (checked: boolean) => void;
  onOttRemove: (service: string) => void;
  onOttClear: () => void;
}

export default function SeasonDaySelector({
  isThisWeek,
  year,
  quarter,
  searchQuery,
  selectedOttServices,
  selectedDay,
  emptyDays,
  showOnlyAiring,
  onSeasonSelect,
  onDaySelect,
  onSearchReset,
  onShowOnlyAiringChange,
  onOttRemove,
  onOttClear,
}: SeasonDaySelectorProps) {
  const { ref, isSticky } = useStickyMenu({ threshold: 100, offset: 60 });
  const sidebarWidth = useSidebarWidth();
  const hasSearchQuery = searchQuery.trim();

  const renderContent = () => (
    <div
      className={cn(
        'mx-auto flex w-full max-w-7xl items-start gap-4 px-6 max-md:justify-between md:flex-col',
        hasSearchQuery && 'max-md:items-center',
        isSticky && !hasSearchQuery && 'md:items-center'
      )}
    >
      {hasSearchQuery && (
        <BackButton
          onClick={onSearchReset}
          className={cn(!isSticky && 'md:-translate-y-1/2 md:px-6')}
        />
      )}
      <>
        {!hasSearchQuery && selectedOttServices.length === 0 ? (
          <>
            <div
              className={cn(
                'flex flex-1 gap-4 max-md:flex-col',
                !isSticky && 'z-50 md:-translate-y-1/2'
              )}
            >
              <SeasonSelector
                onSeasonSelect={onSeasonSelect}
                currentYear={isThisWeek ? null : year}
                currentQuarter={isThisWeek ? null : quarter}
              />
              <AiringCheckbox
                checked={showOnlyAiring}
                onChange={onShowOnlyAiringChange}
              />
            </div>
            <DaySelection
              selectedDay={selectedDay}
              onDaySelect={onDaySelect}
              emptyDays={emptyDays}
              isThisWeek={isThisWeek}
              isSticky={isSticky}
            />
          </>
        ) : (
          <div className="flex flex-col gap-4">
            {!hasSearchQuery && (
              <div className={cn(!isSticky && 'z-50 md:-translate-y-6')}>
                <SeasonSelector
                  onSeasonSelect={onSeasonSelect}
                  currentYear={isThisWeek ? null : year}
                  currentQuarter={isThisWeek ? null : quarter}
                />
              </div>
            )}
            {!isSticky && (
              <OttFilterQueue
                selectedOttServices={selectedOttServices}
                onRemove={onOttRemove}
                onClear={onOttClear}
              />
            )}
          </div>
        )}
      </>
    </div>
  );

  return (
    <>
      {/* 원본 요소 */}
      <div className="mt-10 mb-6 bg-white pb-4 max-md:pt-4 md:mt-20" ref={ref}>
        {renderContent()}
      </div>

      {/* Fixed 복사본 (스크롤 시 표시) */}
      {isSticky && (
        <div
          className="fixed top-[60px] z-40 bg-white/80 backdrop-blur-md"
          style={{
            left: `${sidebarWidth}px`,
            width: `calc(100vw - ${sidebarWidth}px)`,
          }}
        >
          <div className="mx-auto max-w-7xl py-3 md:px-6 md:py-2.5">
            {renderContent()}
          </div>
        </div>
      )}
    </>
  );
}
