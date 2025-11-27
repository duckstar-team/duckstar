'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import VoteModal from './VoteModal';
import { getCandidateList } from '@/api/client';
import { CandidateListDto } from '@/types/vote';
import { FaCheckCircle } from 'react-icons/fa';

interface VoteCandidateListProps {
  year: number;
  quarter: number;
  week: number;
}

// const dayOfWeekMap: Record<
//   NonNullable<LiveCandidateDto['dayOfWeek']>,
//   string
// > = {
//   MON: '월요일',
//   TUE: '화요일',
//   WED: '수요일',
//   THU: '목요일',
//   FRI: '금요일',
//   SAT: '토요일',
//   SUN: '일요일',
//   SPECIAL: '스페셜',
//   NONE: '편성 미정',
// };

// const mediumMap: Record<LiveCandidateDto['medium'], string> = {
//   TVA: 'TV 시리즈',
//   MOVIE: '극장판',
// };

// const voterFormatter = new Intl.NumberFormat('ko-KR');

const getItemsPerPage = (width: number) => {
  if (width < 480) return 1; // 모바일: 1개
  if (width < 768) return 2; // 작은 태블릿: 2개
  if (width < 1024) return 3; // 태블릿: 3개
  if (width < 1280) return 5; // 중간 데스크톱: 5개
  return 7; // 데스크톱 이상: 7개
};

// 후보 카드 컴포넌트
const CandidateCard = ({ candidate }: { candidate: CandidateListDto }) => {
  // const airInfo =
  //   candidate.dayOfWeek === 'NONE'
  //     ? candidate.airTime || '편성 미정'
  //     : `${dayOfWeekMap[candidate.dayOfWeek]} · ${
  //         candidate.airTime || '편성 미정'
  //       }`;

  return (
    <div className="flex flex-col gap-2">
      <div className="group flex flex-col overflow-hidden rounded-lg bg-neutral-900 text-white ring-1 ring-white/5">
        <div className="relative w-full">
          {candidate.hasVoted && (
            <div className="absolute top-2 left-2 z-10 flex items-center gap-1 rounded-full bg-amber-400 px-2 py-1 text-black shadow-lg">
              <FaCheckCircle />
              <span className="text-xs font-semibold">투표 완료</span>
            </div>
          )}

          <div className="relative aspect-[2/3] w-full">
            <Image
              src={candidate.mainThumbnailUrl}
              alt={candidate.titleKor}
              fill
              className="object-cover"
              priority={false}
              style={{
                filter:
                  candidate.state === 'CLOSED' ? 'grayscale(100%)' : 'none',
              }}
            />
          </div>
          {/* <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" /> */}
          {/* <div className="absolute top-4 left-4 flex items-center gap-2 max-md:items-start">
          <span className="rounded-full bg-amber-400/90 px-3 py-1 text-xs font-semibold text-black">
            {candidate.week}주차
          </span>
          <span className="rounded-full bg-white/20 px-3 py-1 text-[11px] font-medium backdrop-blur">
            {mediumMap[candidate.medium]}
          </span>
        </div> */}
        </div>
        {/* <div className="flex flex-1 items-center justify-between px-4 py-3 text-xs text-white/80">
        <div className="flex flex-col">
          <span className="text-[11px] tracking-wide text-white/60 uppercase">
            요일
          </span>
          <span className="text-sm font-semibold">
            {dayOfWeekMap[candidate.dayOfWeek]}
          </span>
        </div>
        <div className="flex flex-col text-right">
          <span className="text-[11px] tracking-wide text-white/60 uppercase">
            투표수
          </span>
          <span className="text-sm font-semibold text-amber-300">
            {voterFormatter.format(candidate.result.voterCount)}표
          </span>
        </div>
      </div> */}
      </div>
      <div className="space-y-1">
        <p className="line-clamp-2 text-base leading-tight font-semibold text-black">
          {candidate.titleKor}
        </p>
        {/* <p className="text-xs text-white/80">{airInfo}</p> */}
      </div>
    </div>
  );
};

// 후보 목록 컴포넌트
export default function VoteCandidateList({
  year,
  quarter,
  week,
}: VoteCandidateListProps) {
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    if (typeof window === 'undefined') return 5;
    return getItemsPerPage(window.innerWidth);
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [candidates, setCandidates] = useState<CandidateListDto[]>([]);
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] =
    useState<CandidateListDto | null>(null);

  useEffect(() => {
    const fetchCandidates = async () => {
      const response = await getCandidateList(year, quarter, week);
      setCandidates(response.result);
    };
    fetchCandidates();
  }, []);

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
  const pages = React.useMemo(() => {
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
    <div className="relative rounded-3xl px-4 py-8 text-white sm:px-8">
      <div className="mb-6 flex items-center justify-between text-sm text-gray-600">
        {/* <span>총 {candidates.length}개 작품</span> */}
        {/* {totalPages > 0 && (
          <span>
            {currentPage + 1} / {totalPages}
          </span>
        )} */}
      </div>

      <button
        type="button"
        aria-label="이전 페이지"
        onClick={handlePrev}
        disabled={totalPages <= 1}
        // className="absolute top-1/2 left-2 z-1 -translate-y-1/2 rounded-full border border-white/20 bg-black/10 p-3 text-white backdrop-blur transition hover:bg-black/20 disabled:opacity-30"
        className="absolute top-1/2 -left-4 z-1 -translate-y-1/2 rounded-full border border-white/20 bg-white p-1 text-black shadow-lg transition hover:bg-white/20 disabled:opacity-30"
      >
        <ChevronLeft className="h-8 w-8 stroke-1 text-gray-500" />
      </button>

      <button
        type="button"
        aria-label="다음 페이지"
        onClick={handleNext}
        disabled={totalPages <= 1}
        className="absolute top-1/2 -right-4 z-1 -translate-y-1/2 rounded-full border border-white/20 bg-white p-1 text-black shadow-lg transition hover:bg-white/20 disabled:opacity-30"
        // className="absolute top-1/2 right-2 z-1 -translate-y-1/2 rounded-full border border-white/10 bg-black/10 p-3 text-white backdrop-blur transition hover:bg-black/20 disabled:opacity-30"
      >
        <ChevronRight className="h-8 w-8 stroke-1 text-gray-500" />
      </button>

      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-[cubic-bezier(0.22,0.61,0.36,1)]"
          style={{ transform: `translateX(-${currentPage * 100}%)` }}
        >
          {pages.map((page, pageIndex) => (
            <div
              key={`page-${pageIndex}`}
              className="w-fit flex-shrink-0 px-4 sm:px-6"
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
                    style={{ minWidth: 0 }}
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
          quarter={quarter}
          week={week}
        />
      )}
    </div>
  );
}
