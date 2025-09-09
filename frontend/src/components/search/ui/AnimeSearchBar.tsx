'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

interface AnimeSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  selectedOttServices?: string[];
  onOttFilterChange?: (ottService: string) => void;
  className?: string;
}

export default function AnimeSearchBar({
  value,
  onChange,
  selectedOttServices = [],
  onOttFilterChange,
  className
}: AnimeSearchBarProps) {
  return (
    <div className={cn("w-full relative", className)} data-name="searchBar">
      {/* 상단 배경 - 옅은 회색 */}
      <div className="bg-[#f1f3f5] w-full h-[196px] rounded-lg relative" />
      
      {/* SearchFilters 컨테이너 - 화면 전체 너비 */}
      <div className="w-full bg-white border-b border-[#dadce0] relative">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex gap-5 items-center justify-between">
            {/* 알림 버튼 */}
            <div className="flex items-center" data-name="notification">
              <div className="bg-[#f1f2f3] flex h-9 items-center justify-center pl-2 pr-5 py-0 rounded-[8px]" data-name="Background">
                <div className="flex gap-2.5 items-center justify-start px-2.5 py-0 w-[34px]">
                  <div className="h-3 w-3.5 relative" data-name="mail-chat-bubble-typing-square">
                    <img
                      src="/icons/mail-chat-bubble.svg"
                      alt="Notification"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
                <div className="flex flex-col items-start justify-start ml-2" data-name="Container">
                  <div className="flex flex-col font-['Pretendard'] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#23272b] text-[14px] text-nowrap">
                    <p className="leading-[normal] whitespace-pre">분기 신작 애니/캐릭터를 검색해보세요...</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* OTT 플랫폼 아이콘들 */}
            <div className="flex gap-[8.979px] items-center" data-name="ottListForFilters">
              <div className="size-[36.001px]">
                <img
                  src="/icons/laftel-logo.svg"
                  alt="LAFTEL"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="size-[36.001px]">
                <img
                  src="/icons/netflix-logo.svg"
                  alt="Netflix"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 메인 검색 입력 필드 - SearchFilters 컨테이너 아래선 중앙을 꿰뚫듯이 위치 */}
      <div className="absolute left-1/2 transform -translate-x-1/2 -bottom-6 z-10 bg-white border border-[#dadce0] rounded-[8px] p-4 shadow-lg" data-name="Background+Border" style={{ width: 'calc(100% - 3rem)' }}>
        <div className="flex items-center">
          {/* 검색 버튼 */}
          <div className="bg-[#fff8e9] flex items-center justify-center p-1 rounded-[8px] shrink-0 size-9 mr-3 border border-[#ffb310]" data-name="Button">
            <div className="size-[17.59px]" data-name="SVG">
              <img
                src="/icons/search-icon.svg"
                alt="Search"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          
          {/* 검색 입력 필드 */}
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="검색어를 입력하세요..."
            className="flex-1 bg-transparent border-none outline-none text-[#23272b] text-base placeholder-gray-400"
            autoComplete="off"
            spellCheck="false"
          />
        </div>
      </div>
      
      {/* 연도 및 시즌 표시 - 왼쪽에 배치 */}
      <div className="mt-8 ml-6 bg-white box-border flex gap-2.5 items-center justify-center px-[25px] py-2.5 rounded-[12px] w-fit" data-name="yearAndSeason">
        <div className="font-['Pretendard'] font-medium leading-[0] not-italic relative shrink-0 text-[18px] text-black text-nowrap">
          <p className="leading-[22px] whitespace-pre">2025년 여름 애니메이션</p>
        </div>
      </div>
    </div>
  );
}
