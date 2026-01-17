'use client';

import { useState, useEffect } from 'react';

interface RightHeaderListProps {
  selectedTab?: 'anilab' | 'anime-corner';
  onTabChange?: (tab: 'anilab' | 'anime-corner') => void;
}

export default function RightHeaderList({
  selectedTab,
  onTabChange,
}: RightHeaderListProps) {
  const [activeTab, setActiveTab] = useState<'anilab' | 'anime-corner'>(
    'anilab'
  );

  // selectedTab prop이 변경될 때 내부 상태 동기화
  useEffect(() => {
    if (selectedTab) {
      setActiveTab(selectedTab);
    }
  }, [selectedTab]);

  // 탭 상태 저장 및 복원
  useEffect(() => {
    const savedTab = sessionStorage.getItem('home-right-tab');
    if (savedTab === 'anime-corner') {
      setActiveTab('anime-corner');
      // 복원 후 플래그 제거
      sessionStorage.removeItem('home-right-tab');
    }
  }, []);

  // 탭 상태 변경 시 저장
  useEffect(() => {
    if (activeTab === 'anime-corner') {
      sessionStorage.setItem('home-right-tab', 'anime-corner');
    } else {
      sessionStorage.removeItem('home-right-tab');
    }
  }, [activeTab]);

  const handleTabClick = (tab: 'anilab' | 'anime-corner') => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };
  return (
    <div className="inline-flex h-12 items-center justify-center self-stretch">
      {/* Anime Corner 탭 (첫 번째) */}
      <button
        onClick={() => handleTabClick('anime-corner')}
        className={`inline-flex w-32 cursor-pointer flex-col items-center justify-center overflow-hidden px-2.5 py-2 sm:w-36 sm:py-2 md:w-40 md:py-3 lg:w-44 ${
          activeTab === 'anime-corner' ? 'border-brand border-b-2' : ''
        }`}
      >
        <div
          className={`justify-start self-stretch text-sm leading-[18px] whitespace-nowrap sm:text-base sm:leading-[20px] md:text-xl md:leading-snug ${
            activeTab === 'anime-corner'
              ? 'text-brand font-semibold'
              : 'font-normal text-gray-400'
          }`}
        >
          Anime Corner 🇺🇸
        </div>
      </button>

      {/* AniLab 탭 (두 번째) */}
      <button
        onClick={() => handleTabClick('anilab')}
        className={`inline-flex w-32 cursor-pointer flex-col items-center justify-center overflow-hidden px-9 py-2 sm:w-36 sm:py-2 md:w-40 md:py-3 lg:w-44 ${
          activeTab === 'anilab' ? 'border-brand border-b-2' : ''
        }`}
      >
        <div
          className={`justify-start self-stretch text-center text-sm leading-[18px] whitespace-nowrap sm:text-base sm:leading-[20px] md:text-xl md:leading-snug ${
            activeTab === 'anilab'
              ? 'text-brand font-semibold'
              : 'font-normal text-gray-400'
          }`}
        >
          AniLab 🇯🇵
        </div>
      </button>
    </div>
  );
}
