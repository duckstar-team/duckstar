import { FileSearch } from 'lucide-react';

interface EmptyStateProps {
  isThisWeek: boolean;
  year?: number | null;
  quarter?: number | null;
}

export default function EmptyState({
  isThisWeek,
  year,
  quarter,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 py-16 text-center">
      <FileSearch className="mb-4 size-10 stroke-[1.5] text-gray-600" />
      <h3 className="text-lg font-medium text-gray-900">
        {isThisWeek
          ? '데이터가 없습니다.'
          : `${year}년 ${quarter}분기 데이터가 없습니다.`}
      </h3>
      <p className="text-sm text-gray-600">
        {isThisWeek ? '다시 시도해주세요.' : '다른 시즌을 선택해보세요.'}
      </p>
    </div>
  );
}
