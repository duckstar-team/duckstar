'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BannerContent from './BannerContent';
import BannerImage from './BannerImage';
import BannerPagination from './BannerPagination';
import { HomeBannerDto } from '@/types/api';

interface HomeBannerProps {
  homeBannerDtos: HomeBannerDto[];
  className?: string;
}

export default function HomeBanner({ homeBannerDtos, className = "" }: HomeBannerProps) {
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const router = useRouter();
  
  // 홈페이지에서는 간단한 라우터 사용 (스크롤 복원 훅 사용 안 함)
  
  // 자동 페이지네이션 - 애니메이션 완료 후 타이머 시작
  useEffect(() => {
    if (!homeBannerDtos || homeBannerDtos.length <= 1) return;
    
    let timeoutId: NodeJS.Timeout;
    
    const startTimer = () => {
      timeoutId = setTimeout(() => {
        setCurrentBannerIndex((prevIndex) => 
          (prevIndex + 1) % homeBannerDtos.length
        );
        // 애니메이션 완료 후 다시 타이머 시작 (1초 후)
        setTimeout(startTimer, 1000);
      }, 6000); // 6초 대기
    };
    
    startTimer();
    
    return () => clearTimeout(timeoutId);
  }, [homeBannerDtos]);
  
  // 배너 데이터가 없으면 기본값 사용
  if (!homeBannerDtos || homeBannerDtos.length === 0) {
    return (
      <div className={`w-[750px] h-[215px] md:w-[750px] md:h-[215px] w-full h-auto relative bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-[#D1D1D6] overflow-hidden ${className}`}>
        <div className="flex items-center justify-center h-full text-gray-500">
          배너 데이터가 없습니다
        </div>
      </div>
    );
  }
  
  const handleBannerClick = (banner: HomeBannerDto) => {
    // 홈페이지에서 상세화면으로 이동할 때 스크롤 저장
    if (typeof window !== 'undefined') {
      const currentScrollY = window.scrollY || 0;
      const documentScrollTop = document.documentElement.scrollTop || 0;
      const bodyScrollTop = document.body.scrollTop || 0;
           
      sessionStorage.setItem('home-scroll', currentScrollY.toString());
      sessionStorage.setItem('navigation-type', 'from-anime-detail');
    }
    
    // Next.js 클라이언트 사이드 라우팅 사용 (간단한 라우터)
    if (banner.contentType === 'ANIME') {
      router.push(`/animes/${banner.contentId}`);
    } else {
      router.push(`/characters/${banner.contentId}`);
    }
  };

  return (
    <div className={`w-[320px] xs:w-[500px] sm:w-[500px] md:w-[550px] lg:w-[750px] max-w-[750px] h-auto md:h-[215px] relative bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-[#D1D1D6] overflow-hidden ${className}`}>
      {/* 모든 배너를 미리 렌더링 - 실무 방식 */}
      <div 
        className="flex transition-transform duration-1000 ease-in-out"
        style={{ 
          transform: `translateX(-${currentBannerIndex * (window.innerWidth >= 1024 ? 750 : window.innerWidth >= 768 ? 550 : window.innerWidth >= 640 ? 500 : 320)}px)`,
          width: `${homeBannerDtos.length * (window.innerWidth >= 1024 ? 750 : window.innerWidth >= 768 ? 550 : window.innerWidth >= 640 ? 500 : 320)}px`
        }}
      >
        {homeBannerDtos.map((banner, index) => (
          <div 
            key={index}
            className="w-[320px] xs:w-[500px] sm:w-[500px] md:w-[550px] lg:w-[750px] h-auto md:h-[215px] flex-shrink-0 relative cursor-pointer hover:opacity-95 transition-opacity flex flex-row items-center"
            onClick={() => handleBannerClick(banner)}
          >
            {/* 왼쪽 텍스트 */}
            <div className="flex-1 p-4 md:p-0 flex items-center">
              <BannerContent 
                header={`${banner.bannerType === 'HOT' ? '🔥 HOT 급상승' : banner.bannerType === 'NOTICEABLE' ? '✨ NEW 주목할만한' : banner.bannerType} ${banner.contentType === 'ANIME' ? '애니메이션' : '캐릭터'}`}
                title={banner.mainTitle}
                source={banner.subTitle}
                date=""
                className="left-[20px] top-[16px] absolute" 
              />
            </div>
            
            {/* 오른쪽 이미지 */}
            <div className="w-[80px] xs:w-[126px] sm:w-[126px] md:w-[156px] lg:w-[326px] h-[215px] rounded-r-xl relative">
              {/* 모바일: 원형 이미지 (오른쪽 아래) */}
              <div className="md:hidden absolute bottom-2 right-5 w-30 h-30 rounded-full overflow-hidden">
                <img 
                  className="w-full h-full object-cover"
                  src={banner.animeImageUrl}
                  alt={banner.mainTitle}
                />
              </div>
              
              {/* 데스크톱: 기존 이미지 */}
              <div className="hidden md:block w-full h-full">
                <img 
                  className="w-full h-full object-cover"
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
        onPageChange={setCurrentBannerIndex}
        className="left-[43px] lg:left-[43px] top-[188px] absolute z-10"
      />
    </div>
  );
}
