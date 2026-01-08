'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import VoteModal from './VoteModal';
import { getCandidateList } from '@/api/vote';
import { CandidateListDto } from '@/types/dtos';
import { FaCheckCircle } from 'react-icons/fa';
import { useModal } from '@/components/layout/AppContainer';
import { searchMatch } from '@/lib';

interface VoteCandidateListProps {
  title?: string;
  year: number;
  quarter: number;
  week: number;
  searchQuery?: string;
}

const getItemsPerPage = (width: number) => {
  if (width < 480) return 2;
  if (width < 640) return 4;
  if (width < 768) return 3;
  if (width < 1024) return 5;
  if (width < 1280) return 6;
  return 7;
};

const getCheckCircleSize = (width: number) => {
  if (width < 1536) return 24;
  return 32;
};

// 후보 카드 컴포넌트
const CandidateCard = ({ candidate }: { candidate: CandidateListDto }) => {
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
      <p className="line-clamp-2 text-sm leading-tight font-semibold text-black">
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
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    if (typeof window === 'undefined') return 5;
    return getItemsPerPage(window.innerWidth);
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedCandidate, setSelectedCandidate] =
    useState<CandidateListDto | null>(null);

  const { data: candidates = [] } = useQuery<CandidateListDto[]>({
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
      setItemsPerPage(getItemsPerPage(window.innerWidth));
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 후보를 페이지 단위로 나누기
  const pages = useMemo(() => {
    if (filteredCandidates.length === 0) return [];
    const chunked: CandidateListDto[][] = [];
    for (let i = 0; i < filteredCandidates.length; i += itemsPerPage) {
      chunked.push(filteredCandidates.slice(i, i + itemsPerPage));
    }
    return chunked;
  }, [filteredCandidates, itemsPerPage]);

  const totalPages = pages.length;

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
        <h1 className="text-2xl font-bold text-black">{title}</h1>
        <span className="text-xs text-gray-400">
          {searchQuery.trim()
            ? `검색 결과 ${filteredCandidates.length}개 / 전체 ${candidates.length}개 작품`
            : `총 ${candidates.length}개 작품`}
        </span>
      </div>
      {filteredCandidates.length === 0 && searchQuery.trim() ? (
        <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="text-center">
            <p className="text-gray-600">
              '{searchQuery}'에 대한 검색 결과가 없습니다.
            </p>
          </div>
        </div>
      ) : (
        <div className="relative rounded-3xl px-4 pb-8 text-white sm:px-8">
          <button
            type="button"
            aria-label="이전 페이지"
            onClick={handlePrev}
            disabled={totalPages <= 1}
            className="absolute top-1/3 -left-4 z-1 rounded-full border border-white/20 bg-white p-1 text-black shadow-lg transition hover:bg-white/20 disabled:opacity-30"
          >
            <ChevronLeft className="h-8 w-8 stroke-1 text-gray-500" />
          </button>

          <button
            type="button"
            aria-label="다음 페이지"
            onClick={handleNext}
            disabled={totalPages <= 1}
            className="absolute top-1/3 -right-4 z-1 rounded-full border border-white/20 bg-white p-1 text-black shadow-lg transition hover:bg-white/20 disabled:opacity-30"
          >
            <ChevronRight className="h-8 w-8 stroke-1 text-gray-500" />
          </button>

          <div className="overflow-hidden pt-8">
            <div
              className="flex transition-transform duration-500 ease-[cubic-bezier(0.22,0.61,0.36,1)]"
              style={{ transform: `translateX(-${currentPage * 100}%)` }}
            >
              {pages.map((page, pageIndex) => (
                <div
                  key={`page-${pageIndex}`}
                  className="w-full flex-shrink-0 px-4 sm:px-6"
                >
                  <div
                    className="grid w-full gap-4"
                    style={{
                      gridTemplateColumns: `repeat(${itemsPerPage}, minmax(0, 1fr))`,
                    }}
                  >
                    {page.map((candidate) => (
                      <div
                        key={candidate.episodeId}
                        className={`flex flex-col gap-2 ${candidate.state === 'CLOSED' ? 'cursor-auto' : 'cursor-pointer'}`}
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

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              {pages.map((_, index) => (
                <button
                  key={`indicator-${index}`}
                  type="button"
                  onClick={() => setCurrentPage(index)}
                  className={`h-2.5 w-2.5 rounded-full transition ${
                    index === currentPage ? 'bg-amber-400' : 'bg-gray-800/30'
                  }`}
                  aria-label={`${index + 1}번째 페이지로 이동`}
                />
              ))}
            </div>
          )}

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
