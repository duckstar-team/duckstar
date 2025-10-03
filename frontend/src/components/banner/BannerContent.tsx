'use client';

interface BannerContentProps {
  header?: string;
  title?: string;
  source?: string;
  date?: string;
  className?: string;
}

export default function BannerContent({ 
  header = "🔥 HOT 급상승 애니메이션",
  title = "내가 연인이 될 수 있을 리 없잖아, 무리무리! (※무리가 아니었다?!)",
  source = "Anilab",
  date = "9/21 기준",
  className = ""
}: BannerContentProps) {
  return (
    <div className={`${className}`}>
      {/* 헤더 */}
      <div className="mb-1.5">
        <div className="justify-start text-black text-lg font-semibold font-['Pretendard']">
          {header}
        </div>
      </div>
      
      {/* 제목과 소스 - 세로 리스트 */}
      <div className="flex flex-col pl-[23px] gap-[8px]">
        {/* 제목 */}
        <div className="w-80">
          <div className="justify-start text-black text-2xl font-bold font-['Pretendard']">
            {title.split(', ').map((line, index) => (
              <span key={index}>
                {line}
                {index === 0 && <br />}
              </span>
            ))}
          </div>
        </div>
        
        {/* 소스 */}
        <div>
          <div className="justify-start text-gray-400 text-base font-normal font-['Pretendard']">
            {source}{date && `, ${date}`}
          </div>
        </div>
      </div>
    </div>
  );
}
