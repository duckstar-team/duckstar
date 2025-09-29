'use client';

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
  className = ""
}: BannerPaginationProps) {
  return (
    <div className={`inline-flex justify-center items-center gap-[5px] ${className}`}>
      {Array.from({ length: totalPages }, (_, index) => (
        <button
          key={index}
          className="size-2 relative cursor-pointer hover:scale-110 transition-transform"
          onClick={() => onPageChange?.(index)}
          data-property-1={index === currentPage ? "Selected" : "UnSelected"}
        >
          <div 
            className={`size-2 left-0 top-0 absolute rounded-full ${
              index === currentPage ? "bg-neutral-500" : "bg-zinc-300"
            }`} 
          />
        </button>
      ))}
    </div>
  );
}
