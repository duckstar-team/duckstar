'use client';

import React from 'react';
import { cn } from '@/lib';
import { MessageSquareMore } from 'lucide-react';

interface SearchFiltersProps {
  className?: string;
  onOttFilterChange?: (ottService: string) => void;
  selectedOttServices?: string[];
}

export default function SearchFilters({
  className,
  onOttFilterChange,
  selectedOttServices = [],
}: SearchFiltersProps) {
  const ottServices = [
    { name: 'netflix', icon: '/icons/netflix-logo.svg' },
    { name: 'laftel', icon: '/icons/laftel-logo.svg' },
    { name: 'tving', icon: '/icons/tving-logo.svg' },
    { name: 'wavve', icon: '/icons/wavve-logo.svg' },
    { name: 'watcha', icon: '/icons/watcha-logo.svg' },
  ];

  const handleOttClick = (ottName: string) => {
    const ottService = ottServices.find((ott) => ott.name === ottName);
    if (ottService) {
      onOttFilterChange?.(ottService.name);
    }
  };

  return (
    <div
      className={cn(
        'scrollbar-hide flex w-full items-center overflow-x-scroll pt-5 pb-4',
        className
      )}
    >
      {/* 툴팁 - 데스크톱에서만 표시 */}
      <div className="hidden h-9 shrink-0 items-center justify-center gap-2 rounded-lg bg-zinc-200 pr-5 pl-4 text-sm font-semibold md:flex dark:bg-zinc-700 dark:text-zinc-400">
        <MessageSquareMore size={14} />
        신작 애니메이션을 검색해보세요.
      </div>

      {/* OTT 필터 목록 - 선택된 OTT는 대기 리스트에서 숨김 */}
      <div className="ml-2 flex items-center justify-center gap-[9px] md:ml-8">
        {ottServices.map((ott) => {
          const isSelected = selectedOttServices.includes(ott.name);

          return (
            <button
              key={ott.name}
              onClick={() => handleOttClick(ott.name)}
              className={cn(
                'relative h-7 w-7 rounded-lg transition-all duration-200 hover:scale-110 md:h-9 md:w-9',
                'flex items-center justify-center'
              )}
              style={{
                filter: isSelected
                  ? 'grayscale(60%) brightness(0.85) saturate(0)'
                  : 'none',
                opacity: isSelected ? 0.8 : 1,
                transform: isSelected ? 'scale(0.95)' : 'scale(1)',
                pointerEvents: 'auto',
                transition: 'all 0.2s ease-in-out',
              }}
            >
              <img
                src={ott.icon}
                alt={ott.name}
                className="h-full w-full rounded-lg object-contain"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
