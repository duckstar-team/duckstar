'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { scrollToTop } from '../utils/scrollUtils';

// ThinNav용 네비게이션 아이템
const THIN_NAV_ITEMS = [
  { 
    label: "홈", 
    href: "/",
    icon: "/icons/home-default.svg",
    activeIcon: "/icons/home-active.svg",
  },
  { 
    label: "주간 차트", 
    href: "/chart",
    icon: "/icons/chart-default.svg",
    activeIcon: "/icons/chart-active.svg",
  },
  { 
    label: "투표하기", 
    href: "/vote",
    icon: "/icons/vote-default.svg",
    activeIcon: "/icons/vote-active.svg",
  },
  { 
    label: "애니/시간표 검색", 
    href: "/search",
    icon: "/icons/search-default.svg",
    activeIcon: "/icons/search-active.svg",
  },
  { 
    label: "마이페이지", 
    href: "/mypage",
    icon: "/icons/mypage-default.svg",
    activeIcon: "/icons/mypage-active.svg",
    isBeta: true,
    badgeText: "준비중",
  },
];

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
        className={`h-screen bg-white border-r border-[#DADCE0] relative hidden md:block transition-all duration-300 ease-in-out ${
          isExpanded ? 'w-[200px]' : 'w-[60px]'
        }`}
        onMouseEnter={() => onHover?.(true)}
        onMouseLeave={() => onHover?.(false)}
      >
      {/* 네비게이션 아이템들 */}
      <div className="pb-[4px] top-[16px] absolute flex flex-col justify-start items-center gap-[4px] w-full">
        {THIN_NAV_ITEMS.map((item) => {
          const isActive = item.href === '/search' 
            ? pathname === item.href || pathname.startsWith('/search/')
            : pathname === item.href;
          const isHovered = hoveredItem === item.href && !isActive;
          const iconSrc = isActive ? item.activeIcon : item.icon;
          
          return (
            <div
              key={item.href}
              onMouseEnter={() => setHoveredItem(item.href)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <Link
                href={item.href}
                onClick={() => {
                  if (item.href === '/') {
                    scrollToTop();
                  }
                }}
                className="block"
              >
                <div className={`
                  h-[40px] rounded-lg flex items-center relative transition-all duration-300 ease-in-out
                  ${isExpanded 
                    ? 'w-[167px] px-[10px] justify-start' 
                    : 'w-[40px] justify-center'
                  }
                  ${isActive 
                    ? 'bg-gradient-to-r from-[#cb285e] to-[#9c1f49]' 
                    : isHovered 
                      ? 'bg-[#ffd4e2]' 
                      : 'hover:bg-gray-50'
                  }
                  ${item.isBeta ? 'opacity-50' : ''}
                `}>
                  <img
                    src={iconSrc}
                    alt={item.label}
                    className="w-5 h-5 object-contain flex-shrink-0"
                  />
                  {showText && (
                    <div className={`ml-[10px] text-[16px] font-[Pretendard] ${
                      isActive ? 'text-white font-bold' : 'text-[#586672] font-medium'
                    }`}>
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
