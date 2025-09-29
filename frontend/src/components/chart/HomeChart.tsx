'use client';

import { useRouter } from 'next/navigation';
import HomeRankInfo from './HomeRankInfo';
import { DuckstarRankPreviewDto } from '@/types/api';

interface HomeChartProps {
  duckstarRankPreviews: DuckstarRankPreviewDto[];
  isPrepared?: boolean;
  className?: string;
}

// RankDiff 타입 변환 헬퍼 함수
function getRankDiffType(rankDiff: number, consecutiveWeeks: number): "up-greater-equal-than-5" | "up-less-than-5" | "down-less-than-5" | "down-greater-equal-than-5" | "same-rank" | "new" | "Zero" {
  // consecutiveWeeks가 2 이상일 때만 same-rank 우선 적용
  if (consecutiveWeeks >= 2) {
    return "same-rank";
  }
  
  // consecutiveWeeks가 0이고 rankDiff가 0일 때 NEW
  if (consecutiveWeeks === 0 && rankDiff === 0) {
    return "new";
  }
  
  // rankDiff에 따른 처리
  if (rankDiff > 0) {
    return rankDiff >= 5 ? "up-greater-equal-than-5" : "up-less-than-5";
  }
  if (rankDiff < 0) {
    return rankDiff <= -5 ? "down-greater-equal-than-5" : "down-less-than-5";
  }
  if (rankDiff === 0) return "same-rank";
  return "Zero";
}

// Medal 타입 변환 헬퍼 함수
function getMedalType(rank: number): "Gold" | "Silver" | "Bronze" | "None" {
  if (rank === 1) return "Gold";
  if (rank === 2) return "Silver";
  if (rank === 3) return "Bronze";
  return "None";
}

export default function HomeChart({ duckstarRankPreviews, isPrepared = true, className = "" }: HomeChartProps) {
  const router = useRouter();

  const handleScheduleClick = () => {
    router.push('/search');
  };

  return (
    <>
      <style jsx>{`
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-15px);
          }
        }
      `}</style>
    <div className={`w-[750px] bg-white rounded-xl border border-[#D1D1D6] ${className}`}>
      {/* 차트 컨텐츠 */}
      <div className="p-5 relative">
        {duckstarRankPreviews.length === 0 ? (
          // 빈 상태 UI
          <div className="flex flex-col items-center justify-center py-16">
            <div className="text-gray-400 text-6xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">순위 데이터가 없습니다</h3>
            <p className="text-sm text-gray-500 text-center">
              해당 주차의 Duckstar 순위 데이터가<br />
              아직 준비되지 않았습니다.
            </p>
          </div>
        ) : (
          <>
            <div className={`space-y-4 ${!isPrepared ? 'pointer-events-none' : ''}`}>
              {duckstarRankPreviews.map((duckstarRankPreview, index) => {
            // API 응답 구조: DuckstarRankPreviewDto는 votePercent와 rankPreviewDto를 포함
            const { votePercent, rankPreviewDto } = duckstarRankPreview;
            const { rank, rankDiff, consecutiveWeeksAtSameRank, title, subTitle, mainThumbnailUrl, type, contentId } = rankPreviewDto;
            
            // null/undefined 체크
            const safeRankDiff = rankDiff ?? 0;
            const safeConsecutiveWeeks = consecutiveWeeksAtSameRank ?? 0;
            const safeVotePercent = votePercent ?? 0;
            
            return (
              <HomeRankInfo 
                key={contentId || `rank-${index}`}
                rank={rank}
                rankDiff={getRankDiffType(safeRankDiff, safeConsecutiveWeeks)}
                rankDiffValue={getRankDiffType(safeRankDiff, safeConsecutiveWeeks) === "same-rank" ? safeConsecutiveWeeks.toString() : safeRankDiff.toString()}
                title={title}
                studio={subTitle}
                image={mainThumbnailUrl}
                percentage={isPrepared ? safeVotePercent.toFixed(2) : ""}
                medal={getMedalType(rank)}
                type={type}
                contentId={contentId}
                isPrepared={isPrepared}
              />
            );
          })}
            </div>
            
            {/* 준비되지 않음 오버레이 */}
            {!isPrepared && (
              <div className="absolute inset-0 flex flex-col items-center justify-start pt-20 bg-gradient-to-b from-white/90 to-white/70 backdrop-blur-[2px] rounded-xl">
                <div 
                  className="text-6xl mb-4 opacity-100" 
                  style={{ 
                    color: '#990033',
                    animation: 'bounce-slow 1.5s ease-in-out infinite'
                  }}
                >
                  🗳️
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: '#990033' }}>4분기 첫 투표 개시!</h3>
                <p className="text-sm text-gray-600 text-center mb-4">
                  이번 주 일요일부터<br />
                  덕스타 차트 제공이 시작됩니다. <br />
                </p>
                <div 
                  className="rounded-lg px-4 py-2 cursor-pointer hover:opacity-80 transition-opacity" 
                  style={{ backgroundColor: '#f0e6e9', border: '1px solid #d4a5b0' }}
                  onClick={handleScheduleClick}
                >
                  <p className="text-xs font-medium" style={{ color: '#990033' }}>
                    시간표 보러 가기
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
    </>
  );
}
