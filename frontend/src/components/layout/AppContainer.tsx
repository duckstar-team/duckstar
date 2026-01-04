'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import Header from './Header';
import Sidebar from './Sidebar';
import LoginModal from '@/components/common/LoginModal';
import { getWeeks } from '@/api/chart';
import { WeekDto } from '@/types/dtos';
import { useSidebarWidth } from '@/hooks/useSidebarWidth';
import { Toaster } from 'react-hot-toast';

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
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);
  const [weeks, setWeeks] = useState<WeekDto[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<WeekDto | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const sidebarWidth = useSidebarWidth(sidebarRef);
  const pathname = usePathname();

  const SIDEBAR_STORAGE_KEY = 'sidebar-open';

  const openLoginModal = () => {
    setIsLoginModalOpen(true);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
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

  const toggleMenu = () => {
    setIsSidebarOpen((prev) => {
      const newValue = !prev;
      // 데스크탑에서만 세션 스토리지에 저장
      if (typeof window !== 'undefined' && window.innerWidth > 768) {
        sessionStorage.setItem(SIDEBAR_STORAGE_KEY, String(newValue));
      }
      return newValue;
    });
    setIsLoginModalOpen(false);
  };

  // 페이지 이동 시 사이드바 자동 닫기 (모바일에서만)
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      window.innerWidth <= 768 &&
      isSidebarOpen
    ) {
      setIsSidebarOpen(false);
    }
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

  /**
   * 사이드바 Open/Close 상태 관리
   * 데스크탑: 세션 스토리지에서 읽어오거나 기본값 false
   * 모바일: 초기 상태 항상 Closed
   */
  useEffect(() => {
    // 초기 로드 시 사이드바 상태 설정
    const resizeSidebar = () => {
      if (window.innerWidth > 768) {
        // 데스크탑: 세션 스토리지에서 읽어오기
        const savedState = sessionStorage.getItem(SIDEBAR_STORAGE_KEY);
        if (savedState !== null) {
          setIsSidebarOpen(savedState === 'true');
        } else {
          // 세션 스토리지에 값이 없으면 기본값 열림
          setIsSidebarOpen(true);
        }
      } else {
        // 모바일: 초기 상태 항상 닫힘
        setIsSidebarOpen(false);
      }
    };
    resizeSidebar();
    window.addEventListener('resize', resizeSidebar);

    return () => window.removeEventListener('resize', resizeSidebar);
  }, []);

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

  return (
    <ModalContext.Provider value={modalContextValue}>
      <ChartContext.Provider value={chartContextValue}>
        {/* Fixed Header */}
        <div className="fixed top-0 right-0 left-0 z-[9999]">
          <Header toggleMenu={toggleMenu} />
        </div>

        {/* Mobile Sidebar: Fixed overlay */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 top-15 z-[9999999] bg-black/50 md:hidden"
              onClick={() => setIsSidebarOpen(false)}
            >
              <motion.div
                initial={{ x: -400 }}
                animate={{ x: 0 }}
                exit={{ x: -400 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                <Sidebar />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desktop Sidebar: Fixed */}
        <motion.aside
          ref={sidebarRef}
          animate={{ width: isSidebarOpen ? 'fit-content' : 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="fixed top-15 left-0 z-[9999999] hidden overflow-y-hidden md:block"
        >
          <Sidebar />
        </motion.aside>

        {/* Main Content */}
        <main
          className="@container pt-15"
          style={{
            width: sidebarWidth > 0 ? `calc(100% - ${sidebarWidth}px)` : '100%',
            marginLeft: sidebarWidth > 0 ? `${sidebarWidth}px` : 0,
          }}
        >
          {children}
        </main>

        {/* Global Modals - 전체 앱 레벨에서 관리 */}
        <LoginModal />
        <Toaster />
      </ChartContext.Provider>
    </ModalContext.Provider>
  );
}
