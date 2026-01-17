'use client';

import { useRouter } from 'next/navigation';
import HomeRankInfo from './HomeRankInfo';
import HomeRankInfoMobile from './HomeRankInfoMobile';
import { DuckstarRankPreviewDto, WeekDto } from '@/types/dtos';
import { MedalType } from '@/types/enums';

interface HomeChartProps {
  duckstarRankPreviews: DuckstarRankPreviewDto[];
  selectedWeek?: WeekDto | null;
  className?: string;
}

// RankDiff 타입 변환 헬퍼 함수
function getRankDiffType(
  rankDiff: number,
  consecutiveWeeks: number,
  isAnilab: boolean = false
):
  | 'up-greater-equal-than-5'
  | 'up-less-than-5'
  | 'down-less-than-5'
  | 'down-greater-equal-than-5'
  | 'same-rank'
  | 'new'
  | 'Zero' {
  // rankDiff가 0이 아니면 up/down 우선 처리
  if (rankDiff > 0) {
    return rankDiff >= 5 ? 'up-greater-equal-than-5' : 'up-less-than-5';
  }
  if (rankDiff < 0) {
    return rankDiff <= -5 ? 'down-greater-equal-than-5' : 'down-less-than-5';
  }

  // 그 외의 경우 Zero, NEW, consecutive 판단

  // consecutiveWeeks가 2 이상일 때 same-rank
  if (consecutiveWeeks >= 2) {
    return 'same-rank';
  }

  // consecutiveWeeks가 1일 때 NEW (anilab이 아닌 경우에만)
  if (consecutiveWeeks === 1 && !isAnilab) {
    return 'new';
  }

  // anilab이거나 consecutiveWeeks가 0일 때 Zero
  return 'Zero';
}

// Medal 타입 변환 헬퍼 함수
function getMedalType(rank: number): MedalType {
  if (rank === 1) return MedalType.Gold;
  if (rank === 2) return MedalType.Silver;
  if (rank === 3) return MedalType.Bronze;
  return MedalType.None;
}

