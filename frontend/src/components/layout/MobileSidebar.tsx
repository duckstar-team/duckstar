'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { scrollToTop } from '@/utils/scrollUtils';
import ThinNavDetail from './ThinNavDetail';
import { useChart } from './AppContainer';
import { NAV_ITEMS } from './navItems';
import { cn } from '@/lib/utils';

interface MobileSidebarProps {
  isOpen: boolean;
  isClosing: boolean;
  onClose: () => void;
}

export default function MobileSidebar({
  isOpen,
  isClosing,
  onClose,
}: MobileSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { weeks, selectedWeek } = useChart();

  // 화면 크기 변경 감지하여 데스크톱 사이즈로 변경되면 자동 닫기
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && isOpen) {
        // lg 브레이크포인트(1024px) 이상이면 모바일 사이드바 닫기
        onClose();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isChartPage = pathname === '/chart' || pathname.startsWith('/chart/');

  const handleNavClick = (href: string) => {
    onClose();
    // 모바일에서 홈으로 이동 시 페이지 새로고침으로 레이아웃 전환
    if (href === '/' && window.innerWidth < 768) {
      window.location.href = '/';
    } else {
      if (href === '/') {
        scrollToTop();
      }
      router.push(href);
    }
  };

  return (
    <div data-mobile-sidebar className="fixed inset-0 z-[99999]">
      {/* Overlay background */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Sidebar menu */}
      <div
        data-sidebar-container
        suppressHydrationWarning
        className={cn(
          'absolute top-0 left-0 flex h-full bg-white shadow-2xl transition-transform duration-300 ease-out',
          isChartPage ? 'w-[243px] max-w-[243px]' : 'w-[240px] max-w-[240px]',
          isClosing ? '-translate-x-full' : 'translate-x-0'
        )}
        style={{ zIndex: 100000 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Main Navigation */}
        <div
          className={cn(
            'flex h-full flex-shrink-0 flex-col p-6',
            isChartPage ? 'w-[100px]' : 'w-[240px]'
          )}
        >
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900">메뉴</h2>
          </div>

          {/* Navigation items */}
          <nav className="flex flex-col gap-2">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === '/search'
                  ? pathname === item.href || pathname.startsWith('/search/')
                  : item.href === '/chart'
                    ? pathname === item.href || pathname.startsWith('/chart/')
                    : pathname === item.href;

              return (
                <button
                  key={item.href}
                  data-menu-item
                  onClick={() => handleNavClick(item.href)}
                  disabled={item.isBeta}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg border-none px-4 py-3 text-left text-base transition-all duration-200 outline-none',
                    isActive
                      ? 'bg-gradient-to-r from-[#cb285e] to-[#9c1f49] font-bold text-white'
                      : 'bg-transparent font-medium text-[#586672] hover:bg-[#ffd4e2]',
                    item.isBeta && 'cursor-not-allowed opacity-50'
                  )}
                >
                  <img
                    src={isActive ? item.activeIcon : item.defaultIcon}
                    alt={item.label}
                    className={cn(
                      'h-5 w-5',
                      item.isBeta && !isActive && 'opacity-50'
                    )}
                  />
                  <span className={cn(isChartPage && 'hidden')}>
                    {item.href === '/search' ? (
                      <>
                        <span className="md:hidden">시간표 검색</span>
                        <span className="hidden md:inline">
                          애니/시간표 검색
                        </span>
                      </>
                    ) : (
                      item.label
                    )}
                  </span>
                  {item.isBeta && (
                    <span
                      className={cn(
                        'absolute top-[3.5px] -right-6 z-10 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600',
                        isChartPage && 'hidden'
                      )}
                    >
                      {item.badgeText || '준비중'}
                    </span>
                  )}
                </button>
              );
            })}

            {/* 푸터 항목들 */}
            <div className="absolute right-0 bottom-0 left-0 mt-auto flex flex-col gap-0 border-t border-gray-200 pt-6 pb-4">
              <button
                data-menu-item
                onClick={() => handleNavClick('/about')}
                className="flex w-full cursor-pointer items-center rounded-md border-none bg-transparent px-4 py-2 text-left text-sm font-normal text-gray-500 transition-all duration-200 outline-none hover:bg-gray-100 hover:text-gray-700"
              >
                덕스타 소개
              </button>

              <div className="flex flex-nowrap items-center gap-2 px-4 whitespace-nowrap">
                <button
                  data-menu-item
                  onClick={() => handleNavClick('/terms')}
                  className="flex-shrink-0 cursor-pointer border-none bg-transparent py-2 text-left text-sm font-normal whitespace-nowrap text-gray-500 transition-colors duration-200 outline-none hover:text-gray-700"
                >
                  이용약관
                </button>
                <span className="flex-shrink-0 text-sm text-gray-300">·</span>
                <button
                  data-menu-item
                  onClick={() => handleNavClick('/privacy-policy')}
                  className="flex-shrink-0 cursor-pointer border-none bg-transparent py-2 text-left text-sm font-normal whitespace-nowrap text-gray-500 transition-colors duration-200 outline-none hover:text-gray-700"
                >
                  개인정보처리방침
                </button>
              </div>

              <div className="px-4 text-left text-xs text-gray-400">
                © 2025 DUCKSTAR
              </div>
            </div>
          </nav>
        </div>

        {/* ThinNavDetail for Chart Pages - integrated within same container */}
        {isChartPage && (
          <ThinNavDetail
            weeks={weeks}
            selectedWeek={selectedWeek}
            hideTextOnMobile={false}
          />
        )}
      </div>
    </div>
  );
}
