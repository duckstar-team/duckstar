'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import VoteModal from './VoteModal';
import { getCandidateList } from '@/api/client';
import { CandidateListDto } from '@/types/vote';
import { FaCheckCircle } from 'react-icons/fa';

interface VoteCandidateListProps {
  title?: string;
  year: number;
  quarter: number;
  week: number;
}

const getItemsPerPage = (width: number) => {
  if (width < 480) return 2;
  if (width < 640) return 4;
  if (width < 768) return 3;
  if (width < 1024) return 5;
  if (width < 1280) return 6;
  return 7;
};

// 후보 카드 컴포넌트
const CandidateCard = ({ candidate }: { candidate: CandidateListDto }) => {
  return (
    <div className="relative flex flex-col items-center">
      <div className="relative flex w-fit flex-col items-center gap-2">
        {candidate.hasVoted && (
          <div className="absolute -top-2 -right-2 z-20 rounded-full bg-white p-0.5 shadow-md">
            <FaCheckCircle size={26} className="text-amber-400" />
          </div>
        )}
        <Image
          src={candidate.mainThumbnailUrl}
          alt={candidate.titleKor}
          width={100}
          height={100}
          className={`aspect-[2/3] rounded-lg object-cover shadow-lg ${candidate.state !== 'CLOSED' && 'transition-all duration-200 hover:scale-105'}`}
          priority={false}
          style={{
            filter: candidate.state === 'CLOSED' ? 'grayscale(100%)' : 'none',
          }}
        />
        <p className="line-clamp-2 text-sm leading-tight font-semibold text-black">
          {candidate.titleKor}
        </p>
      </div>
    </div>
  );
};

// 후보 목록 컴포넌트
export default function VoteCandidateList({
  title = '이번 주 후보 목록',
  year,
  quarter,
  week,
}: VoteCandidateListProps) {
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    if (typeof window === 'undefined') return 5;
    return getItemsPerPage(window.innerWidth);
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);
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

  useEffect(() => {
    if (!selectedCandidate) return;
    const updatedCandidate = candidates.find(
      (candidate) => candidate.episodeId === selectedCandidate.episodeId
    );
    if (
      updatedCandidate &&
      updatedCandidate.hasVoted !== selectedCandidate.hasVoted
    ) {
      setSelectedCandidate(updatedCandidate);
    }
  }, [candidates, selectedCandidate?.episodeId, selectedCandidate?.hasVoted]);

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
    if (candidates.length === 0) return [];
    const chunked: CandidateListDto[][] = [];
    for (let i = 0; i < candidates.length; i += itemsPerPage) {
      chunked.push(candidates.slice(i, i + itemsPerPage));
    }
    return chunked;
  }, [candidates, itemsPerPage]);

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
    <div>
      <div className="flex items-end gap-4">
        <h1 className="text-2xl font-bold text-black">{title}</h1>
        <span className="text-xs text-gray-400">
          총 {candidates.length}개 작품
        </span>
      </div>
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
                        setIsVoteModalOpen(true);
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
        {selectedCandidate && (
          <VoteModal
            isOpen={isVoteModalOpen}
            onClose={() => {
              setIsVoteModalOpen(false);
              setSelectedCandidate(null);
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
    </div>
  );
}
