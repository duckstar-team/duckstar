'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

// Navigation items configuration with local icon paths
const NAV_ITEMS = [
  { 
    label: "홈", 
    href: "/",
    defaultIcon: "/icons/home-default.svg",
    activeIcon: "/icons/home-active.svg",
    iconSize: "size-5",
    iconClass: "flex items-center justify-center size-full",
    isBeta: true,
    badgeText: "준비중"
  },
  { 
    label: "주간 차트", 
    href: "/chart",
    defaultIcon: "/icons/chart-default.svg",
    activeIcon: "/icons/chart-active.svg",
    iconSize: "size-5",
    iconClass: "flex items-center justify-center size-full",
    isBeta: true,
    badgeText: "준비중"
  },
  { 
    label: "투표하기", 
    href: "/vote",
    defaultIcon: "/icons/vote-default.svg",
    activeIcon: "/icons/vote-active.svg",
    iconSize: "size-5",
    iconClass: "flex items-center justify-center size-full",
    isBeta: false
  },
  { 
    label: "애니/캐릭터 찾기", 
    href: "/search",
    defaultIcon: "/icons/search-default.svg",
    activeIcon: "/icons/search-active.svg",
    iconSize: "size-5",
    iconClass: "flex items-center justify-center size-full",
    isBeta: false
  },
  { 
    label: "마이페이지", 
    href: "/mypage",
    defaultIcon: "/icons/mypage-default.svg",
    activeIcon: "/icons/mypage-active.svg",
    iconSize: "size-5",
    iconClass: "flex items-center justify-center size-full",
    isBeta: true,
    badgeText: "준비중"
  },
];

// Vote button variants based on Figma specifications
const voteButtonVariants = cva(
  // Base classes from Figma
  "w-[40px] md:w-[167px] h-[40px] py-[10px] pl-[10px] pr-[10px] md:pr-[12px] rounded-lg flex justify-start items-center gap-0 md:gap-[10px] transition-all duration-200 ease-in-out group-hover:w-[167px] group-hover:pr-[12px] group-hover:gap-[10px]",
  {
    variants: {
      state: {
        default: "bg-white",
        hover: "bg-[#ffd4e2]",
        active: "bg-gradient-to-r from-[#cb285e] to-[#9c1f49]",
      },
    },
    defaultVariants: {
      state: "default",
    },
  }
);

// Text variants based on Figma specifications
const textVariants = cva(
  "flex justify-center flex-col text-[16px] font-[Pretendard] break-words leading-[normal] whitespace-pre",
  {
    variants: {
      state: {
        default: "text-[#586672] font-medium",
        hover: "text-[#586672] font-medium",
        active: "text-[#ffffff] font-bold",
      },
    },
    defaultVariants: {
      state: "default",
    },
  }
);

interface NavButtonProps extends VariantProps<typeof voteButtonVariants> {
  href: string;
  label: string;
  defaultIcon: string;
  activeIcon: string;
  iconSize: string;
  iconClass: string;
  isActive?: boolean;
  isHovered?: boolean;
  isBeta?: boolean;
  badgeText?: string;
}

