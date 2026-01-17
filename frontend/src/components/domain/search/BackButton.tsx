import { cn } from '@/lib';
import { ChevronLeft } from 'lucide-react';

interface BackButtonProps {
  onClick: () => void;
  className?: string;
}

export default function BackButton({ onClick, className }: BackButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-fit items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-gray-600 transition-colors hover:text-gray-400 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:text-white',
        className
      )}
    >
      <ChevronLeft className="size-4.5" />
      <span className="font-medium">이전</span>
    </button>
  );
}
