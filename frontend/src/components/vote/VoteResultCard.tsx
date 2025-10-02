import React, { memo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import VoteCard from "./VoteCard";
import { VoteHistoryBallotDto } from "@/types/api";
import { getCurrentVoteStampImagePath } from "@/utils/voteStampUtils";

interface VoteResultCardProps {
  ballot: VoteHistoryBallotDto;
  weekDto?: any;
}

const VoteResultCard = memo(function VoteResultCard({
  ballot,
  weekDto
}: VoteResultCardProps) {
  const router = useRouter();

  // 투표 도장 이미지 프리로딩
  useEffect(() => {
    if (weekDto) {
      const stampImagePath = getCurrentVoteStampImagePath(weekDto, ballot.ballotType === 'BONUS');
      const img = new Image();
      img.src = stampImagePath;
    }
  }, [weekDto, ballot.ballotType]);

  const handleCardClick = useCallback(() => {
    router.push(`/animes/${ballot.animeId}`);
  }, [router, ballot.animeId]);

  return (
    <div className="w-full">
      <div 
        className="cursor-pointer hover:opacity-80 transition-opacity duration-200"
        onClick={handleCardClick}
      >
        <VoteCard
          thumbnailUrl={ballot.mainThumbnailUrl}
          title={ballot.titleKor || '제목 없음'}
          checked={true}
          onChange={undefined}
          showError={false}
          currentVotes={0}
          maxVotes={10}
          isBonusMode={ballot.ballotType === 'BONUS'}
          bonusVotesUsed={ballot.ballotType === 'BONUS' ? 1 : 0}
          isBonusVote={ballot.ballotType === 'BONUS'}
          onMouseLeave={() => {}}
          weekDto={weekDto}
          disabled={true}
        />
      </div>
    </div>
  );
});

export default VoteResultCard;
