'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AdminEpisodeDto, LogFilterType } from '@/types';
import AdminLogSection from './AdminLogSection';
import { MdPlayArrow } from 'react-icons/md';
import { cn, formatAirTime } from '@/lib';
import { format } from 'date-fns';
import EpisodeTable, { EpisodeTableColumn } from './EpisodeTable';
import {
  InfoRequestDtoStatus,
  PostRequestDtoDayOfWeek,
} from '@/types/generated/api';
import { ANIME_HEADERS } from '@/features/admin/constants';
import { formatStatus, formatDayOfWeek } from '@/features/admin/utils';
import { useQuarters } from '@/features/admin/hooks/queries/useQuarters';
import { useAnimesByQuarter } from '@/features/admin/hooks/queries/useAnimesByQuarter';
import { useEpisodesByAnime } from '@/features/admin/hooks/queries/useEpisodesByAnime';
import { useAnimeFieldEdit } from '@/features/admin/hooks/mutations/useUpdateAnime';
import { useEpisodeActions } from '@/features/admin/hooks/mutations/useEpisodeActions';
import { Pencil } from 'lucide-react';

type EditingEpisodeField = {
  episodeId: number;
  field: 'episodeNumber' | 'scheduledAt';
};

export default function AnimationManagementTab() {
  const [expandedAnimeId, setExpandedAnimeId] = useState<number | null>(null);
  const [logFilterType, setLogFilterType] = useState<LogFilterType>(
    LogFilterType.ANIME
  );
  const [hoveredAnimeId, setHoveredAnimeId] = useState<number | null>(null);
  const [uploadingAnimeId, setUploadingAnimeId] = useState<number | null>(null);
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const { quarterOptions, selectedQuarter, setSelectedQuarter } = useQuarters();
  const { animes, loading: loadingAnimes } =
    useAnimesByQuarter(selectedQuarter);
  const { episodes, loading: loadingEpisodes } =
    useEpisodesByAnime(expandedAnimeId);
  const {
    editingField,
    editingValues,
    setEditingValues,
    handleFieldEdit,
    handleFieldSave,
    handleFieldCancel,
    handleSetTotalEpisodesUnknown,
    handleUpdateAnimeImage: handleUpdateAnimeImageBase,
    isUploadingImage,
  } = useAnimeFieldEdit(animes, selectedQuarter);

  const handleUpdateAnimeImage = (animeId: number, imageFile: File) => {
    setUploadingAnimeId(animeId);
    handleUpdateAnimeImageBase(animeId, imageFile);
  };

  // 업로드 완료 후 상태 초기화
  useEffect(() => {
    if (!isUploadingImage && uploadingAnimeId !== null) {
      setUploadingAnimeId(null);
    }
  }, [isUploadingImage, uploadingAnimeId]);

  const {
    handleQueueEpisode,
    handleBreakEpisode,
    handleDeleteEpisode,
    handleUpdateEpisode,
  } = useEpisodeActions();
  const [editingEpisode, setEditingEpisode] =
    useState<EditingEpisodeField | null>(null);
  const [editingEpisodeValues, setEditingEpisodeValues] = useState<{
    episodeNumber?: string;
    scheduledAt?: string;
  }>({});

  const toggleExpand = (animeId: number) => {
    if (expandedAnimeId === animeId) {
      setExpandedAnimeId(null);
      return;
    }
    setExpandedAnimeId(animeId);
  };

  const episodeColumns: EpisodeTableColumn<AdminEpisodeDto>[] = [
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
              if (!expandedAnimeId) {
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
                { animeId: expandedAnimeId }
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
              if (!expandedAnimeId) {
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
                { animeId: expandedAnimeId }
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
              if (!expandedAnimeId) return;
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
                  expandedAnimeId &&
                    handleBreakEpisode(item.episodeDto.episodeId, {
                      animeId: expandedAnimeId,
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
              expandedAnimeId &&
                handleDeleteEpisode(item.episodeDto.episodeId, {
                  animeId: expandedAnimeId,
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

  return (
    <div className="space-y-6">
      <AdminLogSection
        filterType={logFilterType}
        onFilterChange={setLogFilterType}
        title="관리 로그"
      />

      <div className="rounded-lg border border-gray-200 p-6 shadow-sm dark:border-none dark:bg-zinc-800">
        <h2 className="mb-4 text-xl font-semibold">분기별 애니메이션 목록</h2>
        <div className="mb-4">
          <label className="mr-2 text-sm text-gray-600 dark:text-zinc-400">
            분기
          </label>
          <select
            value={selectedQuarter?.optionValue ?? ''}
            onChange={(e) => {
              const val = Number(e.target.value);
              const opt = quarterOptions.find((o) => o.optionValue === val);
              setSelectedQuarter(opt ?? null);
            }}
            className="rounded border border-gray-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
          >
            <option value="">선택</option>
            {quarterOptions.map((opt) => (
              <option key={opt.optionValue} value={opt.optionValue}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {loadingAnimes ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
          </div>
        ) : (
          <div className="relative overflow-x-scroll">
            <table className="w-full divide-y divide-gray-200 dark:divide-zinc-600">
              <thead>
                <tr>
                  <th />
                  {ANIME_HEADERS.map((header) => (
                    <th
                      key={header.key}
                      className="p-3 text-left text-xs font-medium tracking-wider whitespace-nowrap text-gray-500 dark:text-white"
                    >
                      {header.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-zinc-600 dark:bg-zinc-800">
                {animes.map((row) => (
                  <React.Fragment key={row.animeId}>
                    <tr key={row.animeId}>
                      <td
                        onClick={() => toggleExpand(row.animeId)}
                        className="cursor-pointer px-1 py-2 text-gray-500"
                      >
                        <MdPlayArrow
                          className={cn(
                            expandedAnimeId === row.animeId && 'rotate-90',
                            'mx-auto rounded-xs transition-transform duration-200 hover:bg-gray-100 dark:hover:bg-zinc-700'
                          )}
                        />
                      </td>
                      <td className="p-3 text-sm whitespace-nowrap text-gray-900 dark:text-zinc-200">
                        {row.animeId}
                      </td>
                      <td
                        className="relative flex min-w-70 items-center gap-3 p-3 text-sm text-gray-900 dark:text-zinc-200"
                        title={row.titleKor}
                        onMouseEnter={() => setHoveredAnimeId(row.animeId)}
                        onMouseLeave={() => setHoveredAnimeId(null)}
                      >
                        <div className="relative">
                          <img
                            src={row.mainThumbnailUrl}
                            alt={row.titleKor}
                            className="h-9 w-6 rounded-xs object-cover"
                          />
                          {hoveredAnimeId === row.animeId && (
                            <button
                              type="button"
                              title="이미지 수정"
                              onClick={(e) => {
                                e.stopPropagation();
                                fileInputRefs.current[row.animeId]?.click();
                              }}
                              disabled={
                                isUploadingImage &&
                                uploadingAnimeId === row.animeId
                              }
                              className="absolute top-0 left-0 flex h-full w-full items-center justify-center rounded-xs bg-black/50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isUploadingImage &&
                              uploadingAnimeId === row.animeId ? (
                                <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              ) : (
                                <Pencil className="size-3 text-white" />
                              )}
                            </button>
                          )}
                          <input
                            ref={(el) => {
                              fileInputRefs.current[row.animeId] = el;
                            }}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleUpdateAnimeImage(row.animeId, file);
                                // input 초기화
                                e.target.value = '';
                              }
                            }}
                          />
                        </div>
                        {row.titleKor}
                      </td>
                      <td className="max-w-50 min-w-50 p-3 text-sm whitespace-normal text-gray-600 dark:text-zinc-400">
                        {editingField?.animeId === row.animeId &&
                        editingField?.field === 'corp' ? (
                          <textarea
                            rows={1}
                            value={editingValues.corp ?? ''}
                            onChange={(e) =>
                              setEditingValues({ corp: e.target.value })
                            }
                            onBlur={(e) =>
                              handleFieldSave(
                                row.animeId,
                                'corp',
                                e.target.value
                              )
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleFieldSave(row.animeId, 'corp');
                              } else if (e.key === 'Escape') {
                                handleFieldCancel();
                              }
                            }}
                            placeholder="제작사를 입력하세요"
                            className="w-full -translate-x-2 rounded bg-gray-100 px-2 py-1 text-sm outline-none dark:bg-zinc-700 dark:text-white"
                            autoFocus
                          />
                        ) : (
                          <span
                            className={cn(
                              'cursor-pointer overflow-y-scroll',
                              !row.corp && 'text-zinc-500/50'
                            )}
                            onClick={() =>
                              handleFieldEdit(row.animeId, 'corp', row.corp)
                            }
                            title={row.corp ?? ''}
                          >
                            {row.corp ? row.corp : '제작사 입력'}
                          </span>
                        )}
                      </td>
                      <td className="relative w-[110px] p-3 text-sm whitespace-nowrap text-gray-600 dark:text-zinc-400">
                        {editingField?.animeId === row.animeId &&
                        editingField?.field === 'status' ? (
                          <select
                            value={editingValues.status ?? row.status ?? ''}
                            onChange={(e) => {
                              setEditingValues({
                                status: e.target.value as InfoRequestDtoStatus,
                              });
                              handleFieldSave(
                                row.animeId,
                                'status',
                                e.target.value as InfoRequestDtoStatus
                              );
                            }}
                            onBlur={handleFieldCancel}
                            className="absolute top-1/2 -translate-x-2 -translate-y-1/2 rounded bg-gray-100 px-1 py-1 text-sm outline-none dark:bg-zinc-700 dark:text-white"
                            autoFocus
                          >
                            <option value={InfoRequestDtoStatus.UPCOMING}>
                              예정
                            </option>
                            <option value={InfoRequestDtoStatus.NOW_SHOWING}>
                              방영중
                            </option>
                            <option value={InfoRequestDtoStatus.COOLING}>
                              휴방
                            </option>
                            <option value={InfoRequestDtoStatus.ENDED}>
                              종영
                            </option>
                          </select>
                        ) : (
                          <span
                            className="cursor-pointer"
                            onClick={() =>
                              handleFieldEdit(row.animeId, 'status', row.status)
                            }
                          >
                            {formatStatus(row.status ?? '')}
                          </span>
                        )}
                      </td>
                      <td className="relative w-[110px] p-3 text-sm whitespace-nowrap text-gray-600 dark:text-zinc-400">
                        {editingField?.animeId === row.animeId &&
                        editingField?.field === 'dayOfWeek' ? (
                          <select
                            value={
                              editingValues.dayOfWeek ?? row.dayOfWeek ?? ''
                            }
                            onChange={(e) => {
                              const next = e.target
                                .value as PostRequestDtoDayOfWeek;
                              setEditingValues({
                                dayOfWeek: next,
                              });
                              handleFieldSave(row.animeId, 'dayOfWeek', next);
                            }}
                            onBlur={handleFieldCancel}
                            className="absolute top-1/2 -translate-x-2 -translate-y-1/2 rounded bg-gray-100 p-1 text-sm outline-none dark:bg-zinc-700 dark:text-white"
                            autoFocus
                          >
                            <option value={PostRequestDtoDayOfWeek.MON}>
                              월
                            </option>
                            <option value={PostRequestDtoDayOfWeek.TUE}>
                              화
                            </option>
                            <option value={PostRequestDtoDayOfWeek.WED}>
                              수
                            </option>
                            <option value={PostRequestDtoDayOfWeek.THU}>
                              목
                            </option>
                            <option value={PostRequestDtoDayOfWeek.FRI}>
                              금
                            </option>
                            <option value={PostRequestDtoDayOfWeek.SAT}>
                              토
                            </option>
                            <option value={PostRequestDtoDayOfWeek.SUN}>
                              일
                            </option>
                          </select>
                        ) : (
                          <span
                            className="cursor-pointer"
                            onClick={() =>
                              handleFieldEdit(
                                row.animeId,
                                'dayOfWeek',
                                row.dayOfWeek
                              )
                            }
                          >
                            {formatDayOfWeek(row.dayOfWeek)}
                          </span>
                        )}
                      </td>
                      <td className="relative w-[110px] p-3 text-sm whitespace-nowrap text-gray-600 dark:text-zinc-400">
                        {editingField?.animeId === row.animeId &&
                        editingField?.field === 'airTime' ? (
                          <input
                            type="text"
                            value={editingValues.airTime ?? ''}
                            onChange={(e) =>
                              setEditingValues({ airTime: e.target.value })
                            }
                            onBlur={(e) =>
                              handleFieldSave(
                                row.animeId,
                                'airTime',
                                e.target.value
                              )
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleFieldSave(row.animeId, 'airTime');
                              } else if (e.key === 'Escape') {
                                handleFieldCancel();
                              }
                            }}
                            placeholder="예: 23:00"
                            className="absolute top-1/2 w-16 -translate-x-2 -translate-y-1/2 rounded bg-gray-100 px-2 py-1 text-sm dark:bg-zinc-700 dark:text-white"
                            autoFocus
                          />
                        ) : (
                          <span
                            className="cursor-pointer"
                            onClick={() =>
                              handleFieldEdit(
                                row.animeId,
                                'airTime',
                                row.airTime
                              )
                            }
                          >
                            {formatAirTime(row.airTime)}
                          </span>
                        )}
                      </td>
                      <td className="w-[110px] p-3 text-sm whitespace-nowrap text-gray-600 dark:text-zinc-400">
                        {editingField?.animeId === row.animeId &&
                        editingField?.field === 'totalEpisodes' ? (
                          <input
                            type="number"
                            min={1}
                            step={1}
                            value={editingValues.totalEpisodes ?? ''}
                            onChange={(e) =>
                              setEditingValues({
                                totalEpisodes: e.target.value,
                              })
                            }
                            onBlur={() =>
                              handleFieldSave(row.animeId, 'totalEpisodes')
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleFieldSave(row.animeId, 'totalEpisodes');
                              } else if (e.key === 'Escape') {
                                setEditingValues({});
                              }
                            }}
                            placeholder="예: 12"
                            className="w-16 -translate-x-2 rounded bg-gray-100 px-2 py-1 text-sm dark:bg-zinc-700 dark:text-white"
                            autoFocus
                          />
                        ) : (
                          <div className="flex items-center gap-4">
                            <span
                              className="cursor-pointer"
                              onClick={() =>
                                handleFieldEdit(
                                  row.animeId,
                                  'totalEpisodes',
                                  row.totalEpisodes
                                )
                              }
                            >
                              {row.totalEpisodes ?? 12}
                            </span>
                            {row.totalEpisodes && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleSetTotalEpisodesUnknown(row.animeId)
                                }
                                className="border-brand-zinc-300 rounded border px-1 py-0.5 text-xs text-gray-600 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-zinc-700"
                              >
                                알 수 없음
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                    {expandedAnimeId === row.animeId && (
                      <tr key={`ep-${row.animeId}`}>
                        <td
                          colSpan={8}
                          className="py-4 pl-10 dark:bg-zinc-800/80"
                        >
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
                                      handleQueueEpisode(row.animeId);
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
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
