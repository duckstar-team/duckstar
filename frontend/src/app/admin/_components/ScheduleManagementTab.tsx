'use client';

import { useState } from 'react';
import { breakEpisode, deleteEpisode } from '@/api/admin';
import { LogFilterType, Schemas } from '@/types';
import AdminLogSection from './AdminLogSection';
import EpisodeTable, { EpisodeTableColumn } from './EpisodeTable';
import { format } from 'date-fns';
import { showToast } from '@/components/common/Toast';
import { useWeeks } from '@/features/admin/hooks/useWeeks';
import { useScheduleByWeek } from '@/features/admin/hooks/useScheduleByWeek';

export default function ScheduleManagementTab() {
  const { weekOptions, selectedWeek, setSelectedWeek } = useWeeks();
  const { schedule, loading, refreshSchedule } =
    useScheduleByWeek(selectedWeek);
  const [logFilterType, setLogFilterType] = useState<LogFilterType>(
    LogFilterType.EPISODE
  );

  const handleBreakEpisode = async (episodeId: number) => {
    try {
      const res = await breakEpisode(episodeId);
      if (res.isSuccess) {
        showToast.success('휴방 처리되었습니다.');
        refreshSchedule();
      }
    } catch (e) {
      showToast.error('휴방 처리에 실패했습니다.');
    }
  };

  const handleDeleteEpisode = async (episodeId: number) => {
    if (!confirm('이 에피소드를 삭제하시겠습니까?')) return;
    try {
      await deleteEpisode(episodeId);
      showToast.success('에피소드가 삭제되었습니다.');
      refreshSchedule();
    } catch (e) {
      showToast.error('에피소드 삭제에 실패했습니다.');
    }
  };

  const rows = schedule?.scheduleInfoDtos ?? [];

  const episodeColumns: EpisodeTableColumn<Schemas['ScheduleInfoDto']>[] = [
    {
      key: 'titleKor',
      header: '작품명',
      render: (row) => row.titleKor,
    },
    {
      key: 'episodeNumber',
      header: '에피소드 번호',
      render: (row) => row.episodeDto.episodeNumber,
    },
    {
      key: 'scheduledAt',
      header: '방영 시간',
      render: (row) => format(row.episodeDto.scheduledAt, 'yyyy-MM-dd HH:mm'),
    },
    {
      key: 'nextEpScheduledAt',
      header: '다음 방영 시간',
      render: (row) =>
        format(row.episodeDto.nextEpScheduledAt, 'yyyy-MM-dd HH:mm'),
    },
    {
      key: 'isBreak',
      header: '휴방 여부',
      render: (row) => (row.episodeDto.isBreak ? '휴방' : '-'),
    },
    {
      key: 'isRescheduled',
      header: '재편성 여부',
      render: (row) => (row.episodeDto.isRescheduled ? '재편성' : '-'),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex gap-2">
          <div className="w-9">
            {!row.episodeDto.isBreak ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleBreakEpisode(row.episodeDto.episodeId);
                }}
                className="rounded bg-orange-100 px-2 py-0.5 text-xs text-orange-500 hover:bg-orange-200/80 dark:bg-orange-400/20 dark:text-orange-400 dark:hover:bg-orange-400/40"
              >
                휴방
              </button>
            ) : (
              <div className="invisible">휴방</div>
            )}
          </div>
          <button
            type="button"
            onClick={() => handleDeleteEpisode(row.episodeDto.episodeId)}
            className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-800 hover:bg-red-200/80 dark:bg-red-900/40 dark:text-red-400 dark:hover:bg-red-500/30"
          >
            삭제
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminLogSection
        filterType={logFilterType}
        onFilterChange={setLogFilterType}
        title="관리 로그"
      />

      <div className="rounded-lg border border-gray-200 p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
        <h2 className="mb-4 text-xl font-semibold">주차별 편성표</h2>
        <div className="mb-4">
          <label className="mr-2 text-sm text-gray-600 dark:text-zinc-400">
            주차 (월 18시 기준)
          </label>
          <select
            value={selectedWeek?.optionValue ?? ''}
            onChange={(e) => {
              const val = Number(e.target.value);
              const opt = weekOptions.find((o) => o.optionValue === val);
              setSelectedWeek(opt ?? null);
            }}
            className="rounded border border-gray-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
          >
            <option value="">선택</option>
            {weekOptions.map((opt) => (
              <option key={opt.optionValue} value={opt.optionValue}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
          </div>
        ) : (
          <div className="relative overflow-x-auto">
            <EpisodeTable<Schemas['ScheduleInfoDto']>
              columns={episodeColumns}
              rows={rows}
              getRowKey={(row) => row.episodeDto.episodeId}
              emptyMessage="해당 주차 에피소드가 없습니다."
            />
          </div>
        )}
      </div>
    </div>
  );
}
