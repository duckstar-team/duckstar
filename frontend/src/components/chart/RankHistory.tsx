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
  className = ""
}: RankHistoryProps) {
  return (
    <div className={`min-w-[105px] h-32 inline-flex flex-col justify-start items-center gap-1.5 ${className}`}>
      {/* 헤더 */}
      <div className="self-stretch h-7 py-px inline-flex justify-center items-center gap-2">
        <img 
          src={icon} 
          alt={label} 
          className="size-7"
        />
        <div className="justify-start text-white text-lg font-normal font-['Pretendard'] leading-relaxed">{label}</div>
      </div>
      
      {/* 순위 정보 */}
      <div className="self-stretch flex-1 px-3.5 pt-2.5 pb-3.5 rounded-lg outline outline-1 outline-offset-[-1px] outline-rose-600 flex flex-col justify-center items-center gap-3">
        <div className="size- flex flex-col justify-center items-center gap-1.5">
          <div className="text-center justify-start">
            <span className="text-rose-600 text-xl font-semibold font-['Pretendard']"># </span>
            <span className="text-rose-600 text-4xl font-semibold font-['Pretendard']">{rank}</span>
          </div>
          <div className="size- border-b border-white inline-flex justify-center items-center gap-2.5">
            <div className="w-16 text-center justify-start text-white text-base font-light font-['Pretendard']">{formatDate(date)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
