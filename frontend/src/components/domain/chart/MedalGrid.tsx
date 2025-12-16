'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, useParams } from 'next/navigation';
import Medal from './Medal';

interface MedalData {
  id: string;
  type: "Gold" | "Silver" | "Bronze" | "None";
  title?: string;
  image?: string;
  rank?: number;
  year?: number;
  quarter?: number;
  week?: number;
}

interface MedalGridProps {
  medals: MedalData[];
  className?: string;
  hideSeparators?: boolean;
}

export default function MedalGrid({
  medals,
  className = "",
  hideSeparators = false
}: MedalGridProps) {
  const router = useRouter();
  const params = useParams();
  const [currentPage, setCurrentPage] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hoveredMedal, setHoveredMedal] = useState<{pageIndex: number, medalIndex: number} | null>(null);
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

  const handleMouseEnter = (pageIndex: number, medalIndex: number, event: React.MouseEvent) => {
    setTooltipPosition({
      x: event.clientX,
      y: event.clientY
    });
    setHoveredMedal({ pageIndex, medalIndex });
  };

  const handleMedalClick = (medal: MedalData, event: React.MouseEvent) => {
    event.stopPropagation(); // 카드 펼침 이벤트 전파 방지
    if (medal.year && medal.quarter && medal.week) {
      // 현재 주차 정보 확인
      const currentYear = params.year ? parseInt(params.year as string) : null;
      const currentQuarter = params.quarter ? parseInt(params.quarter as string) : null;
      const currentWeek = params.week ? parseInt(params.week as string) : null;
      
      // 동일 주차가 아니면 이동
      if (
        !(currentYear === medal.year && 
          currentQuarter === medal.quarter && 
          currentWeek === medal.week)
      ) {
        router.push(`/chart/${medal.year}/${medal.quarter}/${medal.week}`);
      }
    }
  };

  return (
    <div className={`flex items-center gap-[6px] xs:gap-[10px] sm:gap-[10px] ${className}`}>
      {/* 왼쪽 세로선 */}
      {!hideSeparators && (
        <div 
          onClick={totalPages > 1 && currentPage !== 0 ? (e) => handlePageChange(currentPage - 1, e) : undefined}
          className={`h-[52px] flex items-center ${totalPages > 1 && currentPage !== 0 ? 'cursor-pointer' : ''}`}
        >
          <div className="w-0 h-[52px] border-l border-gray-300"></div>
        </div>
      )}
      
      {/* 왼쪽 클릭 영역 (gap + 화살표) */}
      {totalPages > 1 && currentPage !== 0 ? (
        <div 
          onClick={(e) => handlePageChange(currentPage - 1, e)}
          className="flex items-center gap-[6px] xs:gap-[10px] sm:gap-[10px] h-[52px] px-1 rounded cursor-pointer hover:bg-gray-200/60 transition-all duration-200"
        >
          {/* 왼쪽 화살표 */}
          <div className="w-2.5 xs:w-3 sm:w-3 h-4.5 xs:h-5.5 sm:h-5.5 flex items-center justify-center pr-0.5 xs:pr-1 sm:pr-1">
            <img 
              src="/icons/episodes-before.svg?v=2" 
              alt="이전 보기" 
              className="w-2.5 xs:w-3 sm:w-3 h-4.5 xs:h-5.5 sm:h-5.5"
            />
          </div>
        </div>
      ) : (
        <div className="w-2.5 xs:w-3 sm:w-3 h-4.5 xs:h-5.5 sm:h-5.5 flex items-center justify-center pr-0.5 xs:pr-1 sm:pr-1 opacity-0">
          <img 
            src="/icons/episodes-before.svg?v=2" 
            alt="이전 보기" 
            className="w-2.5 xs:w-3 sm:w-3 h-4.5 xs:h-5.5 sm:h-5.5"
          />
        </div>
      )}
      
       {/* 메달 그리드 - 슬라이드 애니메이션 */}
       <div className="w-[90px] xs:w-[120px] sm:w-[120px] h-28 xs:h-36 sm:h-36 inline-flex justify-start items-center overflow-hidden relative">
         <div 
           className="flex transition-transform duration-300 ease-in-out"
           style={{ transform: `translateX(${-currentPage * (window.innerWidth < 425 ? 90 : 120)}px)` }}
         >
           {allPages.map((pageMedals, pageIndex) => (
             <div key={pageIndex} className="w-[90px] xs:w-[120px] sm:w-[120px] h-20 xs:h-24 sm:h-24 inline-flex flex-col justify-start items-start flex-shrink-0 gap-1.5 xs:gap-2 sm:gap-2 px-0.5 xs:px-1 sm:px-1">
               {/* 첫 번째 행 (3개) */}
               <div className="flex gap-1.5 xs:gap-2.5 sm:gap-2.5">
                 {pageMedals.slice(0, 3).map((medal, index) => (
                  <div 
                    key={medal.id} 
                    data-property-1={medal.type}
                    className={`w-5 xs:w-7 sm:w-7 h-8 xs:h-11 sm:h-11 inline-flex justify-center items-center gap-1.5 xs:gap-2.5 sm:gap-2.5 relative ${
                      medal.type === "None" 
                        ? "bg-gray-100/40 border-2 border-dashed border-gray-400/50 rounded-md hover:bg-gray-200/50 hover:border-gray-500/60 transition-all duration-200 cursor-pointer" 
                        : "cursor-pointer hover:opacity-80 transition-opacity"
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
               <div className="flex gap-1.5 xs:gap-2.5 sm:gap-2.5">
                 {pageMedals.slice(3, 6).map((medal, index) => (
                   <div 
                     key={medal.id} 
                     data-property-1={medal.type}
                     className={`w-5 xs:w-7 sm:w-7 h-8 xs:h-11 sm:h-11 inline-flex justify-center items-center gap-1.5 xs:gap-2.5 sm:gap-2.5 relative ${
                       medal.type === "None" 
                         ? "bg-gray-100/40 border-2 border-dashed border-gray-400/50 rounded-md hover:bg-gray-200/50 hover:border-gray-500/60 transition-all duration-200" 
                         : "cursor-pointer hover:opacity-80 transition-opacity"
                     }`}
                     onClick={(e) => handleMedalClick(medal, e)}
                     onMouseEnter={(e) => handleMouseEnter(pageIndex, index + 3, e)}
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
          className="flex items-center gap-[6px] xs:gap-[10px] sm:gap-[10px] h-[52px] px-1 rounded cursor-pointer hover:bg-gray-200/60 transition-all duration-200"
        >
          {/* 오른쪽 화살표 */}
          <div className="w-2.5 xs:w-3 sm:w-3 h-4.5 xs:h-5.5 sm:h-5.5 flex items-center justify-center pl-0.5 xs:pl-1 sm:pl-1">
            <img 
              src="/icons/episodes-after.svg?v=2" 
              alt="다음 보기" 
              className="w-2.5 xs:w-3 sm:w-3 h-4.5 xs:h-5.5 sm:h-5.5"
            />
          </div>
        </div>
      ) : (
        <div className="w-2.5 xs:w-3 sm:w-3 h-4.5 xs:h-5.5 sm:h-5.5 flex items-center justify-center pl-0.5 xs:pl-1 sm:pl-1 opacity-0">
          <img 
            src="/icons/episodes-after.svg?v=2" 
            alt="다음 보기" 
            className="w-2.5 xs:w-3 sm:w-3 h-4.5 xs:h-5.5 sm:h-5.5"
          />
        </div>
      )}
      
      {/* 오른쪽 세로선 */}
      {!hideSeparators && (
        <div 
          onClick={totalPages > 1 && currentPage !== totalPages - 1 ? (e) => handlePageChange(currentPage + 1, e) : undefined}
          className={`h-[52px] flex items-center ${totalPages > 1 && currentPage !== totalPages - 1 ? 'cursor-pointer' : ''}`}
        >
          <div className="w-0 h-[52px] border-l border-gray-300"></div>
        </div>
      )}
      

      {/* 툴팁 포털 */}
      {hoveredMedal && typeof window !== 'undefined' && createPortal(
        <div 
          className={`fixed px-2 py-1 bg-black text-white text-xs rounded z-50 pointer-events-none ${
            isMobile ? 'whitespace-normal' : 'whitespace-nowrap'
          }`}
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y
          }}
        >
          {(() => {
            const pageMedals = allPages[hoveredMedal.pageIndex];
            const medal = pageMedals[hoveredMedal.medalIndex];
            
            if (isMobile) {
              // 425px 미만: 연도 제거, 줄바꿈 추가
              return (
                <>
                  {medal.quarter}분기 {medal.week}주차<br />
                  {medal.rank}등
                </>
              );
            } else {
              // 기본: 연도 포함, 한 줄
              const shortYear = medal.year ? medal.year.toString().slice(-2) : '';
              return `${shortYear}년 ${medal.quarter}분기 ${medal.week}주차 ${medal.rank}등`;
            }
          })()}
        </div>,
        document.body
      )}
    </div>
  );
}
