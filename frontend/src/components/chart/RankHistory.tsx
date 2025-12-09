'use client';

interface RankHistoryProps {
  rank: number;
  date: string;
  icon: string;
  label: string;
  className?: string;
}

// 날짜 형식 변환 함수 (YYYY-MM-DD -> YY.MM.DD)
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const year = date.getFullYear().toString().slice(-2); // 마지막 2자리
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}.${month}.${day}`;
  } catch (error) {
    return dateString; // 변환 실패 시 원본 반환
  }
}

export default function RankHistory({
  rank,
  date,
  icon,
  label,
  className = '',
}: RankHistoryProps) {
  return (
    <div
      className={`inline-flex h-32 min-w-[105px] flex-col items-center justify-start gap-1.5 ${className}`}
    >
      {/* 헤더 */}
      <div className="inline-flex h-7 items-center justify-center gap-2 self-stretch py-px">
        <img src={icon} alt={label} className="size-7" />
        <div className="justify-start text-lg leading-relaxed font-normal text-white">
          {label}
        </div>
      </div>

      {/* 순위 정보 */}
      <div className="flex flex-1 flex-col items-center justify-center gap-3 self-stretch rounded-lg px-3.5 pt-2.5 pb-3.5 outline outline-offset-[-1px] outline-rose-600">
        <div className="size- flex flex-col items-center justify-center gap-1.5">
          <div className="justify-start text-center">
            <span className="text-xl font-semibold text-rose-600"># </span>
            <span className="text-4xl font-semibold text-rose-600">{rank}</span>
          </div>
          <div className="size- inline-flex items-center justify-center gap-2.5 border-b border-white">
            <div className="w-16 justify-start text-center text-base font-light text-white">
              {formatDate(date)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
