'use client';

interface RankDiffProps {
  property1?:
    | 'up-greater-equal-than-5'
    | 'up-less-than-5'
    | 'down-less-than-5'
    | 'down-greater-equal-than-5'
    | 'same-rank'
    | 'new'
    | 'Zero';
  value?: string | number;
  className?: string;
}

export default function RankDiff({
  property1 = 'up-greater-equal-than-5',
  value = '5',
  className = '',
}: RankDiffProps) {
  if (property1 === 'up-less-than-5') {
    return (
      <div
        className={`relative flex size-full content-stretch items-center justify-center gap-px ${className}`}
      >
        <div className="relative h-[8px] w-[12px] shrink-0">
          <img
            alt=""
            className="block size-full max-w-none"
            src="/icons/up.svg"
          />
        </div>
        <p className="relative shrink-0 text-center text-[14px] leading-[22px] font-normal text-nowrap whitespace-pre text-[#18b700] not-italic">
          {value}
        </p>
      </div>
    );
  }
  if (property1 === 'same-rank') {
    return (
      <div
        className={`relative flex size-full content-stretch items-center justify-center gap-px ${className}`}
      >
        <div className="relative flex h-[12px] w-[8px] shrink-0 items-center justify-center">
          <div className="rotate+90 flex-none">
            <div className="relative h-[8px] w-[12px]">
              <img
                alt=""
                className="block size-full max-w-none"
                src="/icons/consecutive.svg"
              />
            </div>
          </div>
        </div>
        <p className="relative shrink-0 text-center text-[12px] leading-[22px] font-normal text-nowrap whitespace-pre text-black not-italic">
          {value}주
        </p>
      </div>
    );
  }
  if (property1 === 'down-less-than-5') {
    return (
      <div
        className={`relative flex size-full content-stretch items-center justify-center gap-px ${className}`}
      >
        <div className="relative h-[8px] w-[12px] shrink-0">
          <img
            alt=""
            className="block size-full max-w-none"
            src="/icons/down.svg"
          />
        </div>
        <p className="relative shrink-0 text-center text-[14px] leading-[22px] font-normal text-nowrap whitespace-pre text-[#b70000] not-italic">
          {value}
        </p>
      </div>
    );
  }
  if (property1 === 'down-greater-equal-than-5') {
    return (
      <div
        className={`relative flex size-full content-stretch items-center justify-center gap-px ${className}`}
      >
        <div className="relative h-[10px] w-[10.392px] shrink-0">
          <img
            alt=""
            className="block size-full max-w-none"
            src="/icons/double-down.svg"
          />
        </div>
        <p className="relative shrink-0 text-center text-[14px] leading-[22px] font-normal text-nowrap whitespace-pre text-[#b70000] not-italic">
          {value}
        </p>
      </div>
    );
  }
  if (property1 === 'new') {
    return (
      <div
        className={`relative flex size-full content-stretch items-center justify-center gap-px ${className}`}
      >
        <p className="relative shrink-0 text-center text-[12px] leading-[22px] font-normal text-nowrap whitespace-pre text-[#0088ff] not-italic">
          NEW
        </p>
      </div>
    );
  }
  if (property1 === 'Zero') {
    return (
      <div
        className={`relative flex size-full content-stretch items-center justify-center gap-px ${className}`}
      >
        <div className="relative mt-1 h-[2px] w-[10px] shrink-0">
          <div className="h-full w-full bg-black"></div>
        </div>
      </div>
    );
  }
  return (
    <div
      className={`relative flex size-full content-stretch items-center justify-center gap-px ${className}`}
    >
      <div className="relative h-[10px] w-[10.392px] shrink-0">
        <img
          alt=""
          className="block size-full max-w-none"
          src="/icons/double-up.svg"
        />
      </div>
      <p className="relative shrink-0 text-center text-[14px] leading-[22px] font-normal text-nowrap whitespace-pre text-[#18b700] not-italic">
        {value}
      </p>
    </div>
  );
}
