'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Winner from '@/components/chart/Winner';
import RankCard from '@/components/chart/RankCard';
import { homeApi } from '@/api/home';
import { queryConfig } from '@/lib/queryConfig';
import { DuckstarRankPreviewDto } from '@/types/api';

// 메달 타입 결정 함수
function getMedalType(rank: number): "Gold" | "Silver" | "Bronze" | "None" {
  if (rank === 1) return "Gold";
  if (rank === 2) return "Silver";
  if (rank === 3) return "Bronze";
  return "None";
}

export default function ChartPage() {
  const [medals, setMedals] = useState<Array<{
    id: string;
    type: "Gold" | "Silver" | "Bronze" | "None";
    title?: string;
    image?: string;
  }>>([]);

  // Mock 데이터 생성 (중복 주차 없음) - 각 애니메이션 카드별 메달 그리드
  const mockMedals = [
    // 1주차 (금메달 1개)
    { id: 'medal-1', type: 'Gold' as const, title: '내가 연인이 될 수 있을 리 없잖아, 무리무리!', image: 'https://placehold.co/30x45', rank: 1, year: 2024, quarter: 3, week: 1 },
    
    // 2주차 (금메달 1개)
    { id: 'medal-2', type: 'Gold' as const, title: '원펀맨', image: 'https://placehold.co/30x45', rank: 1, year: 2024, quarter: 3, week: 2 },
    
    // 3주차 (금메달 1개)
    { id: 'medal-3', type: 'Gold' as const, title: '나루토', image: 'https://placehold.co/30x45', rank: 1, year: 2024, quarter: 3, week: 3 },
    
    // 4주차 (은메달 1개)
    { id: 'medal-4', type: 'Silver' as const, title: '원피스', image: 'https://placehold.co/30x45', rank: 2, year: 2024, quarter: 3, week: 4 },
    
    // 5주차 (은메달 1개)
    { id: 'medal-5', type: 'Silver' as const, title: '드래곤볼', image: 'https://placehold.co/30x45', rank: 2, year: 2024, quarter: 3, week: 5 },
    
    // 6주차 (동메달 1개)
    { id: 'medal-6', type: 'Bronze' as const, title: '블리치', image: 'https://placehold.co/30x45', rank: 3, year: 2024, quarter: 3, week: 6 },
    
    // 7주차 (빈 슬롯)
    { id: 'empty-1', type: 'None' as const, rank: 4, year: 2024, quarter: 3, week: 7 },
    
    // 8주차 (빈 슬롯)
    { id: 'empty-2', type: 'None' as const, rank: 5, year: 2024, quarter: 3, week: 8 },
    
    // 9주차 (빈 슬롯)
    { id: 'empty-3', type: 'None' as const, rank: 6, year: 2024, quarter: 3, week: 9 },
    
    // 10주차 (빈 슬롯)
    { id: 'empty-4', type: 'None' as const, rank: 7, year: 2024, quarter: 3, week: 10 },
    
    // 11주차 (빈 슬롯)
    { id: 'empty-5', type: 'None' as const, rank: 8, year: 2024, quarter: 3, week: 11 },
    
    // 12주차 (빈 슬롯)
    { id: 'empty-6', type: 'None' as const, rank: 9, year: 2024, quarter: 3, week: 12 },
    
    // 13주차 (빈 슬롯)
    { id: 'empty-7', type: 'None' as const, rank: 10, year: 2024, quarter: 3, week: 13 },
    
    // 14주차 (빈 슬롯)
    { id: 'empty-8', type: 'None' as const, rank: 11, year: 2024, quarter: 3, week: 14 },
    
    // 15주차 (빈 슬롯)
    { id: 'empty-9', type: 'None' as const, rank: 12, year: 2024, quarter: 3, week: 15 },
    
    // 16주차 (빈 슬롯)
    { id: 'empty-10', type: 'None' as const, rank: 13, year: 2024, quarter: 3, week: 16 },
    
    // 17주차 (빈 슬롯)
    { id: 'empty-11', type: 'None' as const, rank: 14, year: 2024, quarter: 3, week: 17 },
    
    // 18주차 (빈 슬롯)
    { id: 'empty-12', type: 'None' as const, rank: 15, year: 2024, quarter: 3, week: 18 },
  ];

  // 홈 데이터를 가져와서 메달 데이터로 변환 (실제 데이터 사용 시)
  const { data: homeData, error, isLoading } = useQuery({
    queryKey: ['home'],
    queryFn: () => homeApi.getHome(10),
    ...queryConfig.home,
  });

  // Mock 데이터 사용 (테스트용)
  useEffect(() => {
    setMedals(mockMedals);
  }, []);

  // 실제 데이터 사용 시 (주석 처리됨)
  // useEffect(() => {
  //   if (homeData?.duckstarRankPreviews) {
  //     const medalData = homeData.duckstarRankPreviews.map((item, index) => ({
  //       id: `medal-${index}`,
  //       type: getMedalType(item.rank),
  //       title: item.title,
  //       image: item.image,
  //     }));
  //     setMedals(medalData);
  //   }
  // }, [homeData]);

  // Mock 데이터 사용 시 로딩/에러 상태 제거
  // if (isLoading) {
  //   return (
  //     <div className="min-h-screen bg-gray-50 flex items-center justify-center">
  //       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-800"></div>
  //       <span className="ml-3 text-gray-600">차트 데이터 로딩 중...</span>
  //     </div>
  //   );
  // }

  // if (error) {
  //   return (
  //     <div className="min-h-screen bg-gray-50 flex items-center justify-center">
  //       <div className="text-center">
  //         <div className="text-red-500 text-4xl mb-2">⚠️</div>
  //         <h3 className="text-lg font-semibold text-red-600 mb-2">데이터 로딩 실패</h3>
  //         <p className="text-sm text-gray-600 mb-4">차트 데이터를 불러올 수 없습니다.</p>
  //         <button 
  //           onClick={() => window.location.reload()} 
  //           className="px-4 py-2 bg-rose-500 text-white rounded hover:bg-rose-600 text-sm"
  //         >
  //           다시 시도
  //         </button>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* 페이지 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">차트</h1>
          <p className="text-gray-600">주간 애니메이션 순위와 메달 현황</p>
        </div>

        {/* Winner 카드 */}
        <div className="bg-white rounded-xl border border-[#D1D1D6] p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">1등</h2>
          <Winner
            medals={medals}
            rank={1}
            rankDiff={12}
            rankDiffType="up-greater-equal-than-5"
            title="내가 연인이 될 수 있을 리 없잖아, 무리무리! (※무리가 아니었다?!)"
            studio="Studio Mother"
            image="https://placehold.co/112x150"
            rating={5}
          />
        </div>

        {/* RankCard 리스트 */}
        <div className="bg-white rounded-xl border border-[#D1D1D6] p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">2등 이하</h2>
          <div className="flex flex-col gap-4">
            <RankCard
              medals={medals}
              rank={2}
              rankDiff={3}
              rankDiffType="up-less-than-5"
              title="원펀맨"
              studio="Madhouse"
              image="https://placehold.co/75x100"
              rating={4}
            />
            <RankCard
              medals={medals}
              rank={3}
              rankDiff={0}
              rankDiffType="same-rank"
              title="나루토"
              studio="Studio Pierrot"
              image="https://placehold.co/75x100"
              rating={4}
            />
            <RankCard
              medals={medals}
              rank={4}
              rankDiff={-2}
              rankDiffType="down-less-than-5"
              title="원피스"
              studio="Toei Animation"
              image="https://placehold.co/75x100"
              rating={3}
            />
          </div>
        </div>

        {/* 추가 차트 섹션들 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 통계 차트 */}
          <div className="bg-white rounded-xl border border-[#D1D1D6] p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">통계 차트</h3>
            <div className="text-gray-600">
              통계 차트 컴포넌트가 여기에 들어갑니다.
            </div>
          </div>

          {/* 기타 차트 */}
          <div className="bg-white rounded-xl border border-[#D1D1D6] p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">기타 차트</h3>
            <div className="text-gray-600">
              기타 차트 컴포넌트가 여기에 들어갑니다.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
