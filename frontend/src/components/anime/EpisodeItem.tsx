
interface EpisodeItemProps {
  property1?: "past" | "current" | "future" | "filterSelectForPast" | "filterSelectForCurrent";
  episodeNumber?: number;
  quarter?: string;
  week?: string;
  showFilter?: boolean;
  isLast?: boolean;
  isHovered?: boolean;
  onMouseEnter?: () => void;
  onMouseMove?: (e: React.MouseEvent) => void;
  onMouseLeave?: () => void;
  onClick?: () => void;
  disableCursor?: boolean; // 커서 비활성화 옵션
}

export default function EpisodeItem({ 
  property1 = "past", 
  episodeNumber = 1,
  quarter = "3분기",
  week = "3주차",
  showFilter = false,
  isLast = false,
  isHovered = false,
  onMouseEnter,
  onMouseMove,
  onMouseLeave,
  onClick,
  disableCursor = false
}: EpisodeItemProps) {
  // 1. past variant
  if (property1 === "past") {
    return (
      <div className={`${episodeNumber % 6 === 0 ? 'w-16' : 'w-20'} flex flex-col justify-start items-start gap-3 overflow-visible`}>
        <div className={`${episodeNumber % 6 === 0 ? 'w-16' : 'w-20'} h-6`} />
        <div className={`${episodeNumber % 6 === 0 ? 'w-16' : 'w-20'} inline-flex justify-start items-center overflow-visible ${disableCursor ? '' : 'cursor-pointer'}`} onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
          <div 
            className={`w-8 h-8 rounded-2xl inline-flex flex-col justify-center items-center ${disableCursor ? '' : 'cursor-pointer'} transition-transform duration-200 relative z-10 ${isHovered ? 'scale-110' : ''}`} 
            style={{ backgroundColor: '#FFB310' }}
            onMouseMove={onMouseMove}
            onClick={(e) => { e.stopPropagation(); onClick?.(); }}
          >
            <div className="text-center text-white text-lg font-normal font-['Pretendard'] leading-tight">{episodeNumber}</div>
          </div>
          {!isLast && <div className={`h-0 outline outline-1 outline-offset-[-0.58px] cursor-pointer pointer-events-none ${episodeNumber % 6 === 0 ? 'w-8' : 'w-12'}`} style={{ outlineColor: '#FFB310' }}></div>}
        </div>
      </div>
    );
  }

  // 2. current variant
  if (property1 === "current") {
    return (
      <div className={`${episodeNumber % 6 === 0 ? 'w-16' : 'w-20'} flex flex-col justify-start items-start gap-3 overflow-visible`}>
        <div className={`${episodeNumber % 6 === 0 ? 'w-16' : 'w-20'} h-6`} />
        <div className={`${episodeNumber % 6 === 0 ? 'w-16' : 'w-20'} inline-flex justify-start items-center overflow-visible ${disableCursor ? '' : 'cursor-pointer'}`} onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
          <div 
            className={`w-8 h-8 bg-white rounded-2xl outline outline-1 outline-offset-[-1px] inline-flex flex-col justify-center items-center ${disableCursor ? '' : 'cursor-pointer'} transition-transform duration-200 relative z-10 ${isHovered ? 'scale-110' : ''}`} 
            style={{ outlineColor: '#FFB310' }}
            onMouseMove={onMouseMove}
            onClick={(e) => { e.stopPropagation(); onClick?.(); }}
          >
            <div className="text-center text-lg font-normal font-['Pretendard'] leading-tight" style={{ color: '#FFB310' }}>{episodeNumber}</div>
          </div>
          {!isLast && <div className={`h-0 outline outline-1 outline-offset-[-0.58px] cursor-pointer pointer-events-none ${episodeNumber % 6 === 0 ? 'w-8' : 'w-12'}`} style={{ outlineColor: '#FFB310' }}></div>}
        </div>
      </div>
    );
  }

  // 3. future variant
  if (property1 === "future") {
    return (
      <div className={`${episodeNumber % 6 === 0 ? 'w-16' : 'w-20'} flex flex-col justify-start items-start gap-3 overflow-visible`}>
        <div className={isLast ? `${episodeNumber % 6 === 0 ? 'w-16' : 'w-20'} h-6 pl-2.5` : `${episodeNumber % 6 === 0 ? 'w-16' : 'w-20'} h-6 pl-2.5`} />
        <div className={`${episodeNumber % 6 === 0 ? 'w-16' : 'w-20'} inline-flex justify-start items-center overflow-visible`} onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
          <div 
            className={`w-8 h-8 rounded-2xl outline outline-1 outline-offset-[-1px] inline-flex flex-col justify-center items-center transition-transform duration-200 relative z-10 ${isHovered ? 'scale-110' : ''}`} 
            style={{ backgroundColor: '#F8F9FA', outlineColor: '#CED4DA' }}
            onMouseMove={onMouseMove}
          >
            <div className="text-center text-lg font-normal font-['Pretendard'] leading-tight" style={{ color: '#CED4DA' }}>{episodeNumber}</div>
          </div>
          {!isLast && <div className={`h-0 outline outline-1 outline-offset-[-0.58px] pointer-events-none ${episodeNumber % 6 === 0 ? 'w-8' : 'w-12'}`} style={{ outlineColor: '#CED4DA' }}></div>}
        </div>
      </div>
    );
  }

  // 4. filterSelectForPast variant
  if (property1 === "filterSelectForPast") {
    return (
      <div className={`${episodeNumber % 6 === 0 ? 'w-16' : 'w-20'} flex flex-col justify-start items-start gap-3 overflow-visible`}>
        <div className="self-stretch pl-2.5 inline-flex justify-start items-center gap-2.5">
          <div className="size- flex justify-center items-center gap-2.5">
            <img 
              src="/icons/diamond-filter.svg" 
              alt="diamond filter" 
              className="w-3.5 h-6"
            />
          </div>
        </div>
        <div className={`${episodeNumber % 6 === 0 ? 'w-16' : 'w-20'} inline-flex justify-start items-center overflow-visible cursor-pointer`} onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
          <div 
            className={`w-8 h-8 bg-rose-800 rounded-2xl inline-flex flex-col justify-center items-center cursor-pointer transition-transform duration-200 relative z-10 ${isHovered ? 'scale-110' : ''}`}
            onMouseMove={onMouseMove}
            onClick={(e) => { e.stopPropagation(); onClick?.(); }}
          >
            <div className="text-center text-white text-lg font-normal font-['Pretendard'] leading-tight">{episodeNumber}</div>
          </div>
          {!isLast && <div className={`h-0 outline outline-1 outline-offset-[-0.58px] outline-rose-800 cursor-pointer pointer-events-none ${episodeNumber % 6 === 0 ? 'w-8' : 'w-12'}`}></div>}
        </div>
      </div>
    );
  }

  // 5. filterSelectForCurrent variant
  if (property1 === "filterSelectForCurrent") {
    return (
      <div className={`${episodeNumber % 6 === 0 ? 'w-16' : 'w-20'} flex flex-col justify-start items-start gap-3 overflow-visible`}>
        <div className="self-stretch pl-2.5 inline-flex justify-start items-center gap-2.5">
          <div className="size- flex justify-center items-center gap-2.5">
            <img 
              src="/icons/diamond-filter.svg" 
              alt="diamond filter" 
              className="w-3.5 h-6"
            />
          </div>
        </div>
        <div className={`${episodeNumber % 6 === 0 ? 'w-16' : 'w-20'} inline-flex justify-start items-center overflow-visible cursor-pointer`} onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
          <div 
            className={`w-8 h-8 bg-white rounded-2xl outline outline-1 outline-offset-[-1px] outline-rose-800 inline-flex flex-col justify-center items-center cursor-pointer transition-transform duration-200 relative z-10 ${isHovered ? 'scale-110' : ''}`}
            onMouseMove={onMouseMove}
            onClick={(e) => { e.stopPropagation(); onClick?.(); }}
          >
            <div className="text-center text-rose-800 text-lg font-normal font-['Pretendard'] leading-tight">{episodeNumber}</div>
          </div>
          {!isLast && <div className={`h-0 outline outline-1 outline-offset-[-0.58px] outline-rose-800 cursor-pointer pointer-events-none ${episodeNumber % 6 === 0 ? 'w-8' : 'w-12'}`}></div>}
        </div>
      </div>
    );
  }

  // 기본값 (past)
  return (
    <div className={`${episodeNumber % 6 === 0 ? 'w-16' : 'w-20'} flex flex-col justify-start items-start gap-3 pb-[12px]`}>
      <div className={`${episodeNumber % 6 === 0 ? 'w-16' : 'w-20'} h-6 pl-2.5`} />
      <div className={`${episodeNumber % 6 === 0 ? 'w-16' : 'w-20'} inline-flex justify-start items-center`}>
        <div className="w-8 h-8 rounded-2xl inline-flex flex-col justify-center items-center" style={{ backgroundColor: '#FFB310' }}>
          <div className="text-center text-white text-lg font-normal font-['Pretendard'] leading-tight">{episodeNumber}</div>
        </div>
        {!isLast && <div className={`h-0 outline outline-1 outline-offset-[-0.58px] pointer-events-none ${episodeNumber % 6 === 0 ? 'w-8' : 'w-12'}`} style={{ outlineColor: '#FFB310' }}></div>}
      </div>
    </div>
  );
}
