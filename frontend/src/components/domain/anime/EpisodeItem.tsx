interface EpisodeItemProps {
  property1?:
    | 'past'
    | 'current'
    | 'future'
    | 'filterSelectForPast'
    | 'filterSelectForCurrent';
  episodeNumber?: number;
  isLast: boolean;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseMove?: (e: React.MouseEvent) => void;
  onMouseLeave?: () => void;
  onClick?: () => void;
  disableCursor?: boolean; // 커서 비활성화 옵션
}

export default function EpisodeItem({
  property1 = 'past',
  episodeNumber = 1,
  isLast = false,
  isHovered = false,
  onMouseEnter,
  onMouseMove,
  onMouseLeave,
  onClick,
  disableCursor = false,
}: EpisodeItemProps) {
  // 1. past variant
  if (property1 === 'past') {
    return (
      <div
        className={`${episodeNumber % 6 === 0 ? 'w-16' : 'w-20'} flex flex-col items-start justify-start gap-3 overflow-visible`}
      >
        <div className={`${episodeNumber % 6 === 0 ? 'w-16' : 'w-20'} h-6`} />
        <div
          className={`${episodeNumber % 6 === 0 ? 'w-16' : 'w-20'} inline-flex items-center justify-start overflow-visible ${disableCursor ? '' : 'cursor-pointer'}`}
          onClick={onClick}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          <div
            className={`inline-flex h-8 w-8 flex-col items-center justify-center rounded-2xl ${disableCursor ? '' : 'cursor-pointer'} relative z-10 transition-transform duration-200 ${isHovered ? 'scale-110' : ''}`}
            style={{ backgroundColor: '#FFB310' }}
            onMouseMove={onMouseMove}
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
          >
            <div className="text-center text-lg leading-tight font-normal text-white dark:text-black">
              {episodeNumber}
            </div>
          </div>
          {!isLast && (
            <div
              className={`pointer-events-none h-0 cursor-pointer outline outline-offset-[-0.58px] ${episodeNumber % 6 === 0 ? 'w-8' : 'w-12'}`}
              style={{ outlineColor: '#FFB310' }}
            ></div>
          )}
        </div>
      </div>
    );
  }

  // 2. current variant
  if (property1 === 'current') {
    return (
      <div
        className={`${episodeNumber % 6 === 0 ? 'w-16' : 'w-20'} flex flex-col items-start justify-start gap-3 overflow-visible`}
      >
        <div className={`${episodeNumber % 6 === 0 ? 'w-16' : 'w-20'} h-6`} />
        <div
          className={`${episodeNumber % 6 === 0 ? 'w-16' : 'w-20'} inline-flex items-center justify-start overflow-visible ${disableCursor ? '' : 'cursor-pointer'}`}
          onClick={onClick}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          <div
            className={`inline-flex h-8 w-8 flex-col items-center justify-center rounded-2xl outline outline-offset-[-1px] ${disableCursor ? '' : 'cursor-pointer'} relative z-10 transition-transform duration-200 ${isHovered ? 'scale-110' : ''}`}
            style={{ outlineColor: '#FFB310' }}
            onMouseMove={onMouseMove}
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
          >
            <div
              className="text-center text-lg leading-tight font-normal"
              style={{ color: '#FFB310' }}
            >
              {episodeNumber}
            </div>
          </div>
          {!isLast && (
            <div
              className={`pointer-events-none h-0 cursor-pointer outline outline-offset-[-0.58px] ${episodeNumber % 6 === 0 ? 'w-8' : 'w-12'}`}
              style={{ outlineColor: '#FFB310' }}
            ></div>
          )}
        </div>
      </div>
    );
  }

  // 3. future variant
  if (property1 === 'future') {
    return (
      <div
        className={`${episodeNumber % 6 === 0 ? 'w-16' : 'w-20'} flex flex-col items-start justify-start gap-3 overflow-visible`}
      >
        <div
          className={
            isLast
              ? `${episodeNumber % 6 === 0 ? 'w-16' : 'w-20'} h-6 pl-2.5`
              : `${episodeNumber % 6 === 0 ? 'w-16' : 'w-20'} h-6 pl-2.5`
          }
        />
        <div
          className={`${episodeNumber % 6 === 0 ? 'w-16' : 'w-20'} inline-flex items-center justify-start overflow-visible`}
          onClick={onClick}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          <div
            className={`relative z-10 inline-flex h-8 w-8 flex-col items-center justify-center rounded-2xl outline outline-offset-[-1px] outline-zinc-300 transition-transform duration-200 dark:outline-white ${isHovered ? 'scale-110' : ''}`}
            onMouseMove={onMouseMove}
          >
            <div
              className="text-center text-lg leading-tight font-normal"
              style={{ color: '#CED4DA' }}
            >
              {episodeNumber}
            </div>
          </div>
          {!isLast && (
            <div
              className={`pointer-events-none h-0 outline outline-offset-[-0.58px] ${episodeNumber % 6 === 0 ? 'w-8' : 'w-12'}`}
              style={{ outlineColor: '#CED4DA' }}
            ></div>
          )}
        </div>
      </div>
    );
  }

  // 4. filterSelectForPast variant
  if (property1 === 'filterSelectForPast') {
    return (
      <div
        className={`${episodeNumber % 6 === 0 ? 'w-16' : 'w-20'} flex flex-col items-start justify-start gap-3 overflow-visible`}
      >
        <div className="inline-flex items-center justify-start gap-2.5 self-stretch pl-2.5">
          <div className="size- flex items-center justify-center gap-2.5">
            <img
              src="/icons/diamond-filter.svg"
              alt="diamond filter"
              className="h-6 w-3.5"
            />
          </div>
        </div>
        <div
          className={`${episodeNumber % 6 === 0 ? 'w-16' : 'w-20'} inline-flex cursor-pointer items-center justify-start overflow-visible`}
          onClick={onClick}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          <div
            className={`relative z-10 inline-flex h-8 w-8 cursor-pointer flex-col items-center justify-center rounded-2xl bg-rose-800 transition-transform duration-200 ${isHovered ? 'scale-110' : ''}`}
            onMouseMove={onMouseMove}
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
          >
            <div className="text-center text-lg leading-tight font-normal text-white">
              {episodeNumber}
            </div>
          </div>
          {!isLast && (
            <div
              className={`pointer-events-none h-0 cursor-pointer outline outline-offset-[-0.58px] outline-rose-800 ${episodeNumber % 6 === 0 ? 'w-8' : 'w-12'}`}
            ></div>
          )}
        </div>
      </div>
    );
  }

  // 5. filterSelectForCurrent variant
  if (property1 === 'filterSelectForCurrent') {
    return (
      <div
        className={`${episodeNumber % 6 === 0 ? 'w-16' : 'w-20'} flex flex-col items-start justify-start gap-3 overflow-visible`}
      >
        <div className="inline-flex items-center justify-start gap-2.5 self-stretch pl-2.5">
          <div className="size- flex items-center justify-center gap-2.5">
            <img
              src="/icons/diamond-filter.svg"
              alt="diamond filter"
              className="h-6 w-3.5"
            />
          </div>
        </div>
        <div
          className={`${episodeNumber % 6 === 0 ? 'w-16' : 'w-20'} inline-flex cursor-pointer items-center justify-start overflow-visible`}
          onClick={onClick}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          <div
            className={`relative z-10 inline-flex h-8 w-8 cursor-pointer flex-col items-center justify-center rounded-2xl bg-white outline outline-offset-[-1px] outline-rose-800 transition-transform duration-200 ${isHovered ? 'scale-110' : ''}`}
            onMouseMove={onMouseMove}
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
          >
            <div className="text-center text-lg leading-tight font-normal text-rose-800">
              {episodeNumber}
            </div>
          </div>
          {!isLast && (
            <div
              className={`pointer-events-none h-0 cursor-pointer outline outline-offset-[-0.58px] outline-rose-800 ${episodeNumber % 6 === 0 ? 'w-8' : 'w-12'}`}
            ></div>
          )}
        </div>
      </div>
    );
  }

  // 기본값 (past)
  return (
    <div
      className={`${episodeNumber % 6 === 0 ? 'w-16' : 'w-20'} flex flex-col items-start justify-start gap-3 pb-[12px]`}
    >
      <div
        className={`${episodeNumber % 6 === 0 ? 'w-16' : 'w-20'} h-6 pl-2.5`}
      />
      <div
        className={`${episodeNumber % 6 === 0 ? 'w-16' : 'w-20'} inline-flex items-center justify-start`}
      >
        <div
          className="inline-flex h-8 w-8 flex-col items-center justify-center rounded-2xl"
          style={{ backgroundColor: '#FFB310' }}
        >
          <div className="text-center text-lg leading-tight font-normal text-white">
            {episodeNumber}
          </div>
        </div>
        {!isLast && (
          <div
            className={`pointer-events-none h-0 outline outline-offset-[-0.58px] ${episodeNumber % 6 === 0 ? 'w-8' : 'w-12'}`}
            style={{ outlineColor: '#FFB310' }}
          ></div>
        )}
      </div>
    </div>
  );
}
