interface MedalProps {
  property1?: 'GOLD' | 'SILVER' | 'BRONZE' | 'NONE';
  className?: string;
}

export default function Medal({
  property1 = 'GOLD',
  className = '',
}: MedalProps) {
  if (property1 === 'SILVER') {
    return (
      <div
        className={`xs:gap-[10px] relative flex size-full content-stretch items-center justify-center gap-[6px] sm:gap-[10px] ${className}`}
      >
        <div className="xs:h-[44.785px] xs:w-[28.586px] relative h-[32px] w-[20px] shrink-0 sm:h-[44.785px] sm:w-[28.586px]">
          <img
            alt=""
            className="object-50%-50% pointer-events-none absolute inset-0 size-full max-w-none object-cover"
            src="/icons/medal-silver.svg"
          />
        </div>
      </div>
    );
  }
  if (property1 === 'BRONZE') {
    return (
      <div
        className={`xs:gap-[10px] relative flex size-full content-stretch items-center justify-center gap-[6px] sm:gap-[10px] ${className}`}
      >
        <div className="xs:h-[44.785px] xs:w-[28.794px] relative h-[32px] w-[20px] shrink-0 sm:h-[44.785px] sm:w-[28.794px]">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <img
              alt=""
              className="absolute top-0 left-0 size-full max-w-none"
              src="/icons/medal-bronze.svg"
            />
          </div>
        </div>
      </div>
    );
  }
  if (property1 === 'NONE') {
    return <div className={`size-full ${className}`} />;
  }
  return (
    <div
      className={`xs:gap-[10px] relative flex size-full content-stretch items-center justify-center gap-[6px] sm:gap-[10px] ${className}`}
    >
      <div className="xs:h-[44.785px] xs:w-[29.54px] relative h-[32px] w-[21px] shrink-0 sm:h-[44.785px] sm:w-[29.54px]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <img
            alt=""
            className="absolute top-0 left-0 size-full max-w-none"
            src="/icons/medal-gold.svg"
          />
        </div>
      </div>
    </div>
  );
}
