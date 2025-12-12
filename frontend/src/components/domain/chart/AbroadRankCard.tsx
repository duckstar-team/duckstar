'use client';

import { useRouter } from 'next/navigation';
import ImagePlaceholder from '@/components/common/ImagePlaceholder';
import RankDiff from './RankDiff';

interface AbroadRankCardProps {
  rank?: number;
  rankDiff?:
    | 'up-greater-equal-than-5'
    | 'up-less-than-5'
    | 'down-less-than-5'
    | 'down-greater-equal-than-5'
    | 'same-rank'
    | 'new'
    | 'Zero';
  rankDiffValue?: string | number;
  title?: string;
  studio?: string;
  image?: string;
  weeks?: number;
  type?: 'ANIME' | 'HERO' | 'HEROINE';
  contentId?: number;
  isWinner?: boolean;
  className?: string;
}

export default function AbroadRankCard({
  rank = 1,
  rankDiff = 'new',
  rankDiffValue = 'NEW',
  title = 'タコピーの原罪',
  studio = 'ENISHIYA',
  image = '',
  weeks = 13,
  type = 'ANIME',
  contentId = 1,
  isWinner = false,
  className = '',
}: AbroadRankCardProps) {
  const router = useRouter();

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
      className={`xs:w-[350px] w-[320px] sm:w-[370px] ${isWinner ? 'xs:h-[195px] h-[180px] sm:h-[210px]' : 'xs:h-[130px] h-[120px] sm:h-[140px]'} xs:pl-4 xs:gap-4 inline-flex flex-wrap content-center items-center justify-start gap-3 overflow-hidden rounded-xl bg-white py-1.5 pl-3 outline outline-offset-[-1px] outline-zinc-300 sm:gap-5 sm:pl-5 ${contentId ? 'cursor-pointer hover:bg-gray-50' : 'cursor-default'} transition-colors ${className}`}
      onClick={handleClick}
    >
      {/* 순위 섹션 */}
      <div className="xs:w-7 inline-flex w-6 flex-col items-center justify-center self-stretch pb-1 sm:w-8">
        <div className="xs:text-3xl justify-start text-center text-2xl leading-snug font-bold text-gray-500 sm:text-3xl">
          {rank}
        </div>
        <div className="inline-flex items-center justify-center gap-px self-stretch">
          <RankDiff property1={rankDiff} value={rankDiffValue} />
        </div>
      </div>

      {/* 애니메이션 이미지 */}
      <div className="xs:w-[60px] xs:h-[80px] relative h-[66.7px] w-[50px] sm:h-[93.3px] sm:w-[70px]">
        {image && image.trim() !== '' ? (
          <img
            className="xs:w-[60px] xs:h-[80px] h-[66.7px] w-[50px] rounded-lg object-cover sm:h-[93.3px] sm:w-[70px]"
            src={image}
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
        ) : null}
        <div
          className="xs:w-[60px] xs:h-[80px] h-[66.7px] w-[50px] rounded-lg sm:h-[93.3px] sm:w-[70px]"
          style={{ display: !image || image.trim() === '' ? 'flex' : 'none' }}
        >
          <ImagePlaceholder type="anime" />
        </div>
      </div>

      {/* 제목과 스튜디오 */}
      <div className="xs:w-40 xs:h-22 inline-flex h-20 w-40 flex-col items-start justify-center sm:h-24 sm:w-45">
        <div className="inline-flex items-start justify-start gap-2.5 self-stretch">
          <div className="xs:w-52 xs:text-xl line-clamp-3 w-44 justify-start text-lg leading-relaxed font-bold text-[#495057] sm:w-52 sm:text-xl">
            {title}
          </div>
        </div>
        <div className="xs:text-sm justify-start self-stretch text-xs leading-relaxed font-normal text-[#868E96] sm:text-sm">
          {studio}
        </div>
      </div>
    </div>
  );
}
