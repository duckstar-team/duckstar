'use client';

import { useRouter } from 'next/navigation';
import ImagePlaceholder from '@/components/common/ImagePlaceholder';
import RankDiff from './RankDiff';
import { cn } from '@/lib';
import { RankPreviewDto } from '@/types/dtos';

interface AbroadRankCardProps {
  rankPreview: RankPreviewDto;
  rankDiff:
    | 'up-greater-equal-than-5'
    | 'up-less-than-5'
    | 'down-less-than-5'
    | 'down-greater-equal-than-5'
    | 'same-rank'
    | 'new'
    | 'Zero';
  rankDiffValue: string;
  isWinner?: boolean;
}

export default function AbroadRankCard({
  rankPreview,
  rankDiff,
  rankDiffValue,
  isWinner = false,
}: AbroadRankCardProps) {
  const router = useRouter();
  const { contentId, type, rank, title, subTitle, mainThumbnailUrl } =
    rankPreview;

  const handleClick = () => {
    if (!contentId) return;

    if (type === 'ANIME') {
      router.push(`/animes/${contentId}`);
    } else {
      router.push(`/characters/${contentId}`);
    }
  };

  return (
    <div
      className={cn(
        'flex max-w-[370px] flex-wrap items-center gap-4 overflow-hidden rounded-xl border border-zinc-300 bg-white p-4',
        isWinner ? 'h-[180px] sm:h-[210px]' : 'h-[120px] sm:h-[140px]',
        contentId ? 'cursor-pointer hover:bg-gray-50' : 'cursor-default',
        'transition-colors'
      )}
      onClick={handleClick}
    >
      {/* 순위 섹션 */}
      <div className="flex w-8 shrink-0 flex-col items-center justify-center gap-1">
        <div className="text-2xl font-bold text-gray-500 lg:text-3xl">
          {rank}
        </div>
        <RankDiff property1={rankDiff} value={rankDiffValue} />
      </div>

      {/* 애니메이션 이미지 */}
      <div className="shrink-0">
        {mainThumbnailUrl && mainThumbnailUrl.trim() !== '' && (
          <img
            className="xs:w-[60px] xs:h-[80px] h-[65px] w-[50px] rounded-lg object-cover transition sm:h-[100px] sm:w-[75px]"
            src={mainThumbnailUrl}
            alt={title}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const placeholder = target.nextElementSibling as HTMLElement;
              if (placeholder) {
                placeholder.style.display = 'flex';
              }
            }}
          />
        )}
        <div
          className="xs:w-[60px] xs:h-[80px] h-[66.7px] w-[50px] rounded-lg sm:h-[93.3px] sm:w-[70px]"
          style={{
            display:
              !mainThumbnailUrl || mainThumbnailUrl.trim() === ''
                ? 'flex'
                : 'none',
          }}
        >
          <ImagePlaceholder type="anime" />
        </div>
      </div>

      {/* 제목과 스튜디오 */}
      <div className="flex min-w-0 flex-1 flex-col items-start justify-center gap-1">
        <div className="line-clamp-3 leading-tight font-bold text-gray-600 md:text-lg">
          {title}
        </div>
        <div className="text-xs text-gray-400 md:text-sm">{subTitle}</div>
      </div>
    </div>
  );
}
