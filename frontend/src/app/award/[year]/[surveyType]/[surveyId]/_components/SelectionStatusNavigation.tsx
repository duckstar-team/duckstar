'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { CheckSquare2, Square } from 'lucide-react';

interface SelectionStatusNavigationProps {
  selectedCount: number;
  totalCount: number;
  isFiltered: boolean;
  onToggleFilter: () => void;
  isYearEnd?: boolean;
}

export default function SelectionStatusNavigation({
  selectedCount,
  totalCount,
  isFiltered,
  onToggleFilter,
  isYearEnd = false,
}: SelectionStatusNavigationProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

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
        'fixed right-2 sm:right-3 md:right-4 top-1/2 z-[100] -translate-y-1/2',
        isYearEnd ? 'translate-y-[120px]' : ''
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.nav
        className={cn(
          'flex flex-col items-center rounded-lg border border-gray-200 backdrop-blur-sm shadow-lg overflow-hidden',
          isFiltered
            ? 'bg-[#990033]/10'
            : 'bg-white/95 hover:bg-[#990033]/5'
        )}
        animate={{
          width: getWidth(),
          padding: getPadding(),
        }}
        transition={{
          duration: 0.15,
          ease: [0.4, 0, 0.2, 1],
        }}
      >
        <motion.button
          onClick={onToggleFilter}
          className={cn(
            'relative rounded-md text-xs sm:text-sm font-medium transition-colors duration-150',
            'whitespace-nowrap overflow-hidden w-full',
            'flex items-center',
            isHovered 
              ? 'justify-start px-2 sm:px-2.5 md:px-3 py-1.5 sm:py-1.5 md:py-2' 
              : 'justify-center py-1.5 sm:py-1.5 md:py-2',
            isFiltered
              ? 'text-gray-900'
              : 'text-gray-600 hover:text-gray-900'
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className={cn(
            'flex items-center',
            isHovered ? 'justify-start gap-2 w-full' : 'justify-center'
          )}>
            {/* 기본 상태: 체크박스 아이콘 표시 */}
            <CheckSquare2
            className={cn(
                'flex-shrink-0 transition-all duration-150',
                'w-3 h-3 sm:w-4 sm:h-4 text-[#990033]'
            )}
            />
            {/* 호버 시 텍스트 표시 */}
            <motion.span
              className={cn(
                isHovered ? 'flex-1' : 'w-0'
              )}
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
      </motion.nav>
    </div>
  );
}

