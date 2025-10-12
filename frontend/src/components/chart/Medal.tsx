'use client';

interface MedalProps {
  property1?: "Gold" | "Silver" | "Bronze" | "None";
  className?: string;
}

export default function Medal({ 
  property1 = "Gold",
  className = ""
}: MedalProps) {
  if (property1 === "Silver") {
    return (
      <div className={`content-stretch flex gap-[6px] xs:gap-[10px] sm:gap-[10px] items-center justify-center relative size-full ${className}`}>
        <div className="h-[32px] xs:h-[44.785px] sm:h-[44.785px] relative shrink-0 w-[20px] xs:w-[28.586px] sm:w-[28.586px]">
          <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src="/icons/medal-silver.svg" />
        </div>
      </div>
    );
  }
  if (property1 === "Bronze") {
    return (
      <div className={`content-stretch flex gap-[6px] xs:gap-[10px] sm:gap-[10px] items-center justify-center relative size-full ${className}`}>
        <div className="h-[32px] xs:h-[44.785px] sm:h-[44.785px] relative shrink-0 w-[20px] xs:w-[28.794px] sm:w-[28.794px]">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <img alt="" className="absolute left-0 max-w-none size-full top-0" src="/icons/medal-bronze.svg" />
          </div>
        </div>
      </div>
    );
  }
  if (property1 === "None") {
    return <div className={`size-full ${className}`} />;
  }
  return (
    <div className={`content-stretch flex gap-[6px] xs:gap-[10px] sm:gap-[10px] items-center justify-center relative size-full ${className}`}>
      <div className="h-[32px] xs:h-[44.785px] sm:h-[44.785px] relative shrink-0 w-[21px] xs:w-[29.54px] sm:w-[29.54px]">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img alt="" className="absolute left-0 max-w-none size-full top-0" src="/icons/medal-gold.svg" />
        </div>
      </div>
    </div>
  );
}
