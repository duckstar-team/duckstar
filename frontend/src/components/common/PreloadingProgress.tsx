import React from 'react';

interface PreloadingProgressProps {
  total: number;
  loaded: number;
  active: number;
  className?: string;
}

export default function PreloadingProgress({
  total,
  loaded,
  active,
  className = '',
}: PreloadingProgressProps) {
  const progress = total > 0 ? (loaded / total) * 100 : 0;

  if (total === 0 && active === 0) return null;

  return (
    <div
      className={`fixed right-4 bottom-4 z-50 rounded-lg border border-gray-200 bg-white p-3 shadow-lg ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="h-4 w-4">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
        <div className="text-sm">
          <div className="font-medium text-gray-700">이미지 로딩 중...</div>
          <div className="text-xs text-gray-500">
            {loaded}/{total} 완료
            {active > 0 && ` (${active}개 로딩 중)`}
          </div>
        </div>
        <div className="h-2 w-16 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full bg-blue-500 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