export default function HomeChart({
  duckstarRankPreviews,
  selectedWeek,
  className = '',
}: HomeChartProps) {
  const router = useRouter();

  const handleScheduleClick = () => {
    router.push('/search');
  };

  const handleMoreClick = () => {
    // 현재 선택된 주차 정보를 사용하여 차트 페이지로 이동
    if (selectedWeek) {
      router.push(
        `/chart/${selectedWeek.year}/${selectedWeek.quarter}/${selectedWeek.week}`
      );
    } else {
      router.push('/chart');
    }
  };

  return (
    <>
      <style jsx>{`
        @keyframes bounce-slow {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-15px);
          }
        }
      `}</style>
      <div
        className={`w-full max-w-[750px] rounded-xl border border-[#D1D1D6] bg-white xl:w-[750px] dark:border-none dark:bg-zinc-800 ${className}`}
      >
        {/* 차트 컨텐츠 */}
        <div className="relative p-5">
          {duckstarRankPreviews.length === 0 ? (
            // 빈 상태 UI
            <div className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 text-6xl text-gray-400">📊</div>
              <h3 className="mb-2 text-lg font-semibold text-gray-600">
                순위 데이터가 없습니다
              </h3>
              <p className="text-center text-sm text-gray-500">
                해당 주차의 Duckstar 순위 데이터가
                <br />
                아직 준비되지 않았습니다.
              </p>
            </div>
          ) : (
            <>
              <div className="w-full space-y-4">
                {duckstarRankPreviews.map((duckstarRankPreview, index) => {
                  // API 응답 구조: DuckstarRankPreviewDto는 votePercent, averageRating, voterCount와 rankPreviewDto를 포함
                  const {
                    votePercent,
                    averageRating,
                    voterCount,
                    rankPreviewDto,
                  } = duckstarRankPreview;
                  const {
                    rank,
                    rankDiff,
                    consecutiveWeeksAtSameRank,
                    title,
                    subTitle,
                    mainThumbnailUrl,
                    type,
                    contentId,
                  } = rankPreviewDto;

                  // null/undefined 체크
                  const safeRankDiff = rankDiff ?? 0;
                  const safeConsecutiveWeeks = consecutiveWeeksAtSameRank ?? 0;
                  const safeVotePercent = votePercent ?? 0;
                  const safeAverageRating = averageRating ?? 0;
                  const safeVoterCount = voterCount ?? 0;

                  return (
                    <div key={`rank-${contentId || index}`}>
                      {/* 데스크톱용 (1024px 이상) */}
                      <div className="hidden xl:block">
                        <HomeRankInfo
                          rank={rank}
                          rankDiff={getRankDiffType(
                            safeRankDiff,
                            safeConsecutiveWeeks,
                            false
                          )}
                          rankDiffValue={
                            getRankDiffType(
                              safeRankDiff,
                              safeConsecutiveWeeks,
                              false
                            ) === 'same-rank'
                              ? safeConsecutiveWeeks.toString()
                              : safeRankDiff.toString()
                          }
                          title={title}
                          studio={subTitle}
                          image={mainThumbnailUrl}
                          percentage={safeVotePercent.toFixed(2)}
                          averageRating={safeAverageRating}
                          voterCount={safeVoterCount} // 백엔드에서 받은 참여자 수
                          medal={getMedalType(rank)}
                          type={type}
                          contentId={contentId}
                        />
                      </div>

                      {/* 모바일용 (1024px 미만) */}
                      <div className="xl:hidden">
                        <HomeRankInfoMobile
                          rank={rank}
                          rankDiff={getRankDiffType(
                            safeRankDiff,
                            safeConsecutiveWeeks,
                            false
                          )}
                          rankDiffValue={
                            getRankDiffType(
                              safeRankDiff,
                              safeConsecutiveWeeks,
                              false
                            ) === 'same-rank'
                              ? safeConsecutiveWeeks.toString()
                              : safeRankDiff.toString()
                          }
                          title={title}
                          studio={subTitle}
                          image={mainThumbnailUrl}
                          percentage={safeVotePercent.toFixed(2)}
                          averageRating={safeAverageRating}
                          voterCount={safeVoterCount} // 백엔드에서 받은 참여자 수
                          medal={getMedalType(rank)}
                          type={type}
                          contentId={contentId}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 준비되지 않음 오버레이 - 제거됨 */}
              {false && (
                <div className="absolute inset-0 flex flex-col items-center justify-start rounded-xl bg-gradient-to-b from-white/90 to-white/70 pt-20 backdrop-blur-[2px]">
                  <div
                    className="mb-4 text-6xl opacity-100"
                    style={{
                      color: '#990033',
                      animation: 'bounce-slow 1.5s ease-in-out infinite',
                    }}
                  >
                    🗳️
                  </div>
                  <h3
                    className="mb-2 text-xl font-bold"
                    style={{ color: '#990033' }}
                  >
                    4분기 첫 투표 개시!
                  </h3>
                  <p className="mb-4 text-center text-sm text-gray-600">
                    10/10 (금) 부터
                    <br />
                    덕스타 차트 제공이 시작됩니다. <br />
                  </p>
                  <div
                    className="cursor-pointer rounded-lg px-4 py-2 transition-opacity hover:opacity-80"
                    style={{
                      backgroundColor: '#f0e6e9',
                      border: '1px solid #d4a5b0',
                    }}
                    onClick={handleScheduleClick}
                  >
                    <p
                      className="text-xs font-medium"
                      style={{ color: '#990033' }}
                    >
                      시간표 보러 가기
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* 더보기 버튼 */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleMoreClick}
              className="cursor-pointer text-sm font-normal text-zinc-500 transition-colors duration-200 hover:text-zinc-400 sm:text-base md:text-lg"
            >
              더보기
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
