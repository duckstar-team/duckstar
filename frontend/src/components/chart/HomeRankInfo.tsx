'use client';

import { useRouter } from 'next/navigation';
import RankDiff from './RankDiff';
import Medal from './Medal';

interface HomeRankInfoProps {
  rank?: number;
  rankDiff?: "up-greater-equal-than-5" | "up-less-than-5" | "down-less-than-5" | "down-greater-equal-than-5" | "same-rank" | "new" | "Zero";
  rankDiffValue?: string | number;
  title?: string;
  studio?: string;
  image?: string;
  percentage?: string;
  medal?: "Gold" | "Silver" | "Bronze" | "None";
  type?: "ANIME" | "HERO" | "HEROINE";
  contentId?: number;
  isPrepared?: boolean;
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
  medal = "Gold",
  type = "ANIME",
  contentId = 1,
  isPrepared = true,
  className = ""
}: HomeRankInfoProps) {
  const router = useRouter();
  
  // 홈페이지에서는 간단한 라우터 사용 (스크롤 복원 훅 사용 안 함)

  const handleClick = () => {
    if (!contentId) return; // contentId가 null이면 클릭 무시
    
    // 홈페이지에서 상세화면으로 이동할 때 스크롤 및 상태 저장
    if (typeof window !== 'undefined') {
      const currentScrollY = window.scrollY || 0;
      
      console.log('🏠 HomeRankInfo: 스크롤 위치 저장:', currentScrollY);
      
      // 스크롤 위치 저장
      sessionStorage.setItem('home-scroll', currentScrollY.toString());
      sessionStorage.setItem('navigation-type', 'from-anime-detail');
      
      // 홈 상태 저장 플래그 설정
      sessionStorage.setItem('home-state-save', 'true');
      
      console.log('🏠 HomeRankInfo: 홈 상태 저장 플래그 설정');
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
      className={`w-full h-24 px-4 bg-white rounded-xl outline outline-1 outline-gray-200 inline-flex justify-start items-center gap-5 overflow-hidden ${contentId ? 'cursor-pointer hover:bg-gray-50' : 'cursor-default'} transition-colors ${className}`}
      onClick={handleClick}
    >
      {/* 왼쪽 영역 */}
      <div className="flex-1 flex justify-start items-center gap-5 pl-0.5">
        {/* 순위와 변화 */}
        <div className="w-5 self-stretch inline-flex flex-col justify-center items-center pb-1">
          <div className="text-center justify-start text-gray-500 text-3xl font-bold font-['Pretendard'] leading-snug">
            {rank}
          </div>
          <div className="self-stretch inline-flex justify-center items-center gap-px">
            <RankDiff property1={rankDiff} value={rankDiffValue} />
          </div>
        </div>
        
        {/* 애니메이션 이미지 */}
        <div className="w-14 h-20 relative">
          <img className="w-14 h-20 left-0 top-0 absolute rounded-lg" src={image} alt={title} />
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
        {/* 퍼센트 */}
        <div className={`-right-[3px] top-[46px] absolute text-right justify-start ${rank === 1 ? 'opacity-75' : ''}`}>
          {rank <= 3 ? (
            // 1등, 2등, 3등 스타일
            <>
              {isPrepared && (
                <span className={`text-3xl font-semibold font-['Pretendard'] leading-snug tracking-widest ${rank === 1 ? 'text-rose-800' : 'text-[#CED4DA]'}`}>
                  {percentage}
                </span>
              )}
              <span className={`text-2xl font-semibold font-['Pretendard'] leading-snug tracking-widest ${rank === 1 ? 'text-rose-800' : 'text-[#CED4DA]'}`}>
                %
              </span>
            </>
          ) : (
            // 4등 이하 스타일
            <>
              {isPrepared && (
                <span className="text-[#CED4DA] text-2xl font-normal font-['Pretendard'] leading-snug tracking-widest">
                  {percentage}
                </span>
              )}
              <span className="text-[#CED4DA] text-xl font-normal font-['Pretendard'] leading-snug tracking-widest">
                %
              </span>
            </>
          )}
        </div>
        
        {/* 메달 */}
        <div className="w-7 left-[113px] top-0 absolute inline-flex justify-center items-center gap-2.5">
          <Medal property1={medal} />
        </div>
        
        {/* 구분선 */}
        <div className="w-0 h-12 left-0 top-[24px] absolute outline outline-1 outline-offset-[-0.50px] outline-gray-200" />
      </div>
    </div>
  );
}
