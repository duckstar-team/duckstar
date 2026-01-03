'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, useParams } from 'next/navigation';
import Medal from './Medal';
import { MedalPreviewDto } from '@/types/dtos';
import { MedalType } from '@/types/enums';

interface MedalGridProps {
  medals: MedalPreviewDto[];
  hideSeparators?: boolean;
}

export default function MedalGrid({
  medals,
  hideSeparators = false,
}: MedalGridProps) {
  const router = useRouter();
  const params = useParams();
  const [currentPage, setCurrentPage] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hoveredMedal, setHoveredMedal] = useState<{
    pageIndex: number;
    medalIndex: number;
  } | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const medalsPerPage = 6;
  const totalPages = Math.ceil(medals.length / medalsPerPage);

  // 메달 데이터가 변경될 때 마지막 페이지(최신 메달)로 초기화
  useEffect(() => {
    if (totalPages > 0) {
      setCurrentPage(totalPages - 1);
    }
  }, [medals.length, totalPages]);

  // 425px 미만 체크
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 425);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 모든 페이지의 메달 데이터를 미리 준비 (실제 메달만)
  const allPages = [];
  for (let i = 0; i < totalPages; i++) {
    const startIndex = i * medalsPerPage;
    const endIndex = startIndex + medalsPerPage;
    const pageMedals = medals.slice(startIndex, endIndex);

    // 실제 메달 데이터만 사용 (None 타입 추가하지 않음)
    allPages.push(pageMedals);
  }

  const handlePageChange = (page: number, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation(); // 카드 펼침 이벤트 전파 방지
    }
    if (page >= 0 && page < totalPages && !isAnimating) {
      setIsAnimating(true);
      setCurrentPage(page);

      // 애니메이션 완료 후 상태 리셋
      setTimeout(() => {
        setIsAnimating(false);
      }, 300);
    }
  };

  const handleMouseEnter = (
    pageIndex: number,
    medalIndex: number,
    event: React.MouseEvent
  ) => {
    setTooltipPosition({
      x: event.clientX,
      y: event.clientY,
    });
    setHoveredMedal({ pageIndex, medalIndex });
  };

  const handleMedalClick = (
    medal: MedalPreviewDto,
    event: React.MouseEvent
  ) => {
    event.stopPropagation(); // 카드 펼침 이벤트 전파 방지
    if (medal.year && medal.quarter && medal.week) {
      // 현재 주차 정보 확인
      const currentYear = params.year ? parseInt(params.year as string) : null;
      const currentQuarter = params.quarter
        ? parseInt(params.quarter as string)
        : null;
      const currentWeek = params.week ? parseInt(params.week as string) : null;

      // 동일 주차가 아니면 이동
      if (
        !(
          currentYear === medal.year &&
          currentQuarter === medal.quarter &&
          currentWeek === medal.week
        )
      ) {
        router.push(`/chart/${medal.year}/${medal.quarter}/${medal.week}`);
      }
    }
  };

  return (
    <div className="xs:gap-[10px] flex items-center gap-[6px] sm:gap-[10px]">
      {/* 왼쪽 세로선 */}
      {!hideSeparators && (
        <div
          onClick={
            totalPages > 1 && currentPage !== 0
              ? (e) => handlePageChange(currentPage - 1, e)
              : undefined
          }
          className={`flex h-[52px] items-center ${totalPages > 1 && currentPage !== 0 ? 'cursor-pointer' : ''}`}
        >
          <div className="h-[52px] w-0 border-l border-gray-300"></div>
        </div>
      )}

      {/* 왼쪽 클릭 영역 (gap + 화살표) */}
      {totalPages > 1 && currentPage !== 0 ? (
        <div
          onClick={(e) => handlePageChange(currentPage - 1, e)}
          className="xs:gap-[10px] flex h-[52px] cursor-pointer items-center gap-[6px] rounded px-1 transition-all duration-200 hover:bg-gray-200/60 sm:gap-[10px]"
        >
          {/* 왼쪽 화살표 */}
          <div className="xs:w-3 xs:h-5.5 xs:pr-1 flex h-4.5 w-2.5 items-center justify-center pr-0.5 sm:h-5.5 sm:w-3 sm:pr-1">
            <img
              src="/icons/episodes-before.svg?v=2"
              alt="이전 보기"
              className="xs:w-3 xs:h-5.5 h-4.5 w-2.5 sm:h-5.5 sm:w-3"
            />
          </div>
        </div>
      ) : (
        <div className="xs:w-3 xs:h-5.5 xs:pr-1 flex h-4.5 w-2.5 items-center justify-center pr-0.5 opacity-0 sm:h-5.5 sm:w-3 sm:pr-1">
          <img
            src="/icons/episodes-before.svg?v=2"
            alt="이전 보기"
            className="xs:w-3 xs:h-5.5 h-4.5 w-2.5 sm:h-5.5 sm:w-3"
          />
        </div>
      )}

      {/* 메달 그리드 - 슬라이드 애니메이션 */}
      <div className="xs:w-[120px] xs:h-36 relative inline-flex h-28 w-[90px] items-center justify-start overflow-hidden sm:h-36 sm:w-[120px]">
        <div
          className="flex transition-transform duration-300 ease-in-out"
          style={{
            transform: `translateX(${-currentPage * (window.innerWidth < 425 ? 90 : 120)}px)`,
          }}
        >
          {allPages.map((pageMedals, pageIndex) => (
            <div
              key={pageIndex}
              className="xs:w-[120px] xs:h-24 xs:gap-2 xs:px-1 inline-flex h-20 w-[90px] flex-shrink-0 flex-col items-start justify-start gap-1.5 px-0.5 sm:h-24 sm:w-[120px] sm:gap-2 sm:px-1"
            >
              {/* 첫 번째 행 (3개) */}
              <div className="xs:gap-2.5 flex gap-1.5 sm:gap-2.5">
                {pageMedals.slice(0, 3).map((medal, index) => (
                  <div
                    key={index}
                    data-property-1={medal.type}
                    className={`xs:w-7 xs:h-11 xs:gap-2.5 relative inline-flex h-8 w-5 items-center justify-center gap-1.5 sm:h-11 sm:w-7 sm:gap-2.5 ${
                      medal.type === MedalType.None
                        ? 'cursor-pointer rounded-md border-2 border-dashed border-gray-400/50 bg-gray-100/40 transition-all duration-200 hover:border-gray-500/60 hover:bg-gray-200/50'
                        : 'cursor-pointer transition-opacity hover:opacity-80'
                    }`}
                    onClick={(e) => handleMedalClick(medal, e)}
                    onMouseEnter={(e) => handleMouseEnter(pageIndex, index, e)}
                    onMouseLeave={() => setHoveredMedal(null)}
                  >
                    <Medal property1={medal.type} />
                  </div>
                ))}
              </div>
              {/* 두 번째 행 (3개) */}
              <div className="xs:gap-2.5 flex gap-1.5 sm:gap-2.5">
                {pageMedals.slice(3, 6).map((medal, index) => (
                  <div
                    key={index}
                    data-property-1={medal.type}
                    className={`xs:w-7 xs:h-11 xs:gap-2.5 relative inline-flex h-8 w-5 items-center justify-center gap-1.5 sm:h-11 sm:w-7 sm:gap-2.5 ${
                      medal.type === 'NONE'
                        ? 'rounded-md border-2 border-dashed border-gray-400/50 bg-gray-100/40 transition-all duration-200 hover:border-gray-500/60 hover:bg-gray-200/50'
                        : 'cursor-pointer transition-opacity hover:opacity-80'
                    }`}
                    onClick={(e) => handleMedalClick(medal, e)}
                    onMouseEnter={(e) =>
                      handleMouseEnter(pageIndex, index + 3, e)
                    }
                    onMouseLeave={() => setHoveredMedal(null)}
                  >
                    <Medal property1={medal.type} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 오른쪽 클릭 영역 (화살표 + gap) */}
      {totalPages > 1 && currentPage !== totalPages - 1 ? (
        <div
          onClick={(e) => handlePageChange(currentPage + 1, e)}
          className="xs:gap-[10px] flex h-[52px] cursor-pointer items-center gap-[6px] rounded px-1 transition-all duration-200 hover:bg-gray-200/60 sm:gap-[10px]"
        >
          {/* 오른쪽 화살표 */}
          <div className="xs:w-3 xs:h-5.5 xs:pl-1 flex h-4.5 w-2.5 items-center justify-center pl-0.5 sm:h-5.5 sm:w-3 sm:pl-1">
            <img
              src="/icons/episodes-after.svg?v=2"
              alt="다음 보기"
              className="xs:w-3 xs:h-5.5 h-4.5 w-2.5 sm:h-5.5 sm:w-3"
            />
          </div>
        </div>
      ) : (
        <div className="xs:w-3 xs:h-5.5 xs:pl-1 flex h-4.5 w-2.5 items-center justify-center pl-0.5 opacity-0 sm:h-5.5 sm:w-3 sm:pl-1">
          <img
            src="/icons/episodes-after.svg?v=2"
            alt="다음 보기"
            className="xs:w-3 xs:h-5.5 h-4.5 w-2.5 sm:h-5.5 sm:w-3"
          />
        </div>
      )}

      {/* 오른쪽 세로선 */}
      {!hideSeparators && (
        <div
          onClick={
            totalPages > 1 && currentPage !== totalPages - 1
              ? (e) => handlePageChange(currentPage + 1, e)
              : undefined
          }
          className={`flex h-[52px] items-center ${totalPages > 1 && currentPage !== totalPages - 1 ? 'cursor-pointer' : ''}`}
        >
          <div className="h-[52px] w-0 border-l border-gray-300"></div>
        </div>
      )}

      {/* 툴팁 포털 */}
      {hoveredMedal &&
        typeof window !== 'undefined' &&
        createPortal(
          <div
            className={`pointer-events-none fixed z-50 rounded bg-black px-2 py-1 text-xs text-white ${
              isMobile ? 'whitespace-normal' : 'whitespace-nowrap'
            }`}
            style={{
              left: tooltipPosition.x,
              top: tooltipPosition.y,
            }}
          >
            {(() => {
              const pageMedals = allPages[hoveredMedal.pageIndex];
              const medal = pageMedals[hoveredMedal.medalIndex];

              if (isMobile) {
                // 425px 미만: 연도 제거, 줄바꿈 추가
                return (
                  <>
                    {medal.quarter}분기 {medal.week}주차
                    <br />
                    {medal.rank}등
                  </>
                );
              } else {
                // 기본: 연도 포함, 한 줄
                const shortYear = medal.year
                  ? medal.year.toString().slice(-2)
                  : '';
                return `${shortYear}년 ${medal.quarter}분기 ${medal.week}주차 ${medal.rank}등`;
              }
            })()}
          </div>,
          document.body
        )}
    </div>
  );
}
