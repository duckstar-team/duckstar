'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { scrollToTop } from '@/utils/scrollUtils';
import { useNavigationPrefetch } from '@/hooks/useNavigationPrefetch';
import { useNavigationState } from '@/hooks/useNavigationState';
import NavigationLoadingIndicator from '@/components/common/NavigationLoadingIndicator';
import { NAV_ITEMS } from './navItems';

// Vote button variants based on Figma specifications
const voteButtonVariants = cva(
  // Base classes from Figma
  'w-[40px] md:w-[167px] h-[40px] py-[10px] pl-[10px] pr-[10px] md:pr-[12px] rounded-lg flex justify-start items-center gap-0 md:gap-[10px] transition-all duration-200 ease-in-out group-hover:w-[167px] group-hover:pr-[12px] group-hover:gap-[10px]',
  {
    variants: {
      state: {
        default: 'bg-white',
        hover: 'bg-[#ffd4e2]',
        active: 'bg-gradient-to-r from-[#cb285e] to-[#9c1f49]',
      },
    },
    defaultVariants: {
      state: 'default',
    },
  }
);

// Text variants based on Figma specifications
const textVariants = cva(
  'flex justify-center flex-col text-[16px] font-[Pretendard] break-words leading-[normal] whitespace-pre',
  {
    variants: {
      state: {
        default: 'text-[#586672] font-medium',
        hover: 'text-[#586672] font-medium',
        active: 'text-[#ffffff] font-bold',
      },
    },
    defaultVariants: {
      state: 'default',
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
  pathname?: string;
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
  badgeText,
  pathname,
}: NavButtonProps) {
  const { handleMouseEnter } = useNavigationPrefetch();
  const { startNavigation } = useNavigationState();
  const state = isActive ? 'active' : isHovered ? 'hover' : 'default';
  // hover 상태에서는 defaultIcon 사용 (vote-default.svg)
  const iconSrc = isActive ? activeIcon : defaultIcon;

  // 단순화된 네비게이션 클릭 핸들러
  const handleNavigationClick = () => {
    // 네비게이션 시작
    startNavigation();

    // 홈으로 이동할 때만 스크롤 탑으로 이동
    if (href === '/') {
      scrollToTop();
    }

    // 강제 새로고침 제거 - React 상태 관리로 해결
    // search 화면에서의 상태 초기화는 컴포넌트 내부에서 처리
  };

  return (
    <>
      {isBeta ? (
        <div
          className={cn(
            voteButtonVariants({ state }),
            'opacity-50',
            'relative'
          )}
        >
          {/* Icon container */}
          <div className={cn(iconSize, 'relative')}>
            <div className={iconClass}>
              <img
                src={iconSrc}
                alt={label}
                className="size-full object-contain"
              />
            </div>
          </div>

          {/* Text container */}
          <div
            className={cn(
              textVariants({ state }),
              'hidden group-hover:block md:block'
            )}
          >
            <span>{label}</span>
          </div>

          {/* 베타 표시 */}
          <div className="absolute -right-1 bottom-2 z-10 hidden group-hover:block md:block">
            <span
              className={`rounded px-1 py-0.5 text-[12px] ${
                badgeText === '8/31 출시'
                  ? 'bg-gray-200 text-gray-900'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {badgeText || '준비중'}
            </span>
          </div>
        </div>
      ) : (
        <Link
          href={href}
          onClick={handleNavigationClick}
          onMouseEnter={() => handleMouseEnter(href)}
        >
          <div className={cn(voteButtonVariants({ state }), 'relative')}>
            {/* Icon container */}
            <div className={cn(iconSize, 'relative')}>
              <div className={iconClass}>
                <img
                  src={iconSrc}
                  alt={label}
                  className="size-full object-contain"
                />
              </div>
            </div>

            {/* Text container */}
            <div
              className={cn(
                textVariants({ state }),
                'hidden group-hover:block md:block'
              )}
            >
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
  const { isNavigating } = useNavigationState();

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
  const footerTop = Math.max(
    windowHeight - headerHeight - footerHeight - 20,
    400
  ); // 최소 400px, 여백 20px

  // 갤럭시 Z 폴드 5와 같은 좁은 기기 감지 (280px-400px)
  const isNarrowDevice = windowWidth >= 280 && windowWidth < 400;
  const isVeryNarrowDevice = windowWidth < 280;

  return (
    <div
      className={`${
        isVeryNarrowDevice
          ? 'w-[52px]'
          : isNarrowDevice
            ? 'w-[56px]'
            : 'w-[60px] md:w-[200px]'
      } group relative h-screen border-r border-[#DADCE0] bg-white transition-all duration-300 ease-in-out hover:w-[200px]`}
    >
      {/* Navigation items */}
      <div
        className={`${
          isVeryNarrowDevice
            ? 'left-[8px] w-[32px]'
            : isNarrowDevice
              ? 'left-[8px] w-[36px]'
              : 'left-[8px] w-[40px] md:left-[16px] md:w-[167px]'
        } absolute top-[16px] flex flex-col items-start justify-start gap-[4px] pb-[4px] transition-all duration-300 ease-in-out group-hover:left-[16px] group-hover:w-[167px]`}
      >
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
              iconSize={item.iconSize || 'size-5'}
              iconClass={
                item.iconClass || 'flex items-center justify-center size-full'
              }
              isActive={
                item.href === '/search'
                  ? pathname === item.href || pathname.startsWith('/search/')
                  : pathname === item.href
              }
              isHovered={hoveredItem === item.href && pathname !== item.href}
              isBeta={item.isBeta}
              badgeText={item.badgeText}
              pathname={pathname}
            />
          </div>
        ))}
      </div>

      {/* Footer - 동적 위치 */}
      <div
        className={`${
          isVeryNarrowDevice
            ? 'left-[8px]'
            : isNarrowDevice
              ? 'left-[8px]'
              : 'left-[8px] md:left-[16.5px]'
        } absolute flex flex-col items-start justify-start gap-[21px] opacity-0 transition-all duration-300 ease-in-out group-hover:left-[16.5px] group-hover:opacity-100 md:opacity-100`}
        style={{ top: `${footerTop}px` }}
      >
        <div className="relative h-[42px] w-[161px]">
          {/* 상단 링크 */}
          <div className="absolute top-0 left-[0.5px] h-[21px] w-[65px]">
            <Link
              href="/about"
              className="absolute top-0 left-0 flex flex-col justify-center font-[Pretendard] text-[14px] leading-[21px] font-normal break-words text-[#586672] transition-colors hover:text-gray-800"
            >
              덕스타 소개
            </Link>
          </div>
          {/* 하단 링크들 */}
          <div className="absolute top-[21px] left-[0.5px] flex items-center justify-start gap-[5px]">
            <div className="relative h-[21px] w-[49px]">
              <Link
                href="/terms"
                className="absolute top-0 left-0 flex flex-col justify-center font-[Pretendard] text-[14px] leading-[21px] font-normal break-words text-[#586672] transition-colors hover:text-gray-800"
              >
                이용약관
              </Link>
            </div>
            <div className="flex flex-col justify-center font-[Pretendard] text-[14px] leading-[21px] font-normal break-words text-[#586672]">
              ·
            </div>
            <div className="relative h-[21px] w-[97px]">
              <Link
                href="/privacy-policy"
                className="absolute top-0 left-0 flex flex-col justify-center font-[Pretendard] text-[14px] leading-[21px] font-normal break-words text-[#586672] transition-colors hover:text-gray-800"
              >
                개인정보처리방침
              </Link>
            </div>
          </div>
        </div>

        {/* 저작권 텍스트 */}
        <div className="flex flex-col justify-center font-[Pretendard] text-[14px] leading-[21px] font-normal break-words text-[#586672]">
          © 2025 DUCKSTAR
        </div>
      </div>

      {/* 네비게이션 로딩 인디케이터 */}
      <NavigationLoadingIndicator isNavigating={isNavigating} />
    </div>
  );
}
