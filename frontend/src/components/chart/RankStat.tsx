'use client';

import { useRouter } from 'next/navigation';
import RankHistory from './RankHistory';
import Top10Achievement from './Top10Achievement';
import WeekRatingStats from './WeekRatingStats';

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
  className = ""
}: RankStatProps) {
  const router = useRouter();

  const handleAnimeInfoClick = () => {
    if (animeId) {
      router.push(`/animes/${animeId}`);
    }
  };
  return (
    <div className={`w-[768px] h-50 px-8 py-4 bg-black inline-flex justify-center items-center gap-10 ${className}`}>
      <div className="size- py-2.5 rounded-bl-xl rounded-br-xl flex justify-start items-start gap-7">
        {/* 데뷔 순위 */}
        <div data-property-1="Debut" className="w-[105px] h-32 inline-flex flex-col justify-start items-center gap-1.5">
          <div className="self-stretch h-7 py-px inline-flex justify-center items-center gap-2">
            <img 
              src="/icons/debut-icon.svg" 
              alt="데뷔 순위" 
              className="size-7"
            />
            <div className="justify-start text-white text-lg font-normal font-['Pretendard'] leading-relaxed">데뷔 순위</div>
          </div>
          <div className="self-stretch flex-1 px-3.5 pt-2.5 pb-3.5 rounded-lg outline outline-1 outline-offset-[-1px] outline-rose-600 flex flex-col justify-center items-center gap-3">
            <div className="size- flex flex-col justify-center items-center gap-1.5">
              <div className="text-center justify-start">
                <span className="text-rose-600 text-xl font-semibold font-['Pretendard']"># </span>
                <span className="text-rose-600 text-4xl font-semibold font-['Pretendard']">{debutRank}</span>
              </div>
              <div className="size- border-b border-white inline-flex justify-center items-center gap-2.5">
                <div className="w-16 text-center justify-start text-white text-base font-light font-['Pretendard']">{formatDate(debutDate)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* PEAK */}
        <div data-property-1="Peak" className="w-[105px] h-32 inline-flex flex-col justify-start items-center gap-1.5">
          <div className="self-stretch h-7 py-px inline-flex justify-center items-center gap-2">
            <img 
              src="/icons/peak-icon.svg" 
              alt="PEAK" 
              className="size-7"
            />
            <div className="justify-start text-white text-lg font-normal font-['Pretendard'] leading-relaxed">PEAK</div>
          </div>
          <div className="self-stretch flex-1 px-3.5 pt-2.5 pb-3.5 rounded-lg outline outline-1 outline-offset-[-1px] outline-rose-600 flex flex-col justify-center items-center gap-3">
            <div className="size- flex flex-col justify-center items-center gap-1.5">
              <div className="text-center justify-start">
                <span className="text-rose-600 text-xl font-semibold font-['Pretendard']"># </span>
                <span className="text-rose-600 text-4xl font-semibold font-['Pretendard']">{peakRank}</span>
              </div>
              <div className="size- border-b border-white inline-flex justify-center items-center gap-2.5">
                <div className="w-16 text-center justify-start text-white text-base font-light font-['Pretendard']">{formatDate(peakDate)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* TOP10 달성 */}
        <div className="h-32 inline-flex flex-col justify-between items-end gap-[9.5px]">
          <div className="size- flex flex-col justify-start items-start gap-2">
            <div className="w-32 inline-flex justify-center items-center gap-2">
              <img 
                src="/icons/top10-icon.svg" 
                alt="TOP10" 
                className="size-7"
              />
              <div className="justify-start">
                <span className="text-white text-lg font-normal font-['Pretendard']">TO</span>
                <span className="text-white text-lg font-normal font-['Pretendard'] tracking-wide">P10</span>
                <span className="text-white text-lg font-normal font-['Pretendard']"> 달성</span>
              </div>
            </div>
            <div className="w-32 pr-2.5 inline-flex justify-end items-end gap-1.5">
              <div className="text-right justify-start text-white text-4xl font-semibold font-['Pretendard']">{top10Weeks}</div>
              <div className="w-4 h-12 pb-1.5 inline-flex flex-col justify-end items-end gap-3">
                <div className="self-stretch h-5 text-right justify-start text-white text-lg font-semibold font-['Pretendard']">주</div>
              </div>
            </div>
          </div>
          <div 
            className={`w-28 h-8 p-2.5 rounded-md outline outline-1 outline-offset-[-1px] outline-white/30 inline-flex justify-end items-center gap-2.5 ${
              animeId ? 'cursor-pointer hover:bg-white/10 hover:outline-white/50 transition-all duration-200' : 'cursor-default'
            }`}
            onClick={handleAnimeInfoClick}
          >
            <div className="size- inline-flex flex-col justify-start items-center gap-[3px]">
              <div className="size- inline-flex justify-end items-center gap-2.5 overflow-hidden">
                <div className="justify-start text-white text-base font-normal font-['Pretendard'] leading-normal">애니 정보</div>
                <img 
                  src="/icons/navigate-anime-home.svg" 
                  alt="애니 정보" 
                  className="size-5"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 주차별 별점 통계 */}
      <WeekRatingStats 
        week={week}
        averageRating={averageRating}
        participantCount={participantCount}
        distribution={distribution}
      />
    </div>
  );
}
