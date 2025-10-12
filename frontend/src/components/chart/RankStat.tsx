'use client';

import { useRouter } from 'next/navigation';
import RankHistory from './RankHistory';
import Top10Achievement from './Top10Achievement';
import WeekRatingStats from './WeekRatingStats';
import MedalSection from './MedalSection';

// 날짜 형식 변환 함수 (YYYY-MM-DD -> YY.MM.DD)
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const year = date.getFullYear().toString().slice(-2); // 마지막 2자리
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}.${month}.${day}`;
  } catch (error) {
    return dateString; // 변환 실패 시 원본 반환
  }
}

interface RankStatProps {
  // 데뷔 순위 정보
  debutRank: number;
  debutDate: string;
  
  // PEAK 정보
  peakRank: number;
  peakDate: string;
  
  // TOP10 달성 정보
  top10Weeks: number;
  
  // 주차별 별점 통계
  week: string;
  averageRating: number;
  participantCount: number;
  distribution: number[];
  
  // 애니메이션 ID (상세화면 이동용)
  animeId?: number;
  
  // 메달 정보 (모바일용)
  medals?: any[];
  isExpanded?: boolean;
  
  className?: string;
}

export default function RankStat({
  debutRank,
  debutDate,
  peakRank,
  peakDate,
  top10Weeks,
  week,
  averageRating,
  participantCount,
  distribution,
  animeId,
  medals = [],
  isExpanded = false,
  className = ""
}: RankStatProps) {
  const router = useRouter();

  const handleAnimeInfoClick = () => {
    if (animeId) {
      router.push(`/animes/${animeId}`);
    }
  };
  return (
    <div className={`w-full max-w-[600px] md:max-w-[768px] px-2 xs:px-4 sm:px-8 py-4 bg-black flex flex-col md:flex-row justify-center items-center gap-2 xs:gap-4 md:gap-10 ${className}`}>
      {/* 아랫줄: 별분산과 평균별점 + 메달 섹션 (768px 미만에서만 별도 줄) */}
      <div className="w-full md:hidden flex flex-nowrap items-center justify-between gap-1 xs:gap-2 sm:gap-4">
        <WeekRatingStats 
          week={week}
          averageRating={averageRating}
          participantCount={participantCount}
          distribution={distribution}
        />
        {/* 모바일용 메달 섹션 */}
        {medals && medals.length > 0 && (
          <div className="bg-[#212529] rounded-lg p-0.5 xs:p-1 sm:p-2 min-w-0 flex-shrink-0">
            <MedalSection 
              medals={medals} 
              isExpanded={isExpanded}
              hideMedalsOnMobile={false}
              isMobileVersion={true}
            />
          </div>
        )}
      </div>
      
      {/* 윗줄: 데뷔순위, PEAK, TOP10 달성 */}
      <div className="w-full py-2.5 rounded-bl-xl rounded-br-xl flex flex-nowrap justify-center items-start gap-1 xs:gap-2 sm:gap-4 md:gap-7 min-h-fit">
        {/* 데뷔 순위 */}
        <div data-property-1="Debut" className="w-full min-w-[60px] xs:min-w-[80px] sm:min-w-[80px] max-w-[80px] xs:max-w-[105px] sm:max-w-[105px] h-24 xs:h-32 sm:h-32 inline-flex flex-col justify-start items-center gap-1 xs:gap-1.5 sm:gap-1.5">
          <div className="self-stretch h-5 xs:h-7 sm:h-7 py-px inline-flex justify-center items-center gap-1 xs:gap-2 sm:gap-2">
            <img 
              src="/icons/debut-icon.svg" 
              alt="데뷔 순위" 
              className="size-5 xs:size-7 sm:size-7"
            />
            <div className="justify-start text-white text-sm xs:text-lg sm:text-lg font-normal font-['Pretendard'] leading-relaxed">데뷔 순위</div>
          </div>
          <div className="self-stretch flex-1 px-2 xs:px-3.5 sm:px-3.5 pt-1.5 xs:pt-2.5 sm:pt-2.5 pb-1.5 xs:pb-3.5 sm:pb-3.5 rounded-lg outline outline-1 outline-offset-[-1px] outline-rose-600 flex flex-col justify-center items-center gap-2 xs:gap-3 sm:gap-3">
            <div className="size- flex flex-col justify-center items-center gap-1 xs:gap-1.5 sm:gap-1.5">
              <div className="text-center justify-start">
                <span className="text-rose-600 text-lg xs:text-xl sm:text-xl font-semibold font-['Pretendard']"># </span>
                <span className="text-rose-600 text-2xl xs:text-4xl sm:text-4xl font-semibold font-['Pretendard']">{debutRank}</span>
              </div>
              <div className="size- border-b border-white inline-flex justify-center items-center gap-1.5 xs:gap-2.5 sm:gap-2.5">
                <div className="w-12 xs:w-16 sm:w-16 text-center justify-start text-white text-sm xs:text-base sm:text-base font-light font-['Pretendard']">{formatDate(debutDate)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* PEAK */}
        <div data-property-1="Peak" className="w-full min-w-[60px] xs:min-w-[80px] sm:min-w-[80px] max-w-[80px] xs:max-w-[105px] sm:max-w-[105px] h-24 xs:h-32 sm:h-32 inline-flex flex-col justify-start items-center gap-1 xs:gap-1.5 sm:gap-1.5">
          <div className="self-stretch h-5 xs:h-7 sm:h-7 py-px inline-flex justify-center items-center gap-1 xs:gap-2 sm:gap-2">
            <img 
              src="/icons/peak-icon.svg" 
              alt="PEAK" 
              className="size-5 xs:size-7 sm:size-7"
            />
            <div className="justify-start text-white text-sm xs:text-lg sm:text-lg font-normal font-['Pretendard'] leading-relaxed">PEAK</div>
          </div>
          <div className="self-stretch flex-1 px-2 xs:px-3.5 sm:px-3.5 pt-1.5 xs:pt-2.5 sm:pt-2.5 pb-1.5 xs:pb-3.5 sm:pb-3.5 rounded-lg outline outline-1 outline-offset-[-1px] outline-rose-600 flex flex-col justify-center items-center gap-2 xs:gap-3 sm:gap-3">
            <div className="size- flex flex-col justify-center items-center gap-1 xs:gap-1.5 sm:gap-1.5">
              <div className="text-center justify-start">
                <span className="text-rose-600 text-lg xs:text-xl sm:text-xl font-semibold font-['Pretendard']"># </span>
                <span className="text-rose-600 text-2xl xs:text-4xl sm:text-4xl font-semibold font-['Pretendard']">{peakRank}</span>
              </div>
              <div className="size- border-b border-white inline-flex justify-center items-center gap-1.5 xs:gap-2.5 sm:gap-2.5">
                <div className="w-12 xs:w-16 sm:w-16 text-center justify-start text-white text-sm xs:text-base sm:text-base font-light font-['Pretendard']">{formatDate(peakDate)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* TOP10 달성 */}
        <div className="w-full min-w-[60px] xs:min-w-[80px] sm:min-w-[80px] max-w-[100px] xs:max-w-[130px] sm:max-w-[130px] h-24 xs:h-32 sm:h-32 inline-flex flex-col justify-between items-end gap-[6px] xs:gap-[9.5px] sm:gap-[9.5px]">
          <div className="size- flex flex-col justify-start items-start gap-1 xs:gap-2 sm:gap-2">
            <div className="w-24 xs:w-32 sm:w-32 inline-flex justify-center items-center gap-1 xs:gap-2 sm:gap-2">
              <img 
                src="/icons/top10-icon.svg" 
                alt="TOP10" 
                className="size-5 xs:size-7 sm:size-7"
              />
              <div className="justify-start">
                <span className="text-white text-sm xs:text-lg sm:text-lg font-normal font-['Pretendard']">TO</span>
                <span className="text-white text-sm xs:text-lg sm:text-lg font-normal font-['Pretendard'] tracking-wide">P10</span>
                <span className="text-white text-sm xs:text-lg sm:text-lg font-normal font-['Pretendard']"> 달성</span>
              </div>
            </div>
            <div className="w-24 xs:w-32 sm:w-32 pr-1.5 xs:pr-2.5 sm:pr-2.5 inline-flex justify-end items-end gap-1 xs:gap-1.5 sm:gap-1.5">
              <div className="text-right justify-start text-white text-2xl xs:text-4xl sm:text-4xl font-semibold font-['Pretendard']">{top10Weeks}</div>
              <div className="w-3 xs:w-4 sm:w-4 h-8 xs:h-12 sm:h-12 pb-1 xs:pb-1.5 sm:pb-1.5 inline-flex flex-col justify-end items-end gap-2 xs:gap-3 sm:gap-3">
                <div className="self-stretch h-4 xs:h-5 sm:h-5 text-right justify-start text-white text-sm xs:text-lg sm:text-lg font-semibold font-['Pretendard']">주</div>
              </div>
            </div>
          </div>
          <div 
            className={`w-20 xs:w-28 sm:w-28 h-6 xs:h-8 sm:h-8 p-1.5 xs:p-2.5 sm:p-2.5 rounded-md outline outline-1 outline-offset-[-1px] outline-white/30 inline-flex justify-end items-center gap-1.5 xs:gap-2.5 sm:gap-2.5 ${
              animeId ? 'cursor-pointer hover:bg-white/10 hover:outline-white/50 transition-all duration-200' : 'cursor-default'
            }`}
            onClick={handleAnimeInfoClick}
          >
            <div className="size- inline-flex flex-col justify-start items-center gap-[2px] xs:gap-[3px] sm:gap-[3px]">
              <div className="size- inline-flex justify-end items-center gap-1.5 xs:gap-2.5 sm:gap-2.5 overflow-hidden">
                <div className="justify-start text-white text-xs xs:text-base sm:text-base font-normal font-['Pretendard'] leading-normal">애니 정보</div>
                <img 
                  src="/icons/navigate-anime-home.svg" 
                  alt="애니 정보" 
                  className="size-4 xs:size-5 sm:size-5"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 데스크톱: 주차별 별점 통계 (기존 위치) */}
      <div className="hidden md:flex">
        <WeekRatingStats 
          week={week}
          averageRating={averageRating}
          participantCount={participantCount}
          distribution={distribution}
        />
      </div>
    </div>
  );
}
