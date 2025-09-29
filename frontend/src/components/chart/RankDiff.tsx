'use client';

interface RankDiffProps {
  property1?: "up-greater-equal-than-5" | "up-less-than-5" | "down-less-than-5" | "down-greater-equal-than-5" | "same-rank" | "new" | "Zero";
  value?: string | number;
  className?: string;
}

export default function RankDiff({ 
  property1 = "up-greater-equal-than-5",
  value = "5",
  className = ""
}: RankDiffProps) {
  if (property1 === "up-less-than-5") {
    return (
      <div className={`content-stretch flex gap-px items-center justify-center relative size-full ${className}`}>
        <div className="h-[8px] relative shrink-0 w-[12px]">
          <img alt="" className="block max-w-none size-full" src="/icons/up.svg" />
        </div>
        <p className="font-['Pretendard'] font-normal leading-[22px] not-italic relative shrink-0 text-[#18b700] text-[14px] text-center text-nowrap whitespace-pre">
          {value}
        </p>
      </div>
    );
  }
  if (property1 === "same-rank") {
    return (
      <div className={`content-stretch flex gap-px items-center justify-center relative size-full ${className}`}>
        <div className="flex h-[12px] items-center justify-center relative shrink-0 w-[8px]">
          <div className="flex-none rotate+90">
            <div className="h-[8px] relative w-[12px]">
              <img alt="" className="block max-w-none size-full" src="/icons/consecutive.svg" />
            </div>
          </div>
        </div>
        <p className="font-['Pretendard'] font-normal leading-[22px] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap whitespace-pre">
          {value}주
        </p>
      </div>
    );
  }
  if (property1 === "down-less-than-5") {
    return (
      <div className={`content-stretch flex gap-px items-center justify-center relative size-full ${className}`}>
        <div className="h-[8px] relative shrink-0 w-[12px]">
          <img alt="" className="block max-w-none size-full" src="/icons/down.svg" />
        </div>
        <p className="font-['Pretendard'] font-normal leading-[22px] not-italic relative shrink-0 text-[#b70000] text-[14px] text-center text-nowrap whitespace-pre">
          {value}
        </p>
      </div>
    );
  }
  if (property1 === "down-greater-equal-than-5") {
    return (
      <div className={`content-stretch flex gap-px items-center justify-center relative size-full ${className}`}>
        <div className="h-[10px] relative shrink-0 w-[10.392px]">
          <img alt="" className="block max-w-none size-full" src="/icons/double-down.svg" />
        </div>
        <p className="font-['Pretendard'] font-normal leading-[22px] not-italic relative shrink-0 text-[#b70000] text-[14px] text-center text-nowrap whitespace-pre">
          {value}
        </p>
      </div>
    );
  }
  if (property1 === "new") {
    return (
      <div className={`content-stretch flex gap-px items-center justify-center relative size-full ${className}`}>
        <p className="font-['Pretendard'] font-normal leading-[22px] not-italic relative shrink-0 text-[#0088ff] text-[12px] text-center text-nowrap whitespace-pre">
          NEW
        </p>
      </div>
    );
  }
  if (property1 === "Zero") {
    return (
      <div className={`content-stretch flex gap-px items-center justify-center relative size-full ${className}`}>
        <div className="h-[2px] relative shrink-0 w-[10px] mt-1">
          <div className="w-full h-full bg-black"></div>
        </div>
      </div>
    );
  }
  return (
    <div className={`content-stretch flex gap-px items-center justify-center relative size-full ${className}`}>
      <div className="h-[10px] relative shrink-0 w-[10.392px]">
        <img alt="" className="block max-w-none size-full" src="/icons/double-up.svg" />
      </div>
      <p className="font-['Pretendard'] font-normal leading-[22px] not-italic relative shrink-0 text-[#18b700] text-[14px] text-center text-nowrap whitespace-pre">
        {value}
      </p>
    </div>
  );
}
