import VoteStamp from './VoteStamp';
import VoteButton from './VoteButton';
import TooltipBtn from '@/components/common/TooltipBtn';

interface VoteStatusProps {
  currentVotes: number;
  bonusVotesUsed: number;
  isBonusMode: boolean;
  hasReachedMaxVotes: boolean;
  hasClickedBonus: boolean;
  showGenderSelection: boolean;
  isSubmitting?: boolean;
  onBonusClick: () => void;
}

export default function VoteStatus({
  currentVotes,
  bonusVotesUsed,
  isBonusMode,
  hasReachedMaxVotes,
  hasClickedBonus,
  showGenderSelection,
  isSubmitting = false,
  onBonusClick,
}: VoteStatusProps) {
  return (
    <div className="flex min-h-16 w-full flex-wrap items-center justify-center overflow-visible">
      {/* Vote Stamps and Buttons Container */}
      <div className="flex items-center justify-center gap-8 max-[425px]:flex-col max-[425px]:gap-4">
        {/* Normal Vote Stamp */}
        <VoteStamp
          type="normal"
          currentVotes={currentVotes}
          showGenderSelection={showGenderSelection}
        />

        {/* Bonus Vote Stamp - 단순한 조건부 렌더링 */}
        {isBonusMode && !(showGenderSelection && bonusVotesUsed === 0) && (
          <div data-bonus-stamp className="relative">
            <VoteStamp
              type="bonus"
              currentVotes={currentVotes}
              bonusVotesUsed={bonusVotesUsed}
            />
          </div>
        )}

        {/* Action Buttons */}
        {!showGenderSelection && (
          <>
            {hasReachedMaxVotes && !hasClickedBonus && (
              <div data-bonus-button data-max-votes-button className="relative">
                <TooltipBtn
                  text="더 투표하고 싶으신가요?"
                  defaultIsOpen={hasReachedMaxVotes}
                  isOpen={hasReachedMaxVotes}
                  variant="light"
                  placement="bottom"
                >
                  <VoteButton
                    type="bonus"
                    onClick={onBonusClick}
                    disabled={isSubmitting}
                  />
                </TooltipBtn>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
