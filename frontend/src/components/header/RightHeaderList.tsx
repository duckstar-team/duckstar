'use client';
import { useState, useEffect } from 'react';
import { WeekDto } from '@/types/api';

interface RightHeaderListProps {
  weekDtos: WeekDto[];
  selectedTab?: 'anilab' | 'anime-corner';
  onTabChange?: (tab: 'anilab' | 'anime-corner') => void;
  className?: string;
}

export default function RightHeaderList({ weekDtos, selectedTab, onTabChange, className = "" }: RightHeaderListProps) {
  const [activeTab, setActiveTab] = useState<'anilab' | 'anime-corner'>('anilab');
  
  // 현재 주차 찾기 (OPEN 상태인 주차)
  const currentWeek = weekDtos.find(week => week.voteStatus === 'OPEN');
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
    <div className={`self-stretch h-12 inline-flex justify-center items-center ${className}`}>
      {/* Anime Corner 탭 (첫 번째) */}
      <button 
        onClick={() => handleTabClick('anime-corner')}
        className={`w-32 sm:w-36 md:w-40 lg:w-44 px-2.5 py-2 sm:py-2 md:py-3 inline-flex flex-col justify-center items-center overflow-hidden cursor-pointer ${
          activeTab === 'anime-corner' 
            ? 'border-b-2 border-rose-800' 
            : ''
        }`}
      >
        <div className={`self-stretch justify-start text-sm sm:text-base md:text-xl font-['Pretendard'] leading-[18px] sm:leading-[20px] md:leading-snug whitespace-nowrap ${
          activeTab === 'anime-corner' 
            ? 'text-rose-800 font-semibold' 
            : 'text-gray-400 font-normal'
        }`}>
          Anime Corner 🇺🇸
        </div>
      </button>
      
      {/* AniLab 탭 (두 번째) */}
      <button 
        onClick={() => handleTabClick('anilab')}
        className={`w-32 sm:w-36 md:w-40 lg:w-44 px-9 py-2 sm:py-2 md:py-3 inline-flex flex-col justify-center items-center overflow-hidden cursor-pointer ${
          activeTab === 'anilab' 
            ? 'border-b-2 border-rose-800' 
            : ''
        }`}
      >
        <div className={`self-stretch text-center justify-start text-sm sm:text-base md:text-xl font-['Pretendard'] leading-[18px] sm:leading-[20px] md:leading-snug whitespace-nowrap ${
          activeTab === 'anilab' 
            ? 'text-rose-800 font-semibold' 
            : 'text-gray-400 font-normal'
        }`}>
          AniLab 🇯🇵
        </div>
      </button>
    </div>
  );
}
