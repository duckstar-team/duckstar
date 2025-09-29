'use client';

import { useRouter } from 'next/navigation';
import RankDiff from './RankDiff';

interface AbroadRankInfoProps {
  rank?: number;
  rankDiff?: "up-greater-equal-than-5" | "up-less-than-5" | "down-less-than-5" | "down-greater-equal-than-5" | "same-rank" | "new" | "Zero";
  rankDiffValue?: string | number;
  title?: string;
  studio?: string;
  image?: string;
  type?: "ANIME" | "HERO" | "HEROINE";
  contentId?: number;
  className?: string;
}

export default function AbroadRankInfo({
  rank = 4,
  rankDiff = "new",
  rankDiffValue = "NEW",
  title = "タコピーの原罪",
  studio = "ENISHIYA",
  image = "https://placehold.co/60x80",
  type = "ANIME",
  contentId = 1,
  className = ""
}: AbroadRankInfoProps) {
  const router = useRouter();
  
  // 홈페이지에서는 간단한 라우터 사용 (스크롤 복원 훅 사용 안 함)

  const handleClick = () => {
    if (!contentId) return; // contentId가 null이면 클릭 무시
    
    // 홈페이지에서 상세화면으로 이동할 때 스크롤 및 상태 저장
    if (typeof window !== 'undefined') {
      const currentScrollY = window.scrollY || 0;
      
      console.log('🏠 AbroadRankInfo: 스크롤 위치 저장:', currentScrollY);
      
      // 스크롤 위치 저장
      sessionStorage.setItem('home-scroll', currentScrollY.toString());
      sessionStorage.setItem('navigation-type', 'from-anime-detail');
      
      // 홈 상태 저장 플래그 설정
      sessionStorage.setItem('home-state-save', 'true');
      
      console.log('🏠 AbroadRankInfo: 홈 상태 저장 플래그 설정');
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
      className={`w-80 h-24 relative bg-white rounded-xl outline outline-1 outline-gray-200 overflow-hidden ${contentId ? 'cursor-pointer hover:bg-gray-50' : 'cursor-default'} transition-colors ${className}`}
      onClick={handleClick}
    >
      <div className="size- left-[16px] top-[8px] absolute inline-flex justify-start items-center gap-5 pl-1">
        {/* 순위와 변화 - HomeRankInfo와 동일한 레이아웃 */}
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
        <div className="w-40 inline-flex flex-col justify-start items-start">
          <div className="w-40 justify-start text-black text-lg font-semibold font-['Pretendard'] leading-snug line-clamp-2">
            {title}
          </div>
          <div className="text-center justify-start text-gray-400 text-sm font-normal font-['Pretendard'] leading-snug truncate">
            {studio}
          </div>
        </div>
      </div>
    </div>
  );
}
