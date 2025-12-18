'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { NAV_ITEMS, NavItem } from './navItems';
import ThinNav from './ThinNav';
import ThinNavDetail from './ThinNavDetail';
import { useChart } from './AppContainer';

// Button variants based on Figma specifications
const buttonVariants = cva(
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

interface NavButtonProps {
  item: NavItem;
  isActive?: boolean;
  isHovered?: boolean;
}

function NavButton({ item, isActive, isHovered }: NavButtonProps) {
  const { href, label, defaultIcon, activeIcon, isBeta } = item;
  const state = isActive ? 'active' : isHovered ? 'hover' : 'default';
  const iconSrc = isActive ? activeIcon : defaultIcon;
  const router = useRouter();

  return (
    <button
      type="button"
      className={cn(
        buttonVariants({ state }),
        'relative cursor-pointer disabled:cursor-not-allowed! disabled:opacity-50'
      )}
      onClick={() => !isBeta && router.push(href)}
      disabled={isBeta}
    >
      {/* Icon container */}
      <div className="relative">
        <div className="flex items-center justify-center">
          <img src={iconSrc} alt={label} className="size-4 object-contain" />
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
      {isBeta && (
        <div className="absolute -right-1 bottom-2 z-10 hidden group-hover:block md:block">
          <span className="rounded bg-gray-100 px-1 py-0.5 text-[10px] text-gray-600">
            준비중
          </span>
        </div>
      )}
    </button>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [windowHeight, setWindowHeight] = useState(0);
  const [windowWidth, setWindowWidth] = useState(0);
  const [isThinNavHovered, setIsThinNavHovered] = useState(false);
  const [isThinNavDetailHovered, setIsThinNavDetailHovered] = useState(false);

  // 차트 페이지 여부 확인
  const isChartPage = pathname.startsWith('/chart');

  // 차트 컨텍스트에서 weeks와 selectedWeek 가져오기
  const { weeks, selectedWeek } = useChart();

  useEffect(() => {
    const updateDimensions = () => {
      setWindowHeight(window.innerHeight);
      setWindowWidth(window.innerWidth);
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // 페이지 이동 시 호버 상태 초기화
  useEffect(() => {
    setIsThinNavHovered(false);
    setIsThinNavDetailHovered(false);
  }, [pathname]);

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

  // 차트 페이지일 때 ThinNav와 ThinNavDetail 렌더링
  if (isChartPage) {
    return (
      <>
        <ThinNav
          onHover={setIsThinNavHovered}
          isExpanded={isThinNavHovered || isThinNavDetailHovered}
        />
        <div
          className={`absolute top-0 transition-all duration-300 ease-in-out ${
            isThinNavHovered || isThinNavDetailHovered
              ? 'left-[200px]'
              : 'left-[60px]'
          }`}
          onMouseEnter={() => {
            if (isThinNavHovered) {
              setIsThinNavDetailHovered(true);
            }
          }}
          onMouseLeave={() => setIsThinNavDetailHovered(false)}
        >
          <ThinNavDetail weeks={weeks} selectedWeek={selectedWeek} />
        </div>
      </>
    );
  }

  // 일반 페이지일 때 기존 Sidebar 렌더링
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
        {NAV_ITEMS.map((item) => (
          <div
            key={item.href}
            onMouseEnter={() => setHoveredItem(item.href)}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <NavButton
              item={item}
              isActive={
                item.href === '/chart'
                  ? pathname.startsWith('/chart')
                  : pathname === item.href
              }
              isHovered={hoveredItem === item.href && pathname !== item.href}
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
    </div>
  );
}
