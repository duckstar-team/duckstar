'use client';

import React, { useState } from 'react';
import { AdminEpisodeDto, LogFilterType } from '@/types';
import AdminLogSection from './AdminLogSection';
import { MdPlayArrow } from 'react-icons/md';
import { cn, formatAirTime } from '@/lib';
import { format } from 'date-fns';
import ImageModal from '@/components/domain/anime/ImageModal';
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

export default function AnimationManagementTab() {
  const [expandedAnimeId, setExpandedAnimeId] = useState<number | null>(null);
  const [logFilterType, setLogFilterType] = useState<LogFilterType>(
    LogFilterType.ANIME
  );
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [selectedImageTitle, setSelectedImageTitle] = useState<string>('');

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
  } = useAnimeFieldEdit(animes, selectedQuarter);
  const { handleQueueEpisode, handleBreakEpisode, handleDeleteEpisode } =
    useEpisodeActions();

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
      render: (item) => item.episodeDto.episodeNumber,
    },
    {
      key: 'scheduledAt',
      header: '방영 시간',
      render: (item) =>
        item.episodeDto.scheduledAt
          ? format(item.episodeDto.scheduledAt, 'yyyy-MM-dd HH:mm')
          : '-',
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
                        className="flex min-w-70 items-center gap-3 p-3 text-sm text-gray-900 dark:text-zinc-200"
                        title={row.titleKor}
                      >
                        <img
                          src={row.mainThumbnailUrl}
                          alt={row.titleKor}
                          className="h-9 w-6 cursor-zoom-in rounded-xs object-cover"
                          onClick={() => {
                            setSelectedImageUrl(row.mainThumbnailUrl || null);
                            setSelectedImageTitle(row.titleKor || '제목 없음');
                          }}
                        />
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
                            onBlur={() => handleFieldSave(row.animeId, 'corp')}
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
                              handleFieldSave(row.animeId, 'status');
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
                              setEditingValues({
                                dayOfWeek: e.target
                                  .value as PostRequestDtoDayOfWeek,
                              });
                              handleFieldSave(row.animeId, 'dayOfWeek');
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
                            onBlur={() =>
                              handleFieldSave(row.animeId, 'airTime')
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
                            {row.totalEpisodes ?? '-'}
                          </span>
                        )}
                      </td>
                    </tr>
                    {expandedAnimeId === row.animeId && (
                      <tr key={`ep-${row.animeId}`}>
                        <td
                          colSpan={8}
                          className="bg-gray-50 py-4 pl-10 dark:bg-zinc-800/80"
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

        {/* 이미지 확대 모달 */}
        {selectedImageUrl && (
          <ImageModal
            isOpen={selectedImageUrl !== null}
            onClose={() => {
              setSelectedImageUrl(null);
              setSelectedImageTitle('');
            }}
            imageUrl={selectedImageUrl ?? ''}
            title={selectedImageTitle}
          />
        )}
      </div>
    </div>
  );
}
