'use client';

import { useRouter } from 'next/navigation';
import RankDiff from './RankDiff';
import ImagePlaceholder from '@/components/common/ImagePlaceholder';

interface AbroadRankInfoProps {
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
  type?: 'ANIME' | 'HERO' | 'HEROINE';
  contentId?: number;
  className?: string;
}

export default function AbroadRankInfo({
  rank = 4,
  rankDiff = 'new',
  rankDiffValue = 'NEW',
  title = 'タコピーの原罪',
  studio = 'ENISHIYA',
  image = '',
  type = 'ANIME',
  contentId = 1,
  className = '',
}: AbroadRankInfoProps) {
  const router = useRouter();

  // 홈페이지에서는 간단한 라우터 사용 (스크롤 복원 훅 사용 안 함)

  const handleClick = () => {
    if (!contentId) return; // contentId가 null이면 클릭 무시

    // 홈페이지에서 상세화면으로 이동할 때 스크롤 및 상태 저장
    if (typeof window !== 'undefined') {
      const currentScrollY = window.scrollY || 0;

      // 스크롤 위치 저장
      sessionStorage.setItem('home-scroll', currentScrollY.toString());
      sessionStorage.setItem('navigation-type', 'from-anime-detail');

      // 홈 상태 저장 플래그 설정
      sessionStorage.setItem('home-state-save', 'true');
    }

    // Next.js 클라이언트 사이드 라우팅 사용 (간단한 라우터)
    if (type === 'ANIME') {
      router.push(`/animes/${contentId}`);
    } else {
      router.push(`/characters/${contentId}`);
    }
  };
  return (
    <div
      className={`relative h-24 w-full overflow-hidden rounded-xl bg-white px-3 outline outline-gray-200 sm:px-4 xl:w-80 dark:bg-zinc-900 dark:outline-none ${contentId ? 'cursor-pointer hover:bg-gray-50 hover:dark:bg-zinc-900/50' : 'cursor-default'} transition-colors ${className}`}
      onClick={handleClick}
    >
      <div className="flex h-full w-full items-center gap-2 sm:gap-3 md:gap-4 lg:gap-5">
        {/* 순위와 변화 - HomeRankInfo와 동일한 레이아웃 */}
        <div className="flex w-5 flex-col items-center gap-1">
          <div className="justify-start text-center text-xl leading-snug font-bold text-gray-500 sm:text-2xl md:text-3xl dark:text-zinc-100">
            {rank}
          </div>
          <div className="inline-flex items-center justify-center gap-px self-stretch">
            <RankDiff property1={rankDiff} value={rankDiffValue} />
          </div>
        </div>

        {/* 애니메이션 이미지 */}
        <div className="relative h-14 w-10 sm:h-16 sm:w-12">
          {image && image.trim() !== '' ? (
            <img
              className="h-full w-full rounded-lg object-cover"
              src={image}
              alt={title}
              onError={(e) => {
                // 이미지 로드 실패 시 플레이스홀더로 대체
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
            className="absolute top-0 left-0 h-14 w-10 rounded-lg sm:h-16 sm:w-12"
            style={{ display: !image || image.trim() === '' ? 'flex' : 'none' }}
          >
            <ImagePlaceholder type="anime" />
          </div>
        </div>

        {/* 제목과 스튜디오 */}
        <div className="inline-flex flex-1 flex-col items-start justify-start">
          <div className="line-clamp-2 w-full justify-start text-sm leading-snug font-semibold sm:text-base md:text-lg">
            {title}
          </div>
          <div className="justify-start truncate text-center text-xs leading-snug font-normal text-gray-400 sm:text-sm">
            {studio}
          </div>
        </div>
      </div>
    </div>
  );
}
