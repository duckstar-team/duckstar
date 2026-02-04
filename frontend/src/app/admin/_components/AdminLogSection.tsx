'use client';

import { useState, useRef, useEffect } from 'react';
import { getAdminLogs } from '@/api/admin';
import { LogFilterType, ManagementLogDto } from '@/types';
import { format } from 'date-fns';
import { cn, formatWeekLabel } from '@/lib';
import { ManagerProfileDtoTaskType } from '@/types/generated/api';

const FILTER_OPTIONS: { value: LogFilterType; label: string }[] = [
  { value: LogFilterType.ALL, label: '전체' },
  { value: LogFilterType.ANIME, label: '애니메이션' },
  { value: LogFilterType.EPISODE, label: '에피소드' },
  { value: LogFilterType.IP, label: 'IP' },
];

const TASK_TYPE: Record<
  ManagerProfileDtoTaskType,
  { label: string; color: string }
> = {
  BAN: { label: '차단', color: 'text-red-400' },
  UNBAN: { label: '차단 해제', color: 'text-pink-400' },
  WITHDRAW: { label: '표 몰수', color: 'text-orange-400' },
  UNDO_WITHDRAW: { label: '표 몰수 롤백', color: 'text-blue-400' },
  EPISODE_BREAK: { label: '휴방', color: 'text-orange-400' },
  EPISODE_RESCHEDULE: { label: '편성 변경', color: 'text-pink-400' },
  EPISODE_CREATE: { label: '에피소드 추가', color: 'text-blue-500' },
  FUTURE_EPISODE_DELETE: { label: '에피소드 삭제', color: 'text-red-400' },
  EPISODE_MODIFY_NUMBER: { label: '화수 수정', color: 'text-purple-400' },
  ANIME_CREATE: { label: '애니 등록', color: 'text-orange-400' },
  ANIME_INFO_UPDATE: { label: '애니 정보 수정', color: 'text-orange-400' },
  ANIME_STATUS_UPDATE: { label: '애니 상태 수정', color: 'text-pink-400' },
  ANIME_DIRECTION_UPDATE: { label: '애니 방향 수정', color: 'text-yellow-500' },
  ANIME_EPISODE_TOTAL_COUNT: {
    label: '애니 총 화수 수정',
    color: 'text-orange-500',
  },
};

function formatLogSentence(log: ManagementLogDto): React.ReactNode {
  const subject = log.memberProfileDto?.managerNickname ?? '관리자';
  const target =
    log.ipHash != null
      ? log.ipHash
      : log.episodeNumber != null && log.episodeNumber > 0
        ? `${log.titleKor} ${log.episodeNumber}화`
        : (log.titleKor ?? '');
  const taskType = log.memberProfileDto?.taskType ?? '';
  const taskLabel =
    TASK_TYPE[taskType as ManagerProfileDtoTaskType]?.label ?? taskType;
  const textColor =
    TASK_TYPE[taskType as ManagerProfileDtoTaskType]?.color ??
    'text-orange-400';
  return (
    <>
      <span className="text-green-400">{subject}</span>
      <span className="text-gray-400"> 님이 </span>
      <span className="text-cyan-400">{target}</span>
      <span className="text-gray-400">
        {log.ipHash != null &&
          ` (${formatWeekLabel(log.weekDto.year, log.weekDto.quarter, log.weekDto.week)})에 대해`}{' '}
      </span>
      <span className={cn(textColor)}>{taskLabel}</span>
      <span className="text-gray-400"> 하였습니다.</span>
    </>
  );
}

interface AdminLogSectionProps {
  filterType: LogFilterType;
  onFilterChange: (filterType: LogFilterType) => void;
  onUndo?: (log: ManagementLogDto) => void;
  title?: string;
}

export default function AdminLogSection({
  filterType,
  onFilterChange,
  onUndo,
  title = '관리 로그',
}: AdminLogSectionProps) {
  const [logs, setLogs] = useState<ManagementLogDto[]>([]);
  const [page, setPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadLogs = async (pageNum: number, reset: boolean) => {
    if (reset) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    try {
      const res = await getAdminLogs(pageNum, 10, filterType);
      if (res.isSuccess && res.result) {
        const list = res.result.managementLogDtos ?? [];
        if (reset) {
          setLogs(list);
        } else {
          setLogs((prev) => [...prev, ...list]);
        }
        setHasNextPage(res.result.pageInfo?.hasNext ?? false);
        setPage(pageNum);
      }
    } catch (e) {
      console.error('로그 조회 실패:', e);
      if (reset) setLogs([]);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    setLogs([]);
    setPage(0);
    loadLogs(0, true);
  }, [filterType]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let requesting = false;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      if (scrollHeight - scrollTop - clientHeight > 100) return;
      if (!hasNextPage || isLoadingMore || isLoading || requesting) return;
      requesting = true;
      loadLogs(page + 1, false).finally(() => {
        requesting = false;
      });
    };
    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [hasNextPage, isLoadingMore, isLoading, page, filterType]);

  return (
    <div className="overflow-hidden rounded-lg border border-gray-700 bg-gray-900 shadow-lg">
      <div className="flex items-center justify-between border-b border-gray-700 bg-gray-800 px-4 py-2">
        <h2 className="text-sm font-semibold text-gray-300">{title}</h2>
        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => onFilterChange(e.target.value as LogFilterType)}
            className="rounded border border-gray-600 bg-gray-700 px-2 py-1 text-sm text-gray-200"
          >
            {FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="p-4 font-mono text-sm">
        <div ref={scrollRef} className="max-h-96 space-y-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-500 border-t-green-400" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-gray-500">로그가 없습니다.</div>
          ) : (
            logs.map((log, i) => (
              <div
                key={`log-${log.logId}-${i}`}
                className="leading-relaxed text-gray-300"
              >
                {log.memberProfileDto?.profileImageUrl && (
                  <img
                    src={log.memberProfileDto.profileImageUrl}
                    alt=""
                    className="mr-1.5 inline-block h-4 w-4 rounded-full align-middle"
                  />
                )}
                <span className="text-green-400">{formatLogSentence(log)}</span>
                <span className="ml-1 text-gray-500">
                  {format(log.memberProfileDto?.managedAt, 'yyyy.MM.dd HH:mm')}
                </span>
                {filterType === LogFilterType.IP && log.isUndoable && (
                  <button
                    type="button"
                    onClick={() => onUndo?.(log)}
                    className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full border border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-gray-900"
                    title="되돌리기"
                  >
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  </button>
                )}
                {log.reason && (
                  <>
                    <br />
                    <span className="ml-4 text-gray-500">└ 사유: </span>
                    <span className="text-gray-400">{log.reason}</span>
                  </>
                )}
              </div>
            ))
          )}
          {isLoadingMore && (
            <div className="text-gray-500">더 불러오는 중...</div>
          )}
        </div>
      </div>
    </div>
  );
}
