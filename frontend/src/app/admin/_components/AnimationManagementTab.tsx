'use client';

import React, { useState, useEffect } from 'react';
import { getQuarters } from '@/api/search';
import {
  getAnimesByQuarter,
  getEpisodesByAnimeAdmin,
  updateAnimeInfo,
  updateAnimeTotalEpisodes,
  setAnimeTotalEpisodesUnknown,
  updateAnimeImage,
  patchEpisode,
  breakEpisode,
  deleteEpisode,
  queueEpisode,
} from '@/api/admin';
import { AdminEpisodeDto, LogFilterType, Schemas } from '@/types';
import AdminLogSection from './AdminLogSection';
import { MdPlayArrow } from 'react-icons/md';
import { cn, formatAirTime } from '@/lib';
import { format } from 'date-fns';
import { showToast } from '@/components/common/Toast';
import ImageModal from '@/components/domain/anime/ImageModal';
import EpisodeTable, { EpisodeTableColumn } from './EpisodeTable';
import {
  InfoRequestDtoStatus,
  PostRequestDtoDayOfWeek,
} from '@/types/generated/api';

const ANIME_HEADERS = [
  { label: '애니메이션 ID', key: 'animeId' },
  { label: '애니메이션 제목', key: 'titleKor' },
  { label: '제작사', key: 'corp' },
  { label: '상태', key: 'status' },
  { label: '방영 요일', key: 'dayOfWeek' },
  { label: '방영 시간', key: 'airTime' },
  { label: '총 에피소드 수', key: 'totalEpisodes' },
];

function formatStatus(s: string): string {
  const map: Record<string, string> = {
    UPCOMING: '예정',
    NOW_SHOWING: '방영중',
    COOLING: '휴방',
    ENDED: '종영',
  };
  return map[s] ?? s;
}

function formatDayOfWeek(d?: string | null): string {
  const map: Record<string, string> = {
    MON: '월',
    TUE: '화',
    WED: '수',
    THU: '목',
    FRI: '금',
    SAT: '토',
    SUN: '일',
  };
  return map[d ?? ''] ?? d ?? '';
}

interface QuarterOption {
  label: string;
  year: number;
  quarter: number;
  /** 드롭다운 옵션 구분용 (year*100+quarter) */
  optionValue: number;
}

