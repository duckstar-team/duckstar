'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { NAV_ITEMS } from './navItems';

interface ThinNavProps {
  onHover?: (isHovered: boolean) => void;
  isExpanded?: boolean;
}

export default function ThinNav({ onHover, isExpanded = false }: ThinNavProps) {
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [showText, setShowText] = useState(false);

  // isExpanded가 true가 되면 300ms 후에 텍스트 표시
  useEffect(() => {
    if (isExpanded) {
      const timer = setTimeout(() => {
        setShowText(true);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setShowText(false);
    }
  }, [isExpanded]);

  return (
    <div
      className={`relative hidden h-screen border-r border-[#DADCE0] bg-white transition-all duration-300 ease-in-out md:block ${
        isExpanded ? 'w-[200px]' : 'w-[60px]'
      }`}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
    >
      {/* 네비게이션 아이템들 */}
      <div className="absolute top-[16px] flex w-full flex-col items-center justify-start gap-[4px] pb-[4px]">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === '/search'
              ? pathname === item.href || pathname.startsWith('/search/')
              : item.href === '/chart'
                ? pathname.startsWith('/chart')
                : pathname === item.href;
          const isHovered = hoveredItem === item.href && !isActive;
          const iconSrc = isActive ? item.activeIcon : item.defaultIcon;

          return (
            <div
              key={item.href}
              onMouseEnter={() => setHoveredItem(item.href)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <Link href={item.href}>
                <div
                  className={`relative flex h-[40px] items-center rounded-lg transition-all duration-300 ease-in-out ${
                    isExpanded
                      ? 'w-[167px] justify-start px-[10px]'
                      : 'w-[40px] justify-center'
                  } ${
                    isActive
                      ? 'bg-gradient-to-r from-[#cb285e] to-[#9c1f49]'
                      : isHovered
                        ? 'bg-[#ffd4e2]'
                        : 'hover:bg-gray-50'
                  } ${item.isBeta ? 'opacity-50' : ''} `}
                >
                  <img
                    src={iconSrc}
                    alt={item.label}
                    className="h-5 w-5 flex-shrink-0 object-contain"
                  />
                  {showText && (
                    <div
                      className={`ml-[10px] font-[Pretendard] text-[16px] ${
                        isActive
                          ? 'font-bold text-white'
                          : 'font-medium text-[#586672]'
                      }`}
                    >
                      {item.label}
                    </div>
                  )}
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
