'use client';

interface ChartHeaderProps {
  property1?:
    | 'Selected-Default'
    | 'Selected-Anilab'
    | 'Selected-AnimeCorner'
    | 'UnSelected-AnimeCorner'
    | 'UnSelected-Anilab';
  className?: string;
}

export default function ChartHeader({
  property1 = 'Selected-Default',
  className = '',
}: ChartHeaderProps) {
  if (property1 === 'Selected-AnimeCorner') {
    return (
      <div
        className={`relative size-full ${className}`}
        data-name="Property 1=Selected-AnimeCorner"
      >
        <div className="relative size-full">
          <p
            className="absolute translate-x-[-50%] text-center text-sm leading-[18px] font-semibold text-nowrap whitespace-pre text-[#990033] not-italic sm:text-base sm:leading-[20px] md:text-lg md:leading-[22px]"
            style={{ top: 'calc(50% - 5px)', left: 'calc(50% + 0.5px)' }}
          >
            Anime Trend 🇺🇸
          </p>
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 border-[0px_0px_2px] border-solid border-[#990033]"
        />
      </div>
    );
  }
  if (property1 === 'UnSelected-AnimeCorner') {
    return (
      <div
        className={`relative size-full ${className}`}
        data-name="Property 1=UnSelected-AnimeCorner"
      >
        <p
          className="absolute translate-x-[-50%] text-center font-['Pretendard:Regular',_sans-serif] text-sm leading-[18px] text-nowrap whitespace-pre text-[#adb5bd] not-italic sm:text-base sm:leading-[20px] md:text-lg md:leading-[22px]"
          style={{ top: 'calc(50% - 5px)', left: 'calc(50% + 0.5px)' }}
        >
          Anime Trend
        </p>
      </div>
    );
  }
  if (property1 === 'Selected-Anilab') {
    return (
      <div
        className={`relative size-full ${className}`}
        data-name="Property 1=Selected-Anilab"
      >
        <div className="relative size-full">
          <p
            className="absolute left-1/2 translate-x-[-50%] text-center text-sm leading-[18px] font-semibold text-nowrap whitespace-pre text-[#990033] not-italic sm:text-base sm:leading-[20px] md:text-lg md:leading-[22px]"
            style={{ top: 'calc(50% - 5px)' }}
          >
            AniLab 🇯🇵
          </p>
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 border-[0px_0px_2px] border-solid border-[#990033]"
        />
      </div>
    );
  }
  if (property1 === 'UnSelected-Anilab') {
    return (
      <div
        className={`relative size-full ${className}`}
        data-name="Property 1=UnSelected-Anilab"
      >
        <p
          className="absolute left-1/2 translate-x-[-50%] text-center font-['Pretendard:Regular',_sans-serif] text-sm leading-[18px] text-nowrap whitespace-pre text-[#adb5bd] not-italic sm:text-base sm:leading-[20px] md:text-lg md:leading-[22px]"
          style={{ top: 'calc(50% - 5px)' }}
        >
          AniLab
        </p>
      </div>
    );
  }
  return (
    <div
      className={`relative size-full ${className}`}
      data-name="Property 1=Selected-Default"
    >
      <div className="relative size-full">
        <p
          className="absolute left-1/2 translate-x-[-50%] text-center text-sm leading-[18px] font-semibold text-nowrap whitespace-pre text-[#990033] not-italic sm:text-base sm:leading-[20px] md:text-lg md:leading-[22px]"
          style={{ top: 'calc(50% - 5px)' }}
        >
          애니메이션 순위 🇰🇷
        </p>
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 border-[0px_0px_2px] border-solid border-[#990033]"
      />
    </div>
  );
}
