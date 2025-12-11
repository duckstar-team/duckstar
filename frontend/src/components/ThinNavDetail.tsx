'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { scrollToTop } from '../utils/scrollUtils';
import ThinNavMenuItem from './chart/ThinNavMenuItem';
import { WeekDto } from '@/types';

// ThinNavDetail용 네비게이션 아이템
const THIN_NAV_DETAIL_ITEMS = [
  {
    label: '홈',
    href: '/',
    icon: '/icons/home-default.svg',
    activeIcon: '/icons/home-active.svg',
  },
  {
    label: '주간 차트',
    href: '/chart',
    icon: '/icons/chart-default.svg',
    activeIcon: '/icons/chart-active.svg',
  },
  {
    label: '투표하기',
    href: '/vote',
    icon: '/icons/vote-default.svg',
    activeIcon: '/icons/vote-active.svg',
  },
  {
    label: '애니/시간표 검색',
    href: '/search',
    icon: '/icons/search-default.svg',
    activeIcon: '/icons/search-active.svg',
  },
  {
    label: '마이페이지',
    href: '/mypage',
    icon: '/icons/mypage-default.svg',
    activeIcon: '/icons/mypage-active.svg',
  },
];

interface ThinNavDetailProps {
  weeks?: WeekDto[];
  selectedWeek?: WeekDto | null;
  hideTextOnMobile?: boolean;
}

export default function ThinNavDetail({
  weeks = [],
  selectedWeek,
  hideTextOnMobile = false,
}: ThinNavDetailProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [expandedQuarters, setExpandedQuarters] = useState<Set<string>>(
    new Set()
  );

  // 선택된 주차가 있는 분기를 자동으로 펼치기
  useEffect(() => {
    if (selectedWeek) {
      const quarterKey = `${selectedWeek.year}-${selectedWeek.quarter}`;
      setExpandedQuarters((prev) => new Set([...prev, quarterKey]));
    }
  }, [selectedWeek]);

  // 분기 토글 함수
  const toggleQuarter = (year: number, quarter: number) => {
    const quarterKey = `${year}-${quarter}`;
    setExpandedQuarters((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(quarterKey)) {
        newSet.delete(quarterKey);
      } else {
        newSet.add(quarterKey);
      }
      return newSet;
    });
  };

  // weeks 데이터를 기반으로 메뉴 아이템 생성
  const generateMenuItems = () => {
    if (weeks.length === 0) return [];

    // 년도별로 그룹화
    const groupedByYear = weeks.reduce(
      (acc, week) => {
        if (!acc[week.year]) {
          acc[week.year] = [];
        }
        acc[week.year].push(week);
        return acc;
      },
      {} as Record<number, WeekDto[]>
    );

    const menuItems: any[] = []; // TODO: 타입 정의

    // 각 년도별로 처리
    Object.entries(groupedByYear).forEach(([year, yearWeeks]) => {
      // 년도 헤더 추가
      menuItems.push({
        type: 'yearHeader' as const,
        label: year,
      });

      // 분기별로 그룹화
      const groupedByQuarter = yearWeeks.reduce(
        (acc, week) => {
          if (!acc[week.quarter]) {
            acc[week.quarter] = [];
          }
          acc[week.quarter].push(week);
          return acc;
        },
        {} as Record<number, WeekDto[]>
      );

      // 각 분기별로 처리
      Object.entries(groupedByQuarter).forEach(([quarter, quarterWeeks]) => {
        const quarterKey = `${year}-${quarter}`;
        const isExpanded = expandedQuarters.has(quarterKey);
        const isSelected = selectedWeek?.quarter === parseInt(quarter);

        // 분기 헤더 추가
        menuItems.push({
          type: 'quarter' as const,
          label: `${year.slice(-2)}년 ${quarter}분기`,
          state: isExpanded ? ('unfolded' as const) : ('folded' as const),
          icon: isExpanded ? '/icons/arrow-up.svg' : '/icons/arrow-down.svg',
          quarterKey: quarterKey,
        });

        // 분기가 펼쳐진 경우에만 주차들 표시 (주차 오름차순 정렬)
        if (isExpanded) {
          quarterWeeks
            .sort((a, b) => a.week - b.week) // 주차 오름차순 정렬
            .forEach((week) => {
              const isWeekSelected =
                selectedWeek?.week === week.week &&
                selectedWeek?.quarter === week.quarter;
              menuItems.push({
                type: 'week' as const,
                label: `${week.week}주차`,
                state: isWeekSelected
                  ? ('selected' as const)
                  : ('default' as const),
                weekData: week,
              });
            });
        }
      });
    });

    return menuItems;
  };

  const menuItems = generateMenuItems();

  return (
    <div
      className={`${hideTextOnMobile ? 'w-[60px] md:w-[143px]' : 'w-[143px]'} relative h-screen bg-[#212529]`}
    >
      {/* 차트 제목 */}
      <div className="absolute top-[24px] left-[20px]">
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'white' }}>
          차트
        </h2>
      </div>

      {/* 시간 메뉴 아이템들 */}
      <div
        className={`${hideTextOnMobile ? 'w-[40px] md:w-[123px]' : 'w-[123px]'} absolute top-[90px] left-[10px] flex flex-col items-start justify-start gap-[4px] pb-[4px]`}
      >
        {menuItems.map((item, index) => (
          <ThinNavMenuItem
            key={`${item.type}-${index}`}
            type={item.type}
            state={item.state}
            label={item.label}
            icon={item.icon}
            hideTextOnMobile={hideTextOnMobile}
            onClick={() => {
              if (item.type === 'week' && item.weekData) {
                // 주차 클릭 시 동적 라우팅으로 이동
                router.push(
                  `/chart/${item.weekData.year}/${item.weekData.quarter}/${item.weekData.week}`
                );
                scrollToTop();
              } else if (item.type === 'quarter' && item.quarterKey) {
                // 분기 클릭 시 토글
                const [year, quarter] = item.quarterKey.split('-').map(Number);
                toggleQuarter(year, quarter);
              }
            }}
          />
        ))}
      </div>
    </div>
  );
}
