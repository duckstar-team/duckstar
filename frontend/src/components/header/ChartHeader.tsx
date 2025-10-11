'use client';

interface ChartHeaderProps {
  property1?: "Selected-Default" | "Selected-Anilab" | "Selected-AnimeCorner" | "UnSelected-AnimeCorner" | "UnSelected-Anilab";
  className?: string;
}

export default function ChartHeader({ 
  property1 = "Selected-Default",
  className = ""
}: ChartHeaderProps) {
  if (property1 === "Selected-AnimeCorner") {
    return (
      <div className={`relative size-full ${className}`} data-name="Property 1=Selected-AnimeCorner">
        <div className="relative size-full">
          <p className="absolute font-['Pretendard'] font-semibold leading-[18px] sm:leading-[20px] md:leading-[22px] not-italic text-[#990033] text-sm sm:text-base md:text-lg text-center text-nowrap translate-x-[-50%] whitespace-pre" style={{ top: "calc(50% - 5px)", left: "calc(50% + 0.5px)" }}>
            Anime Trend 🇺🇸
          </p>
        </div>
        <div aria-hidden="true" className="absolute border-[#990033] border-[0px_0px_2px] border-solid inset-0 pointer-events-none" />
      </div>
    );
  }
  if (property1 === "UnSelected-AnimeCorner") {
    return (
      <div className={`relative size-full ${className}`} data-name="Property 1=UnSelected-AnimeCorner">
        <p className="absolute font-['Pretendard:Regular',_sans-serif] leading-[18px] sm:leading-[20px] md:leading-[22px] not-italic text-[#adb5bd] text-sm sm:text-base md:text-lg text-center text-nowrap translate-x-[-50%] whitespace-pre" style={{ top: "calc(50% - 5px)", left: "calc(50% + 0.5px)" }}>
          Anime Trend
        </p>
      </div>
    );
  }
  if (property1 === "Selected-Anilab") {
    return (
      <div className={`relative size-full ${className}`} data-name="Property 1=Selected-Anilab">
        <div className="relative size-full">
          <p className="absolute font-['Pretendard'] font-semibold leading-[18px] sm:leading-[20px] md:leading-[22px] left-1/2 not-italic text-[#990033] text-sm sm:text-base md:text-lg text-center text-nowrap translate-x-[-50%] whitespace-pre" style={{ top: "calc(50% - 5px)" }}>
            AniLab 🇯🇵
          </p>
        </div>
        <div aria-hidden="true" className="absolute border-[#990033] border-[0px_0px_2px] border-solid inset-0 pointer-events-none" />
      </div>
    );
  }
  if (property1 === "UnSelected-Anilab") {
    return (
      <div className={`relative size-full ${className}`} data-name="Property 1=UnSelected-Anilab">
        <p className="absolute font-['Pretendard:Regular',_sans-serif] leading-[18px] sm:leading-[20px] md:leading-[22px] left-1/2 not-italic text-[#adb5bd] text-sm sm:text-base md:text-lg text-center text-nowrap translate-x-[-50%] whitespace-pre" style={{ top: "calc(50% - 5px)" }}>
          AniLab
        </p>
      </div>
    );
  }
  return (
    <div className={`relative size-full ${className}`} data-name="Property 1=Selected-Default">
      <div className="relative size-full">
        <p className="absolute font-['Pretendard'] font-semibold leading-[18px] sm:leading-[20px] md:leading-[22px] left-1/2 not-italic text-[#990033] text-sm sm:text-base md:text-lg text-center text-nowrap translate-x-[-50%] whitespace-pre" style={{ top: "calc(50% - 5px)" }}>
          애니메이션 순위 🇰🇷
        </p>
      </div>
      <div aria-hidden="true" className="absolute border-[#990033] border-[0px_0px_2px] border-solid inset-0 pointer-events-none" />
    </div>
  );
}
