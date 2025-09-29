'use client';
import { useState, useEffect } from 'react';
import { WeekDto } from '@/types/api';

interface RightHeaderListProps {
  weekDtos: WeekDto[];
  selectedTab?: 'anilab' | 'anime-trending';
  onTabChange?: (tab: 'anilab' | 'anime-trending') => void;
  className?: string;
}

export default function RightHeaderList({ weekDtos, selectedTab, onTabChange, className = "" }: RightHeaderListProps) {
  const [activeTab, setActiveTab] = useState<'anilab' | 'anime-trending'>('anilab');
  
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
    if (savedTab === 'anime-trending') {
      setActiveTab('anime-trending');
      // 복원 후 플래그 제거
      sessionStorage.removeItem('home-right-tab');
    }
  }, []);

  // 탭 상태 변경 시 저장
  useEffect(() => {
    if (activeTab === 'anime-trending') {
      sessionStorage.setItem('home-right-tab', 'anime-trending');
    } else {
      sessionStorage.removeItem('home-right-tab');
    }
  }, [activeTab]);

  const handleTabClick = (tab: 'anilab' | 'anime-trending') => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };
  return (
    <div className={`self-stretch h-12 inline-flex justify-center items-center ${className}`}>
      {/* AniLab 탭 (첫 번째) */}
      <button 
        onClick={() => handleTabClick('anilab')}
        className={`w-44 px-9 py-3 inline-flex flex-col justify-center items-center overflow-hidden cursor-pointer ${
          activeTab === 'anilab' 
            ? 'border-b-2 border-rose-800' 
            : ''
        }`}
      >
        <div className={`self-stretch text-center justify-start text-xl font-['Pretendard'] leading-snug ${
          activeTab === 'anilab' 
            ? 'text-rose-800 font-semibold' 
            : 'text-gray-400 font-normal'
        }`}>
          AniLab 🇯🇵
        </div>
      </button>
      
      {/* Anime Trending 탭 (두 번째) */}
      <button 
        onClick={() => handleTabClick('anime-trending')}
        className={`w-44 px-2.5 py-3 inline-flex flex-col justify-center items-center overflow-hidden cursor-pointer ${
          activeTab === 'anime-trending' 
            ? 'border-b-2 border-rose-800' 
            : ''
        }`}
      >
        <div className={`self-stretch justify-start text-xl font-['Pretendard'] leading-snug ${
          activeTab === 'anime-trending' 
            ? 'text-rose-800 font-semibold' 
            : 'text-gray-400 font-normal'
        }`}>
          Anime Trend 🇺🇸
        </div>
      </button>
    </div>
  );
}
