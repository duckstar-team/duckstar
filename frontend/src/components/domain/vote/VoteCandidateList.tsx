'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import VoteModal from './VoteModal';
import { getCandidateList } from '@/api/vote';
import { Schemas } from '@/types';
import { FaCheckCircle } from 'react-icons/fa';
import { useModal } from '@/components/layout/AppContainer';
import { searchMatch } from '@/lib';
import { useSidebarWidth } from '@/hooks/useSidebarWidth';

interface VoteCandidateListProps {
  title?: string;
  year: number;
  quarter: number;
  week: number;
  searchQuery?: string;
}

const getItemsPerPage = (width: number) => {
  if (width < 640) return 4;
  if (width < 1024) return 5;
  if (width < 1280) return 6;
  return 7;
};

const getCheckCircleSize = (width: number) => {
  if (width < 1536) return 24;
  return 32;
};

// 후보 카드 컴포넌트
const CandidateCard = ({
  candidate,
}: {
  candidate: Schemas['WeekCandidateDto'];
}) => {
  return (
    <div className="relative flex w-full flex-col items-start gap-2">
      {candidate.hasVoted && (
        <div className="absolute -top-2 -right-2 z-20 rounded-full bg-white p-0.5 shadow-md">
          <FaCheckCircle
            size={getCheckCircleSize(window.innerWidth)}
            className="text-amber-400"
          />
        </div>
      )}
      <img
        src={candidate.mainThumbnailUrl}
        alt={candidate.titleKor}
        className={`aspect-[2/3] w-full rounded-md object-cover shadow-lg ${candidate.state !== 'CLOSED' && 'transition-all duration-200 hover:scale-105'}`}
        style={{
          filter: candidate.state === 'CLOSED' ? 'grayscale(100%)' : 'none',
        }}
      />
      <p className="line-clamp-2 text-sm leading-tight font-medium text-black dark:text-white">
        {candidate.titleKor}
      </p>
    </div>
  );
};

