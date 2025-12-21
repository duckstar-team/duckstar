'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import ThinNavMenuItem from '@/components/domain/chart/ThinNavMenuItem';
import { WeekDto, SurveyDto } from '@/types';
import { ApiResponse } from '@/api/http';
import { getSurveyTypeLabel } from '@/lib/surveyUtils';

interface ThinNavDetailProps {
  weeks?: WeekDto[];
  selectedWeek?: WeekDto | null;
  hideTextOnMobile?: boolean;
  mode?: 'chart' | 'award';
  selectedSurveyId?: number | null;
}

export default function ThinNavDetail({
  weeks = [],
  selectedWeek,
  hideTextOnMobile = false,
  mode = 'chart',
  selectedSurveyId = null,
}: ThinNavDetailProps) {
  const router = useRouter();

  const [expandedQuarters, setExpandedQuarters] = useState<Set<string>>(
    new Set()
  );

  // surveys API 호출 (award 모드일 때만)
  const { data: surveysData } = useQuery<ApiResponse<SurveyDto[]>>({
    queryKey: ['surveys'],
    queryFn: async () => {
      const response = await fetch('/api/v1/vote/surveys');
      if (!response.ok) throw new Error('설문 조회 실패');
      return await response.json();
    },
    enabled: mode === 'award',
  });

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

  // award 모드용 메뉴 아이템 생성
  const generateAwardMenuItems = () => {
    if (!surveysData || surveysData.result.length === 0) return [];

    const menuItems: any[] = [];

    // 년도별로 그룹화
    const groupedByYear = surveysData.result.reduce(
      (acc, survey) => {
        if (!acc[survey.year]) {
          acc[survey.year] = [];
        }
        acc[survey.year].push(survey);
        return acc;
      },
      {} as Record<number, SurveyDto[]>
    );

    // 각 년도별로 처리
    Object.entries(groupedByYear).forEach(([year, yearSurveys]) => {
      // 년도 헤더 추가
      menuItems.push({
        type: 'yearHeader' as const,
        label: year,
      });

      // 각 설문을 메뉴 아이템으로 추가
      yearSurveys.forEach((survey) => {
        const surveyId = survey.surveyId;
        const isSelected = selectedSurveyId === surveyId;
        menuItems.push({
          type: 'awardItem' as const,
          label: getSurveyTypeLabel(survey.type),
          state: isSelected ? ('selected' as const) : ('default' as const),
          surveyId: surveyId,
          survey: survey,
        });
      });
    });

    return menuItems;
  };

  // weeks 데이터를 기반으로 메뉴 아이템 생성
  const generateChartMenuItems = () => {
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

  const generateMenuItems = () => {
    if (mode === 'award') {
      return generateAwardMenuItems();
    }
    return generateChartMenuItems();
  };

  const menuItems = generateMenuItems();

  return (
    <div
      className={`${hideTextOnMobile ? 'w-[60px] md:w-[143px]' : 'w-38'} relative h-screen bg-[#212529]`}
    >
      {/* 차트/결산 투표 제목 */}
      <div className="absolute top-[24px] left-[20px]">
        <h2 className="text-xl font-semibold text-white">
          {mode === 'award' ? '결산 투표' : '차트'}
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
              } else if (item.type === 'quarter' && item.quarterKey) {
                // 분기 클릭 시 토글
                const [year, quarter] = item.quarterKey.split('-').map(Number);
                toggleQuarter(year, quarter);
              } else if (
                item.type === 'awardItem' &&
                item.surveyId &&
                item.survey
              ) {
                // award 아이템 클릭 시 라우팅
                const surveyType = item.survey.type
                  .toLowerCase()
                  .replace(/_/g, '-');
                router.push(
                  `/award/${item.survey.year}/${surveyType}/${item.surveyId}`
                );
              }
            }}
          />
        ))}
      </div>
    </div>
  );
}
