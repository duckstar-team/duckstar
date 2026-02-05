'use client';

import React from 'react';
import { AdminEpisodeDto } from '@/types';
import { format } from 'date-fns';
import EpisodeTable, { EpisodeTableColumn } from './EpisodeTable';
import { useEpisodesByAnime } from '../hooks/queries/useEpisodesByAnime';
import { useEpisodeActions } from '../hooks/mutations/useEpisodeActions';

export type EditingEpisodeField = {
  episodeId: number;
  field: 'episodeNumber' | 'scheduledAt';
};

interface AnimeEpisodeRowProps {
  animeId: number;
  editingEpisode: EditingEpisodeField | null;
  editingEpisodeValues: { episodeNumber?: string; scheduledAt?: string };
  setEditingEpisode: (field: EditingEpisodeField | null) => void;
  setEditingEpisodeValues: (values: {
    episodeNumber?: string;
    scheduledAt?: string;
  }) => void;
}

export default function AnimeEpisodeRow({
  animeId,
  editingEpisode,
  editingEpisodeValues,
  setEditingEpisode,
  setEditingEpisodeValues,
}: AnimeEpisodeRowProps) {
  const { episodes, loading: loadingEpisodes } = useEpisodesByAnime(animeId);
  const {
    handleQueueEpisode,
    handleBreakEpisode,
    handleDeleteEpisode,
    handleUpdateEpisode,
  } = useEpisodeActions();

  const getEpisodeColumns = (): EpisodeTableColumn<AdminEpisodeDto>[] => [
    {
      key: 'episodeNumber',
      header: '에피소드 번호',
      render: (item) => {
        const isEditing =
          editingEpisode?.episodeId === item.episodeDto.episodeId &&
          editingEpisode?.field === 'episodeNumber';
        return isEditing ? (
          <input
            type="number"
            min={1}
            step={1}
            value={
              editingEpisodeValues.episodeNumber ??
              item.episodeDto.episodeNumber ??
              ''
            }
            onChange={(e) =>
              setEditingEpisodeValues({ episodeNumber: e.target.value })
            }
            onBlur={() => {
              const valueStr = editingEpisodeValues.episodeNumber?.trim();
              if (!valueStr) {
                setEditingEpisode(null);
                setEditingEpisodeValues({});
                return;
              }
              const num = Number(valueStr);
              if (!Number.isFinite(num) || num <= 0) {
                alert('올바른 에피소드 번호를 입력하세요.');
                setEditingEpisode(null);
                setEditingEpisodeValues({});
                return;
              }
              if (num === item.episodeDto.episodeNumber) {
                setEditingEpisode(null);
                setEditingEpisodeValues({});
                return;
              }
              // 번호만 수정하는 경우 시간은 그대로 두기 위해 episodeNumber만 전송
              handleUpdateEpisode(
                item.episodeDto.episodeId,
                {
                  episodeNumber: num,
                },
                { animeId }
              );
              setEditingEpisode(null);
              setEditingEpisodeValues({});
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur();
              } else if (e.key === 'Escape') {
                setEditingEpisode(null);
                setEditingEpisodeValues({});
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
                episodeId: item.episodeDto.episodeId,
                field: 'episodeNumber',
              });
              setEditingEpisodeValues({
                episodeNumber: item.episodeDto.episodeNumber?.toString() ?? '',
              });
            }}
          >
            {item.episodeDto.episodeNumber}
          </button>
        );
      },
    },
    {
      key: 'scheduledAt',
      header: '방영 시간',
      render: (item) => {
        const isEditing =
          editingEpisode?.episodeId === item.episodeDto.episodeId &&
          editingEpisode?.field === 'scheduledAt';
        if (!item.episodeDto.scheduledAt && !isEditing) {
          return '-';
        }
        const dateValue =
          editingEpisodeValues.scheduledAt ??
          (item.episodeDto.scheduledAt
            ? new Date(item.episodeDto.scheduledAt).toISOString().slice(0, 16)
            : '');
        const display = item.episodeDto.scheduledAt
          ? format(item.episodeDto.scheduledAt, 'yyyy-MM-dd HH:mm')
          : '-';
        return isEditing ? (
          <input
            type="datetime-local"
            value={dateValue}
            onChange={(e) =>
              setEditingEpisodeValues({ scheduledAt: e.target.value })
            }
            onBlur={() => {
              const valueStr = editingEpisodeValues.scheduledAt?.trim();
              if (!valueStr) {
                // 값이 비어있으면 원래 값과 동일한 것으로 간주 (변경 없음)
                setEditingEpisode(null);
                setEditingEpisodeValues({});
                return;
              }
              const date = new Date(valueStr);
              if (Number.isNaN(date.getTime())) {
                alert('올바른 날짜/시간 형식이 아닙니다.');
                setEditingEpisode(null);
                setEditingEpisodeValues({});
                return;
              }
              // 원래 값과 비교하여 변경되지 않았으면 요청하지 않음
              if (
                item.episodeDto.scheduledAt &&
                date.getTime() ===
                  new Date(item.episodeDto.scheduledAt).getTime()
              ) {
                setEditingEpisode(null);
                setEditingEpisodeValues({});
                return;
              }
              // datetime-local 값(YYYY-MM-DDTHH:mm)에 초만 붙여 LocalDateTime 문자열로 전송
              handleUpdateEpisode(
                item.episodeDto.episodeId,
                {
                  episodeNumber: item.episodeDto.episodeNumber,
                  rescheduledAt: `${valueStr}:00`,
                },
                { animeId }
              );
              setEditingEpisode(null);
              setEditingEpisodeValues({});
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur();
              } else if (e.key === 'Escape') {
                setEditingEpisode(null);
                setEditingEpisodeValues({});
              }
            }}
            className="-translate-x-2 rounded bg-gray-100 px-2 py-0.5 text-sm outline-none dark:bg-zinc-700 dark:text-white"
            autoFocus
          />
        ) : (
          <button
            type="button"
            className="text-left"
            onClick={() => {
              setEditingEpisode({
                episodeId: item.episodeDto.episodeId,
                field: 'scheduledAt',
              });
              setEditingEpisodeValues({
                scheduledAt: item.episodeDto.scheduledAt
                  ? new Date(item.episodeDto.scheduledAt)
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
      header: '다음 에피소드 방영 시간',
      render: (item) =>
        item.episodeDto.nextEpScheduledAt
          ? format(item.episodeDto.nextEpScheduledAt, 'yyyy-MM-dd HH:mm')
          : '-',
    },
    {
      key: 'isBreak',
      header: '휴방 여부',
      render: (item) => (item.episodeDto.isBreak ? '휴방' : '-'),
    },
    {
      key: 'actions',
      header: '',
      render: (item) => (
        <div className="flex gap-2">
          <div className="w-9">
            {!item.episodeDto.isBreak ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleBreakEpisode(item.episodeDto.episodeId, {
                    animeId,
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
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteEpisode(item.episodeDto.episodeId, {
                animeId,
              });
            }}
            className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-800 hover:bg-red-200/80 dark:bg-red-900/40 dark:text-red-400 dark:hover:bg-red-500/30"
          >
            삭제
          </button>
        </div>
      ),
    },
  ];

  const episodeColumns = getEpisodeColumns();

  return (
    <tr key={`ep-${animeId}`}>
      <td colSpan={8} className="py-4 pl-10 dark:bg-zinc-800/80">
        {loadingEpisodes ? (
          <div className="flex justify-center py-4">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
          </div>
        ) : (
          <EpisodeTable
            columns={episodeColumns}
            rows={episodes ?? []}
            getRowKey={(item) => item.episodeDto.episodeId}
            footer={
              <div className="flex w-full justify-end">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQueueEpisode(animeId);
                  }}
                  className="rounded border border-dashed border-gray-400 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 dark:border-zinc-500 dark:text-zinc-400 dark:hover:bg-zinc-700"
                >
                  에피소드 추가
                </button>
              </div>
            }
          />
        )}
      </td>
    </tr>
  );
}
