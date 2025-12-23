'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface OttService {
  id: string;
  name: string;
  icon: string;
}

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
    { id: 'netflix', name: 'Netflix', icon: '/icons/netflix-logo.svg' },
    { id: 'laftel', name: 'LAFTEL', icon: '/icons/laftel-logo.svg' },
    { id: 'tving', name: 'TVING', icon: '/icons/tving-logo.svg' },
    { id: 'wavve', name: 'WAVVE', icon: '/icons/wavve-logo.svg' },
    { id: 'watcha', name: 'WATCHA', icon: '/icons/watcha-logo.svg' },
  ];

  const handleOttClick = (ottId: string) => {
    const ottService = ottServices.find((ott) => ott.id === ottId);
    if (ottService) {
      onOttFilterChange?.(ottService.name.toLowerCase());
    }
  };

  return (
    <div className={cn('flex w-full items-center justify-between', className)}>
      {/* 툴팁 - 데스크톱에서만 표시 */}
      <div className="hidden items-center md:flex">
        <div className="flex h-9 items-center justify-center rounded-[8px] bg-[#f1f2f3] py-0 pr-5 pl-2">
          <div className="flex w-[34px] items-center justify-start gap-2.5 px-2.5 py-0">
            <div className="relative h-3 w-3.5">
              <img
                src="/icons/searchSection-notify-icon.svg"
                alt="Notification"
                className="h-full w-full object-contain"
              />
            </div>
          </div>
          <div className="ml-2 flex flex-col items-start justify-start">
            <div className="relative flex shrink-0 flex-col justify-center text-[14px] leading-[0] font-semibold text-nowrap text-[#23272b] not-italic">
              <p className="leading-[normal] whitespace-pre">
                신작 애니메이션을 검색해보세요...
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* OTT 필터 목록 - 선택된 OTT는 대기 리스트에서 숨김 */}
      <div className="ml-2 flex items-center justify-center gap-[9px] sm:ml-8">
        {ottServices.map((ott) => {
          const isSelected = selectedOttServices.includes(
            ott.name.toLowerCase()
          );

          return (
            <button
              key={ott.id}
              onClick={() => handleOttClick(ott.id)}
              className={cn(
                'relative h-7 w-7 cursor-pointer rounded-lg transition-all duration-200 hover:scale-110 md:h-9 md:w-9',
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
