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
  selectedOttServices = []
}: SearchFiltersProps) {
  const ottServices = [
    { id: 'netflix', name: 'Netflix', icon: '/icons/netflix-logo.svg' },
    { id: 'laftel', name: 'LAFTEL', icon: '/icons/laftel-logo.svg' },
    { id: 'tving', name: 'TVING', icon: '/icons/tving-logo.svg' },
    { id: 'wavve', name: 'WAVVE', icon: '/icons/wavve-logo.svg' },
    { id: 'watcha', name: 'WATCHA', icon: '/icons/watcha-logo.svg' }
  ];

  const handleOttClick = (ottId: string) => {
    const ottService = ottServices.find(ott => ott.id === ottId);
    if (ottService) {
      onOttFilterChange?.(ottService.name.toLowerCase());
    }
  };

  return (
    <div className={cn(
      "flex items-center justify-between w-full",
      className
    )}>
      {/* 툴팁 - 데스크톱에서만 표시 */}
      <div className="hidden md:flex items-center">
        <div className="bg-[#f1f2f3] flex h-9 items-center justify-center pl-2 pr-5 py-0 rounded-[8px]">
          <div className="flex gap-2.5 items-center justify-start px-2.5 py-0 w-[34px]">
            <div className="h-3 w-3.5 relative">
              <img
                src="/icons/searchSection-notify-icon.svg"
                alt="Notification"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          <div className="flex flex-col items-start justify-start ml-2">
            <div className="flex flex-col font-['Pretendard'] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#23272b] text-[14px] text-nowrap">
              <p className="leading-[normal] whitespace-pre">신작 애니메이션을 검색해보세요...</p>
            </div>
          </div>
        </div>
      </div>

      {/* OTT 필터 목록 - 선택된 OTT는 대기 리스트에서 숨김 */}
      <div className="flex gap-[9px] items-center justify-center ml-8">
        {ottServices.map((ott) => {
          const isSelected = selectedOttServices.includes(ott.name.toLowerCase());
          
          return (
            <button
              key={ott.id}
              onClick={() => handleOttClick(ott.id)}
              className={cn(
                "relative w-9 h-9 rounded-lg transition-all duration-200 hover:scale-110 cursor-pointer",
                "flex items-center justify-center"
              )}
              style={{
                filter: isSelected ? 'grayscale(60%) brightness(0.85) saturate(0)' : 'none',
                opacity: isSelected ? 0.8 : 1,
                transform: isSelected ? 'scale(0.95)' : 'scale(1)',
                pointerEvents: 'auto',
                transition: 'all 0.2s ease-in-out'
              }}
            >
              <img
                src={ott.icon}
                alt={ott.name}
                className="w-full h-full object-contain rounded-lg"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
