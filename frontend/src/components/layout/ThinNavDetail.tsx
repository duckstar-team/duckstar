'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { WeekDto, SurveyDto } from '@/types';
import { ApiResponse } from '@/api/http';
import { getSurveyTypeLabel } from '@/lib/surveyUtils';
import { useChart } from './AppContainer';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThinNavDetailProps {
  mode: 'chart' | 'award';
}

export default function ThinNavDetail({ mode }: ThinNavDetailProps) {
  const router = useRouter();
  const params = useParams();

  const { weeks, selectedWeek } = useChart();
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
        type: 'year' as const,
        label: year,
      });

      // 각 설문을 메뉴 아이템으로 추가
      yearSurveys.forEach((survey) => {
        const surveyId = survey.surveyId;
        const isSelected = Number(params.surveyId) === surveyId;
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
        type: 'year' as const,
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
    <div className="h-screen bg-[#212529] px-2 pt-6">
      {/* 차트/결산 투표 제목 */}
      <h2 className="px-4 text-xl font-semibold text-white">
        {mode === 'award' ? '결산 투표' : '차트'}
      </h2>

      {/* 연도 정보 */}
      {menuItems
        .filter((item) => item.type === 'year')
        .map((item, index) => (
          <div
            key={`year-${index}`}
            className="mt-10 inline-flex self-stretch px-4 font-semibold text-white"
          >
            {item.label}
          </div>
        ))}

      {/* 분기 정보 - chart 모드에서만 렌더링 */}
      {mode === 'chart' &&
        menuItems
          .filter((item) => item.type === 'quarter')
          .map((item) => (
            <button
              key={`${item.quarterKey}`}
              onClick={() => {
                const [year, quarter] = item.quarterKey.split('-').map(Number);
                toggleQuarter(year, quarter);
              }}
              className="mx-auto my-2 flex h-10 w-full min-w-30 items-center gap-1 rounded-lg pl-3 font-medium text-white transition hover:bg-white/10"
            >
              {/* 드롭다운 아이콘 */}
              <ChevronRight
                className={cn(
                  'size-4 transition',
                  expandedQuarters.has(item.quarterKey) && 'rotate-90'
                )}
              />
              {item.label}
            </button>
          ))}

      {/* 하위 항목 - award 모드: awardItem만, chart 모드: week만 렌더링 */}
      <div className="flex flex-col items-end gap-1 pr-2">
        {menuItems
          .filter((item) =>
            mode === 'award' ? item.type === 'awardItem' : item.type === 'week'
          )
          .map((item, index) => (
            <button
              key={`${item.type}-${index}`}
              className={cn(
                'relative flex h-7 min-w-22 items-center rounded-lg px-2.5 text-nowrap transition hover:bg-white/10 max-md:text-sm',
                item.state === 'selected'
                  ? 'bg-amber-200/20 font-bold text-amber-200'
                  : 'text-white',
                mode === 'award' && 'mt-4 ml-4'
              )}
              onClick={() => {
                if (item.type === 'week' && item.weekData) {
                  // 주차 클릭 시 동적 라우팅으로 이동
                  router.push(
                    `/chart/${item.weekData.year}/${item.weekData.quarter}/${item.weekData.week}`
                  );
                } else if (item.type === 'awardItem') {
                  // award 아이템 클릭 시 라우팅
                  router.push(
                    `/award/${item.survey.year}/${item.survey.type.toLowerCase()}/${item.surveyId}`
                  );
                }
              }}
            >
              {item.label}
              {/* 선택된 상태일 때만 화살표 표시 - 같은 레벨에 배치 */}
              {item.state === 'selected' && (
                <div className="absolute top-1/2 -right-2 h-4.5 -translate-y-1/2 rounded-full border-2 border-amber-300" />
              )}
            </button>
          ))}
      </div>
    </div>
  );
}
