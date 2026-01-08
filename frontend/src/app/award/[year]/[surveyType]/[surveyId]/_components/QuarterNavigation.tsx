'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib';

interface QuarterNavigationProps {
  quarters: number[];
  onQuarterClick: (quarter: number) => void;
  activeQuarter?: number | null;
}

export default function QuarterNavigation({
  quarters,
  onQuarterClick,
  activeQuarter,
}: QuarterNavigationProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>(
    'desktop'
  );

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setScreenSize('mobile');
      } else if (width < 1024) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
      }
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const getWidth = () => {
    if (screenSize === 'mobile') {
      return isHovered ? 100 : 36;
    } else if (screenSize === 'tablet') {
      return isHovered ? 120 : 42;
    }
    return isHovered ? 140 : 48;
  };

  const getPadding = () => {
    if (screenSize === 'mobile') {
      return isHovered ? '8px' : '8px 0';
    } else if (screenSize === 'tablet') {
      return isHovered ? '10px' : '10px 0';
    }
    return isHovered ? '12px' : '12px 0';
  };

  return (
    <div
      className="fixed top-1/2 right-2 z-[100] -translate-y-1/2 sm:right-3 md:right-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.nav
        className="flex flex-col items-center overflow-hidden rounded-lg border border-gray-200 bg-white/95 shadow-lg backdrop-blur-sm"
        animate={{
          width: getWidth(),
          padding: getPadding(),
        }}
        transition={{
          duration: 0.15,
          ease: [0.4, 0, 0.2, 1],
        }}
      >
        {quarters.map((quarter) => (
          <motion.button
            key={quarter}
            onClick={() => onQuarterClick(quarter)}
            className={cn(
              'relative rounded-md text-xs font-medium transition-colors duration-150 sm:text-sm',
              'w-full overflow-hidden whitespace-nowrap',
              'flex items-center',
              isHovered
                ? 'justify-start px-2 py-1.5 sm:px-2.5 sm:py-1.5 md:px-3 md:py-2'
                : 'justify-center py-1.5 sm:py-1.5 md:py-2',
              activeQuarter === quarter
                ? 'bg-[#990033]/10 text-gray-900'
                : 'text-gray-600 hover:bg-[#990033]/5 hover:text-gray-900'
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* 항상 클릭 가능한 영역 */}
            <div
              className={cn(
                'flex items-center',
                isHovered ? 'w-full justify-start gap-2' : 'justify-center'
              )}
            >
              {/* 기본 상태: 점 표시 */}
              <motion.div
                className={cn(
                  'flex-shrink-0 rounded-full transition-all duration-150',
                  activeQuarter === quarter
                    ? 'h-2.5 w-2.5 bg-[#990033] sm:h-3 sm:w-3'
                    : 'h-1.5 w-1.5 bg-[#990033]/30 sm:h-2 sm:w-2'
                )}
                animate={{
                  scale: activeQuarter === quarter && !isHovered ? 1 : 1,
                }}
              />
              {/* 호버 시 텍스트 표시 */}
              <motion.span
                className={cn(isHovered ? 'flex-1' : 'w-0')}
                animate={{
                  opacity: isHovered ? 1 : 0,
                  x: isHovered ? 0 : -8,
                  width: isHovered ? 'auto' : 0,
                }}
                transition={{
                  duration: 0.15,
                  ease: [0.4, 0, 0.2, 1],
                }}
                style={{ display: 'inline-block', overflow: 'hidden' }}
              >
                {quarter}분기
              </motion.span>
            </div>
          </motion.button>
        ))}
      </motion.nav>
    </div>
  );
}
