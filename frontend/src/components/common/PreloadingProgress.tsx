'use client';

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
  className = '' 
}: PreloadingProgressProps) {
  const progress = total > 0 ? (loaded / total) * 100 : 0;
  
  if (total === 0 && active === 0) return null;

  return (
    <div className={`fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-3 z-50 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="w-4 h-4">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <div className="text-sm">
          <div className="text-gray-700 font-medium">
            이미지 로딩 중...
          </div>
          <div className="text-gray-500 text-xs">
            {loaded}/{total} 완료
            {active > 0 && ` (${active}개 로딩 중)`}
          </div>
        </div>
        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
