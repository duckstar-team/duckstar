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
    <div className={`inline-flex flex-col items-end gap-1 ${className}`}>
      {/* 주차 정보 */}
      <div className="text-right text-white text-lg font-normal font-['Pretendard']">{week}</div>
      
      {/* 별점 통계 */}
      <div className="inline-flex items-start gap-4">
        {/* 별점 분산 차트 */}
        <div className="w-32 relative mt-[44px]" style={{ height: '51.63px' }}>
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
        
        {/* 평균 별점 및 참여자 수 */}
        <div className="inline-flex flex-col items-end">
          <div className="inline-flex items-center gap-2">
            <div className="size-8 relative">
              <img 
                src="/icons/star/star-Selected.svg" 
                alt="별" 
                className="w-8 h-8"
              />
            </div>
            <div className="text-center">
              <span className="text-white text-4xl font-semibold font-['Pretendard'] leading-loose tracking-widest">{integerPart}</span>
              <span className="text-white text-2xl font-semibold font-['Pretendard'] leading-loose tracking-widest">{decimalString}</span>
            </div>
          </div>
          <div className="text-right text-gray-400 text-lg font-medium font-['Pretendard'] leading-loose -mt-[14px]">{participantCount}명 참여</div>
        </div>
      </div>
    </div>
  );
}
