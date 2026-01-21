'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  getSubmissionCountGroupByIp,
  getSubmissionsByWeekAndIp,
  banIp,
  withdrawVotesByWeekAndIp,
  undoWithdrawnSubmissions,
  getAdminLogsOnIpManagement,
} from '@/api/admin';
import { IpManagementLogDto, OttDto, SubmissionCountDto } from '@/types/dtos';
import { OttType } from '@/types/enums';

// 기존 AnimeData 인터페이스와 컴포넌트는 그대로 유지

interface AnimeData {
  titleKor: string;
  titleOrigin?: string;
  titleEng?: string;
  medium: 'TVA' | 'MOVIE';
  airTime?: string;
  premiereDate?: string;
  premiereTime?: string;
  dayOfWeek?: 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';
  totalEpisodes?: number;
  corp?: string;
  director?: string;
  genre?: string;
  author?: string;
  minAge?: number;
  officialSite?: {
    OTHERS?: string;
    X?: string;
    YOUTUBE?: string;
    INSTAGRAM?: string;
    TIKTOK?: string;
  };
  synopsis?: string;
  mainImage?: File;
  ottDtos?: OttDto[];
  otherSites?: string[];
}

export default function AdminPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'content' | 'submissions'>(
    'content'
  );

  // 애니메이션 등록 관련 상태
  const [animeData, setAnimeData] = useState<AnimeData>({
    titleKor: '',
    titleOrigin: '',
    titleEng: '',
    medium: 'TVA',
    airTime: '',
    premiereDate: '',
    premiereTime: '',
    dayOfWeek: undefined,
    totalEpisodes: undefined,
    corp: '',
    director: '',
    genre: '',
    author: '',
    minAge: undefined,
    officialSite: {
      OTHERS: '',
      X: '',
      YOUTUBE: '',
      INSTAGRAM: '',
      TIKTOK: '',
    },
    synopsis: '',
    mainImage: undefined,
    ottDtos: [],
    otherSites: [''],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // 제출 현황 관리 관련 상태
  const [submissions, setSubmissions] = useState<SubmissionCountDto[]>([]);
  const [submissionsPage, setSubmissionsPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // IP 관리 로그 관련 상태
  const [logs, setLogs] = useState<IpManagementLogDto[]>([]);
  const [logsPage, setLogsPage] = useState(0);
  const [logsHasNextPage, setLogsHasNextPage] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isLoadingMoreLogs, setIsLoadingMoreLogs] = useState(false);

  // 스크롤 동기화를 위한 ref
  const leftScrollTopRef = useRef<HTMLDivElement>(null);
  const leftScrollBottomRef = useRef<HTMLDivElement>(null);
  const logsScrollRef = useRef<HTMLDivElement>(null);

  // 권한 확인
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      router.push('/');
      return;
    }
  }, [isAuthenticated, user, router]);

  // 제출 현황 조회 (초기 로드)
  useEffect(() => {
    if (activeTab === 'submissions') {
      setSubmissions([]);
      setSubmissionsPage(0);
      loadSubmissions(0, true);

      // 로그도 함께 로드
      setLogs([]);
      setLogsPage(0);
      loadLogs(0, true);
    }
  }, [activeTab]);

  // 무한 스크롤 처리 (전역 스크롤 - 제출 현황용)
  useEffect(() => {
    if (activeTab !== 'submissions') return;

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
  }, [
    activeTab,
    hasNextPage,
    isLoadingMore,
    isLoadingSubmissions,
    submissionsPage,
  ]);

  // 로그 섹션 내부 스크롤 무한 스크롤 처리
  useEffect(() => {
    if (activeTab !== 'submissions') return;

    const logsScrollContainer = logsScrollRef.current;
    if (!logsScrollContainer) return;

    let isRequestingLogs = false;

    const handleLogsScroll = async () => {
      const { scrollTop, scrollHeight, clientHeight } = logsScrollContainer;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

      // 로그 로드
      if (
        isNearBottom &&
        logsHasNextPage &&
        !isLoadingMoreLogs &&
        !isLoadingLogs &&
        !isRequestingLogs
      ) {
        isRequestingLogs = true;
        setIsLoadingMoreLogs(true);
        try {
          const response = await getAdminLogsOnIpManagement(logsPage + 1, 10);
          if (response.isSuccess) {
            setLogs((prev) => [
              ...prev,
              ...response.result.ipManagementLogDtos,
            ]);
            setLogsHasNextPage(response.result.pageInfo.hasNext);
            setLogsPage((prev) => prev + 1);
          }
        } catch (error) {
          console.error('로그 조회 실패:', error);
        } finally {
          setIsLoadingMoreLogs(false);
          isRequestingLogs = false;
        }
      }
    };

    logsScrollContainer.addEventListener('scroll', handleLogsScroll);
    return () =>
      logsScrollContainer.removeEventListener('scroll', handleLogsScroll);
  }, [
    activeTab,
    logsHasNextPage,
    isLoadingMoreLogs,
    isLoadingLogs,
    logsPage,
    logs,
  ]);

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

  const loadLogs = async (page: number = 0, reset: boolean = false) => {
    if (reset) {
      setIsLoadingLogs(true);
    } else {
      setIsLoadingMoreLogs(true);
    }
    try {
      const response = await getAdminLogsOnIpManagement(page, 10);
      if (response.isSuccess) {
        if (reset) {
          setLogs(response.result.ipManagementLogDtos);
        } else {
          setLogs((prev) => [...prev, ...response.result.ipManagementLogDtos]);
        }
        setLogsHasNextPage(response.result.pageInfo.hasNext);
        setLogsPage(page);
      }
    } catch (error) {
      console.error('로그 조회 실패:', error);
      if (reset) {
        setLogs([]);
      }
    } finally {
      setIsLoadingLogs(false);
      setIsLoadingMoreLogs(false);
    }
  };

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

      // 로그 새로고침
      await loadLogs(0, true);

      setMessage(`IP가 ${action}되었습니다.`);
    } catch (error) {
      console.error('IP 차단 실패:', error);
      setMessage(`IP ${action}에 실패했습니다.`);
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
      setMessage('표가 성공적으로 몰수되었습니다.');
      // 목록 새로고침
      await loadSubmissions(0, true);
      // 로그 새로고침
      await loadLogs(0, true);
    } catch (error) {
      console.error('표 몰수 실패:', error);
      setMessage('표 몰수에 실패했습니다.');
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleUndoWithdraw = async (
    log: IpManagementLogDto,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();

    if (!log.isUndoable || !log.weekId || !log.logId) {
      alert('되돌릴 수 없는 작업입니다.');
      return;
    }

    if (
      !confirm(
        `정말로 이 표 몰수를 되돌리시겠습니까?\n주차: ${log.year && log.quarter && log.week ? formatDate(log.year, log.quarter, log.week) : '알 수 없음'}\nIP: ${log.ipHash}`
      )
    ) {
      return;
    }

    // reason 입력 받기
    const reason = prompt('되돌리기 사유를 입력해주세요 (최대 300자):', '');
    if (reason === null) {
      return; // 취소 버튼 클릭
    }
    if (reason.length > 300) {
      alert('사유는 300자 이하여야 합니다.');
      return;
    }

    try {
      await undoWithdrawnSubmissions(log.logId, log.weekId, log.ipHash, reason);
      setMessage('표 몰수가 성공적으로 되돌려졌습니다.');
      // 목록 새로고침
      await loadSubmissions(0, true);
      // 로그 새로고침
      await loadLogs(0, true);
    } catch (error) {
      console.error('표 몰수 되돌리기 실패:', error);
      setMessage('표 몰수 되돌리기에 실패했습니다.');
    }
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

  // 애니메이션 등록 관련 함수들
  const addOttData = () => {
    setAnimeData((prev) => ({
      ...prev,
      ottDtos: [
        ...(prev.ottDtos || []),
        { ottType: OttType.Netflix, watchUrl: '' },
      ],
    }));
  };

  const removeOttData = (index: number) => {
    setAnimeData((prev) => ({
      ...prev,
      ottDtos: prev.ottDtos?.filter((_, i) => i !== index) || [],
    }));
  };

  const updateOttData = (index: number, field: keyof OttDto, value: string) => {
    setAnimeData((prev) => ({
      ...prev,
      ottDtos:
        prev.ottDtos?.map((ott, i) =>
          i === index ? { ...ott, [field]: value } : ott
        ) || [],
    }));
  };

  const addOtherSite = () => {
    setAnimeData((prev) => ({
      ...prev,
      otherSites: [...(prev.otherSites || []), ''],
    }));
  };

  const removeOtherSite = (index: number) => {
    setAnimeData((prev) => ({
      ...prev,
      otherSites: prev.otherSites?.filter((_, i) => i !== index) || [],
    }));
  };

  const updateOtherSite = (index: number, value: string) => {
    setAnimeData((prev) => ({
      ...prev,
      otherSites:
        prev.otherSites?.map((site, i) => (i === index ? value : site)) || [],
    }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === 'file') {
      const fileInput = e.target as HTMLInputElement;
      const file = fileInput.files?.[0];
      setAnimeData((prev) => ({
        ...prev,
        [name]: file,
      }));
    } else if (type === 'number') {
      setAnimeData((prev) => ({
        ...prev,
        [name]: value ? parseInt(value) : undefined,
      }));
    } else if (name.startsWith('officialSite.')) {
      const siteType = name.split(
        '.'
      )[1] as keyof typeof animeData.officialSite;
      setAnimeData((prev) => ({
        ...prev,
        officialSite: {
          ...prev.officialSite,
          [siteType]: value,
        },
      }));
    } else if (name === 'premiereDate' || name === 'premiereTime') {
      setAnimeData((prev) => {
        const newData = { ...prev, [name]: value };

        if (prev.medium !== 'MOVIE') {
          const date = name === 'premiereDate' ? value : prev.premiereDate;
          const time = name === 'premiereTime' ? value : prev.premiereTime;

          if (date && time) {
            const fullDateTime = new Date(`${date}T${time}`);
            const dayOfWeek = fullDateTime
              .toLocaleDateString('en-US', { weekday: 'short' })
              .toUpperCase();

            return {
              ...newData,
              dayOfWeek: dayOfWeek as
                | 'MON'
                | 'TUE'
                | 'WED'
                | 'THU'
                | 'FRI'
                | 'SAT'
                | 'SUN',
              airTime: time,
            };
          }
        }

        return newData;
      });
    } else {
      setAnimeData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      if (!animeData.titleKor || !animeData.titleKor.trim()) {
        setMessage('한국어 제목은 필수입니다.');
        setIsLoading(false);
        return;
      }

      if (!animeData.medium) {
        setMessage('매체는 필수입니다.');
        setIsLoading(false);
        return;
      }

      const formData = new FormData();

      formData.append('titleKor', animeData.titleKor.trim());
      formData.append('medium', animeData.medium);

      if (animeData.titleOrigin)
        formData.append('titleOrigin', animeData.titleOrigin);
      if (animeData.titleEng) formData.append('titleEng', animeData.titleEng);
      if (animeData.airTime) formData.append('airTime', animeData.airTime);
      if (animeData.premiereDate && animeData.premiereTime) {
        // 로컬 시간을 그대로 유지하기 위해 ISO 형식 문자열 직접 생성
        // toISOString()은 UTC로 변환하므로 사용하지 않음
        const localDateTimeString = `${animeData.premiereDate}T${animeData.premiereTime}:00`;
        formData.append('premiereDateTime', localDateTimeString);
      } else if (animeData.premiereDate) {
        // 날짜만 있는 경우 시간을 00:00:00으로 설정
        const localDateTimeString = `${animeData.premiereDate}T00:00:00`;
        formData.append('premiereDateTime', localDateTimeString);
      }
      if (animeData.dayOfWeek)
        formData.append('dayOfWeek', animeData.dayOfWeek);
      if (animeData.totalEpisodes)
        formData.append('totalEpisodes', animeData.totalEpisodes.toString());
      if (animeData.corp) formData.append('corp', animeData.corp);
      if (animeData.director) formData.append('director', animeData.director);
      if (animeData.genre) formData.append('genre', animeData.genre);
      if (animeData.author) formData.append('author', animeData.author);
      if (animeData.minAge)
        formData.append('minAge', animeData.minAge.toString());
      if (animeData.synopsis) formData.append('synopsis', animeData.synopsis);
      if (animeData.mainImage)
        formData.append('mainImage', animeData.mainImage);

      if (animeData.ottDtos && animeData.ottDtos.length > 0) {
        animeData.ottDtos.forEach((ott, index) => {
          formData.append(`ottDtos[${index}].ottType`, ott.ottType);
          formData.append(`ottDtos[${index}].watchUrl`, ott.watchUrl);
        });
      }

      if (animeData.officialSite) {
        const officialSiteMap: Record<string, string> = {};
        Object.entries(animeData.officialSite).forEach(([siteType, url]) => {
          if (url && url.trim()) {
            officialSiteMap[siteType] = url;
          }
        });

        if (animeData.otherSites && animeData.otherSites.length > 0) {
          const validOtherSites = animeData.otherSites.filter(
            (site) => site && site.trim()
          );
          if (validOtherSites.length > 0) {
            if (officialSiteMap.OTHERS) {
              officialSiteMap.OTHERS = `${officialSiteMap.OTHERS}, ${validOtherSites.join(', ')}`;
            } else {
              officialSiteMap.OTHERS = validOtherSites.join(', ');
            }
          }
        }

        if (Object.keys(officialSiteMap).length > 0) {
          formData.append(
            'officialSiteString',
            JSON.stringify(officialSiteMap)
          );
        }
      }

      const response = await fetch('/api/admin/animes', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (response.ok) {
        try {
          const result = await response.json();
          setMessage(
            `애니메이션이 성공적으로 추가되었습니다. (ID: ${result.result})`
          );
        } catch (jsonError) {
          setMessage('애니메이션이 성공적으로 추가되었습니다.');
        }

        setAnimeData({
          titleKor: '',
          titleOrigin: '',
          titleEng: '',
          medium: 'TVA',
          airTime: '',
          premiereDate: '',
          premiereTime: '',
          dayOfWeek: undefined,
          totalEpisodes: undefined,
          corp: '',
          director: '',
          genre: '',
          author: '',
          minAge: undefined,
          officialSite: {
            OTHERS: '',
            X: '',
            YOUTUBE: '',
            INSTAGRAM: '',
            TIKTOK: '',
          },
          synopsis: '',
          mainImage: undefined,
          ottDtos: [],
        });
      } else {
        try {
          const errorData = await response.json();
          setMessage(
            `오류: ${errorData.message || '애니메이션 추가에 실패했습니다.'}`
          );
        } catch (jsonError) {
          setMessage(
            `오류: 애니메이션 추가에 실패했습니다. (상태 코드: ${response.status})`
          );
        }
      }
    } catch (error) {
      console.error('API 호출 오류:', error);
      setMessage('네트워크 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
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

  // 권한이 없는 경우 로딩 표시
  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
          <p className="mt-2 text-gray-600">권한을 확인하는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden py-8">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">관리자 페이지</h1>
          <p className="mt-2 text-gray-600 dark:text-zinc-400">
            애니메이션 데이터와 제출 현황을 관리할 수 있습니다.
          </p>
        </div>

        {/* 탭 */}
        <div className="border-brand-zinc-200 mb-6 border-b">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('content')}
              className={`border-b-2 px-1 py-4 text-sm font-medium ${
                activeTab === 'content'
                  ? 'border-blue-500 text-blue-600'
                  : 'hover:border-brand-zinc-300 border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-zinc-400'
              }`}
            >
              컨텐츠 관리
            </button>
            <button
              onClick={() => setActiveTab('submissions')}
              className={`border-b-2 px-1 py-4 text-sm font-medium ${
                activeTab === 'submissions'
                  ? 'border-blue-500 text-blue-600'
                  : 'hover:border-brand-zinc-300 border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-zinc-400'
              }`}
            >
              제출 현황 관리
            </button>
          </nav>
        </div>

        {/* 컨텐츠 관리 탭 */}
        {activeTab === 'content' && (
          <div className="border-brand-zinc-200 rounded-lg border p-6 shadow-sm dark:border-none dark:bg-zinc-800">
            <h2 className="mb-6 text-xl font-semibold">새 애니메이션 등록</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 기존 폼 내용은 그대로 유지 */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="titleKor"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-400"
                  >
                    한국어 제목 *
                  </label>
                  <input
                    type="text"
                    id="titleKor"
                    name="titleKor"
                    value={animeData.titleKor}
                    onChange={handleInputChange}
                    required
                    className="border-brand-zinc-300 w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="한국어 제목을 입력하세요"
                  />
                </div>

                <div>
                  <label
                    htmlFor="titleOrigin"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-400"
                  >
                    원제
                  </label>
                  <input
                    type="text"
                    id="titleOrigin"
                    name="titleOrigin"
                    value={animeData.titleOrigin}
                    onChange={handleInputChange}
                    className="border-brand-zinc-300 w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="원제를 입력하세요"
                  />
                </div>

                <div>
                  <label
                    htmlFor="titleEng"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-400"
                  >
                    영어 제목
                  </label>
                  <input
                    type="text"
                    id="titleEng"
                    name="titleEng"
                    value={animeData.titleEng}
                    onChange={handleInputChange}
                    className="border-brand-zinc-300 w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="영어 제목을 입력하세요"
                  />
                </div>

                <div>
                  <label
                    htmlFor="medium"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-400"
                  >
                    매체 *
                  </label>
                  <select
                    id="medium"
                    name="medium"
                    value={animeData.medium}
                    onChange={handleInputChange}
                    required
                    className="border-brand-zinc-300 w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="TVA">TV 애니메이션</option>
                    <option value="MOVIE">영화</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="premiereDateTime"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-400"
                  >
                    첫 방영일시
                  </label>
                  <input
                    type="datetime-local"
                    id="premiereDateTime"
                    name="premiereDateTime"
                    value={
                      animeData.premiereDate && animeData.premiereTime
                        ? `${animeData.premiereDate}T${animeData.premiereTime}`
                        : ''
                    }
                    onChange={(e) => {
                      const [date, time] = e.target.value.split('T');
                      setAnimeData((prev) => {
                        const newData = {
                          ...prev,
                          premiereDate: date || '',
                          premiereTime: time || '',
                        };

                        if (prev.medium !== 'MOVIE' && date && time) {
                          const fullDateTime = new Date(`${date}T${time}`);
                          const dayOfWeek = fullDateTime
                            .toLocaleDateString('en-US', { weekday: 'short' })
                            .toUpperCase();

                          return {
                            ...newData,
                            dayOfWeek: dayOfWeek as
                              | 'MON'
                              | 'TUE'
                              | 'WED'
                              | 'THU'
                              | 'FRI'
                              | 'SAT'
                              | 'SUN',
                            airTime: time,
                          };
                        }

                        return newData;
                      });
                    }}
                    className="border-brand-zinc-300 w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">
                    {animeData.medium === 'MOVIE'
                      ? '극장판은 방영 시간과 요일이 자동 설정되지 않습니다'
                      : '입력 시 방영 요일과 방영 시간이 자동으로 설정됩니다'}
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="airTime"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-400"
                  >
                    방영 시간{' '}
                    {animeData.medium === 'MOVIE' && (
                      <span className="text-gray-500 dark:text-zinc-400">
                        (극장판은 해당 없음)
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    id="airTime"
                    name="airTime"
                    value={animeData.airTime}
                    onChange={handleInputChange}
                    disabled={animeData.medium === 'MOVIE'}
                    className={`border-brand-zinc-300 w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                      animeData.medium === 'MOVIE'
                        ? 'cursor-not-allowed bg-gray-100'
                        : ''
                    }`}
                    placeholder={
                      animeData.medium === 'MOVIE'
                        ? '극장판은 해당 없음'
                        : '예: 23:00'
                    }
                  />
                </div>

                <div>
                  <label
                    htmlFor="dayOfWeek"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-400"
                  >
                    방영 요일{' '}
                    {animeData.medium === 'MOVIE' && (
                      <span className="text-gray-500 dark:text-zinc-400">
                        (극장판은 해당 없음)
                      </span>
                    )}
                  </label>
                  <select
                    id="dayOfWeek"
                    name="dayOfWeek"
                    value={animeData.dayOfWeek || ''}
                    onChange={handleInputChange}
                    disabled={animeData.medium === 'MOVIE'}
                    className={`border-brand-zinc-300 w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                      animeData.medium === 'MOVIE'
                        ? 'cursor-not-allowed bg-gray-100'
                        : ''
                    }`}
                  >
                    <option value="">
                      {animeData.medium === 'MOVIE'
                        ? '극장판은 해당 없음'
                        : '선택하세요'}
                    </option>
                    <option value="MON">월요일</option>
                    <option value="TUE">화요일</option>
                    <option value="WED">수요일</option>
                    <option value="THU">목요일</option>
                    <option value="FRI">금요일</option>
                    <option value="SAT">토요일</option>
                    <option value="SUN">일요일</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="totalEpisodes"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-400"
                  >
                    총 화수{' '}
                    {animeData.medium === 'MOVIE' && (
                      <span className="text-gray-500 dark:text-zinc-400">
                        (극장판은 해당 없음)
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    id="totalEpisodes"
                    name="totalEpisodes"
                    value={animeData.totalEpisodes || ''}
                    onChange={handleInputChange}
                    disabled={animeData.medium === 'MOVIE'}
                    className={`border-brand-zinc-300 w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                      animeData.medium === 'MOVIE'
                        ? 'cursor-not-allowed bg-gray-100'
                        : ''
                    }`}
                    placeholder={
                      animeData.medium === 'MOVIE'
                        ? '극장판은 해당 없음'
                        : '예: 12'
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="corp"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-400"
                  >
                    제작사
                  </label>
                  <input
                    type="text"
                    id="corp"
                    name="corp"
                    value={animeData.corp}
                    onChange={handleInputChange}
                    className="border-brand-zinc-300 w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="제작사를 입력하세요"
                  />
                </div>

                <div>
                  <label
                    htmlFor="director"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-400"
                  >
                    감독
                  </label>
                  <input
                    type="text"
                    id="director"
                    name="director"
                    value={animeData.director}
                    onChange={handleInputChange}
                    className="border-brand-zinc-300 w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="감독을 입력하세요"
                  />
                </div>

                <div>
                  <label
                    htmlFor="genre"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-400"
                  >
                    장르
                  </label>
                  <input
                    type="text"
                    id="genre"
                    name="genre"
                    value={animeData.genre}
                    onChange={handleInputChange}
                    className="border-brand-zinc-300 w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="장르를 입력하세요"
                  />
                </div>

                <div>
                  <label
                    htmlFor="author"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-400"
                  >
                    원작
                  </label>
                  <input
                    type="text"
                    id="author"
                    name="author"
                    value={animeData.author}
                    onChange={handleInputChange}
                    className="border-brand-zinc-300 w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="원작을 입력하세요"
                  />
                </div>

                <div>
                  <label
                    htmlFor="minAge"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-400"
                  >
                    시청 등급
                  </label>
                  <select
                    id="minAge"
                    name="minAge"
                    value={animeData.minAge || ''}
                    onChange={handleInputChange}
                    className="border-brand-zinc-300 w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">시청 등급을 선택하세요</option>
                    <option value="0">전체이용가</option>
                    <option value="7">7세 이상</option>
                    <option value="12">12세 이상</option>
                    <option value="15">15세 이상</option>
                    <option value="19">19세 이상</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="synopsis"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-400"
                >
                  시놉시스
                </label>
                <textarea
                  id="synopsis"
                  name="synopsis"
                  value={animeData.synopsis}
                  onChange={handleInputChange}
                  rows={4}
                  className="border-brand-zinc-300 w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="시놉시스를 입력하세요"
                />
              </div>

              <div>
                <label
                  htmlFor="mainImage"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-400"
                >
                  메인 이미지
                </label>
                <input
                  type="file"
                  id="mainImage"
                  name="mainImage"
                  accept="image/*"
                  onChange={handleInputChange}
                  className="border-brand-zinc-300 w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {message && (
                <div
                  className={`rounded-md p-4 ${
                    message.includes('성공')
                      ? 'border border-green-200 bg-green-50 text-green-800 dark:bg-green-900/50 dark:text-green-400'
                      : 'border border-red-200 bg-red-50 text-red-800'
                  }`}
                >
                  {message}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="rounded-md bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoading ? '등록 중...' : '애니메이션 등록'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 제출 현황 관리 탭 */}
        {activeTab === 'submissions' && (
          <div className="space-y-6">
            {/* IP 관리 로그 섹션 */}
            <div className="overflow-hidden rounded-lg border border-gray-700 bg-gray-900 shadow-lg">
              <div className="border-b border-gray-700 bg-gray-800 px-4 py-2">
                <h2 className="text-sm font-semibold text-gray-300">
                  IP 관리 로그
                </h2>
              </div>

              {isLoadingLogs ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-green-400"></div>
                </div>
              ) : (
                <div className="p-4 font-mono text-sm">
                  <div
                    ref={logsScrollRef}
                    className="max-h-96 space-y-1 overflow-y-auto"
                  >
                    {logs.length === 0 && !isLoadingLogs ? (
                      <div className="text-gray-500">로그가 없습니다.</div>
                    ) : (
                      logs.map((log, index) => {
                        const taskTypeText =
                          log.taskType === 'BAN'
                            ? '차단'
                            : log.taskType === 'UNBAN'
                              ? '차단 해제'
                              : log.taskType === 'WITHDRAW'
                                ? '표 몰수'
                                : '표 몰수 롤백';

                        const weekInfo =
                          log.weekId && log.year && log.quarter && log.week
                            ? formatDate(log.year, log.quarter, log.week)
                            : '알 수 없음';

                        const dateTime = new Date(log.managedAt);
                        const formattedDate = `${dateTime.getFullYear()}.${String(dateTime.getMonth() + 1).padStart(2, '0')}.${String(dateTime.getDate()).padStart(2, '0')}.${String(dateTime.getHours()).padStart(2, '0')}:${String(dateTime.getMinutes()).padStart(2, '0')}`;

                        const taskTypeColor =
                          log.taskType === 'BAN'
                            ? 'text-red-400'
                            : log.taskType === 'UNBAN'
                              ? 'text-green-400'
                              : log.taskType === 'WITHDRAW'
                                ? 'text-orange-400'
                                : 'text-blue-400';

                        return (
                          <div
                            key={`log-${index}`}
                            className="leading-relaxed text-gray-300"
                          >
                            {log.profileImageUrl && (
                              <img
                                src={log.profileImageUrl}
                                alt={log.managerNickname}
                                className="mr-1.5 inline-block h-4 w-4 rounded-full align-middle"
                              />
                            )}
                            <span className="text-green-400">
                              {log.managerNickname}
                            </span>
                            <span className="text-gray-400"> 님이 </span>
                            <span className="font-mono text-cyan-400">
                              {log.ipHash}
                            </span>
                            {log.weekId &&
                              log.year &&
                              log.quarter &&
                              log.week && (
                                <span className="text-gray-400">
                                  {' '}
                                  ({weekInfo})
                                </span>
                              )}
                            <span className="text-gray-400">에 대해 </span>
                            <span className={taskTypeColor}>
                              {taskTypeText}
                            </span>
                            <span className="text-gray-400"> 하였습니다. </span>
                            <span className="text-gray-500">
                              {formattedDate}
                            </span>
                            {log.taskType === 'WITHDRAW' && (
                              <button
                                onClick={(e) => handleUndoWithdraw(log, e)}
                                disabled={
                                  !log.isUndoable || !log.weekId || !log.logId
                                }
                                className={`ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full border transition-colors ${
                                  log.isUndoable && log.weekId
                                    ? 'cursor-pointer border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-gray-900'
                                    : 'cursor-not-allowed border-gray-600 text-gray-600 opacity-50'
                                }`}
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
                                <span className="ml-4 text-gray-500">
                                  └ 사유:{' '}
                                </span>
                                <span className="text-gray-400">
                                  {log.reason}
                                </span>
                              </>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {isLoadingMoreLogs && (
                    <div className="mt-2 text-gray-500">
                      <span className="animate-pulse">더 불러오는 중...</span>
                    </div>
                  )}
                </div>
              )}
            </div>

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
                                onClick={() =>
                                  handleSubmissionClick(submission)
                                }
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
                                      onClick={(e) =>
                                        handleBanIp(submission, e)
                                      }
                                      disabled={processingIds.has(
                                        `${submission.weekId}-${submission.ipHash}`
                                      )}
                                      className={`cursor-pointer rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                                        submission.isBlocked
                                          ? 'bg-brand-zinc-100 hover:bg-brand-zinc-200 text-gray-600 dark:text-zinc-400'
                                          : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-400 dark:hover:bg-red-500/40'
                                      } disabled:cursor-not-allowed disabled:opacity-50`}
                                    >
                                      {submission.isBlocked
                                        ? '차단 해제'
                                        : '차단'}
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
        )}
      </div>
    </div>
  );
}
