'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import BannerContent from './BannerContent';
import BannerPagination from './BannerPagination';
import { Schemas } from '@/types';

interface HomeBannerProps {
  homeBannerDtos: Schemas['HomeBannerDto'][];
}

export default function HomeBanner({ homeBannerDtos }: HomeBannerProps) {
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const bannerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // 자동 페이지네이션 - 애니메이션 완료 후 타이머 시작
  useEffect(() => {
    if (!homeBannerDtos || homeBannerDtos.length <= 1 || !isAutoPlay) return;

    let timeoutId: NodeJS.Timeout;

    const startTimer = () => {
      timeoutId = setTimeout(() => {
        setCurrentBannerIndex(
          (prevIndex) => (prevIndex + 1) % homeBannerDtos.length
        );
        // 애니메이션 완료 후 다시 타이머 시작 (1초 후)
        setTimeout(startTimer, 1000);
      }, 7000); // 7초 대기
    };

    startTimer();

    return () => clearTimeout(timeoutId);
  }, [homeBannerDtos, isAutoPlay]);

  // 네비게이션 함수들
  const goToPrevious = () => {
    setCurrentBannerIndex((prevIndex) =>
      prevIndex === 0 ? homeBannerDtos.length - 1 : prevIndex - 1
    );
    // 수동 조작 시 3초간 자동 재생 일시 정지
    setIsAutoPlay(false);
    setTimeout(() => {
      setIsAutoPlay(true);
    }, 3000);
  };

  const goToNext = () => {
    setCurrentBannerIndex(
      (prevIndex) => (prevIndex + 1) % homeBannerDtos.length
    );
    // 수동 조작 시 3초간 자동 재생 일시 정지
    setIsAutoPlay(false);
    setTimeout(() => {
      setIsAutoPlay(true);
    }, 3000);
  };

  // 터치 이벤트 핸들러들
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && homeBannerDtos.length > 1) {
      goToNext();
    }
    if (isRightSwipe && homeBannerDtos.length > 1) {
      goToPrevious();
    }

    // 터치 이벤트 완료 후 상태 초기화
    setTouchStart(null);
    setTouchEnd(null);
  };

  // 마우스 이벤트로 자동 재생 일시 정지/재시작
  const handleMouseEnter = () => {
    setIsAutoPlay(false);
  };

  const handleMouseLeave = () => {
    setIsAutoPlay(true);
  };

  // 배너 데이터가 없으면 기본값 사용
  if (!homeBannerDtos || homeBannerDtos.length === 0) {
    return (
      <div className="relative h-auto w-full overflow-hidden rounded-xl bg-white outline outline-offset-[-1px] outline-[#D1D1D6] md:h-[215px] md:w-[750px]">
        <div className="flex h-full items-center justify-center text-gray-500">
          배너 데이터가 없습니다
        </div>
      </div>
    );
  }

  const handleBannerClick = (banner: Schemas['HomeBannerDto']) => {
    // 홈페이지에서 상세화면으로 이동할 때 스크롤 저장
    if (typeof window !== 'undefined') {
      const currentScrollY = window.scrollY || 0;

      sessionStorage.setItem('home-scroll', currentScrollY.toString());
      sessionStorage.setItem('navigation-type', 'from-anime-detail');
    }

    // Next.js 클라이언트 사이드 라우팅 사용 (간단한 라우터)
    if (banner.contentType === 'ANIME') {
      router.push(`/animes/${banner.animeId}`);
    } else {
      router.push(`/characters/${banner.characterId}`);
    }
  };

  return (
    <div
      ref={bannerRef}
      className="dark:outlin-zinc-800 relative h-[215px] w-full overflow-hidden rounded-xl outline outline-offset-[-1px] outline-[#D1D1D6] dark:bg-zinc-800 dark:outline-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* PC용 네비게이션 버튼 - 오른쪽 아래 배치 */}
      <div className="absolute right-4 bottom-4 z-20 hidden gap-3 md:flex">
        <button
          onClick={goToPrevious}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-black/20 transition-all duration-200 hover:bg-black/40"
          aria-label="이전 배너"
        >
          <img
            src="/icons/episodes-before.svg"
            alt="이전"
            className="h-4 w-4 brightness-0 invert filter"
          />
        </button>

        <button
          onClick={goToNext}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-black/20 transition-all duration-200 hover:bg-black/40"
          aria-label="다음 배너"
        >
          <img
            src="/icons/episodes-after.svg"
            alt="다음"
            className="h-4 w-4 brightness-0 invert filter"
          />
        </button>
      </div>

      {/* 모든 배너를 미리 렌더링 - 실무 방식 */}
      <div
        className="flex h-full transition-transform duration-1000 ease-in-out"
        style={{
          transform: `translateX(-${(currentBannerIndex * 100) / homeBannerDtos.length}%)`,
          width: `${homeBannerDtos.length * 100}%`,
        }}
      >
        {homeBannerDtos.map((banner, index) => (
          <div
            key={index}
            className="relative flex h-full flex-shrink-0 cursor-pointer flex-row items-center transition-opacity hover:opacity-95"
            style={{
              width: `${100 / homeBannerDtos.length}%`,
            }}
            onClick={() => handleBannerClick(banner)}
          >
            <div className="flex flex-1 items-center p-4 md:p-0">
              <BannerContent
                header={`${banner.bannerType === 'HOT' ? '🔥 HOT 급상승' : banner.bannerType === 'NOTICEABLE' ? '✨ NEW 주목할만한' : banner.bannerType} ${banner.contentType === 'ANIME' ? '애니메이션' : '캐릭터'}`}
                title={banner.mainTitle}
                source={banner.subTitle}
              />
            </div>

            {/* 오른쪽 이미지 */}
            <div className="xs:w-[126px] relative h-[215px] w-[80px] rounded-r-xl sm:w-[126px] md:w-[156px] lg:w-[326px]">
              {/* 모바일: 원형 이미지 (오른쪽 아래) */}
              <div className="absolute right-5 bottom-2 h-30 w-30 overflow-hidden rounded-full md:hidden">
                <img
                  className="h-full w-full object-cover"
                  src={banner.animeImageUrl}
                  alt={banner.mainTitle}
                />
              </div>

              {/* 데스크톱: 기존 이미지 */}
              <div className="hidden h-full w-full md:block">
                <img
                  className="h-full w-full object-cover"
                  src={banner.animeImageUrl}
                  alt={banner.mainTitle}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 하단 페이지네이션 */}
      <BannerPagination
        currentPage={currentBannerIndex}
        totalPages={homeBannerDtos.length}
        onPageChange={(index) => {
          setCurrentBannerIndex(index);
          // 수동 조작 시 3초간 자동 재생 일시 정지
          setIsAutoPlay(false);
          setTimeout(() => {
            setIsAutoPlay(true);
          }, 3000);
        }}
        className="absolute top-[188px] left-[43px] z-10 lg:left-[43px]"
      />
    </div>
  );
}