export default function AnimationManagementTab() {
  const [quarterOptions, setQuarterOptions] = useState<QuarterOption[]>([]);
  const [selectedQuarter, setSelectedQuarter] = useState<QuarterOption | null>(
    null
  );
  const [animes, setAnimes] = useState<Schemas['AdminAnimeDto'][]>([]);
  const [loadingAnimes, setLoadingAnimes] = useState(false);
  const [expandedAnimeId, setExpandedAnimeId] = useState<number | null>(null);
  const [episodesByAnime, setEpisodesByAnime] = useState<
    Record<number, AdminEpisodeDto[]>
  >({});
  const [loadingEpisodes, setLoadingEpisodes] = useState<
    Record<number, boolean>
  >({});
  const [logFilterType, setLogFilterType] = useState<LogFilterType>(
    LogFilterType.ANIME
  );
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [selectedImageTitle, setSelectedImageTitle] = useState<string>('');
  const [editingField, setEditingField] = useState<{
    animeId: number;
    field: 'dayOfWeek' | 'status' | 'airTime' | 'corp' | 'totalEpisodes';
  } | null>(null);
  const [editingValues, setEditingValues] = useState<{
    dayOfWeek?: PostRequestDtoDayOfWeek;
    status?: InfoRequestDtoStatus;
    airTime?: string;
    corp?: string;
    totalEpisodes?: string;
  }>({});

  // 분기 목록: getQuarters() 리턴값만 사용 (GET /api/v1/search/quarters)
  useEffect(() => {
    let cancelled = false;
    const fetchQuarters = async () => {
      try {
        const res = await getQuarters();
        if (cancelled || !res.isSuccess || !res.result) return;
        const list: QuarterOption[] = [];
        res.result.forEach((item: Schemas['QuarterResponseDto']) => {
          const year = item.year;
          (item.quarters ?? []).forEach((q: number) => {
            list.push({
              label: `${year}년 ${q}분기`,
              year,
              quarter: q,
              optionValue: year * 100 + q,
            });
          });
        });
        setQuarterOptions(list);
        if (list.length > 0 && selectedQuarter === null) {
          setSelectedQuarter(list[0]);
        }
      } catch (e) {
        // 에러 처리
      }
    };
    fetchQuarters();
    return () => {
      cancelled = true;
    };
  }, []);

  // getAnimesByQuarter의 quarterId는 getQuarters() 리턴으로 만든 선택값 사용
  useEffect(() => {
    if (selectedQuarter == null) return;
    setLoadingAnimes(true);
    const fetchAnimes = async () => {
      try {
        const res = await getAnimesByQuarter(
          selectedQuarter.year,
          selectedQuarter.quarter,
          0,
          100
        );
        if (res.isSuccess && res.result?.adminAnimeDtos) {
          setAnimes(res.result.adminAnimeDtos);
        } else {
          setAnimes([]);
        }
      } catch (e) {
        setAnimes([]);
      } finally {
        setLoadingAnimes(false);
      }
    };
    fetchAnimes();
  }, [selectedQuarter]);

  const toggleExpand = async (animeId: number) => {
    if (expandedAnimeId === animeId) {
      setExpandedAnimeId(null);
      return;
    }
    setExpandedAnimeId(animeId);
    if (episodesByAnime[animeId]) return;
    setLoadingEpisodes((prev) => ({ ...prev, [animeId]: true }));
    try {
      const res = await getEpisodesByAnimeAdmin(animeId);
      if (res.isSuccess && res.result?.adminEpisodeDtos) {
        setEpisodesByAnime((prev) => ({
          ...prev,
          [animeId]: res.result!.adminEpisodeDtos!,
        }));
      }
    } catch (e) {
      // 에러 처리
    } finally {
      setLoadingEpisodes((prev) => ({ ...prev, [animeId]: false }));
    }
  };

  const refreshEpisodes = async (animeId: number) => {
    setLoadingEpisodes((prev) => ({ ...prev, [animeId]: true }));
    try {
      const res = await getEpisodesByAnimeAdmin(animeId);
      if (res.isSuccess && res.result?.adminEpisodeDtos) {
        setEpisodesByAnime((prev) => ({
          ...prev,
          [animeId]: res.result!.adminEpisodeDtos!,
        }));
      }
    } catch (e) {
      // 에러 처리
    } finally {
      setLoadingEpisodes((prev) => ({ ...prev, [animeId]: false }));
    }
  };

  const handleQueueEpisode = async (animeId: number) => {
    try {
      const res = await queueEpisode(animeId);
      if (res.isSuccess) {
        showToast.success('에피소드가 추가되었습니다.');
        refreshEpisodes(animeId);
      }
    } catch (e) {
      showToast.error('에피소드 추가에 실패했습니다.');
    }
  };

  const handleBreakEpisode = async (episodeId: number, animeId: number) => {
    try {
      const res = await breakEpisode(episodeId);
      if (res.isSuccess) {
        showToast.success('휴방 처리되었습니다.');
        refreshEpisodes(animeId);
      }
    } catch (e) {
      showToast.error('휴방 처리에 실패했습니다.');
    }
  };

  const handleDeleteEpisode = async (episodeId: number, animeId: number) => {
    if (!confirm('이 에피소드를 삭제하시겠습니까?')) return;
    try {
      await deleteEpisode(episodeId);
      showToast.success('에피소드가 삭제되었습니다.');
      refreshEpisodes(animeId);
    } catch (e) {
      showToast.error('에피소드 삭제에 실패했습니다.');
    }
  };

  // airTime 문자열을 LocalTime 객체로 변환
  // formatAirTime의 로직에 맞춰 24:00~28:59 (실제로는 00:00~04:59)도 허용
  const parseAirTime = (timeStr: string): Schemas['LocalTime'] | null => {
    const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    let hour = parseInt(match[1], 10);
    const minute = parseInt(match[2], 10);
    if (minute < 0 || minute > 59) return null;

    // 24시간 이상의 시간은 실제로는 전날 밤 시간 (예: 25:00 = 01:00)
    if (hour >= 24 && hour <= 28) {
      hour -= 24;
    } else if (hour < 0 || hour > 23) {
      return null;
    }

    return { hour, minute, second: 0, nano: 0 };
  };

  // airTime LocalTime 객체를 문자열로 변환
  const airTimeToString = (airTime?: Schemas['LocalTime'] | null): string => {
    if (!airTime) return '';
    return formatAirTime(airTime);
  };

  const handleFieldEdit = (
    animeId: number,
    field: 'dayOfWeek' | 'status' | 'airTime' | 'corp' | 'totalEpisodes',
    currentValue: any
  ) => {
    setEditingField({ animeId, field });
    if (field === 'airTime') {
      setEditingValues({ airTime: airTimeToString(currentValue) });
    } else if (field === 'corp') {
      setEditingValues({ corp: currentValue ?? '' });
    } else if (field === 'dayOfWeek') {
      setEditingValues({ dayOfWeek: currentValue });
    } else if (field === 'status') {
      setEditingValues({ status: currentValue });
    } else if (field === 'totalEpisodes') {
      setEditingValues({
        totalEpisodes:
          currentValue === null || currentValue === undefined
            ? ''
            : String(currentValue),
      });
    }
  };

  const handleFieldSave = async (
    animeId: number,
    field: 'dayOfWeek' | 'status' | 'airTime' | 'corp' | 'totalEpisodes'
  ) => {
    if (field === 'totalEpisodes') {
      const valueStr = (editingValues.totalEpisodes ?? '').trim();

      const anime = animes.find((a) => a.animeId === animeId);
      if (!anime) {
        setEditingField(null);
        setEditingValues({});
        return;
      }

      if (!valueStr) {
        // 비어 있으면 변경 취소
        setEditingField(null);
        setEditingValues({});
        return;
      }

      const newTotal = Number(valueStr);
      if (!Number.isFinite(newTotal) || newTotal <= 0) {
        showToast.error('올바른 총 화수를 입력하세요.');
        return;
      }

      if ((anime.totalEpisodes ?? null) === newTotal) {
        setEditingField(null);
        setEditingValues({});
        return;
      }

      try {
        const res = await updateAnimeTotalEpisodes(animeId, newTotal);
        if (res.isSuccess) {
          showToast.success('총 화수가 수정되었습니다.');
          // 로컬 상태 갱신
          setAnimes((prev) =>
            prev.map((a) =>
              a.animeId === animeId ? { ...a, totalEpisodes: newTotal } : a
            )
          );
        } else {
          showToast.error('총 화수 수정에 실패했습니다.');
        }
      } catch (e) {
        showToast.error('총 화수 수정에 실패했습니다.');
      } finally {
        setEditingField(null);
        setEditingValues({});
      }

      return;
    }

    const value = editingValues[field];
    if (value === undefined) {
      setEditingField(null);
      setEditingValues({});
      return;
    }

    const anime = animes.find((a) => a.animeId === animeId);
    if (!anime) {
      setEditingField(null);
      setEditingValues({});
      return;
    }

    // 값 변화 체크
    let hasChanged = false;
    if (field === 'airTime') {
      const parsedTime = parseAirTime(value as string);
      if (!parsedTime) {
        showToast.error('올바른 시간 형식을 입력하세요 (예: 23:00)');
        return;
      }
      const currentTime = anime.airTime;
      if (
        !currentTime ||
        currentTime.hour !== parsedTime.hour ||
        currentTime.minute !== parsedTime.minute
      ) {
        hasChanged = true;
      }
    } else if (field === 'corp') {
      if ((anime.corp ?? '') !== (value as string)) {
        hasChanged = true;
      }
    } else if (field === 'dayOfWeek') {
      if (anime.dayOfWeek !== (value as PostRequestDtoDayOfWeek)) {
        hasChanged = true;
      }
    } else if (field === 'status') {
      if (anime.status !== (value as InfoRequestDtoStatus)) {
        hasChanged = true;
      }
    }

    // 값 변화가 없으면 요청하지 않음
    if (!hasChanged) {
      setEditingField(null);
      setEditingValues({});
      return;
    }

    try {
      const updateData: Schemas['InfoRequestDto'] =
        {} as Schemas['InfoRequestDto'];

      if (field === 'airTime') {
        const parsedTime = parseAirTime(value as string);
        if (!parsedTime) {
          showToast.error('올바른 시간 형식을 입력하세요 (예: 23:00)');
          return;
        }
        updateData.airTime = parsedTime;
        updateData.dayOfWeek = anime.dayOfWeek as PostRequestDtoDayOfWeek;
        updateData.status = anime.status as InfoRequestDtoStatus;
        updateData.corp = anime.corp ?? '';
      } else if (field === 'corp') {
        updateData.corp = value as string;
        updateData.dayOfWeek = anime.dayOfWeek as PostRequestDtoDayOfWeek;
        updateData.status = anime.status as InfoRequestDtoStatus;
        updateData.airTime = anime.airTime as Schemas['LocalTime'];
      } else if (field === 'dayOfWeek') {
        updateData.dayOfWeek = value as PostRequestDtoDayOfWeek;
        updateData.status = anime.status as InfoRequestDtoStatus;
        updateData.airTime = anime.airTime as Schemas['LocalTime'];
        updateData.corp = anime.corp ?? '';
      } else if (field === 'status') {
        updateData.status = value as InfoRequestDtoStatus;
        updateData.dayOfWeek = anime.dayOfWeek as PostRequestDtoDayOfWeek;
        updateData.airTime = anime.airTime as Schemas['LocalTime'];
        updateData.corp = anime.corp ?? '';
      }

      const res = await updateAnimeInfo(animeId, updateData);
      if (res.isSuccess) {
        showToast.success('수정되었습니다.');
        // 목록 새로고침
        if (selectedQuarter) {
          try {
            const refreshRes = await getAnimesByQuarter(
              selectedQuarter.year,
              selectedQuarter.quarter,
              0,
              100
            );
            if (refreshRes.isSuccess && refreshRes.result?.adminAnimeDtos) {
              setAnimes(refreshRes.result.adminAnimeDtos);
            }
          } catch (e) {
            // 에러 처리
          }
        }
      } else {
        showToast.error('수정에 실패했습니다.');
      }
    } catch (e) {
      showToast.error('수정에 실패했습니다.');
    } finally {
      setEditingField(null);
      setEditingValues({});
    }
  };

  const handleFieldCancel = () => {
    setEditingField(null);
    setEditingValues({});
  };

  const getEpisodeColumns = (
    animeId: number
  ): EpisodeTableColumn<AdminEpisodeDto>[] => [
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
                  handleBreakEpisode(item.episodeDto.episodeId, animeId);
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
              handleDeleteEpisode(item.episodeDto.episodeId, animeId);
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
                                setEditingField(null);
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
                          {loadingEpisodes[row.animeId] ? (
                            <div className="flex justify-center py-4">
                              <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
                            </div>
                          ) : (
                            <EpisodeTable
                              columns={getEpisodeColumns(row.animeId)}
                              rows={episodesByAnime[row.animeId] ?? []}
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
