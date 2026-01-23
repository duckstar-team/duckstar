'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import RankDiff from '@/components/domain/chart/RankDiff';
import Medal from '@/components/domain/chart/Medal';
import ImagePlaceholder from '@/components/common/ImagePlaceholder';
import StarRatingDisplay from '@/components/domain/star/StarRatingDisplay';
import { ContentType, MedalType } from '@/types';

interface HomeRankInfoProps {
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
  medal: MedalType;
  type: ContentType;
  contentId: number;
}

export default function HomeRankInfo({
  rank,
  rankDiff = 'up-greater-equal-than-5',
  rankDiffValue,
  title,
  studio,
  image,
  averageRating,
  voterCount,
  medal,
  type,
  contentId,
}: HomeRankInfoProps) {
  const router = useRouter();
  const [showTooltip, setShowTooltip] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // 컴포넌트 상태 정의
  const isTopThree = rank <= 3;
  const isFirst = rank === 1;
  const isSecond = rank === 2;
  const isThird = rank === 3;

  // 색상 및 스타일 결정
  const getStarColor = () => {
    if (isFirst) return 'text-brand opacity-80';
    if (isSecond) return 'text-[#868E96] opacity-70';
    if (isThird) return 'text-[#E37429] opacity-70';
    return 'text-[#ADB5BD]';
  };

  const getFontWeight = () => {
    return isTopThree ? 'font-semibold' : 'font-normal';
  };

  const getPosition = () => {
    return isTopThree ? 'left-[25px]' : '-right-[3px]';
  };

  const getStarListPosition = () => {
    return isTopThree ? 'left-[21px]' : '-right-[3px]';
  };

  const getTopPosition = () => {
    return isTopThree ? 'top-[14px]' : 'top-[30px]';
  };

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
    if (type === ContentType.ANIME) {
      router.push(`/animes/${contentId}`);
    } else {
      router.push(`/characters/${contentId}`);
    }
  };
  return (
    <div className="inline-flex h-24 w-full items-center justify-start gap-5 overflow-hidden rounded-xl px-4 outline outline-gray-200 dark:bg-zinc-900 dark:outline-none">
      {/* 왼쪽 영역 - 클릭 가능 */}
      <div
        className={`flex flex-1 items-center justify-start gap-5 pl-0.5 dark:hover:bg-zinc-800/40 ${contentId ? '-m-2 cursor-pointer rounded-lg p-2 transition-colors duration-200 hover:bg-gray-50' : 'cursor-default'}`}
        onClick={handleClick}
      >
        {/* 순위와 변화 */}
        <div className="ml-2 inline-flex w-8 flex-col items-center justify-center self-stretch pb-1">
          <div className="justify-start text-center text-3xl leading-snug font-bold text-gray-500 dark:text-gray-300">
            {rank}
          </div>
          <div className="inline-flex items-center justify-center gap-px self-stretch">
            <RankDiff property1={rankDiff} value={rankDiffValue} />
          </div>
        </div>

        {/* 애니메이션 이미지 */}
        <div className="relative h-20 w-14">
          {image && image.trim() !== '' ? (
            <img
              className="absolute top-0 left-0 h-20 w-14 rounded-lg object-cover"
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
            className="absolute top-0 left-0 h-20 w-14 rounded-lg"
            style={{ display: !image || image.trim() === '' ? 'flex' : 'none' }}
          >
            <ImagePlaceholder type="anime" />
          </div>
        </div>

        {/* 제목과 스튜디오 */}
        <div className="inline-flex flex-1 flex-col items-start justify-start gap-0.5">
          <div className="w-96 justify-start text-lg leading-snug font-semibold">
            {title}
          </div>
          <div className="justify-start text-center text-sm leading-snug font-normal text-gray-400">
            {studio}
          </div>
        </div>
      </div>

      {/* 오른쪽 영역 */}
      <div className="relative h-24 w-36">
        {/* 1-3등 호버 컨테이너 */}
        {isTopThree ? (
          <div
            className="h-full w-full cursor-pointer"
            onMouseEnter={(e) => {
              setMousePosition({ x: e.clientX, y: e.clientY });
              setShowTooltip(true);
            }}
            onMouseMove={(e) => {
              setMousePosition({ x: e.clientX, y: e.clientY });
            }}
            onMouseLeave={() => setShowTooltip(false)}
          >
            {/* 별점 텍스트 */}
            <div
              className={`${getPosition()} ${getTopPosition()} absolute justify-start text-right ${isFirst ? 'opacity-75' : ''}`}
            >
              <div className="justify-start text-right">
                <span
                  className={`text-xl ${getFontWeight()} leading-snug tracking-widest ${getStarColor()}`}
                >
                  ★
                </span>
                <span
                  className={`text-2xl ${getFontWeight()} leading-snug tracking-widest ${getStarColor()}`}
                >
                  {Math.floor(averageRating)}
                </span>
                <span
                  className={`text-base ${getFontWeight()} leading-snug tracking-widest ${getStarColor()}`}
                >
                  {averageRating.toFixed(1).substring(1)}
                </span>
              </div>
            </div>

            {/* 메달 */}
            <div className="absolute top-0 left-[113px] inline-flex w-7 items-center justify-center gap-2.5">
              <Medal property1={medal} />
            </div>

            {/* 별점 리스트 */}
            <div className={`${getStarListPosition()} absolute top-[52px]`}>
              <StarRatingDisplay
                rating={averageRating}
                size="lg"
                maxStars={5}
              />
            </div>

            {/* 호버 툴팁 - 마우스 위치 추적 */}
            <div
              className="fixed z-[99999] rounded bg-gray-800 px-2 py-1 text-xs whitespace-nowrap text-white shadow-lg"
              style={{
                display: showTooltip ? 'block' : 'none',
                pointerEvents: 'none',
                left: `${mousePosition.x + 10}px`,
                top: `${mousePosition.y + 10}px`,
              }}
            >
              {voterCount}명 참여
            </div>
          </div>
        ) : (
          <>
            {/* 4등 이하 - 기존 방식 */}
            <div
              className={`${getPosition()} ${getTopPosition()} absolute justify-start text-right ${isFirst ? 'opacity-75' : ''}`}
            >
              <div className="justify-start text-right">
                <span
                  className={`text-xl ${getFontWeight()} leading-snug tracking-widest ${getStarColor()}`}
                >
                  ★
                </span>
                <span
                  className={`text-2xl ${getFontWeight()} leading-snug tracking-widest ${getStarColor()}`}
                >
                  {Math.floor(averageRating)}
                </span>
                <span
                  className={`text-base ${getFontWeight()} leading-snug tracking-widest ${getStarColor()}`}
                >
                  {averageRating.toFixed(1).substring(1)}
                  <br />
                  {voterCount}명 참여
                </span>
              </div>
            </div>

            {/* 메달 */}
            <div className="absolute top-0 left-[113px] inline-flex w-7 items-center justify-center gap-2.5">
              <Medal property1={medal} />
            </div>
          </>
        )}

        {/* 구분선 */}
        <div className="absolute top-[24px] left-0 h-12 w-0 outline outline-offset-[-0.50px] outline-gray-200 dark:outline-zinc-800" />
      </div>
    </div>
  );
}
