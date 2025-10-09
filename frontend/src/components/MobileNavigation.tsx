'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { scrollToTop } from '../utils/scrollUtils';

// 모바일 네비게이션 아이템
const MOBILE_NAV_ITEMS = [
  { 
    label: "홈", 
    href: "/",
    icon: "/icons/home-default.svg",
    activeIcon: "/icons/home-active.svg",
  },
  { 
    label: "투표", 
    href: "/vote",
    icon: "/icons/vote-default.svg",
    activeIcon: "/icons/vote-active.svg",
  },
  { 
    label: "검색", 
    href: "/search",
    icon: "/icons/search-default.svg",
    activeIcon: "/icons/search-active.svg",
  },
  { 
    label: "차트", 
    href: "/chart",
    icon: "/icons/chart-default.svg",
    activeIcon: "/icons/chart-active.svg",
  },
];

interface MobileNavigationProps {
  className?: string;
}

export default function MobileNavigation({ className = "" }: MobileNavigationProps) {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkVisibility = () => {
      const width = window.innerWidth;
      setIsVisible(width <= 768);
    };

    checkVisibility();
    window.addEventListener('resize', checkVisibility);
    return () => window.removeEventListener('resize', checkVisibility);
  }, []);

  if (!isVisible) return null;

  return (
    <nav className={`fixed bottom-0 left-0 right-0 h-[60px] bg-white border-t border-[#E9ECEF] z-50 ${className}`}>
      <div className="flex h-full">
        {MOBILE_NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const iconSrc = isActive ? item.activeIcon : item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                if (item.href === '/') {
                  scrollToTop();
                }
              }}
              className="flex-1 flex flex-col items-center justify-center gap-1 touch-target"
            >
              <div className="w-6 h-6 flex items-center justify-center">
                <img
                  src={iconSrc}
                  alt={item.label}
                  className="w-5 h-5"
                />
              </div>
              <span className={`text-xs font-medium ${
                isActive ? 'text-[#990033]' : 'text-gray-500'
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
