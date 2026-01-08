'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib';
import { CheckSquare2 } from 'lucide-react';

interface SelectionStatusNavigationProps {
  isFiltered: boolean;
  onToggleFilter: () => void;
  isYearEnd?: boolean;
}

export default function SelectionStatusNavigation({
  isFiltered,
  onToggleFilter,
  isYearEnd = false,
}: SelectionStatusNavigationProps) {
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
      className={cn(
        'fixed top-1/2 right-2 z-[100] -translate-y-1/2 sm:right-3 md:right-4',
        isYearEnd ? 'translate-y-[120px]' : ''
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.button
        onClick={onToggleFilter}
        className={cn(
          'relative flex w-full items-center overflow-hidden rounded-md border border-gray-200 text-xs font-medium whitespace-nowrap shadow-lg backdrop-blur-sm sm:text-sm',
          isHovered
            ? 'justify-start px-2 py-1.5 sm:px-2.5 sm:py-1.5 md:px-3 md:py-2'
            : 'justify-center py-1.5 sm:py-1.5 md:py-2',
          isFiltered
            ? 'text-brand bg-[#990033]/10 font-semibold'
            : 'bg-white text-gray-900 hover:bg-[#990033]/5'
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        animate={{
          width: getWidth(),
          padding: getPadding(),
        }}
      >
        <div
          className={cn(
            'flex items-center',
            isHovered ? 'w-full justify-start gap-2' : 'justify-center'
          )}
        >
          {/* 기본 상태: 체크박스 아이콘 표시 */}
          <CheckSquare2 className="h-3 w-3 flex-shrink-0 text-[#990033] transition-all duration-150 sm:h-4 sm:w-4" />
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
            선택 현황
          </motion.span>
        </div>
      </motion.button>
    </div>
  );
}
