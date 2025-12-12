'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import ThinNav from '@/components/layout/ThinNav';
import ThinNavDetail from '@/components/layout/ThinNavDetail';
import LoginModal from '@/components/common/LoginModal';
import { getWeeks } from '@/api/chart';
import { WeekDto } from '@/types';

// 모달 상태를 관리하는 Context
interface ModalContextType {
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  isVoteModalOpen: boolean;
  openVoteModal: () => void;
  closeVoteModal: () => void;
}

// 주간 차트 상태를 관리하는 Context
interface ChartContextType {
  selectedWeek: WeekDto | null;
  setSelectedWeek: (week: WeekDto | null) => void;
  weeks: WeekDto[];
}

// 모바일 메뉴 상태를 관리하는 Context
interface MobileMenuContextType {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
  toggleMobileMenu: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);
const ChartContext = createContext<ChartContextType | undefined>(undefined);
const MobileMenuContext = createContext<MobileMenuContextType | undefined>(
  undefined
);

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

// export const useMobileMenu = () => {
//   const context = useContext(MobileMenuContext);
//   if (context === undefined) {
//     throw new Error('useMobileMenu must be used within a MobileMenuProvider');
//   }
//   return context;
// };

interface AppContainerProps {
  children: ReactNode;
}

export default function AppContainer({ children }: AppContainerProps) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);
  const [isThinNavHovered, setIsThinNavHovered] = useState(false);
  const [isThinNavDetailHovered, setIsThinNavDetailHovered] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [weeks, setWeeks] = useState<WeekDto[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<WeekDto | null>(null);
  const pathname = usePathname();

  const openLoginModal = () => {
    setIsLoginModalOpen(true);
  };

  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
  };

  const openVoteModal = () => {
    setIsVoteModalOpen(true);
  };

  const closeVoteModal = () => {
    setIsVoteModalOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
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
    isVoteModalOpen,
    openVoteModal,
    closeVoteModal,
  };

  const chartContextValue: ChartContextType = {
    selectedWeek,
    setSelectedWeek,
    weeks,
  };

  const mobileMenuContextValue = {
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    toggleMobileMenu,
  };

  return (
    <ModalContext.Provider value={modalContextValue}>
      <ChartContext.Provider value={chartContextValue}>
        <MobileMenuContext.Provider value={mobileMenuContextValue}>
          <div className="min-h-screen bg-gray-50">
            {/* Mobile Menu Overlay - 차트 페이지에서는 오버레이 제거 */}
            {isMobileMenuOpen &&
              (pathname === '/vote' ||
                pathname === '/search' ||
                pathname.startsWith('/search/') ||
                pathname.startsWith('/animes/') ||
                pathname === '/profile-setup') && (
                <div
                  className="bg-opacity-20 fixed inset-0 z-[9999998] bg-black lg:hidden"
                  onClick={() => setIsMobileMenuOpen(false)}
                />
              )}

            {/* Fixed Header */}
            <div className="fixed top-0 right-0 left-0 z-[9999]">
              <Header />
            </div>

            {/* Fixed Sidebar */}
            <div
              className={`fixed top-[60px] bottom-0 left-0 z-[9999999] ${pathname === '/' || pathname === '/vote' || pathname === '/search' || pathname.startsWith('/search/') || pathname.startsWith('/animes/') || pathname === '/chart' || pathname.startsWith('/chart/') || pathname === '/profile-setup' || pathname === '/about' || pathname === '/terms' || pathname === '/privacy-policy' ? 'hidden lg:block' : ''}`}
            >
              {isChartPage ? (
                <>
                  <ThinNav
                    onHover={setIsThinNavHovered}
                    isExpanded={isThinNavHovered || isThinNavDetailHovered}
                  />
                  <div
                    className={`absolute top-0 transition-all duration-300 ease-in-out ${
                      isThinNavHovered || isThinNavDetailHovered
                        ? 'left-[200px]'
                        : 'left-[60px]'
                    }`}
                    onMouseEnter={() => {
                      if (isThinNavHovered) {
                        setIsThinNavDetailHovered(true);
                      }
                    }}
                    onMouseLeave={() => setIsThinNavDetailHovered(false)}
                  >
                    <ThinNavDetail weeks={weeks} selectedWeek={selectedWeek} />
                  </div>
                </>
              ) : (
                <Sidebar />
              )}
            </div>

            {/* Main Content */}
            <main
              className={`bg-gray-50 pt-[60px] transition-all duration-300 ease-in-out ${
                isChartPage
                  ? 'ml-0 lg:ml-[200px]' // 모바일에서는 마진 없음, 데스크톱에서만 ThinNav 마진
                  : pathname === '/vote' ||
                      pathname === '/search' ||
                      pathname.startsWith('/search/') ||
                      pathname.startsWith('/animes/') ||
                      pathname === '/profile-setup' ||
                      pathname === '/about' ||
                      pathname === '/terms' ||
                      pathname === '/privacy-policy'
                    ? 'ml-0 lg:ml-[200px]'
                    : pathname === '/'
                      ? 'ml-0 lg:ml-[200px]'
                      : 'ml-[50px] overflow-x-hidden group-hover:ml-[200px] sm:ml-[55px] lg:ml-[200px]'
              }`}
            >
              {children}
            </main>
          </div>

          {/* Global Modals - 전체 앱 레벨에서 관리 */}
          <LoginModal
            isOpen={isLoginModalOpen}
            onClose={closeLoginModal}
            backdropStyle="blur"
          />
        </MobileMenuContext.Provider>
      </ChartContext.Provider>
    </ModalContext.Provider>
  );
}
