'use client';

import { useState } from 'react';
import { LogFilterType, Schemas } from '@/types';
import AdminLogSection from './AdminLogSection';
import EpisodeTable, { EpisodeTableColumn } from './EpisodeTable';
import { format } from 'date-fns';
import { useWeeks } from '@/features/admin/hooks/queries/useWeeks';
import { useScheduleByWeek } from '@/features/admin/hooks/queries/useScheduleByWeek';
import { useEpisodeActions } from '@/features/admin/hooks/mutations/useEpisodeActions';

type EditingEpisodeField = {
  episodeId: number;
  field: 'episodeNumber' | 'scheduledAt';
};

export default function ScheduleManagementTab() {
  const { weekOptions, selectedWeek, setSelectedWeek } = useWeeks();
  const { schedule, loading } = useScheduleByWeek(selectedWeek);
  const { handleBreakEpisode, handleDeleteEpisode, handleUpdateEpisode } =
    useEpisodeActions();
  const [logFilterType, setLogFilterType] = useState<LogFilterType>(
    LogFilterType.EPISODE
  );
  const [editingEpisode, setEditingEpisode] =
    useState<EditingEpisodeField | null>(null);
  const [editingValues, setEditingValues] = useState<{
    episodeNumber?: string;
    scheduledAt?: string;
  }>({});

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
      render: (row) => {
        const isEditing =
          editingEpisode?.episodeId === row.episodeDto.episodeId &&
          editingEpisode?.field === 'episodeNumber';
        return isEditing ? (
          <input
            type="number"
            min={1}
            step={1}
            value={
              editingValues.episodeNumber ?? row.episodeDto.episodeNumber ?? ''
            }
            onChange={(e) =>
              setEditingValues({ episodeNumber: e.target.value })
            }
            onBlur={() => {
              const valueStr = editingValues.episodeNumber?.trim();
              if (!valueStr) {
                setEditingEpisode(null);
                setEditingValues({});
                return;
              }
              const num = Number(valueStr);
              if (!Number.isFinite(num) || num <= 0) {
                alert('올바른 에피소드 번호를 입력하세요.');
                setEditingEpisode(null);
                setEditingValues({});
                return;
              }
              if (num === row.episodeDto.episodeNumber) {
                setEditingEpisode(null);
                setEditingValues({});
                return;
              }
              // 번호만 수정하는 경우 시간은 그대로 두기 위해 episodeNumber만 전송
              handleUpdateEpisode(
                row.episodeDto.episodeId,
                {
                  episodeNumber: num,
                },
                { weekId: selectedWeek?.weekId }
              );
              setEditingEpisode(null);
              setEditingValues({});
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur();
              } else if (e.key === 'Escape') {
                setEditingEpisode(null);
                setEditingValues({});
              }
            }}
            className="w-16 -translate-x-2 rounded bg-gray-100 px-2 py-0.5 text-sm outline-none dark:bg-zinc-700 dark:text-white"
            autoFocus
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setEditingEpisode({
                episodeId: row.episodeDto.episodeId,
                field: 'episodeNumber',
              });
              setEditingValues({
                episodeNumber: row.episodeDto.episodeNumber?.toString() ?? '',
              });
            }}
          >
            {row.episodeDto.episodeNumber}
          </button>
        );
      },
    },
    {
      key: 'scheduledAt',
      header: '방영 시간',
      render: (row) => {
        const isEditing =
          editingEpisode?.episodeId === row.episodeDto.episodeId &&
          editingEpisode?.field === 'scheduledAt';
        const dateValue =
          editingValues.scheduledAt ??
          (row.episodeDto.scheduledAt
            ? new Date(row.episodeDto.scheduledAt).toISOString().slice(0, 16)
            : '');
        const display = format(row.episodeDto.scheduledAt, 'yyyy-MM-dd HH:mm');
        return isEditing ? (
          <input
            type="datetime-local"
            value={dateValue}
            onChange={(e) => setEditingValues({ scheduledAt: e.target.value })}
            onBlur={() => {
              const valueStr = editingValues.scheduledAt?.trim();
              if (!valueStr) {
                // 값이 비어있으면 원래 값과 동일한 것으로 간주 (변경 없음)
                setEditingEpisode(null);
                setEditingValues({});
                return;
              }
              const date = new Date(valueStr);
              if (Number.isNaN(date.getTime())) {
                alert('올바른 날짜/시간 형식이 아닙니다.');
                setEditingEpisode(null);
                setEditingValues({});
                return;
              }
              // 원래 값과 비교하여 변경되지 않았으면 요청하지 않음
              const currentDate = new Date(row.episodeDto.scheduledAt);
              if (date.getTime() === currentDate.getTime()) {
                setEditingEpisode(null);
                setEditingValues({});
                return;
              }
              // datetime-local 값(YYYY-MM-DDTHH:mm)에 초만 붙여 LocalDateTime 문자열로 전송
              handleUpdateEpisode(
                row.episodeDto.episodeId,
                {
                  episodeNumber: row.episodeDto.episodeNumber,
                  rescheduledAt: `${valueStr}:00`,
                },
                { weekId: selectedWeek?.weekId }
              );
              setEditingEpisode(null);
              setEditingValues({});
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur();
              } else if (e.key === 'Escape') {
                setEditingEpisode(null);
                setEditingValues({});
              }
            }}
            className="-translate-x-2 rounded bg-gray-100 px-2 py-1 text-sm outline-none dark:bg-zinc-700 dark:text-white"
            autoFocus
          />
        ) : (
          <button
            type="button"
            className="min-w-60 text-left"
            onClick={() => {
              setEditingEpisode({
                episodeId: row.episodeDto.episodeId,
                field: 'scheduledAt',
              });
              setEditingValues({
                scheduledAt: row.episodeDto.scheduledAt
                  ? new Date(row.episodeDto.scheduledAt)
                      .toISOString()
                      .slice(0, 16)
                  : '',
              });
            }}
          >
            {display}
          </button>
        );
      },
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
                  handleBreakEpisode(row.episodeDto.episodeId, {
                    weekId: selectedWeek?.weekId,
                  });
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
            onClick={() =>
              handleDeleteEpisode(row.episodeDto.episodeId, {
                weekId: selectedWeek?.weekId,
              })
            }
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
