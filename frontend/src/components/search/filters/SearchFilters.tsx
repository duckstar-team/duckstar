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
      {/* 알림 섹션 - 피그마 디자인에 맞춤 */}
      <div className="flex items-center justify-start">
        <div className="bg-[#f1f2f3] flex h-9 items-center justify-start pl-3 pr-5 py-0 rounded-lg w-[265px]">
          {/* 메시지 아이콘 */}
          <div className="flex items-center justify-center w-[34px] h-12">
            <div className="w-3.5 h-3 relative">
              <img
                src="/icons/searchSection-notify-icon.svg"
                alt="Message"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          
          {/* 텍스트 컨테이너 */}
          <div className="flex items-center justify-start w-[211px] h-[17px]">
            <span className="text-[#23272b] text-sm font-semibold leading-[17px] font-['Pretendard']">
              신작 애니메이션을 검색해보세요...
            </span>
          </div>
        </div>
      </div>

            {/* OTT 필터 목록 - 선택된 OTT는 대기 리스트에서 숨김 */}
      <div className="flex gap-[9px] items-center justify-start ml-5">
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
