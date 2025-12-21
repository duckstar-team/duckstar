'use client';

import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { NAV_ITEMS } from './navItems';
import ThinNavDetail from './ThinNavDetail';
import { useChart } from './AppContainer';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isThinNavHovered, setIsThinNavHovered] = useState(false);
  const [isThinNavDetailHovered, setIsThinNavDetailHovered] = useState(false);

  // ThinNav 여부 확인
  const isThinNavPage =
    pathname.startsWith('/chart') || pathname.startsWith('/award');
  const isExpanded = isThinNavHovered || isThinNavDetailHovered;
  const isThinNav = isThinNavPage && !isExpanded;

  // 차트 컨텍스트에서 weeks와 selectedWeek 가져오기
  const { weeks, selectedWeek } = useChart();

  // 페이지 이동 시 호버 상태 초기화
  useEffect(() => {
    setIsThinNavHovered(false);
    setIsThinNavDetailHovered(false);
  }, [pathname]);

  return (
    <div className="flex">
      <div
        className="flex h-screen flex-col justify-between bg-white px-2 py-3 pb-24 md:px-2.5"
        onMouseEnter={
          isThinNavPage ? () => setIsThinNavHovered(true) : undefined
        }
        onMouseLeave={
          isThinNavPage ? () => setIsThinNavHovered(false) : undefined
        }
        onClick={(e) => e.stopPropagation()}
      >
        {/* Navigation items */}
        <div className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/chart'
                ? pathname.startsWith('/chart')
                : pathname === item.href;
            const iconSrc = isActive ? item.activeIcon : item.defaultIcon;

            return (
              <AnimatePresence key={item.href}>
                <motion.button
                  type="button"
                  className={cn(
                    'flex h-10 items-center overflow-hidden rounded-lg hover:bg-[#ffd4e2]',
                    isActive && 'bg-gradient-to-r from-[#cb285e] to-[#9c1f49]'
                  )}
                  animate={{
                    width: isThinNav ? 'fit-content' : '168px',
                  }}
                  transition={{
                    duration: 0.3,
                    ease: 'easeInOut',
                  }}
                  onClick={() => router.push(item.href)}
                >
                  <img
                    src={iconSrc}
                    alt={item.label}
                    className="mx-2.5 size-4 flex-shrink-0 object-contain"
                  />

                  <motion.div
                    className={cn(
                      'whitespace-nowrap max-md:text-sm',
                      isActive
                        ? 'font-bold text-white'
                        : 'font-medium text-gray-500'
                    )}
                    animate={{
                      opacity: isThinNav ? 0 : 1,
                      width: isThinNav ? 0 : 'auto',
                    }}
                    transition={{
                      duration: 0.3,
                      ease: 'easeInOut',
                    }}
                    style={{
                      overflow: 'hidden',
                    }}
                  >
                    <span>{item.label}</span>
                  </motion.div>
                </motion.button>
              </AnimatePresence>
            );
          })}
        </div>

        {/* Footer - 일반 페이지에만 표시 */}
        {!isThinNavPage && (
          <footer className="ml-1 flex flex-col text-sm text-gray-500">
            {/* 상단 링크 */}
            <Link href="/about" className="hover:text-gray-800">
              덕스타 소개
            </Link>

            {/* 하단 링크들 */}
            <div className="flex items-center gap-[5px]">
              <Link href="/terms" className="hover:text-gray-800">
                이용약관
              </Link>
              <span>·</span>
              <Link href="/privacy-policy" className="hover:text-gray-800">
                개인정보처리방침
              </Link>
            </div>

            {/* 저작권 텍스트 */}
            <div className="mt-5">© 2025 DUCKSTAR</div>
          </footer>
        )}
      </div>

      {/* ThinNavDetail - Chart 또는 Award 페이지에만 표시 */}
      {isThinNavPage && (
        <div
          onMouseEnter={() => {
            if (isThinNavHovered) {
              setIsThinNavDetailHovered(true);
            }
          }}
          onMouseLeave={() => setIsThinNavDetailHovered(false)}
          onClick={(e) => e.stopPropagation()}
        >
          <ThinNavDetail
            weeks={weeks}
            selectedWeek={selectedWeek}
            mode={pathname.startsWith('/award') ? 'award' : 'chart'}
          />
        </div>
      )}
    </div>
  );
}
