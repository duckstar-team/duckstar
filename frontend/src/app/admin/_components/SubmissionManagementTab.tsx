'use client';

import { useState, useEffect, useRef } from 'react';
import {
  getSubmissionCountGroupByIp,
  getSubmissionsByWeekAndIp,
  banIp,
  withdrawVotesByWeekAndIp,
  undoWithdrawnSubmissions,
} from '@/api/admin';
import { SubmissionCountDto, LogFilterType, Schemas } from '@/types';
import AdminLogSection from './AdminLogSection';

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDate = (year: number, quarter: number, week: number) => {
  const shortYear = year.toString().slice(-2);
  return `${shortYear}년 ${quarter}분기 ${week}주차`;
};

export default function SubmissionManagementTab() {
  const [submissions, setSubmissions] = useState<SubmissionCountDto[]>([]);
  const [submissionsPage, setSubmissionsPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // 제출 현황 탭용 로그 (AdminLogSection에서 filterType=IP, 롤백 시 목록 갱신용)
  const [logRefreshKey, setLogRefreshKey] = useState(0);
  const [submissionsLogFilterType, setSubmissionsLogFilterType] = useState<
    'ALL' | 'ANIME' | 'EPISODE' | 'IP'
  >('IP');

  // 스크롤 동기화를 위한 ref
  const leftScrollTopRef = useRef<HTMLDivElement>(null);
  const leftScrollBottomRef = useRef<HTMLDivElement>(null);

  // 제출 현황 조회 (초기 로드)
  useEffect(() => {
    setSubmissions([]);
    setSubmissionsPage(0);
    loadSubmissions(0, true);
  }, []);

  // 무한 스크롤 처리 (전역 스크롤 - 제출 현황용)
  useEffect(() => {
    let isRequestingSubmissions = false;

    const handleScroll = async () => {
      const { scrollTop, scrollHeight, clientHeight } =
        document.documentElement;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 200;

      // 제출 현황 로드
      if (
        isNearBottom &&
        hasNextPage &&
        !isLoadingMore &&
        !isLoadingSubmissions &&
        !isRequestingSubmissions
      ) {
        isRequestingSubmissions = true;
        setIsLoadingMore(true);
        try {
          const response = await getSubmissionCountGroupByIp(
            submissionsPage + 1,
            50
          );
          if (response.isSuccess) {
            setSubmissions((prev) => [
              ...prev,
              ...response.result.submissionCountDtos,
            ]);
            setHasNextPage(response.result.pageInfo.hasNext);
            setSubmissionsPage((prev) => prev + 1);
          }
        } catch (error) {
          console.error('제출 현황 조회 실패:', error);
        } finally {
          setIsLoadingMore(false);
          isRequestingSubmissions = false;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasNextPage, isLoadingMore, isLoadingSubmissions, submissionsPage]);

  // 왼쪽 패널 스크롤 동기화 및 너비 동기화
  useEffect(() => {
    const topScroll = leftScrollTopRef.current;
    const bottomScroll = leftScrollBottomRef.current;

    if (!topScroll || !bottomScroll) return;

    // 테이블의 실제 너비를 계산하여 상단 스크롤 영역의 너비를 맞춤
    const table = bottomScroll.querySelector('table');
    if (table) {
      const tableWidth = table.scrollWidth;
      const topScrollContent = topScroll.querySelector('div');
      if (topScrollContent) {
        topScrollContent.style.minWidth = `${tableWidth}px`;
      }
    }

    const handleTopScroll = () => {
      if (bottomScroll) {
        bottomScroll.scrollLeft = topScroll.scrollLeft;
      }
    };

    const handleBottomScroll = () => {
      if (topScroll) {
        topScroll.scrollLeft = bottomScroll.scrollLeft;
      }
    };

    topScroll.addEventListener('scroll', handleTopScroll);
    bottomScroll.addEventListener('scroll', handleBottomScroll);

    return () => {
      topScroll.removeEventListener('scroll', handleTopScroll);
      bottomScroll.removeEventListener('scroll', handleBottomScroll);
    };
  }, [submissions]);

  const loadSubmissions = async (page: number = 0, reset: boolean = false) => {
    if (reset) {
      setIsLoadingSubmissions(true);
    } else {
      setIsLoadingMore(true);
    }
    try {
      const response = await getSubmissionCountGroupByIp(page, 50);
      if (response.isSuccess) {
        if (reset) {
          setSubmissions(response.result.submissionCountDtos);
        } else {
          setSubmissions((prev) => [
            ...prev,
            ...response.result.submissionCountDtos,
          ]);
        }
        setHasNextPage(response.result.pageInfo.hasNext);
        setSubmissionsPage(page);
      }
    } catch (error) {
      console.error('제출 현황 조회 실패:', error);
      if (reset) {
        setSubmissions([]);
      }
    } finally {
      setIsLoadingSubmissions(false);
      setIsLoadingMore(false);
    }
  };

  const handleBanIp = async (
    submission: SubmissionCountDto,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    const id = `${submission.weekId}-${submission.ipHash}`;

    if (processingIds.has(id)) return;

    const newBanStatus = !submission.isBlocked;
    const action = newBanStatus ? '차단' : '차단 해제';

    if (
      !confirm(
        `정말로 이 IP를 ${action}하시겠습니까?\n주차: ${formatDate(submission.year, submission.quarter, submission.week)}\nIP: ${submission.ipHash}`
      )
    ) {
      return;
    }

    // reason 입력 받기
    const reason = prompt(`${action} 사유를 입력해주세요 (최대 300자):`, '');
    if (reason === null) {
      return; // 취소 버튼 클릭
    }
    if (reason.length > 300) {
      alert('사유는 300자 이하여야 합니다.');
      return;
    }

    setProcessingIds((prev) => new Set(prev).add(id));

    try {
      await banIp(submission.ipHash, newBanStatus, reason);

      // 로컬 상태 업데이트
      setSubmissions((prev) =>
        prev.map((s) =>
          s.weekId === submission.weekId && s.ipHash === submission.ipHash
            ? { ...s, isBlocked: newBanStatus }
            : s
        )
      );

      setLogRefreshKey((k) => k + 1);
    } catch (error) {
      console.error('IP 차단 실패:', error);
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleWithdrawVotes = async (
    submission: SubmissionCountDto,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    const id = `${submission.weekId}-${submission.ipHash}`;

    if (processingIds.has(id)) return;

    if (submission.isAllWithdrawn) {
      alert('이미 모든 표가 몰수되었습니다.');
      return;
    }

    if (!submission.isBlocked) {
      alert('표 몰수는 차단된 IP에만 가능합니다. 먼저 IP를 차단해주세요.');
      return;
    }

    if (
      !confirm(
        `정말로 이 IP의 모든 표를 몰수하시겠습니까?\n주차: ${formatDate(submission.year, submission.quarter, submission.week)}\nIP: ${submission.ipHash}\n제출 수: ${submission.count}`
      )
    ) {
      return;
    }

    // reason 입력 받기
    const reason = prompt('표 몰수 사유를 입력해주세요 (최대 300자):', '');
    if (reason === null) {
      return; // 취소 버튼 클릭
    }
    if (reason.length > 300) {
      alert('사유는 300자 이하여야 합니다.');
      return;
    }

    setProcessingIds((prev) => new Set(prev).add(id));

    try {
      await withdrawVotesByWeekAndIp(
        submission.weekId,
        submission.ipHash,
        reason
      );
      await loadSubmissions(0, true);
      setLogRefreshKey((k) => k + 1);
    } catch (error) {
      console.error('표 몰수 실패:', error);
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // AdminLogSection용 롤백 핸들러 (IP 필터에서만 롤백 버튼 노출)
  const handleUndoWithdrawForLog = (log: Schemas['ManagementLogDto']) => {
    if (!log.isUndoable || log.weekId == null || !log.logId) {
      alert('되돌릴 수 없는 작업입니다.');
      return;
    }
    const weekYear = (log as any).weekDto?.year ?? (log as any).year;
    const weekQuarter = (log as any).weekDto?.quarter ?? (log as any).quarter;
    const weekWeek = (log as any).weekDto?.week ?? (log as any).week;
    const weekInfo =
      weekYear != null && weekQuarter != null && weekWeek != null
        ? formatDate(weekYear, weekQuarter, weekWeek)
        : '알 수 없음';
    if (
      !confirm(
        `정말로 이 표 몰수를 되돌리시겠습니까?\n주차: ${weekInfo}\nIP: ${log.ipHash}`
      )
    )
      return;
    const reason = prompt('되돌리기 사유를 입력해주세요 (최대 300자):', '');
    if (reason === null) return;
    if (reason.length > 300) {
      alert('사유는 300자 이하여야 합니다.');
      return;
    }
    undoWithdrawnSubmissions(log.logId, log.weekId, log.ipHash, reason)
      .then(() => {
        loadSubmissions(0, true);
        setLogRefreshKey((k) => k + 1);
      })
      .catch((error) => {
        console.error('표 몰수 되돌리기 실패:', error);
      });
  };

  const handleSubmissionClick = async (submission: SubmissionCountDto) => {
    // 새 창으로 제출 상세 열기
    const popup = window.open(
      '',
      'submissionDetail',
      'width=800,height=900,scrollbars=yes,resizable=yes'
    );

    if (!popup) {
      alert('팝업이 차단되었습니다. 팝업 차단을 해제해주세요.');
      return;
    }

    // 로딩 화면 표시
    popup.document.write(`
      <!DOCTYPE html>
      <html lang="ko">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>제출 상세 - ${submission.ipHash.substring(0, 16)}...</title>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-gray-50 p-6">
          <div class="flex justify-center items-center h-screen">
            <div class="text-center">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p class="mt-2 text-gray-600">데이터를 불러오는 중...</p>
            </div>
          </div>
        </body>
      </html>
    `);

    try {
      const response = await getSubmissionsByWeekAndIp(
        submission.weekId,
        submission.ipHash
      );
      if (response.isSuccess) {
        const episodeStars = response.result;

        // 정렬 함수 (클라이언트 사이드)
        const sortData = (
          data: typeof episodeStars,
          column: string,
          direction: 'asc' | 'desc'
        ) => {
          return [...data].sort((a, b) => {
            let aValue: any, bValue: any;

            switch (column) {
              case 'titleKor':
                aValue = a.titleKor;
                bValue = b.titleKor;
                break;
              case 'starScore':
                aValue = a.starScore;
                bValue = b.starScore;
                break;
              case 'isBlocked':
                aValue = a.isBlocked ? 1 : 0;
                bValue = b.isBlocked ? 1 : 0;
                break;
              case 'createdAt':
                aValue = new Date(a.createdAt).getTime();
                bValue = new Date(b.createdAt).getTime();
                break;
              case 'updatedAt':
                aValue = new Date(a.updatedAt).getTime();
                bValue = new Date(b.updatedAt).getTime();
                break;
              default:
                return 0;
            }

            if (typeof aValue === 'string' && typeof bValue === 'string') {
              return direction === 'asc'
                ? aValue.localeCompare(bValue, 'ko')
                : bValue.localeCompare(aValue, 'ko');
            } else {
              return direction === 'asc' ? aValue - bValue : bValue - aValue;
            }
          });
        };

        const formatDateTime = (dateString: string) => {
          const date = new Date(dateString);
          return date.toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          });
        };

        const formatDate = (year: number, quarter: number, week: number) => {
          const shortYear = year.toString().slice(-2);
          return `${shortYear}년 ${quarter}분기 ${week}주차`;
        };

        // HTML 생성
        const html = `
          <!DOCTYPE html>
          <html lang="ko">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>제출 상세 - ${submission.ipHash.substring(0, 16)}...</title>
              <script src="https://cdn.tailwindcss.com"></script>
              <style>
                @keyframes slide-in {
                  from { opacity: 0; transform: translateY(10px); }
                  to { opacity: 1; transform: translateY(0); }
                }
                .animate-slide-in { animation: slide-in 0.3s ease-out; }
              </style>
            </head>
            <body class="bg-gray-50">
              <div class="p-6 animate-slide-in">
                <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div class="flex items-center justify-between mb-4">
                    <h1 class="text-2xl font-bold text-gray-900">제출 상세</h1>
                    <button onclick="window.close()" class="text-gray-500 hover:text-gray-700 transition-colors">
                      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div class="mb-4 p-4 bg-gray-50 rounded-lg">
                    <p class="text-sm text-gray-600">
                      <span class="font-medium">주차:</span> ${formatDate(submission.year, submission.quarter, submission.week)}
                    </p>
                    <p class="text-sm text-gray-600 mt-1">
                      <span class="font-medium">IP Hash:</span> <span class="font-mono">${submission.ipHash}</span>
                    </p>
                    <p class="text-sm text-gray-600 mt-1">
                      <span class="font-medium">총 제출 수:</span> ${submission.count}
                    </p>
                  </div>

                  <div class="relative">
                    <div id="scrollTop" class="overflow-x-auto mb-2" style="height: 17px;">
                      <div style="height: 1px;"></div>
                    </div>
                    <div id="tableContainer" class="overflow-x-auto" style="max-height: 70vh; overflow-y: auto;">
                      <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50 sticky top-0 z-10">
                          <tr>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-gray-100 select-none" onclick="handleSort('titleKor')">
                              <div class="flex items-center gap-1">
                                애니메이션
                                <div id="sort-icon-titleKor" class="flex flex-col items-center justify-center" style="width: 12px; height: 12px;">
                                  <svg class="w-2 h-2 text-gray-400" fill="currentColor" viewBox="0 0 8 8">
                                    <path d="M4 0L0 4h8L4 0z"/>
                                  </svg>
                                  <svg class="w-2 h-2 text-gray-400 -mt-0.5" fill="currentColor" viewBox="0 0 8 8">
                                    <path d="M4 8L0 4h8L4 8z"/>
                                  </svg>
                                </div>
                              </div>
                            </th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-gray-100 select-none" onclick="handleSort('starScore')">
                              <div class="flex items-center gap-1">
                                별점
                                <div id="sort-icon-starScore" class="flex flex-col items-center justify-center" style="width: 12px; height: 12px;">
                                  <svg class="w-2 h-2 text-gray-400" fill="currentColor" viewBox="0 0 8 8">
                                    <path d="M4 0L0 4h8L4 0z"/>
                                  </svg>
                                  <svg class="w-2 h-2 text-gray-400 -mt-0.5" fill="currentColor" viewBox="0 0 8 8">
                                    <path d="M4 8L0 4h8L4 8z"/>
                                  </svg>
                                </div>
                              </div>
                            </th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-gray-100 select-none" onclick="handleSort('isBlocked')">
                              <div class="flex items-center gap-1">
                                상태
                                <div id="sort-icon-isBlocked" class="flex flex-col items-center justify-center" style="width: 12px; height: 12px;">
                                  <svg class="w-2 h-2 text-gray-400" fill="currentColor" viewBox="0 0 8 8">
                                    <path d="M4 0L0 4h8L4 0z"/>
                                  </svg>
                                  <svg class="w-2 h-2 text-gray-400 -mt-0.5" fill="currentColor" viewBox="0 0 8 8">
                                    <path d="M4 8L0 4h8L4 8z"/>
                                  </svg>
                                </div>
                              </div>
                            </th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-gray-100 select-none" onclick="handleSort('createdAt')">
                              <div class="flex items-center gap-1">
                                제출 시간
                                <div id="sort-icon-createdAt" class="flex flex-col items-center justify-center" style="width: 12px; height: 12px;">
                                  <svg class="w-2 h-2 text-gray-400" fill="currentColor" viewBox="0 0 8 8">
                                    <path d="M4 0L0 4h8L4 0z"/>
                                  </svg>
                                  <svg class="w-2 h-2 text-gray-400 -mt-0.5" fill="currentColor" viewBox="0 0 8 8">
                                    <path d="M4 8L0 4h8L4 8z"/>
                                  </svg>
                                </div>
                              </div>
                            </th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-gray-100 select-none" onclick="handleSort('updatedAt')">
                              <div class="flex items-center gap-1">
                                수정 시간
                                <div id="sort-icon-updatedAt" class="flex flex-col items-center justify-center" style="width: 12px; height: 12px;">
                                  <svg class="w-2 h-2 text-gray-400" fill="currentColor" viewBox="0 0 8 8">
                                    <path d="M4 0L0 4h8L4 0z"/>
                                  </svg>
                                  <svg class="w-2 h-2 text-gray-400 -mt-0.5" fill="currentColor" viewBox="0 0 8 8">
                                    <path d="M4 8L0 4h8L4 8z"/>
                                  </svg>
                                </div>
                              </div>
                            </th>
                          </tr>
                        </thead>
                        <tbody id="tableBody" class="bg-white divide-y divide-gray-200">
                          ${
                            episodeStars.length === 0
                              ? '<tr><td colSpan="5" class="px-4 py-8 text-center text-sm text-gray-500">제출 내역이 없습니다</td></tr>'
                              : episodeStars
                                  .map((episode, index) => {
                                    return `
                                  <tr class="hover:bg-gray-50">
                                    <td class="px-4 py-3 text-sm text-gray-900" style="max-width: 300px; word-break: break-word; white-space: normal; min-width: 150px;">${episode.titleKor}</td>
                                    <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">${episode.starScore}</td>
                                    <td class="px-4 py-3 whitespace-nowrap text-sm">
                                      ${
                                        episode.isBlocked
                                          ? '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">차단됨</span>'
                                          : '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">정상</span>'
                                      }
                                    </td>
                                    <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">${formatDateTime(episode.createdAt)}</td>
                                    <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">${formatDateTime(episode.updatedAt)}</td>
                                  </tr>
                                `;
                                  })
                                  .join('')
                          }
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              <script>
                let sortColumn = null;
                let sortDirection = 'asc';
                const data = ${JSON.stringify(episodeStars)};

                const sortData = (data, column, direction) => {
                  return [...data].sort((a, b) => {
                    let aValue, bValue;
                    
                    switch (column) {
                      case 'titleKor':
                        aValue = a.titleKor;
                        bValue = b.titleKor;
                        break;
                      case 'starScore':
                        aValue = a.starScore;
                        bValue = b.starScore;
                        break;
                      case 'isBlocked':
                        aValue = a.isBlocked ? 1 : 0;
                        bValue = b.isBlocked ? 1 : 0;
                        break;
                      case 'createdAt':
                        aValue = new Date(a.createdAt).getTime();
                        bValue = new Date(b.createdAt).getTime();
                        break;
                      case 'updatedAt':
                        aValue = new Date(a.updatedAt).getTime();
                        bValue = new Date(b.updatedAt).getTime();
                        break;
                      default:
                        return 0;
                    }
                    
                    if (typeof aValue === 'string' && typeof bValue === 'string') {
                      return direction === 'asc' 
                        ? aValue.localeCompare(bValue, 'ko')
                        : bValue.localeCompare(aValue, 'ko');
                    } else {
                      return direction === 'asc'
                        ? aValue - bValue
                        : bValue - aValue;
                    }
                  });
                };

                const formatDateTime = (dateString) => {
                  const date = new Date(dateString);
                  return date.toLocaleString('ko-KR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                };

                const renderTable = (sortedData) => {
                  const tbody = document.getElementById('tableBody');
                  if (sortedData.length === 0) {
                    tbody.innerHTML = '<tr><td colSpan="5" class="px-4 py-8 text-center text-sm text-gray-500">제출 내역이 없습니다</td></tr>';
                    return;
                  }
                  
                  tbody.innerHTML = sortedData.map((episode, index) => {
                    return \`
                      <tr class="hover:bg-gray-50">
                        <td class="px-4 py-3 text-sm text-gray-900" style="max-width: 300px; word-break: break-word; white-space: normal; min-width: 150px;">\${episode.titleKor}</td>
                        <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">\${episode.starScore}</td>
                        <td class="px-4 py-3 whitespace-nowrap text-sm">
                          \${episode.isBlocked 
                            ? '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">차단됨</span>'
                            : '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">정상</span>'
                          }
                        </td>
                        <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">\${formatDateTime(episode.createdAt)}</td>
                        <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">\${formatDateTime(episode.updatedAt)}</td>
                      </tr>
                    \`;
                  }).join('');
                };

                const updateSortIndicator = () => {
                  // 모든 정렬 아이콘을 기본 상태로 리셋
                  const columns = ['titleKor', 'starScore', 'isBlocked', 'createdAt', 'updatedAt'];
                  columns.forEach(col => {
                    const iconContainer = document.getElementById('sort-icon-' + col);
                    if (iconContainer) {
                      const upArrow = iconContainer.querySelector('svg:first-child');
                      const downArrow = iconContainer.querySelector('svg:last-child');
                      if (upArrow && downArrow) {
                        // 기본 상태: 두 화살표 모두 회색
                        upArrow.classList.remove('text-blue-600', 'text-gray-400');
                        downArrow.classList.remove('text-blue-600', 'text-gray-400');
                        upArrow.classList.add('text-gray-400');
                        downArrow.classList.add('text-gray-400');
                        upArrow.style.opacity = '1';
                        downArrow.style.opacity = '1';
                      }
                    }
                  });
                  
                  // 현재 정렬된 칼럼만 강조 표시
                  if (sortColumn) {
                    const iconContainer = document.getElementById('sort-icon-' + sortColumn);
                    if (iconContainer) {
                      const upArrow = iconContainer.querySelector('svg:first-child');
                      const downArrow = iconContainer.querySelector('svg:last-child');
                      if (upArrow && downArrow) {
                        if (sortDirection === 'asc') {
                          // 오름차순: 위쪽 화살표만 파란색
                          upArrow.classList.remove('text-gray-400');
                          upArrow.classList.add('text-blue-600');
                          downArrow.classList.remove('text-blue-600');
                          downArrow.classList.add('text-gray-400');
                          downArrow.style.opacity = '0.3';
                        } else {
                          // 내림차순: 아래쪽 화살표만 파란색
                          downArrow.classList.remove('text-gray-400');
                          downArrow.classList.add('text-blue-600');
                          upArrow.classList.remove('text-blue-600');
                          upArrow.classList.add('text-gray-400');
                          upArrow.style.opacity = '0.3';
                        }
                      }
                    }
                  }
                };

                const handleSort = (column) => {
                  if (sortColumn === column) {
                    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
                  } else {
                    sortColumn = column;
                    sortDirection = 'asc';
                  }
                  
                  const sortedData = sortData(data, sortColumn, sortDirection);
                  renderTable(sortedData);
                  updateSortIndicator();
                };

                // 초기 로드 시 정렬 아이콘 표시
                updateSortIndicator();

                // 스크롤 동기화
                const topScroll = document.getElementById('scrollTop');
                const bottomScroll = document.getElementById('tableContainer');
                
                if (topScroll && bottomScroll) {
                  const table = bottomScroll.querySelector('table');
                  if (table) {
                    const tableWidth = table.scrollWidth;
                    const topScrollContent = topScroll.querySelector('div');
                    if (topScrollContent) {
                      topScrollContent.style.minWidth = tableWidth + 'px';
                    }
                  }

                  topScroll.addEventListener('scroll', () => {
                    bottomScroll.scrollLeft = topScroll.scrollLeft;
                  });

                  bottomScroll.addEventListener('scroll', () => {
                    topScroll.scrollLeft = bottomScroll.scrollLeft;
                  });
                }
              </script>
            </body>
          </html>
        `;

        popup.document.open();
        popup.document.write(html);
        popup.document.close();
      }
    } catch (error) {
      console.error('제출 상세 조회 실패:', error);
      popup.document.write(`
        <!DOCTYPE html>
        <html lang="ko">
          <head>
            <meta charset="UTF-8">
            <title>오류</title>
            <script src="https://cdn.tailwindcss.com"></script>
          </head>
          <body class="bg-gray-50 p-6">
            <div class="bg-white rounded-lg shadow-sm border border-red-200 p-6">
              <h1 class="text-xl font-semibold text-red-900 mb-4">오류 발생</h1>
              <p class="text-gray-600">제출 상세 정보를 불러오는 중 오류가 발생했습니다.</p>
              <button onclick="window.close()" class="mt-4 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">
                닫기
              </button>
            </div>
          </body>
        </html>
      `);
      popup.document.close();
    }
  };

  return (
    <div className="space-y-6">
      <AdminLogSection
        key={logRefreshKey}
        filterType={submissionsLogFilterType as LogFilterType}
        onFilterChange={setSubmissionsLogFilterType}
        onUndo={handleUndoWithdrawForLog}
        title="IP 관리 로그"
      />

      {/* IP별 제출 수 테이블 */}
      <div className="border-brand-zinc-200 rounded-lg border p-6 shadow-sm dark:border-none dark:bg-zinc-800">
        <h2 className="mb-4 text-xl font-semibold">IP별 제출 수</h2>

        {isLoadingSubmissions ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <>
            <div className="relative">
              {/* 가로 스크롤바를 상단에 표시 */}
              <div
                ref={leftScrollTopRef}
                className="mb-2 overflow-x-auto"
                style={{ height: '17px' }}
              >
                <div style={{ height: '1px' }}></div>
              </div>
              <div ref={leftScrollBottomRef} className="overflow-x-auto">
                <table className="divide-brand-zinc-200 min-w-full divide-y">
                  <thead className="sticky top-0 z-10 bg-gray-50 text-gray-500 uppercase dark:bg-zinc-800 dark:text-white">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium tracking-wider whitespace-nowrap">
                        주차
                      </th>
                      <th className="max-w-xs px-4 py-3 text-left text-xs font-medium tracking-wider">
                        IP Hash
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium tracking-wider whitespace-nowrap">
                        제출 수
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium tracking-wider whitespace-nowrap">
                        상태
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium tracking-wider whitespace-nowrap">
                        첫 제출
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium tracking-wider whitespace-nowrap">
                        마지막 제출
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium tracking-wider whitespace-nowrap">
                        작업
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-brand-zinc-200 divide-y bg-white dark:bg-zinc-800">
                    {submissions.map((submission, index) => {
                      // 주차가 변경되는지 확인
                      const prevSubmission =
                        index > 0 ? submissions[index - 1] : null;
                      const isWeekChanged =
                        prevSubmission &&
                        (prevSubmission.year !== submission.year ||
                          prevSubmission.quarter !== submission.quarter ||
                          prevSubmission.week !== submission.week);

                      // 다음 행이 다른 주차인지 확인 (아래 선 제거용)
                      const nextSubmission =
                        index < submissions.length - 1
                          ? submissions[index + 1]
                          : null;
                      const isNextWeekDifferent =
                        nextSubmission &&
                        (nextSubmission.year !== submission.year ||
                          nextSubmission.quarter !== submission.quarter ||
                          nextSubmission.week !== submission.week);

                      return (
                        <tr
                          key={`${submission.weekId}-${submission.ipHash}-${index}`}
                          onClick={() => handleSubmissionClick(submission)}
                          className={`cursor-pointer ${
                            submission.isBlocked
                              ? 'bg-red-50 dark:bg-red-900/20'
                              : ''
                          } ${isWeekChanged ? 'border-t-4 border-blue-500' : ''} ${
                            isNextWeekDifferent ? 'border-b-0' : ''
                          }`}
                        >
                          <td className="px-4 py-3 text-sm whitespace-nowrap">
                            {formatDate(
                              submission.year,
                              submission.quarter,
                              submission.week
                            )}
                          </td>
                          <td className="max-w-xs px-4 py-3 font-mono text-sm break-words">
                            {submission.ipHash}
                          </td>
                          <td className="px-4 py-3 text-sm whitespace-nowrap">
                            {submission.count}
                          </td>
                          <td className="px-4 py-3 text-sm whitespace-nowrap">
                            {submission.isBlocked ? (
                              <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800 dark:bg-red-900/40">
                                차단됨
                              </span>
                            ) : (
                              <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800 dark:bg-green-900/40">
                                정상
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-500">
                            {formatDateTime(submission.firstCreatedAt)}
                          </td>
                          <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-500">
                            {formatDateTime(submission.lastCreatedAt)}
                          </td>
                          <td className="px-4 py-3 text-sm whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={(e) => handleBanIp(submission, e)}
                                disabled={processingIds.has(
                                  `${submission.weekId}-${submission.ipHash}`
                                )}
                                className={`cursor-pointer rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                                  submission.isBlocked
                                    ? 'bg-brand-zinc-100 hover:bg-brand-zinc-200 text-gray-600 dark:text-zinc-400'
                                    : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-400 dark:hover:bg-red-500/40'
                                } disabled:cursor-not-allowed disabled:opacity-50`}
                              >
                                {submission.isBlocked ? '차단 해제' : '차단'}
                              </button>
                              <button
                                onClick={(e) =>
                                  handleWithdrawVotes(submission, e)
                                }
                                disabled={
                                  processingIds.has(
                                    `${submission.weekId}-${submission.ipHash}`
                                  ) ||
                                  !submission.isBlocked ||
                                  submission.isAllWithdrawn
                                }
                                className="flex cursor-pointer items-center gap-1 rounded-md bg-orange-100 px-4 py-2 text-sm font-medium text-orange-700 transition-colors hover:bg-orange-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-orange-400/20 dark:text-orange-400 dark:hover:bg-orange-500/40"
                              >
                                {submission.isAllWithdrawn
                                  ? '✅ 몰수 완료'
                                  : '표 몰수'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {isLoadingMore && (
              <div className="mt-4 text-center">
                <div className="inline-flex items-center gap-2 text-sm text-gray-600">
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-gray-600"></div>
                  <span>더 불러오는 중...</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
