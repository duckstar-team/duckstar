interface BannerPaginationProps {
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  className?: string;
}

export default function BannerPagination({
  currentPage = 0,
  totalPages = 5,
  onPageChange,
  className = '',
}: BannerPaginationProps) {
  return (
    <div
      className={`inline-flex items-center justify-center gap-[5px] ${className}`}
    >
      {Array.from({ length: totalPages }, (_, index) => (
        <button
          key={index}
          className="relative size-2 cursor-pointer transition-transform hover:scale-110"
          onClick={() => onPageChange?.(index)}
          data-property-1={index === currentPage ? 'Selected' : 'UnSelected'}
        >
          <div
            className={`absolute top-0 left-0 size-2 rounded-full ${
              index === currentPage ? 'bg-neutral-500' : 'bg-zinc-300'
            }`}
          />
        </button>
      ))}
    </div>
  );
}
