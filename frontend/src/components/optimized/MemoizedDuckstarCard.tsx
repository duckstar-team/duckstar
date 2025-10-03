'use client';

import React, { memo } from 'react';
import { DuckstarRankPreviewDto } from '@/types/api';
import HomeRankInfo from '@/components/chart/HomeRankInfo';

interface MemoizedDuckstarCardProps {
  rankPreview: DuckstarRankPreviewDto;
  index: number;
}

/**
 * 메모이제이션된 덕스타 카드 컴포넌트
 * 불필요한 리렌더링 방지로 성능 최적화
 */
const MemoizedDuckstarCard = memo<MemoizedDuckstarCardProps>(({ 
  rankPreview, 
  index 
}) => {
  return (
    <HomeRankInfo
      key={rankPreview.animeId}
      rank={index + 1}
      title={rankPreview.titleKor}
      image={rankPreview.mainThumbnailUrl}
      rankDiff={rankPreview.rankDiff}
      consecutiveWeeks={rankPreview.consecutiveWeeks}
    />
  );
});

MemoizedDuckstarCard.displayName = 'MemoizedDuckstarCard';

export default MemoizedDuckstarCard;
