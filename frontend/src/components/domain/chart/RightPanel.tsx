'use client';

import { useRouter } from 'next/navigation';
import { AbroadRankListSkeleton } from '@/components/skeletons';
import AbroadRankInfo from './AbroadRankInfo';
import { RankPreviewDto, WeekDto } from '@/types/dtos';

interface RightPanelProps {
  rightPanelData: RankPreviewDto[];
  selectedRightTab: 'anilab' | 'anime-corner';
  rightPanelLoading: boolean;
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

export default function RightPanel({
  rightPanelData,
  selectedRightTab,
  rightPanelLoading,
  selectedWeek,
  className = '',
}: RightPanelProps) {
  const router = useRouter();

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
    <div
      className={`w-full max-w-[750px] rounded-xl border border-[#D1D1D6] bg-white xl:w-[373px] dark:border-zinc-800 dark:bg-zinc-800 ${className}`}
    >
      <div className="relative p-5">
        {rightPanelLoading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-rose-800"></div>
          </div>
        ) : rightPanelData.length > 0 ? (
          <>
            {/* 정보 아이콘 - 절대 위치로 모서리에 배치 */}
            <div className="absolute top-2 right-2 z-10">
              <div className="group relative">
                <a
                  href={
                    selectedRightTab === 'anilab'
                      ? 'https://anilabb.com/rate/anime'
                      : 'https://animecorner.me/category/anime-corner/rankings/anime-of-the-week/'
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block h-4 w-4 flex-shrink-0 cursor-pointer"
                >
                  <img
                    src="/icons/info.svg"
                    alt="정보"
                    className="h-full w-full object-contain"
                  />
                </a>
                {/* 툴팁 */}
                <div className="pointer-events-none absolute top-full -right-10 z-[9999] -mt-10 rounded-md bg-gray-800 px-2 py-1 text-right text-xs whitespace-pre text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  {selectedRightTab === 'anilab'
                    ? 'Anilab은 일본의 투표 사이트입니다.\n(결과 공개: KST 일 22시) '
                    : 'Anime Corner은 미국의 투표 사이트입니다.\n(결과 공개: KST 금 22시) '}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {rightPanelData.map((rankPreview, index) => {
                // null/undefined 체크
                const safeRankDiff = rankPreview.rankDiff ?? 0;
                const safeConsecutiveWeeks =
                  rankPreview.consecutiveWeeksAtSameRank ?? 0;

                // anilab 데이터인지 확인하여 NEW 처리
                const isAnilab = selectedRightTab === 'anilab';
                const finalRankDiffType = getRankDiffType(
                  safeRankDiff,
                  safeConsecutiveWeeks,
                  isAnilab
                );

                return (
                  <AbroadRankInfo
                    key={rankPreview.contentId || `abroad-${index}`}
                    rank={rankPreview.rank}
                    rankDiff={finalRankDiffType}
                    rankDiffValue={
                      finalRankDiffType === 'same-rank'
                        ? safeConsecutiveWeeks.toString()
                        : safeRankDiff.toString()
                    }
                    title={rankPreview.title}
                    studio={rankPreview.subTitle}
                    image={rankPreview.mainThumbnailUrl}
                    type={rankPreview.type}
                    contentId={rankPreview.contentId}
                  />
                );
              })}
            </div>

            {/* 더보기 버튼 */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleMoreClick}
                className="cursor-pointer text-sm font-normal text-zinc-500 transition-colors duration-200 hover:text-zinc-400 sm:text-base md:text-lg"
              >
                더보기
              </button>
            </div>
          </>
        ) : (
          // 빈 상태 UI - 스켈레톤 UI + 블러 처리 + 로딩 메시지
          <div className="relative min-h-[1142px] pt-21">
            {/* 스켈레톤 UI (뒷배경) */}
            <AbroadRankListSkeleton />

            {/* 블러 처리 레이어 */}
            <div className="absolute inset-0 rounded-xl"></div>

            {/* 로딩 메시지 (앞배경) */}
            <div className="relative z-10 flex h-full flex-col items-center justify-center">
              {selectedRightTab === 'anilab' ? (
                <>
                  <div className="mb-4 text-6xl text-gray-400 opacity-90">
                    🇯🇵
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-600 dark:text-white">
                    해외 순위 데이터 준비 중..
                  </h3>
                  <p className="text-center text-sm text-gray-500 dark:text-white">
                    Anilab 순위는 일 22:00 공개
                  </p>
                </>
              ) : (
                <>
                  <div className="mb-4 text-6xl text-gray-400 opacity-90">
                    🌍
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-600 dark:text-white">
                    해외 순위 데이터 준비 중..
                  </h3>
                  <p className="text-center text-sm text-gray-500 dark:text-white">
                    해당 주차의 해외 순위 데이터가
                    <br />
                    아직 준비되지 않았습니다.
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
