'use client';

interface Top10AchievementProps {
  weeks: number;
  className?: string;
}

export default function Top10Achievement({
  weeks,
  className = '',
}: Top10AchievementProps) {
  return (
    <div
      className={`inline-flex h-32 flex-col items-end justify-between ${className}`}
    >
      {/* TOP10 달성 텍스트 */}
      <div className="inline-flex w-32 items-center justify-center gap-2">
        <img src="/icons/top10-icon.svg" alt="TOP10" className="size-7" />
        <div className="justify-start">
          <span className="text-lg font-normal text-white">TO</span>
          <span className="text-lg font-normal tracking-wide text-white">
            P10
          </span>
          <span className="text-lg font-normal text-white"> 달성</span>
        </div>
      </div>

      {/* 주차 수 */}
      <div className="inline-flex w-32 items-end justify-end gap-1.5 pr-2.5">
        <div className="justify-start text-right text-4xl font-semibold text-white">
          {weeks}
        </div>
        <div className="inline-flex h-12 w-4 flex-col items-end justify-end gap-3 pb-1.5">
          <div className="h-5 justify-start self-stretch text-right text-lg font-semibold text-white">
            주
          </div>
        </div>
      </div>
      <div className="inline-flex h-8 w-28 items-center justify-end gap-2.5 rounded-md p-2.5 outline outline-offset-[-1px] outline-white/30">
        <div className="size- inline-flex flex-col items-center justify-start gap-[3px]">
          <div className="size- inline-flex items-center justify-end gap-2.5 overflow-hidden">
            <div className="justify-start text-base leading-normal font-normal text-white">
              애니 정보
            </div>
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
