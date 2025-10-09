'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import RankDiff from './RankDiff';
import Medal from './Medal';
import ImagePlaceholder from '../common/ImagePlaceholder';
import StarRatingDisplay from '../StarRatingDisplay';

interface HomeRankInfoProps {
  rank?: number;
  rankDiff?: "up-greater-equal-than-5" | "up-less-than-5" | "down-less-than-5" | "down-greater-equal-than-5" | "same-rank" | "new" | "Zero";
  rankDiffValue?: string | number;
  title?: string;
  studio?: string;
  image?: string;
  percentage?: string;
  averageRating?: number; // 백엔드에서 받은 평균 별점
  voterCount?: number; // 백엔드에서 받은 참여자 수
  medal?: "Gold" | "Silver" | "Bronze" | "None";
  type?: "ANIME" | "HERO" | "HEROINE";
  contentId?: number;
  className?: string;
}

export default function HomeRankInfo({
  rank = 1,
  rankDiff = "up-greater-equal-than-5",
  rankDiffValue = "5",
  title = "내가 연인이 될 수 있을 리 없잖아, 무리무리! (※무리가 아니었다?!)",
  studio = "Studio Mother",
  image = "https://placehold.co/60x80",
  percentage = "15.18",
  averageRating = 4.5, // 기본값
  voterCount = 0, // 기본값
  medal = "Gold",
  type = "ANIME",
  contentId = 1,
  className = ""
}: HomeRankInfoProps) {
  const router = useRouter();
  const [showTooltip, setShowTooltip] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // 평균 별점을 정수 부분과 소수 부분으로 분리 (소수점 두 번째 자리에서 버림)
  const integerPart = Math.floor(averageRating);
  const decimalPart = Math.floor((averageRating - integerPart) * 100) / 100; // 소수점 두 번째 자리에서 버림
  const decimalString = decimalPart.toFixed(2).substring(1); // ".95" 형태
  
  // 컴포넌트 상태 정의
  const isTopThree = rank <= 3;
  const isFirst = rank === 1;
  const isSecond = rank === 2;
  const isThird = rank === 3;
  
  // 색상 및 스타일 결정
  const getStarColor = () => {
    if (isFirst) return 'text-[#990033] opacity-80';
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
    if (type === "ANIME") {
      router.push(`/animes/${contentId}`);
    } else {
      router.push(`/characters/${contentId}`);
    }
  };
  return (
    <div 
      className={`w-full h-24 px-4 bg-white rounded-xl outline outline-1 outline-gray-200 inline-flex justify-start items-center gap-5 overflow-hidden ${className}`}
    >
      {/* 왼쪽 영역 - 클릭 가능 */}
      <div 
        className={`flex-1 flex justify-start items-center gap-5 pl-0.5 ${contentId ? 'cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors duration-200' : 'cursor-default'}`}
        onClick={handleClick}
      >
        {/* 순위와 변화 */}
        <div className="w-8 self-stretch inline-flex flex-col justify-center items-center pb-1 ml-2">
          <div className="text-center justify-start text-gray-500 text-3xl font-bold font-['Pretendard'] leading-snug">
            {rank}
          </div>
          <div className="self-stretch inline-flex justify-center items-center gap-px">
            <RankDiff property1={rankDiff} value={rankDiffValue} />
          </div>
        </div>
        
        {/* 애니메이션 이미지 */}
        <div className="w-14 h-20 relative">
          {image && image.trim() !== '' ? (
            <img 
              className="w-14 h-20 left-0 top-0 absolute rounded-lg object-cover" 
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
            className="w-14 h-20 left-0 top-0 absolute rounded-lg"
            style={{ display: !image || image.trim() === '' ? 'flex' : 'none' }}
          >
            <ImagePlaceholder type="anime" />
          </div>
        </div>
        
        {/* 제목과 스튜디오 */}
        <div className="flex-1 inline-flex flex-col justify-start items-start gap-0.5">
          <div className="w-96 justify-start text-black text-lg font-semibold font-['Pretendard'] leading-snug">
            {title}
          </div>
          <div className="text-center justify-start text-gray-400 text-sm font-normal font-['Pretendard'] leading-snug">
            {studio}
          </div>
        </div>
      </div>
      
      {/* 오른쪽 영역 */}
      <div className="w-36 h-24 relative">
        {/* 1-3등 호버 컨테이너 */}
        {isTopThree ? (
          <div 
            className="w-full h-full cursor-pointer"
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
            <div className={`${getPosition()} ${getTopPosition()} absolute text-right justify-start ${isFirst ? 'opacity-75' : ''}`}>
              <div className="text-right justify-start">
                <span className={`text-xl ${getFontWeight()} font-['Pretendard'] leading-snug tracking-widest ${getStarColor()}`}>
                  ★
                </span>
                <span className={`text-2xl ${getFontWeight()} font-['Pretendard'] leading-snug tracking-widest ${getStarColor()}`}>
                  {integerPart}
                </span>
                <span className={`text-base ${getFontWeight()} font-['Pretendard'] leading-snug tracking-widest ${getStarColor()}`}>
                  {decimalString}
                </span>
              </div>
            </div>
            
            {/* 메달 */}
            <div className="w-7 left-[113px] top-0 absolute inline-flex justify-center items-center gap-2.5">
              <Medal property1={medal} />
            </div>
            
            {/* 별점 리스트 */}
            <div className={`${getStarListPosition()} top-[52px] absolute`}>
              <StarRatingDisplay 
                rating={averageRating} 
                size="lg" 
                maxStars={5}
              />
            </div>
            
            {/* 호버 툴팁 - 마우스 위치 추적 */}
            <div 
              className="fixed bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-[99999]"
              style={{ 
                display: showTooltip ? 'block' : 'none',
                pointerEvents: 'none',
                left: `${mousePosition.x + 10}px`,
                top: `${mousePosition.y + 10}px`
              }}
            >
              {voterCount}명 참여
            </div>
          </div>
        ) : (
          <>
            {/* 4등 이하 - 기존 방식 */}
            <div className={`${getPosition()} ${getTopPosition()} absolute text-right justify-start ${isFirst ? 'opacity-75' : ''}`}>
              <div className="text-right justify-start">
                <span className={`text-xl ${getFontWeight()} font-['Pretendard'] leading-snug tracking-widest ${getStarColor()}`}>
                  ★
                </span>
                <span className={`text-2xl ${getFontWeight()} font-['Pretendard'] leading-snug tracking-widest ${getStarColor()}`}>
                  {integerPart}
                </span>
                <span className={`text-base ${getFontWeight()} font-['Pretendard'] leading-snug tracking-widest ${getStarColor()}`}>
                  {decimalString}<br/>{voterCount}명 참여
                </span>
              </div>
            </div>
            
            {/* 메달 */}
            <div className="w-7 left-[113px] top-0 absolute inline-flex justify-center items-center gap-2.5">
              <Medal property1={medal} />
            </div>
          </>
        )}
        
        {/* 구분선 */}
        <div className="w-0 h-12 left-0 top-[24px] absolute outline outline-1 outline-offset-[-0.50px] outline-gray-200" />
      </div>
    </div>
  );
}