// 후보 목록 컴포넌트
export default function VoteCandidateList({
  title = '이번 주 후보 목록',
  year,
  quarter,
  week,
  searchQuery = '',
}: VoteCandidateListProps) {
  const { openVoteModal, closeVoteModal, isVoteModalOpen } = useModal();
  const queryClient = useQueryClient();
  const sidebarWidth = useSidebarWidth();
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    if (typeof window === 'undefined') return 5;
    return getItemsPerPage(window.innerWidth - sidebarWidth);
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedCandidate, setSelectedCandidate] = useState<
    Schemas['WeekCandidateDto'] | null
  >(null);

  const { data: candidates = [] } = useQuery<Schemas['WeekCandidateDto'][]>({
    queryKey: ['candidateList', year, quarter, week],
    queryFn: async () => {
      const response = await getCandidateList(year, quarter, week);
      return response.result ?? [];
    },
    staleTime: 60_000,
  });

  // 검색어로 필터링된 후보 목록
  const filteredCandidates = useMemo(() => {
    if (!searchQuery.trim()) return candidates;
    return candidates.filter((candidate) =>
      searchMatch(searchQuery, candidate.titleKor)
    );
  }, [candidates, searchQuery]);

  useEffect(() => {
    if (!selectedCandidate) return;
    const updatedCandidate = filteredCandidates.find(
      (candidate) => candidate.episodeId === selectedCandidate.episodeId
    );
    if (
      updatedCandidate &&
      updatedCandidate.hasVoted !== selectedCandidate.hasVoted
    ) {
      setSelectedCandidate(updatedCandidate);
    }
  }, [
    filteredCandidates,
    selectedCandidate?.episodeId,
    selectedCandidate?.hasVoted,
  ]);

  useEffect(() => {
    const handleResize = () => {
      if (typeof window === 'undefined') return;
      setItemsPerPage(getItemsPerPage(window.innerWidth - sidebarWidth));
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarWidth]);

  // 후보를 페이지 단위로 나누기
  const pages = useMemo(() => {
    if (filteredCandidates.length === 0) return [];
    const chunked: Schemas['WeekCandidateDto'][][] = [];
    for (let i = 0; i < filteredCandidates.length; i += itemsPerPage) {
      chunked.push(filteredCandidates.slice(i, i + itemsPerPage));
    }
    return chunked;
  }, [filteredCandidates, itemsPerPage]);

  const totalPages = pages.length;

  // itemsPerPage 변경 시 currentPage 조정
  useEffect(() => {
    if (totalPages === 0) {
      setCurrentPage(0);
      return;
    }
    setCurrentPage((prev) => Math.min(prev, totalPages - 1));
  }, [totalPages]);

  const handlePrev = () => {
    if (totalPages <= 1) return;
    setCurrentPage((prev) => (prev === 0 ? totalPages - 1 : prev - 1));
  };

  const handleNext = () => {
    if (totalPages <= 1) return;
    setCurrentPage((prev) => (prev === totalPages - 1 ? 0 : prev + 1));
  };

  return (
    <div className="mt-16">
      <div className="flex items-end gap-4">
        <h1 className="text-2xl font-bold">{title}</h1>
        <span className="text-xs text-gray-400">
          {searchQuery.trim()
            ? `검색 결과 ${filteredCandidates.length}개 / 전체 ${candidates.length}개 작품`
            : `총 ${candidates.length}개 작품`}
        </span>
      </div>
      {filteredCandidates.length === 0 && searchQuery.trim() ? (
        <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-none dark:bg-zinc-800">
          <div className="text-center">
            <p className="text-gray-600 dark:text-zinc-300">
              '{searchQuery}'에 대한 검색 결과가 없습니다.
            </p>
          </div>
        </div>
      ) : (
        <div className="relative mx-4 rounded-3xl pb-8 text-white">
          <button
            type="button"
            aria-label="이전"
            onClick={handlePrev}
            className="absolute top-[35%] -left-6 z-10 transition hover:opacity-70 sm:-left-8"
          >
            <ChevronLeft className="size-8 w-full stroke-[1.5px] text-zinc-500 dark:text-zinc-200" />
          </button>

          <button
            type="button"
            aria-label="다음"
            onClick={handleNext}
            className="absolute top-[35%] -right-6 z-10 transition hover:opacity-70 sm:-right-8"
          >
            <ChevronRight className="size-8 w-full stroke-[1.5px] text-zinc-500 dark:text-zinc-200" />
          </button>

          <div className="scrollbar-custom w-full overflow-x-scroll overflow-y-hidden pt-8">
            <div
              className="flex transition-transform duration-500 ease-[cubic-bezier(0.22,0.61,0.36,1)]"
              style={{ transform: `translateX(-${currentPage * 100}%)` }}
            >
              {pages.map((page, pageIndex) => (
                <div key={`page-${pageIndex}`} className="w-full flex-shrink-0">
                  <div
                    className="grid w-full items-stretch"
                    style={{
                      gridTemplateColumns: `repeat(${itemsPerPage}, minmax(0, 1fr))`,
                    }}
                  >
                    {page.map((candidate) => (
                      <div
                        key={candidate.episodeId}
                        className={`mx-1 @sm:mx-2 ${candidate.state === 'CLOSED' ? 'cursor-auto' : 'cursor-pointer'}`}
                        onClick={() => {
                          if (candidate.state === 'CLOSED') {
                            return;
                          }
                          setSelectedCandidate(candidate);
                          openVoteModal();
                        }}
                      >
                        <CandidateCard candidate={candidate} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 모달을 컴포넌트 최상위 레벨에서 한 번만 렌더링 */}
          {isVoteModalOpen && selectedCandidate && (
            <VoteModal
              onClose={() => {
                closeVoteModal();
                setSelectedCandidate(null);
                // 모달 닫을 때 candidateList 쿼리 무효화하여 hasVoted 상태 업데이트
                queryClient.invalidateQueries({
                  queryKey: ['candidateList', year, quarter, week],
                });
              }}
              hasVoted={selectedCandidate.hasVoted}
              episodeId={selectedCandidate.episodeId}
              mainThumbnailUrl={selectedCandidate.mainThumbnailUrl || ''}
              titleKor={selectedCandidate.titleKor}
              year={year}
              quarter={quarter}
              week={week}
            />
          )}
        </div>
      )}
    </div>
  );
}
