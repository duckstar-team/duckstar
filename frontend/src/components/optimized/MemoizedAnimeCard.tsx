'use client';

import React, { memo } from 'react';
import { RankPreviewDto } from '@/types/api';
import AbroadRankInfo from '@/components/chart/AbroadRankInfo';

interface MemoizedAnimeCardProps {
  rankPreview: RankPreviewDto;
  index: number;
  isAnilab?: boolean;
}

/**
 * 메모이제이션된 애니메이션 카드 컴포넌트
 * 불필요한 리렌더링 방지로 성능 최적화
 */
const MemoizedAnimeCard = memo<MemoizedAnimeCardProps>(({ 
  rankPreview, 
  index, 
  isAnilab = false 
}) => {
  return (
    <AbroadRankInfo
      key={rankPreview.animeId}
      rank={index + 1}
      title={rankPreview.titleKor}
      image={rankPreview.mainThumbnailUrl}
      rankDiff={rankPreview.rankDiff}
      consecutiveWeeks={rankPreview.consecutiveWeeks}
      isAnilab={isAnilab}
    />
  );
});

MemoizedAnimeCard.displayName = 'MemoizedAnimeCard';

export default MemoizedAnimeCard;
