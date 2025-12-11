'use client';
import { useState, useEffect } from 'react';
import { WeekDto } from '@/types';

interface RightHeaderListProps {
  weekDtos: WeekDto[];
  selectedTab?: 'anilab' | 'anime-corner';
  onTabChange?: (tab: 'anilab' | 'anime-corner') => void;
  className?: string;
}

export default function RightHeaderList({
  weekDtos,
  selectedTab,
  onTabChange,
  className = '',
}: RightHeaderListProps) {
  const [activeTab, setActiveTab] = useState<'anilab' | 'anime-corner'>(
    'anilab'
  );

  // 현재 주차 찾기 (첫 번째 주차)
  const currentWeek = weekDtos[0];
  const currentWeekText = currentWeek
    ? `${currentWeek.year}년 ${currentWeek.quarter}분기 ${currentWeek.week}주차`
    : '2025년 3분기 12주차';

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
    <div
      className={`inline-flex h-12 items-center justify-center self-stretch ${className}`}
    >
      {/* Anime Corner 탭 (첫 번째) */}
      <button
        onClick={() => handleTabClick('anime-corner')}
        className={`inline-flex w-32 cursor-pointer flex-col items-center justify-center overflow-hidden px-2.5 py-2 sm:w-36 sm:py-2 md:w-40 md:py-3 lg:w-44 ${
          activeTab === 'anime-corner' ? 'border-b-2 border-rose-800' : ''
        }`}
      >
        <div
          className={`justify-start self-stretch text-sm leading-[18px] whitespace-nowrap sm:text-base sm:leading-[20px] md:text-xl md:leading-snug ${
            activeTab === 'anime-corner'
              ? 'font-semibold text-rose-800'
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
          activeTab === 'anilab' ? 'border-b-2 border-rose-800' : ''
        }`}
      >
        <div
          className={`justify-start self-stretch text-center text-sm leading-[18px] whitespace-nowrap sm:text-base sm:leading-[20px] md:text-xl md:leading-snug ${
            activeTab === 'anilab'
              ? 'font-semibold text-rose-800'
              : 'font-normal text-gray-400'
          }`}
        >
          AniLab 🇯🇵
        </div>
      </button>
    </div>
  );
}
