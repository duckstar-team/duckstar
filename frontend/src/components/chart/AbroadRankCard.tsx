'use client';

import { useRouter } from 'next/navigation';
import ImagePlaceholder from '../common/ImagePlaceholder';
import RankDiff from './RankDiff';

interface AbroadRankCardProps {
  rank?: number;
  rankDiff?: "up-greater-equal-than-5" | "up-less-than-5" | "down-less-than-5" | "down-greater-equal-than-5" | "same-rank" | "new" | "Zero";
  rankDiffValue?: string | number;
  title?: string;
  studio?: string;
  image?: string;
  weeks?: number;
  type?: "ANIME" | "HERO" | "HEROINE";
  contentId?: number;
  isWinner?: boolean;
  className?: string;
}

export default function AbroadRankCard({
  rank = 1,
  rankDiff = "new",
  rankDiffValue = "NEW",
  title = "タコピーの原罪",
  studio = "ENISHIYA",
  image = "",
  weeks = 13,
  type = "ANIME",
  contentId = 1,
  isWinner = false,
  className = ""
}: AbroadRankCardProps) {
  const router = useRouter();

  const handleClick = () => {
    if (!contentId) return;
    
    if (type === "ANIME") {
      router.push(`/animes/${contentId}`);
    } else {
      router.push(`/characters/${contentId}`);
    }
  };

  return (
    <div 
      className={`w-[320px] xs:w-[350px] sm:w-[370px] ${isWinner ? 'h-[180px] xs:h-[195px] sm:h-[210px]' : 'h-[120px] xs:h-[130px] sm:h-[140px]'} pl-3 xs:pl-4 sm:pl-5 py-1.5 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-zinc-300 inline-flex justify-start items-center gap-3 xs:gap-4 sm:gap-5 flex-wrap content-center overflow-hidden ${contentId ? 'cursor-pointer hover:bg-gray-50' : 'cursor-default'} transition-colors ${className}`}
      onClick={handleClick}
    >
      {/* 순위 섹션 */}
      <div className="w-6 xs:w-7 sm:w-8 self-stretch inline-flex flex-col justify-center items-center pb-1">
        <div className="text-center justify-start text-gray-500 text-2xl xs:text-3xl sm:text-3xl font-bold font-['Pretendard'] leading-snug">
          {rank}
        </div>
        <div className="self-stretch inline-flex justify-center items-center gap-px">
          <RankDiff property1={rankDiff} value={rankDiffValue} />
        </div>
      </div>

      {/* 애니메이션 이미지 */}
      <div className="w-[50px] xs:w-[60px] sm:w-[70px] h-[66.7px] xs:h-[80px] sm:h-[93.3px] relative">
        {image && image.trim() !== '' ? (
          <img 
            className="w-[50px] xs:w-[60px] sm:w-[70px] h-[66.7px] xs:h-[80px] sm:h-[93.3px] rounded-lg object-cover" 
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
          className="w-[50px] xs:w-[60px] sm:w-[70px] h-[66.7px] xs:h-[80px] sm:h-[93.3px] rounded-lg"
          style={{ display: !image || image.trim() === '' ? 'flex' : 'none' }}
        >
          <ImagePlaceholder type="anime" />
        </div>
      </div>

      {/* 제목과 스튜디오 */}
      <div className="w-40 xs:w-40 sm:w-45 h-20 xs:h-22 sm:h-24 inline-flex flex-col justify-center items-start">
        <div className="self-stretch inline-flex justify-start items-start gap-2.5">
          <div className="w-44 xs:w-52 sm:w-52 justify-start text-[#495057] text-lg xs:text-xl sm:text-xl font-bold font-['Pretendard'] leading-relaxed line-clamp-3">
            {title}
          </div>
        </div>
        <div className="self-stretch justify-start text-[#868E96] text-xs xs:text-sm sm:text-sm font-normal font-['Pretendard'] leading-relaxed">
          {studio}
        </div>
      </div>
    </div>
  );
}
