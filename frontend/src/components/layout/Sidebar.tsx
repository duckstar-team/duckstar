'use client';

import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib';
import { useState, useEffect } from 'react';
import { NAV_ITEMS } from '@/lib';
import ThinNavDetail from './ThinNavDetail';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import ThemeToggle from '../common/ThemeToggle';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isThinNavHovered, setIsThinNavHovered] = useState(false);
  const [isThinNavDetailHovered, setIsThinNavDetailHovered] = useState(false);
  const [canHover, setCanHover] = useState(true);

  // hover 가능 여부 (마우스 vs 터치) — 화면 너비와 무관
  useEffect(() => {
    const mq = window.matchMedia('(hover: hover)');
    const update = () => setCanHover(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // ThinNav 여부 확인
  const isThinNavPage =
    pathname.startsWith('/chart') || pathname.startsWith('/award');
  const isExpanded = isThinNavHovered || isThinNavDetailHovered;
  const isThinNav = isThinNavPage && !isExpanded;

  // 페이지 이동 시 호버 상태 초기화
  useEffect(() => {
    setIsThinNavHovered(false);
    setIsThinNavDetailHovered(false);
  }, [pathname]);

  return (
    <div className="flex h-screen">
      <div
        className="flex flex-col justify-between border-r border-gray-200 bg-white px-2 py-3 pb-30 md:px-2.5 dark:border-zinc-800 dark:bg-zinc-900"
        onMouseEnter={
          isThinNavPage && canHover
            ? () => setIsThinNavHovered(true)
            : undefined
        }
        onMouseLeave={
          isThinNavPage && canHover
            ? () => setIsThinNavHovered(false)
            : undefined
        }
        onClick={(e) => e.stopPropagation()}
      >
        {/* Navigation items */}
        <div className="space-y-1">
          {NAV_ITEMS.map((item) => {
            // startsWith를 사용해야 하는 경로들
            const prefixPaths = ['/chart', '/award', '/search'];
            const isActive = prefixPaths.includes(item.href)
              ? pathname.startsWith(item.href)
              : pathname === item.href;
            const iconSrc = isActive ? item.activeIcon : item.defaultIcon;

            return (
              <AnimatePresence key={item.href}>
                <motion.button
                  type="button"
                  className={cn(
                    'flex h-10 items-center overflow-hidden rounded-lg hover:bg-[#ffd4e2] dark:hover:bg-zinc-800',
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
                    className="mx-3 size-5 flex-shrink-0 object-contain"
                  />

                  <motion.div
                    className={cn(
                      'overflow-hidden whitespace-nowrap max-md:text-sm',
                      isActive
                        ? 'font-bold text-white'
                        : 'font-medium text-gray-500 dark:text-white'
                    )}
                    animate={{
                      opacity: isThinNav ? 0 : 1,
                      width: isThinNav ? 0 : 'auto',
                    }}
                    transition={{
                      duration: 0.3,
                      ease: 'easeInOut',
                    }}
                  >
                    <span>{item.label}</span>
                  </motion.div>
                </motion.button>
              </AnimatePresence>
            );
          })}
        </div>

        <footer className="flex flex-col gap-4">
          {/* Footer - 일반 페이지에만 표시 */}
          {!isThinNavPage && (
            <div className="ml-1 flex flex-col text-sm text-gray-500">
              {/* 상단 링크 */}
              <Link
                href="/about"
                className="hover:text-gray-800 dark:hover:text-zinc-200"
              >
                덕스타 소개
              </Link>

              {/* 하단 링크들 */}
              <div className="flex items-center gap-[5px]">
                <Link
                  href="/terms"
                  className="hover:text-gray-800 dark:hover:text-zinc-200"
                >
                  이용약관
                </Link>
                <span>·</span>
                <Link
                  href="/privacy-policy"
                  className="hover:text-gray-800 dark:hover:text-zinc-200"
                >
                  개인정보처리방침
                </Link>
              </div>

              {/* 저작권 텍스트 */}
              <div className="mt-5">© 2025 DUCKSTAR</div>
            </div>
          )}

          {(!isThinNavPage || isExpanded || !canHover) && (
            <div className="ml-auto">
              <ThemeToggle />
            </div>
          )}
        </footer>
      </div>

      {/* ThinNavDetail - Chart 또는 Award 페이지에만 표시 */}
      {isThinNavPage && (
        <div
          onMouseEnter={
            canHover
              ? () => {
                  if (isThinNavHovered) {
                    setIsThinNavDetailHovered(true);
                  }
                }
              : undefined
          }
          onMouseLeave={
            canHover ? () => setIsThinNavDetailHovered(false) : undefined
          }
          onClick={(e) => e.stopPropagation()}
        >
          <ThinNavDetail
            mode={pathname.startsWith('/award') ? 'award' : 'chart'}
          />
        </div>
      )}
    </div>
  );
}
