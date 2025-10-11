'use client';

interface Top10AchievementProps {
  weeks: number;
  className?: string;
}

export default function Top10Achievement({
  weeks,
  className = ""
}: Top10AchievementProps) {
  return (
    <div className={`h-32 inline-flex flex-col justify-between items-end ${className}`}>
      {/* TOP10 달성 텍스트 */}
      <div className="w-32 inline-flex justify-center items-center gap-2">
        <img 
          src="/icons/top10-icon.svg" 
          alt="TOP10" 
          className="size-7"
        />
        <div className="justify-start">
          <span className="text-white text-lg font-normal font-['Pretendard']">TO</span>
          <span className="text-white text-lg font-normal font-['Pretendard'] tracking-wide">P10</span>
          <span className="text-white text-lg font-normal font-['Pretendard']"> 달성</span>
        </div>
      </div>
      
      {/* 주차 수 */}
      <div className="w-32 pr-2.5 inline-flex justify-end items-end gap-1.5">
        <div className="text-right justify-start text-white text-4xl font-semibold font-['Pretendard']">{weeks}</div>
        <div className="w-4 h-12 pb-1.5 inline-flex flex-col justify-end items-end gap-3">
          <div className="self-stretch h-5 text-right justify-start text-white text-lg font-semibold font-['Pretendard']">주</div>
        </div>
      </div>
      <div className="w-28 h-8 p-2.5 rounded-md outline outline-1 outline-offset-[-1px] outline-white/30 inline-flex justify-end items-center gap-2.5">
        <div className="size- inline-flex flex-col justify-start items-center gap-[3px]">
          <div className="size- inline-flex justify-end items-center gap-2.5 overflow-hidden">
            <div className="justify-start text-white text-base font-normal font-['Pretendard'] leading-normal">애니 정보</div>
            <img 
              src="/icons/navigate-anime-home.svg" 
              alt="애니 정보" 
              className="size-5"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
