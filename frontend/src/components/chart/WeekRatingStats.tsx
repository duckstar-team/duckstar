'use client';

import StarDistributionChart from './StarDistributionChart';

interface WeekRatingStatsProps {
  week: string; // "25년 3분기 1주차"
  averageRating: number; // 4.78
  participantCount: number; // 136
  distribution: number[]; // 별점 분포 배열 (10개 또는 5개 요소)
  className?: string;
}

export default function WeekRatingStats({
  week,
  averageRating,
  participantCount,
  distribution,
  className = ""
}: WeekRatingStatsProps) {
  // 4분기 1-2주차인지 확인 (1점 단위 모드)
  const isIntegerMode = week.includes('4분기 1주차') || week.includes('4분기 2주차');
  
  // 평균 별점을 정수 부분과 소수 부분으로 분리 (소수점 첫째 자리)
  const integerPart = Math.floor(averageRating);
  const decimalPart = Math.floor((averageRating - integerPart) * 10) / 10;
  const decimalString = decimalPart.toFixed(1).substring(1); // ".7" 형태

  return (
    <div className={`inline-flex flex-col items-center sm:items-end gap-1 min-w-0 flex-shrink-0 ${className}`}>
      {/* 주차 정보 */}
      <div className="text-left sm:text-right text-white text-sm xs:text-lg sm:text-lg font-normal font-['Pretendard'] ml-2 sm:ml-0">
        {week.includes('4분기 1주차') || week.includes('4분기 2주차') ? (
          <div className="flex sm:hidden items-start gap-4">
            <div className="flex-shrink-0">
              <div>{week.split(' ').slice(0, 2).join(' ')}</div>
              <div>{week.split(' ').slice(2).join(' ')}</div>
            </div>
            <div className="inline-flex flex-col items-end gap-0.5 -mt-3">
              <div className="inline-flex items-center gap-1.5">
                <div className="size-6 relative">
                  <img 
                    src="/icons/star/star-Selected.svg" 
                    alt="별" 
                    className="w-6 h-6"
                  />
                </div>
                <div className="text-center">
                  <span className="text-white text-2xl font-semibold font-['Pretendard'] leading-loose tracking-widest">{integerPart}</span>
                  <span className="text-white text-xl font-semibold font-['Pretendard'] leading-loose tracking-widest">{decimalString}</span>
                </div>
              </div>
              <div className="text-right text-gray-400 text-sm font-medium font-['Pretendard'] leading-loose -mt-3 sm:mt-0">{participantCount}명 참여</div>
            </div>
          </div>
        ) : (
          <div className="flex sm:hidden items-start gap-2">
            <div className="flex-shrink-0">
              <div>{week}</div>
            </div>
            <div className="inline-flex flex-col items-end gap-0.5">
              <div className="inline-flex items-center gap-1.5">
                <div className="size-6 relative">
                  <img 
                    src="/icons/star/star-Selected.svg" 
                    alt="별" 
                    className="w-6 h-6"
                  />
                </div>
                <div className="text-center">
                  <span className="text-white text-2xl font-semibold font-['Pretendard'] leading-loose tracking-widest">{integerPart}</span>
                  <span className="text-white text-xl font-semibold font-['Pretendard'] leading-loose tracking-widest">{decimalString}</span>
                </div>
              </div>
              <div className=" text-right text-gray-400 text-sm font-medium font-['Pretendard'] leading-loose">{participantCount}명 참여</div>
            </div>
          </div>
        )}
        <div className="hidden sm:block">{week}</div>
      </div>
      
      {/* 별점 통계 */}
      <div className="inline-flex items-start gap-[2px] xs:gap-4 sm:gap-4">
        {/* 별점 분산 차트 */}
        <div className="w-24 xs:w-32 sm:w-32 relative mt-[3px] xs:mt-[32px] sm:mt-[44px]" style={{ height: '38.72px' }}>
          <StarDistributionChart
            distribution={distribution}
            totalVoters={participantCount}
            width={128}
            height={51.63}
            barWidth={10}
            barSpacing={2}
            maxBarColor="#F87171" // rose-400
            normalBarColor="rgba(248, 113, 113, 0.7)" // rose-400/70
            isIntegerMode={isIntegerMode}
            className="absolute inset-0"
          />
        </div>
        
        {/* 평균 별점 및 참여자 수 - 640px 이상에서만 표시 */}
        <div className="hidden sm:inline-flex flex-col items-end">
          <div className="inline-flex items-center gap-1.5 xs:gap-2 sm:gap-2">
            <div className="size-6 xs:size-8 sm:size-8 relative">
              <img 
                src="/icons/star/star-Selected.svg" 
                alt="별" 
                className="w-6 h-6 xs:w-8 xs:h-8 sm:w-8 sm:h-8"
              />
            </div>
            <div className="text-center">
              <span className="text-white text-2xl xs:text-4xl sm:text-4xl font-semibold font-['Pretendard'] leading-loose tracking-widest">{integerPart}</span>
              <span className="text-white text-xl xs:text-2xl sm:text-2xl font-semibold font-['Pretendard'] leading-loose tracking-widest">{decimalString}</span>
            </div>
          </div>
          <div className="text-right text-gray-400 text-sm xs:text-lg sm:text-lg font-medium font-['Pretendard'] leading-loose -mt-[10px] xs:-mt-[14px] sm:-mt-[14px]">{participantCount}명 참여</div>
        </div>
      </div>
    </div>
  );
}
