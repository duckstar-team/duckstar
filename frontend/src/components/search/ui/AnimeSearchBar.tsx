'use client';

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
  className,
}: AnimeSearchBarProps) {
  return (
    <div className={cn('relative w-full', className)} data-name="searchBar">
      {/* 상단 배경 - 옅은 회색 */}
      <div className="relative h-[196px] w-full rounded-lg bg-[#f1f3f5]" />

      {/* SearchFilters 컨테이너 - 화면 전체 너비 */}
      <div className="relative w-full border-b border-[#dadce0] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <div className="flex items-center justify-between gap-5">
            {/* 알림 버튼 - 데스크톱에서만 표시 */}
            <div
              className="hidden items-center md:flex"
              data-name="notification"
            >
              <div
                className="flex h-9 items-center justify-center rounded-[8px] bg-[#f1f2f3] py-0 pr-5 pl-2"
                data-name="Background"
              >
                <div className="flex w-[34px] items-center justify-start gap-2.5 px-2.5 py-0">
                  <div
                    className="relative h-3 w-3.5"
                    data-name="mail-chat-bubble-typing-square"
                  >
                    <img
                      src="/icons/mail-chat-bubble.svg"
                      alt="Notification"
                      className="h-full w-full object-contain"
                    />
                  </div>
                </div>
                <div
                  className="ml-2 flex flex-col items-start justify-start"
                  data-name="Container"
                >
                  <div className="relative flex shrink-0 flex-col justify-center text-[14px] leading-[0] font-semibold text-nowrap text-[#23272b] not-italic">
                    <p className="leading-[normal] whitespace-pre">
                      신작 애니메이션을 검색해보세요...
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* OTT 플랫폼 아이콘들 */}
            <div
              className="flex items-center gap-[8.979px]"
              data-name="ottListForFilters"
            >
              <div className="size-[36.001px]">
                <img
                  src="/icons/laftel-logo.svg"
                  alt="LAFTEL"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="size-[36.001px]">
                <img
                  src="/icons/netflix-logo.svg"
                  alt="Netflix"
                  className="h-full w-full object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 검색 입력 필드 - SearchFilters 컨테이너 아래선 중앙을 꿰뚫듯이 위치 */}
      <div
        className="absolute -bottom-6 left-1/2 z-10 -translate-x-1/2 transform rounded-[8px] border border-[#dadce0] bg-white p-4 shadow-lg"
        data-name="Background+Border"
        style={{ width: 'calc(100% - 3rem)' }}
      >
        <div className="flex items-center">
          {/* 검색 버튼 */}
          <div
            className="mr-3 flex size-9 shrink-0 items-center justify-center rounded-[8px] border border-[#ffb310] bg-[#fff8e9] p-1"
            data-name="Button"
          >
            <div className="size-[17.59px]" data-name="SVG">
              <img
                src="/icons/search-icon.svg"
                alt="Search"
                className="h-full w-full object-contain"
              />
            </div>
          </div>

          {/* 검색 입력 필드 */}
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="검색어를 입력하세요..."
            className="flex-1 border-none bg-transparent text-base text-[#23272b] placeholder-gray-400 outline-none"
            autoComplete="off"
            spellCheck="false"
          />
        </div>
      </div>

      {/* 연도 및 시즌 표시 - 왼쪽에 배치 */}
      <div
        className="mt-8 ml-6 box-border flex w-fit items-center justify-center gap-2.5 rounded-[12px] bg-white px-[25px] py-2.5"
        data-name="yearAndSeason"
      >
        <div className="relative shrink-0 text-[18px] leading-[0] font-medium text-nowrap text-black not-italic">
          <p className="leading-[22px] whitespace-pre">
            2025년 여름 애니메이션
          </p>
        </div>
      </div>
    </div>
  );
}
