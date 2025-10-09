'use client';

import React, { useState } from 'react';

interface StarDistributionChartProps {
  /** 별점 분산 데이터 (0.5~5.0점 각각의 비율) */
  distribution: number[];
  /** 총 투표자 수 */
  totalVoters?: number;
  /** 컨테이너 너비 (기본값: 96px) */
  width?: number;
  /** 컨테이너 높이 (기본값: 40px) */
  height?: number;
  /** 막대 너비 (기본값: 8px) */
  barWidth?: number;
  /** 막대 간격 (기본값: 2px) */
  barSpacing?: number;
  /** 최고값 막대 색상 (기본값: #FF7B7B) */
  maxBarColor?: string;
  /** 일반 막대 색상 (기본값: #FF7B7B with 66% opacity) */
  normalBarColor?: string;
  /** 클래스명 */
  className?: string;
}

export default function StarDistributionChart({
  distribution,
  totalVoters = 0,
  width = 96,
  height = 40,
  barWidth = 8,
  barSpacing = 2,
  maxBarColor = '#FF7B7B',
  normalBarColor = 'rgba(255, 123, 123, 0.66)',
  className = ''
}: StarDistributionChartProps) {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  // 분산 데이터가 10개(0.5~5.0점)인지 확인
  if (distribution.length !== 10) {
    console.warn('StarDistributionChart: distribution 배열은 10개의 요소를 가져야 합니다 (0.5~5.0점)');
    return null;
  }

  // 최대값 찾기
  const maxValue = Math.max(...distribution);
  
  // 막대들의 정보 계산
  const bars = distribution.map((value, index) => {
    // 최소 높이 1px 보장 (0명일 때도 얇은 막대 표시)
    const minBarHeight = 1;
    const calculatedHeight = maxValue > 0 ? (value / maxValue) * (height - 4) : 0;
    const barHeight = value > 0 ? calculatedHeight : minBarHeight;
    
    const x = index * (barWidth + barSpacing);
    const y = height - barHeight - 2; // 하단에서 2px 위
    const isMaxBar = value === maxValue && value > 0;
    
    return {
      x,
      y,
      width: barWidth,
      height: barHeight,
      color: isMaxBar ? maxBarColor : normalBarColor,
      value,
      rating: (index + 1) * 0.5 // 0.5, 1.0, 1.5, ..., 5.0
    };
  });

  return (
    <div 
      className={`relative ${className}`}
      style={{ width, height }}
    >
      {bars.map((bar, index) => (
        <div key={index}>
          {/* 실제 막대 (시각적 표시) */}
          <div
            className="absolute rounded-tl-[3px] rounded-tr-[3px]"
            style={{
              left: bar.x,
              top: bar.y,
              width: bar.width,
              height: bar.height,
              backgroundColor: bar.color,
            }}
          />
          {/* 호버 영역 (간격 포함하여 확장) */}
          <div
            className="absolute cursor-pointer"
            style={{
              left: bar.x - barSpacing / 2, // 왼쪽 간격의 절반만큼 확장
              top: 2, // 상단 여백 2px
              width: bar.width + barSpacing, // 오른쪽 간격 포함
              height: height - 4, // 전체 높이 - 상하 여백
            }}
            onMouseEnter={() => setHoveredBar(index)}
            onMouseLeave={() => setHoveredBar(null)}
          />
        </div>
      ))}
      
      {/* 커스텀 툴팁 */}
      {hoveredBar !== null && (
        <div
          className="absolute bg-gray-700/60 text-white text-xs rounded shadow-lg pointer-events-none z-10"
          style={{
            left: bars[hoveredBar].x + bars[hoveredBar].width / 2 + 30,
            top: bars[hoveredBar].y + bars[hoveredBar].height - 15,
            transform: 'translateX(-50%)',
            minWidth: '50px',
            textAlign: 'center'
          }}
        >
          <div style={{ whiteSpace: 'nowrap' }}>
            ★ {bars[hoveredBar].rating}
          </div>
          <div style={{ whiteSpace: 'nowrap' }}>
            ({Math.round(bars[hoveredBar].value * totalVoters)}명)
          </div>
        </div>
      )}
    </div>
  );
}
