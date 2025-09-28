'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import LoginModal from '@/components/common/LoginModal';

// 모달 상태를 관리하는 Context
interface ModalContextType {
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

interface AppContainerProps {
  children: ReactNode;
}

export default function AppContainer({ children }: AppContainerProps) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const pathname = usePathname();

  const openLoginModal = () => {
    setIsLoginModalOpen(true);
  };

  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
  };

  // 페이지 이동 시 모달 자동 닫기
  useEffect(() => {
    if (isLoginModalOpen) {
      closeLoginModal();
    }
  }, [pathname]);

  const modalContextValue: ModalContextType = {
    isLoginModalOpen,
    openLoginModal,
    closeLoginModal,
  };

  return (
    <ModalContext.Provider value={modalContextValue}>
      <div className="min-h-screen bg-gray-50">
        {/* Fixed Header */}
        <div className="fixed top-0 left-0 right-0 z-[9999]">
          <Header />
        </div>
        
        {/* Fixed Sidebar */}
        <div className="fixed top-[60px] left-0 bottom-0 z-[9999999]">
          <Sidebar />
        </div>
        
        {/* Main Content */}
        <main className="ml-[50px] sm:ml-[55px] md:ml-[200px] pt-[60px] bg-gray-50 transition-all duration-300 ease-in-out group-hover:ml-[200px]">
          {children}
        </main>
      </div>
      
      {/* Global Modals - 전체 앱 레벨에서 관리 */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={closeLoginModal}
        backdropStyle="blur"
      />
    </ModalContext.Provider>
  );
}
