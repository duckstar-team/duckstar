'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import ThinNav from '@/components/ThinNav';
import ThinNavDetail from '@/components/ThinNavDetail';
import LoginModal from '@/components/common/LoginModal';
import { WeekDto, getWeeks } from '@/api/chart';

// 모달 상태를 관리하는 Context
interface ModalContextType {
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
}

// 주간 차트 상태를 관리하는 Context
interface ChartContextType {
  selectedWeek: WeekDto | null;
  setSelectedWeek: (week: WeekDto | null) => void;
  weeks: WeekDto[];
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);
const ChartContext = createContext<ChartContextType | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

export const useChart = () => {
  const context = useContext(ChartContext);
  if (context === undefined) {
    throw new Error('useChart must be used within a ChartProvider');
  }
  return context;
};

interface AppContainerProps {
  children: ReactNode;
}

export default function AppContainer({ children }: AppContainerProps) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isThinNavHovered, setIsThinNavHovered] = useState(false);
  const [isThinNavDetailHovered, setIsThinNavDetailHovered] = useState(false);
  const [weeks, setWeeks] = useState<WeekDto[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<WeekDto | null>(null);
  const pathname = usePathname();

  const openLoginModal = () => {
    setIsLoginModalOpen(true);
  };

  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
  };

  // 페이지 이동 시 모달 자동 닫기 및 사이드바 상태 초기화
  useEffect(() => {
    if (isLoginModalOpen) {
      closeLoginModal();
    }
    // 페이지 이동 시 호버 상태 초기화
    setIsThinNavHovered(false);
    setIsThinNavDetailHovered(false);
  }, [pathname]);

  // 주간차트 페이지에서는 ThinNav 사용 (동적 라우팅 포함)
  const isChartPage = pathname.startsWith('/chart');

  // weeks 데이터 가져오기 (주간 차트 페이지에서만)
  useEffect(() => {
    if (isChartPage && weeks.length === 0) {
      const fetchWeeks = async () => {
        try {
          const response = await getWeeks();
          setWeeks(response.result);
          // selectedWeek는 각 페이지에서 개별적으로 설정
        } catch (error) {
          console.error('주차 데이터 로딩 실패:', error);
        }
      };
      
      fetchWeeks();
    }
  }, [isChartPage, weeks.length]);

  // /chart 페이지로 돌아왔을 때 selectedWeek를 최신 주차로 리셋 (동적 라우팅 제외)
  useEffect(() => {
    if (isChartPage && pathname === '/chart' && weeks.length > 0) {
      const latestWeek = weeks.sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        if (a.quarter !== b.quarter) return b.quarter - a.quarter;
        return b.week - a.week;
      })[0];
      setSelectedWeek(latestWeek);
    }
  }, [isChartPage, pathname, weeks, setSelectedWeek]);

  // 동적 라우팅 페이지에서는 selectedWeek를 리셋하지 않음
  useEffect(() => {
    if (isChartPage && pathname !== '/chart' && pathname.includes('/chart/')) {
      // 동적 라우팅 페이지에서는 selectedWeek를 리셋하지 않음
      // 해당 페이지에서 URL 파라미터를 기반으로 설정
    }
  }, [isChartPage, pathname]);


  const modalContextValue: ModalContextType = {
    isLoginModalOpen,
    openLoginModal,
    closeLoginModal,
  };

  const chartContextValue: ChartContextType = {
    selectedWeek,
    setSelectedWeek,
    weeks,
  };

  return (
    <ModalContext.Provider value={modalContextValue}>
      <ChartContext.Provider value={chartContextValue}>
      <div className="min-h-screen bg-gray-50">
        {/* Fixed Header */}
        <div className="fixed top-0 left-0 right-0 z-[9999]">
          <Header />
        </div>
        
        {/* Fixed Sidebar */}
        <div className={`fixed top-[60px] left-0 bottom-0 z-[9999999] ${pathname === '/vote' || pathname === '/search' || pathname.startsWith('/search/') || pathname === '/' ? 'hidden md:block' : ''}`}>
          {isChartPage ? (
            <>
              <ThinNav onHover={setIsThinNavHovered} isExpanded={isThinNavHovered || isThinNavDetailHovered} />
              <div 
                className={`absolute top-0 transition-all duration-300 ease-in-out ${
                  (isThinNavHovered || isThinNavDetailHovered) ? 'left-[200px]' : 'left-[60px]'
                }`}
                onMouseEnter={() => {
                  if (isThinNavHovered) {
                    setIsThinNavDetailHovered(true);
                  }
                }}
                onMouseLeave={() => setIsThinNavDetailHovered(false)}
              >
                <ThinNavDetail 
                weeks={weeks}
                selectedWeek={selectedWeek}
              />
              </div>
            </>
          ) : (
            <Sidebar />
          )}
        </div>
        
        {/* Main Content */}
        <main className={`pt-[60px] bg-gray-50 transition-all duration-300 ease-in-out ${
          isChartPage 
            ? 'ml-[200px]' // ThinNav(60px) + ThinNavDetail(143px) - 고정
            : pathname === '/vote' || pathname === '/search' || pathname.startsWith('/search/') || pathname === '/'
              ? 'ml-0 md:ml-[200px]' 
              : pathname === '/'
                ? 'ml-0'
                : 'ml-[50px] sm:ml-[55px] md:ml-[200px] group-hover:ml-[200px]'
        }`}>
          {children}
        </main>
      </div>
      
      {/* Global Modals - 전체 앱 레벨에서 관리 */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={closeLoginModal}
        backdropStyle="blur"
      />
      </ChartContext.Provider>
    </ModalContext.Provider>
  );
}