function NavButton({ 
  href, 
  label, 
  defaultIcon, 
  activeIcon, 
  iconSize, 
  iconClass,
  isActive, 
  isHovered,
  isBeta = false,
  badgeText
}: NavButtonProps) {
  const state = isActive ? 'active' : isHovered ? 'hover' : 'default';
  // hover 상태에서는 defaultIcon 사용 (vote-default.svg)
  const iconSrc = isActive ? activeIcon : defaultIcon;
  
  // 네비게이션 메뉴 클릭 시 스크롤을 맨 위로 이동
  const handleNavigationClick = () => {
    // search 화면으로 이동할 때는 사이드바 네비게이션임을 표시
    if (href === '/search') {
      // 사이드바 네비게이션임을 표시하는 플래그 설정
      sessionStorage.setItem('sidebar-navigation', 'true');
      console.log('🔝 search 화면 사이드바 네비게이션 - 스크롤 맨 위로 이동');
    }
    // vote 화면으로 이동할 때도 사이드바 네비게이션임을 표시
    if (href === '/vote') {
      sessionStorage.setItem('sidebar-navigation', 'true');
      console.log('🔝 vote 화면 사이드바 네비게이션 - 스크롤 맨 위로 이동');
    }
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  };

  return (
    <>
      {isBeta ? (
        <div className={cn(voteButtonVariants({ state }), "opacity-50", "relative")}>
          {/* Icon container */}
          <div className={cn(iconSize, "relative")}>
            <div className={iconClass}>
              <img
                src={iconSrc}
                alt={label}
                className="size-full object-contain"
              />
            </div>
          </div>
        
          {/* Text container */}
          <div className={cn(textVariants({ state }), "hidden md:block group-hover:block")}>
            <span>{label}</span>
          </div>
          
          {/* 베타 표시 */}
          <div className="absolute -right-1 bottom-2 z-10 hidden md:block group-hover:block">
            <span className={`text-[12px] px-1 py-0.5 rounded ${
              badgeText === "8/31 출시" 
                ? "bg-gray-200 text-gray-900" 
                : "bg-gray-100 text-gray-600"
            }`}>{badgeText || "준비중"}</span>
          </div>
        </div>
      ) : (
        <Link href={href} onClick={handleNavigationClick}>
          <div className={cn(voteButtonVariants({ state }), "relative")}>
            {/* Icon container */}
            <div className={cn(iconSize, "relative")}>
              <div className={iconClass}>
                <img
                  src={iconSrc}
                  alt={label}
                  className="size-full object-contain"
                />
              </div>
            </div>
            
            {/* Text container */}
            <div className={cn(textVariants({ state }), "hidden md:block group-hover:block")}>
              <span>{label}</span>
            </div>
          </div>
        </Link>
      )}
    </>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [windowHeight, setWindowHeight] = useState(0);
  const [windowWidth, setWindowWidth] = useState(0);

  useEffect(() => {
    const updateDimensions = () => {
      setWindowHeight(window.innerHeight);
      setWindowWidth(window.innerWidth);
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Footer 위치 계산 (화면 높이에서 헤더 높이(56px)와 Footer 높이를 뺀 값)
  const headerHeight = 56; // 헤더 높이
  const footerHeight = 100; // Footer 대략적 높이
  const footerTop = Math.max(windowHeight - headerHeight - footerHeight - 20, 400); // 최소 400px, 여백 20px

  // 갤럭시 Z 폴드 5와 같은 좁은 기기 감지 (280px-400px)
  const isNarrowDevice = windowWidth >= 280 && windowWidth < 400;
  const isVeryNarrowDevice = windowWidth < 280;

  return (
    <div className={`${
      isVeryNarrowDevice ? 'w-[52px]' : 
      isNarrowDevice ? 'w-[56px]' : 
      'w-[60px] md:w-[200px]'
    } h-screen bg-white border-r border-[#DADCE0] relative transition-all duration-300 ease-in-out group hover:w-[200px]`}>
      {/* Navigation items */}
      <div className={`${
        isVeryNarrowDevice ? 'w-[32px] left-[8px]' : 
        isNarrowDevice ? 'w-[36px] left-[8px]' : 
        'w-[40px] md:w-[167px] left-[8px] md:left-[16px]'
      } pb-[4px] top-[16px] absolute flex flex-col justify-start items-start gap-[4px] transition-all duration-300 ease-in-out group-hover:w-[167px] group-hover:left-[16px]`}>
        {NAV_ITEMS.map((item, index) => (
          <div
            key={item.href}
            onMouseEnter={() => setHoveredItem(item.href)}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <NavButton
              href={item.href}
              label={item.label}
              defaultIcon={item.defaultIcon}
              activeIcon={item.activeIcon}
              iconSize={item.iconSize}
              iconClass={item.iconClass}
              isActive={pathname === item.href}
              isHovered={hoveredItem === item.href && pathname !== item.href}
              isBeta={item.isBeta}
              badgeText={item.badgeText}
            />
          </div>
        ))}
      </div>
      
      {/* Footer - 동적 위치 */}
      <div 
        className={`${
          isVeryNarrowDevice ? 'left-[8px]' : 
          isNarrowDevice ? 'left-[8px]' : 
          'left-[8px] md:left-[16.5px]'
        } absolute flex flex-col justify-start items-start gap-[21px] transition-all duration-300 ease-in-out group-hover:left-[16.5px] opacity-0 md:opacity-100 group-hover:opacity-100`}
        style={{ top: `${footerTop}px` }}
      >
        <div className="w-[161px] h-[42px] relative">
          {/* 상단 링크 */}
          <div className="w-[65px] h-[21px] left-[0.5px] top-0 absolute">
            <Link 
              href="/about" 
              className="left-0 top-0 absolute flex justify-center flex-col text-[#586672] text-[14px] font-[Pretendard] font-normal leading-[21px] break-words hover:text-gray-800 transition-colors"
            >
              덕스타 소개
            </Link>
          </div>
          {/* 하단 링크들 */}
          <div className="left-[0.5px] top-[21px] absolute flex justify-start items-center gap-[5px]">
            <div className="w-[49px] h-[21px] relative">
              <Link 
                href="/terms" 
                className="left-0 top-0 absolute flex justify-center flex-col text-[#586672] text-[14px] font-[Pretendard] font-normal leading-[21px] break-words hover:text-gray-800 transition-colors"
              >
                이용약관
              </Link>
            </div>
            <div className="flex justify-center flex-col text-[#586672] text-[14px] font-[Pretendard] font-normal leading-[21px] break-words">
              ·
            </div>
            <div className="w-[97px] h-[21px] relative">
              <Link 
                href="/privacy-policy" 
                className="left-0 top-0 absolute flex justify-center flex-col text-[#586672] text-[14px] font-[Pretendard] font-normal leading-[21px] break-words hover:text-gray-800 transition-colors"
              >
                개인정보처리방침
              </Link>
            </div>
          </div>
        </div>

        {/* 저작권 텍스트 */}
        <div className="flex justify-center flex-col text-[#586672] text-[14px] font-[Pretendard] font-normal leading-[21px] break-words">
          © 2025 DUCKSTAR
        </div>
      </div>
    </div>
  );
}
