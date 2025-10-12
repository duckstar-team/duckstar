'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const [currentPage, setCurrentPage] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hoveredMedal, setHoveredMedal] = useState<{pageIndex: number, medalIndex: number} | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const medalsPerPage = 6;
  const totalPages = Math.ceil(medals.length / medalsPerPage);
  
  // 모든 페이지의 메달 데이터를 미리 준비 (실제 메달만)
  const allPages = [];
  for (let i = 0; i < totalPages; i++) {
    const startIndex = i * medalsPerPage;
    const endIndex = startIndex + medalsPerPage;
    const pageMedals = medals.slice(startIndex, endIndex);
    
    // 실제 메달 데이터만 사용 (None 타입 추가하지 않음)
    allPages.push(pageMedals);
  }
  

  const handlePageChange = (page: number) => {
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

  return (
    <div className={`flex items-center gap-[6px] xs:gap-[10px] sm:gap-[10px] ${className}`}>
      {/* 왼쪽 세로선 */}
      {!hideSeparators && (
        <div className="w-0 h-[52px] border-l border-gray-300"></div>
      )}
      
      {/* 왼쪽 화살표 */}
      <div className="w-2.5 xs:w-3 sm:w-3 h-4.5 xs:h-5.5 sm:h-5.5 flex items-center justify-center pr-0.5 xs:pr-1 sm:pr-1">
        {totalPages > 1 && (
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 0}
            className={`w-2.5 xs:w-3 sm:w-3 h-4.5 xs:h-5.5 sm:h-5.5 flex items-center justify-center cursor-pointer ${
              currentPage === 0 ? 'opacity-0' : 'opacity-100 hover:opacity-70'
            }`}
          >
            <img 
              src="/icons/episodes-before.svg?v=2" 
              alt="이전 보기" 
              className="w-2.5 xs:w-3 sm:w-3 h-4.5 xs:h-5.5 sm:h-5.5"
            />
          </button>
        )}
      </div>
      
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
                    className={`w-5 xs:w-7 sm:w-7 h-8 xs:h-11 sm:h-11 inline-flex justify-center items-center gap-1.5 xs:gap-2.5 sm:gap-2.5 relative cursor-pointer ${
                      medal.type === "None" ? "bg-gray-100/40 border-2 border-dashed border-gray-400/50 rounded-md hover:bg-gray-200/50 hover:border-gray-500/60 transition-all duration-200" : ""
                    }`}
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
                     className={`w-5 xs:w-7 sm:w-7 h-8 xs:h-11 sm:h-11 inline-flex justify-center items-center gap-1.5 xs:gap-2.5 sm:gap-2.5 relative cursor-pointer ${
                       medal.type === "None" ? "bg-gray-100/40 border-2 border-dashed border-gray-400/50 rounded-md hover:bg-gray-200/50 hover:border-gray-500/60 transition-all duration-200" : ""
                     }`}
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
      
      {/* 오른쪽 화살표 */}
      <div className="w-2.5 xs:w-3 sm:w-3 h-4.5 xs:h-5.5 sm:h-5.5 flex items-center justify-center pl-0.5 xs:pl-1 sm:pl-1">
        {totalPages > 1 && (
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages - 1}
            className={`w-2.5 xs:w-3 sm:w-3 h-4.5 xs:h-5.5 sm:h-5.5 flex items-center justify-center cursor-pointer ${
              currentPage === totalPages - 1 ? 'opacity-0' : 'opacity-100 hover:opacity-70'
            }`}
          >
            <img 
              src="/icons/episodes-after.svg?v=2" 
              alt="다음 보기" 
              className="w-2.5 xs:w-3 sm:w-3 h-4.5 xs:h-5.5 sm:h-5.5"
            />
          </button>
        )}
      </div>
      
      {/* 오른쪽 세로선 */}
      {!hideSeparators && (
        <div className="w-0 h-[52px] border-l border-gray-300"></div>
      )}
      

      {/* 툴팁 포털 */}
      {hoveredMedal && typeof window !== 'undefined' && createPortal(
        <div 
          className="fixed px-2 py-1 bg-black text-white text-xs rounded whitespace-nowrap z-50 pointer-events-none"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y
          }}
        >
          {(() => {
            const pageMedals = allPages[hoveredMedal.pageIndex];
            const medal = pageMedals[hoveredMedal.medalIndex];
            const shortYear = medal.year ? medal.year.toString().slice(-2) : '';
            return `${shortYear}년 ${medal.quarter}분기 ${medal.week}주차 ${medal.rank}등`;
          })()}
        </div>,
        document.body
      )}
    </div>
  );
}
