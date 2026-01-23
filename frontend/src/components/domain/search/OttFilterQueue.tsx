interface OttFilterQueueProps {
  selectedOttServices: string[];
  onRemove: (service: string) => void;
  onClear: () => void;
}

export default function OttFilterQueue({
  selectedOttServices,
  onRemove,
  onClear,
}: OttFilterQueueProps) {
  if (selectedOttServices.length === 0) return null;

  return (
    <div className="flex items-center gap-3">
      <span className="max-xs:hidden text-sm font-medium text-gray-700 dark:text-white/80">
        선택됨:
      </span>

      {selectedOttServices.map((ottService, index) => (
        <div key={index} className="relative flex items-center">
          <button
            onClick={() => onRemove(ottService)}
            className="size-8 overflow-hidden rounded-full transition-transform hover:scale-105"
          >
            <img
              src={`/icons/${ottService.toLowerCase()}-logo.svg`}
              alt={ottService}
              className="h-full w-full object-contain"
            />
          </button>
          <img
            src="/icons/remove-filter.svg"
            alt="제거"
            className="pointer-events-none absolute -top-1 -right-1 h-[17px] w-[17px]"
          />
        </div>
      ))}

      <button
        onClick={onClear}
        className="text-sm whitespace-nowrap text-gray-500 underline hover:text-gray-700"
      >
        필터 초기화
      </button>
    </div>
  );
}
