'use client';

import { useRouter } from 'next/navigation';
import RankDiff from '@/components/domain/chart/RankDiff';
import ImagePlaceholder from '@/components/common/ImagePlaceholder';
import Medal from '@/components/domain/chart/Medal';
import { ContentType, MedalType } from '@/types';

interface HomeRankInfoMobileProps {
  rank: number;
  rankDiff:
    | 'up-greater-equal-than-5'
    | 'up-less-than-5'
    | 'down-less-than-5'
    | 'down-greater-equal-than-5'
    | 'same-rank'
    | 'new'
    | 'Zero';
  rankDiffValue: string | number;
  title: string;
  studio: string;
  image: string;
  averageRating: number;
  voterCount: number;
  type: ContentType;
  contentId: number;
}

export default function HomeRankInfoMobile({
  rank,
  rankDiff,
  rankDiffValue,
  title,
  studio,
  image,
  averageRating,
  voterCount,
  type,
  contentId,
}: HomeRankInfoMobileProps) {
  const router = useRouter();

  // 1-3등 체크
  const isTopThree = rank <= 3;

  const handleClick = () => {
    if (type === 'ANIME') {
      router.push(`/animes/${contentId}`);
    } else {
      router.push(`/characters/${contentId}`);
    }
  };

  return (
    <div
      className="relative h-24 w-full cursor-pointer rounded-xl border border-gray-200 px-3 py-3 transition-colors hover:bg-gray-50 sm:px-4 dark:border-none dark:bg-zinc-900 dark:hover:bg-zinc-900/50"
      onClick={handleClick}
    >
      <div className="flex h-full w-full items-center gap-2 sm:gap-3 md:gap-4">
        {/* 왼쪽 영역 - 순위와 이미지 */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* 순위 */}
          <div className="flex min-w-[28px] flex-col items-center gap-1">
            <div className="text-xl leading-snug font-bold text-gray-400 sm:text-2xl">
              {rank}
            </div>
            <RankDiff property1={rankDiff} value={rankDiffValue} />
          </div>

          {/* 이미지 */}
          <div className="relative h-14 w-10 sm:h-16 sm:w-12">
            {image ? (
              <img
                src={image}
                alt={title}
                className="h-full w-full rounded object-cover"
              />
            ) : (
              <ImagePlaceholder />
            )}
          </div>
        </div>

        {/* 제목과 스튜디오 */}
        <div className="-mt-1 inline-flex flex-1 flex-col items-start justify-start gap-0.5">
          {/* 평균별점과 참여자 수 표시 */}
          <div className="-mb-[2px] flex items-center gap-1 sm:gap-2">
            <div className="flex items-center gap-0.5 sm:gap-1">
              <div className="relative h-3 w-3 sm:h-4 sm:w-4">
                <img
                  alt="star"
                  className="block size-full max-w-none"
                  src="/icons/star/star-UnSelected.svg"
                />
              </div>
              <p className="text-center text-[12px] leading-[18px] text-nowrap whitespace-pre text-[#adb5bd] sm:text-[14px] sm:leading-[22px]">
                {averageRating.toFixed(1)}
              </p>
            </div>
            <p className="text-center text-[12px] leading-[18px] text-nowrap whitespace-pre text-[#adb5bd] sm:text-[14px] sm:leading-[22px]">
              참여
            </p>
            <p className="text-center text-[12px] leading-[18px] text-nowrap whitespace-pre text-[#adb5bd] sm:-ml-1 sm:text-[14px] sm:leading-[22px]">
              {voterCount}
            </p>
          </div>

          <div
            className={`line-clamp-2 w-full justify-start text-sm leading-snug font-semibold sm:text-base md:text-lg ${isTopThree ? 'pr-8' : ''}`}
          >
            {title}
          </div>
          <div
            className={`justify-start text-start text-xs leading-snug font-normal text-gray-400 sm:text-sm ${isTopThree ? 'pr-8' : ''}`}
          >
            {studio}
          </div>
        </div>
      </div>

      {/* 메달 - 1등, 2등, 3등만 표시 */}
      {rank <= 3 && (
        <div className="absolute top-2 right-2">
          <Medal
            property1={
              rank === 1
                ? MedalType.GOLD
                : rank === 2
                  ? MedalType.SILVER
                  : rank === 3
                    ? MedalType.BRONZE
                    : MedalType.NONE
            }
          />
        </div>
      )}
    </div>
  );
}
