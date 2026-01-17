import { cn } from '@/lib';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo } from 'react';

// 페이지네이션 바에 표시할 최대 페이지 수
const PAGES_PER_GROUP = 5;

interface PaginationProps {
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  totalPages,
  currentPage,
  onPageChange,
}: PaginationProps) {
  const paginationData = useMemo(() => {
    const currentGroup = Math.floor((currentPage - 1) / PAGES_PER_GROUP);
    const startPage = currentGroup * PAGES_PER_GROUP + 1;
    const endPage = Math.min(startPage + PAGES_PER_GROUP - 1, totalPages);

    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return {
      totalPages,
      startPage,
      endPage,
      pages,
      hasPrev: currentPage > 1,
      hasNext: currentPage < totalPages,
    };
  }, [currentPage, totalPages]);

  const handlePrev = () => {
    onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    onPageChange(currentPage + 1);
  };

  return (
    <div className="mb-12 flex justify-center gap-[6px] text-sm">
      <button
        type="button"
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-full',
          !paginationData.hasPrev
            ? 'cursor-not-allowed! opacity-20'
            : 'text-gray-500 hover:bg-gray-200/50 dark:hover:bg-zinc-800'
        )}
        onClick={handlePrev}
        disabled={!paginationData.hasPrev}
      >
        <ChevronLeft />
      </button>
      {paginationData?.pages.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => onPageChange(page)}
          className={cn(
            'h-8 w-8 rounded-full',
            page === currentPage
              ? 'bg-gray-200 text-black dark:bg-zinc-700 dark:text-zinc-200'
              : 'hover:bg-gray-200/50 dark:hover:bg-zinc-800'
          )}
        >
          {page}
        </button>
      ))}
      <button
        type="button"
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-full',
          !paginationData.hasNext
            ? 'cursor-not-allowed! opacity-20'
            : 'text-gray-500 hover:bg-gray-200/50 dark:hover:bg-zinc-800'
        )}
        onClick={handleNext}
        disabled={!paginationData.hasNext}
      >
        <ChevronRight />
      </button>
    </div>
  );
}
