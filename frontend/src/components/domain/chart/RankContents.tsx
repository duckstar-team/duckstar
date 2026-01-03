import RankDiff from './RankDiff';
import StarRatingDisplay from '@/components/domain/star/StarRatingDisplay';
import { AnimeRankDto } from '@/types/dtos';
import { getRankDiffType } from '@/lib';
import TooltipBtn from '@/components/common/TooltipBtn';

interface RankContentsProps {
  anime: AnimeRankDto;
  variant?: 'default' | 'winner';
}

export default function RankContents({
  anime,
  variant = 'default',
}: RankContentsProps) {
  const isWinner = variant === 'winner';

  const {
    rank,
    rankDiff,
    consecutiveWeeksAtSameRank,
    title,
    subTitle,
    mainThumbnailUrl,
  } = anime.rankPreviewDto;
  const rankDiffValue =
    getRankDiffType(rankDiff, consecutiveWeeksAtSameRank) === 'same-rank'
      ? (consecutiveWeeksAtSameRank || 0).toString()
      : (rankDiff || 0).toString();
  const averageRating = anime.voteResultDto?.info?.starAverage || 0;
  const rating = Math.round(averageRating * 10) / 10;

  // 실제 전체 점수 (소수점 셋째자리까지 반올림, 항상 표시)
  const fullRating =
    averageRating !== undefined
      ? (Math.round(averageRating * 1000) / 1000).toFixed(3)
      : (Math.round(rating * 1000) / 1000).toFixed(3);

  return (
    <div
      className={`xs:gap-3 flex ${
        isWinner ? 'h-52' : 'h-[140px]'
      } min-w-0 flex-1 items-center justify-start gap-2 sm:gap-5`}
    >
      {/* 순위 및 변동 정보 */}
      <div className="inline-flex w-9 shrink-0 flex-col items-center justify-start">
        <div className="xs:text-[32px] justify-start text-center text-[28px] leading-normal font-bold text-[#868E96] sm:text-[32px]">
          {rank}
        </div>
        <RankDiff
          property1={getRankDiffType(rankDiff, consecutiveWeeksAtSameRank)}
          value={rankDiffValue || rankDiff}
        />
      </div>

      {/* 애니메이션 포스터 */}
      <div
        className={`shrink-0 overflow-hidden rounded-md transition ${
          isWinner
            ? 'xs:w-20 xs:h-28 h-20 w-16 sm:h-36 sm:w-28'
            : 'xs:w-[60px] xs:h-[80px] h-[65px] w-[50px] sm:h-[100px] sm:w-[75px]'
        }`}
      >
        <img
          className="h-full w-full object-cover"
          src={mainThumbnailUrl}
          alt={title}
        />
      </div>

      {/* 제목, 스튜디오, 별점 정보 */}
      <div className="flex min-w-0 flex-1 flex-col items-end justify-center gap-2">
        <div className="flex w-full flex-col items-start justify-start gap-[3px]">
          <div className="xs:text-lg line-clamp-2 leading-snug font-bold text-black">
            {title}
          </div>
          <div className="xs:text-sm text-xs leading-snug font-normal text-gray-400">
            {subTitle}
          </div>
        </div>

        {/* 별점 */}
        <div className="inline-flex cursor-pointer items-center justify-start gap-2.5 self-stretch pr-[5px]">
          <TooltipBtn
            text={`★ ${fullRating} / 10`}
            placement="bottom"
            noArrow={true}
            className="rounded-md! text-xs!"
          >
            <StarRatingDisplay
              rating={rating}
              size="lg"
              maxStars={5}
              responsiveSize={true}
            />
          </TooltipBtn>
        </div>
      </div>
    </div>
  );
}
