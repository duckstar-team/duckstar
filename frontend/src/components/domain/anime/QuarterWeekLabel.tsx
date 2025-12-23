interface QuarterWeekLabelProps {
  variant?: 'past' | 'current' | 'future';
  quarter?: string;
  week?: string;
  episodeNumber?: number;
  isLast?: boolean;
  isSelected?: boolean;
  isHovered?: boolean;
  onMouseEnter?: () => void;
  onMouseMove?: (e: React.MouseEvent) => void;
  onMouseLeave?: () => void;
  onClick?: () => void;
  disableCursor?: boolean; // 커서 비활성화 옵션
}

export default function QuarterWeekLabel({
  variant = 'past',
  quarter = '3분기',
  week = '7주차',
  episodeNumber = 1,
  isLast = false,
  isSelected = false,
  isHovered = false,
  onMouseEnter,
  onMouseMove,
  onMouseLeave,
  onClick,
  disableCursor = false,
}: QuarterWeekLabelProps) {
  // past variant
  if (variant === 'past') {
    return (
      <div
        className={`${episodeNumber % 6 === 0 ? 'w-16 pl-1' : 'w-20'} inline-flex h-auto items-center justify-center pt-[12px] ${disableCursor ? '' : 'cursor-pointer'}`}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
      >
        <div
          className={`${episodeNumber % 6 === 0 ? 'w-auto whitespace-nowrap' : 'w-12'} relative z-10 text-center transition-transform duration-200 ${isHovered ? 'scale-110' : ''}`}
          onMouseEnter={(e) => {
            e.stopPropagation();
            onMouseEnter?.();
          }}
          onMouseMove={(e) => {
            e.stopPropagation();
            onMouseMove?.(e);
          }}
          onMouseLeave={(e) => {
            e.stopPropagation();
            onMouseLeave?.();
          }}
        >
          <span
            className={`text-sm ${
              isSelected
                ? 'font-semibold text-[#990033] underline decoration-solid'
                : 'font-light text-black'
            }`}
          >
            {quarter}
            <br />
          </span>
          <span
            className={`text-base ${
              isSelected
                ? 'font-semibold text-[#990033] underline decoration-solid'
                : 'font-medium text-black'
            }`}
          >
            {week}
          </span>
        </div>
        <div className="pointer-events-none h-full w-8 bg-transparent opacity-0">
          <div className="pointer-events-none h-full w-full bg-gray-300"></div>
        </div>
      </div>
    );
  }

  // current variant
  if (variant === 'current') {
    return (
      <div
        className={`${episodeNumber % 6 === 0 ? 'w-16 pl-1' : 'w-20'} inline-flex h-auto items-center justify-center pt-[12px] ${disableCursor ? '' : 'cursor-pointer'}`}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
      >
        <div
          className={`${episodeNumber % 6 === 0 ? 'w-auto whitespace-nowrap' : 'w-12'} relative z-10 text-center transition-transform duration-200 ${isHovered ? 'scale-110' : ''}`}
          onMouseEnter={(e) => {
            e.stopPropagation();
            onMouseEnter?.();
          }}
          onMouseMove={(e) => {
            e.stopPropagation();
            onMouseMove?.(e);
          }}
          onMouseLeave={(e) => {
            e.stopPropagation();
            onMouseLeave?.();
          }}
        >
          <span
            className={`text-sm ${
              isSelected
                ? 'font-semibold text-[#990033] underline decoration-solid'
                : 'font-light'
            }`}
            style={{ color: isSelected ? '#990033' : '#FFB310' }}
          >
            {quarter}
            <br />
          </span>
          <span
            className={`text-base font-semibold ${
              isSelected ? 'text-[#990033] underline decoration-solid' : ''
            }`}
            style={{ color: isSelected ? '#990033' : '#FFB310' }}
          >
            {week}
          </span>
        </div>
        <div className="pointer-events-none h-full w-8 bg-transparent opacity-0">
          <div className="pointer-events-none h-full w-full bg-gray-300"></div>
        </div>
      </div>
    );
  }

  // future variant
  if (variant === 'future') {
    return (
      <div
        className={`${episodeNumber % 6 === 0 ? 'w-16 pl-1' : 'w-20'} inline-flex h-auto cursor-default items-center justify-start pt-[12px]`}
      >
        <div
          className={`${episodeNumber % 6 === 0 ? 'w-auto whitespace-nowrap' : 'w-12'} relative z-10 text-center transition-transform duration-200 ${isHovered ? 'scale-110' : ''}`}
          onMouseEnter={onMouseEnter}
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
        >
          <span className="text-sm font-light" style={{ color: '#CED4DA' }}>
            {quarter}
            <br />
          </span>
          <span className="text-base font-medium" style={{ color: '#CED4DA' }}>
            {week}
          </span>
        </div>
        <div className="pointer-events-none h-full w-8 bg-transparent opacity-0">
          <div className="pointer-events-none h-full w-full bg-gray-300"></div>
        </div>
      </div>
    );
  }

  // 기본값 (past)
  return (
    <div
      className={`${episodeNumber % 6 === 0 ? 'w-16 pl-1' : 'w-20'} inline-flex h-auto items-center justify-start gap-2.5`}
    >
      <div
        className={`${episodeNumber % 6 === 0 ? 'w-auto whitespace-nowrap' : 'w-12'} pointer-events-none justify-start text-center`}
      >
        <span className="text-sm font-light text-black">
          {quarter}
          <br />
        </span>
        <span className="text-base font-medium text-black">{week}</span>
      </div>
    </div>
  );
}
