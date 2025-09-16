'use client';

import { useState, useEffect, memo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import SearchBar from './SearchBar';
import VoteStatus from './VoteStatus';
import VoteButton from './VoteButton';
import GenderSelection from './GenderSelection';
import TooltipPortal from './TooltipPortal';

interface VoteSectionProps {
  currentVotes?: number;
  maxVotes?: number;
  bonusVotesUsed?: number;
  searchQuery?: string;
  gender?: 'male' | 'female';
  hasClickedBonus?: boolean;
  showGenderSelection?: boolean;
  selectedGender?: 'male' | 'female' | null;
  showVoteResult?: boolean;
  submissionDateTime?: string;
  showNextError?: boolean;
  showConfirmDialog?: boolean;
  isSubmitting?: boolean;
  onSearchQueryChange?: (query: string) => void;
  onNextClick?: () => void;
  onBonusClick?: () => void;
  onBackClick?: () => void;
  onGenderSelect?: (gender: 'male' | 'female') => void;
  onSubmitClick?: () => void;
  external?: boolean;
}

const VoteSection = memo(function VoteSection({
  currentVotes: externalCurrentVotes = 0,
  maxVotes: externalMaxVotes = 10,
  bonusVotesUsed: externalBonusVotesUsed = 0,
  searchQuery: externalSearchQuery = '',
  gender: externalGender = 'male',
  hasClickedBonus: externalHasClickedBonus = false,
  showGenderSelection: externalShowGenderSelection = false,
  selectedGender: externalSelectedGender = null,
  showVoteResult: _externalShowVoteResult = false,
  submissionDateTime: _externalSubmissionDateTime = "2025년 8월 21일 18:47",
  showNextError: externalShowNextError = false,
  showConfirmDialog: externalShowConfirmDialog = false,
  isSubmitting: externalIsSubmitting = false,
  onSearchQueryChange,
  onNextClick,
  onBonusClick,
  onBackClick,
  onGenderSelect,
  onSubmitClick,
  external = false
}: VoteSectionProps) {
  const router = useRouter();
  
  // Internal state
  const [internalCurrentVotes, _setInternalCurrentVotes] = useState(0);
  const [internalBonusVotesUsed, _setInternalBonusVotesUsed] = useState(0);
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const [internalGender, setInternalGender] = useState<'male' | 'female'>('male');
  const [internalHasClickedBonus, setInternalHasClickedBonus] = useState(false);
  const [hasReachedMaxVotes, setHasReachedMaxVotes] = useState(false);
  const [showGenderSelection, setShowGenderSelection] = useState(false);
  const [bonusAnimationComplete, setBonusAnimationComplete] = useState(false);
  const [bonusButtonPosition, setBonusButtonPosition] = useState({ x: 0, y: 0 });
  const [bonusStampPosition, setBonusStampPosition] = useState({ x: 0, y: 0 });
  const [showBonusTooltip, setShowBonusTooltip] = useState(true);

  // Use external or internal state based on external prop
  const currentVotes = external ? externalCurrentVotes : internalCurrentVotes;
  const maxVotes = externalMaxVotes;
  const bonusVotesUsed = external ? externalBonusVotesUsed : internalBonusVotesUsed;
  const searchQuery = external ? externalSearchQuery : internalSearchQuery;
  const _gender = external ? externalGender : internalGender;
  const showConfirmDialog = external ? externalShowConfirmDialog : false;
  const hasClickedBonus = external ? externalHasClickedBonus : internalHasClickedBonus;
  const currentShowGenderSelection = external ? externalShowGenderSelection : showGenderSelection;
  const currentSelectedGender = external ? externalSelectedGender : internalGender;
  const currentShowNextError = externalShowNextError;

  // Check if max votes reached and update state permanently
  useEffect(() => {
    if (currentVotes >= maxVotes && !hasReachedMaxVotes) {
      setHasReachedMaxVotes(true);
    }
  }, [currentVotes, maxVotes, hasReachedMaxVotes]);

  // Scroll to top when entering gender selection mode
  // Note: 스크롤은 vote/page.tsx에서 처리됨

  // Derived states
  const isBonusMode = hasClickedBonus;

  // Event handlers - 메모이제이션
  const handleSearchQueryChange = useCallback((query: string) => {
    if (external && onSearchQueryChange) {
      onSearchQueryChange(query);
    } else {
      setInternalSearchQuery(query);
    }
  }, [external, onSearchQueryChange]);

  const handleNextClick = useCallback(() => {
    if (external && onNextClick) {
      onNextClick();
    } else {
      setShowGenderSelection(true);
    }
  }, [external, onNextClick]);

  const handleBackClick = useCallback(() => {
    if (external && onBackClick) {
      onBackClick();
    } else {
      setShowGenderSelection(false);
    }
  }, [external, onBackClick]);

  const handleBonusClick = useCallback(() => {
    if (external && onBonusClick) {
      onBonusClick();
    } else {
      setInternalHasClickedBonus(true);
    }
  }, [external, onBonusClick]);

  const handleSubmitClick = useCallback(() => {
    if (external && onSubmitClick) {
      onSubmitClick();
    } else {
      const currentDateTime = new Date().toLocaleString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      const params = new URLSearchParams({
        normalVotes: currentVotes.toString(),
        bonusVotes: bonusVotesUsed.toString(),
        submissionDateTime: currentDateTime
      });
      
      router.push(`/vote-result?${params.toString()}`);
    }
  }, [external, onSubmitClick, currentVotes, bonusVotesUsed, router]);

  const handleGenderSelect = useCallback((gender: 'male' | 'female') => {
    if (external && onGenderSelect) {
      onGenderSelect(gender);
    } else {
      setInternalGender(gender);
    }
  }, [external, onGenderSelect]);

  return (
    <>
      {/* Tooltip Portals - 높은 z-index로 헤더 위에 표시 */}
      <TooltipPortal
        type="bonus"
        position={bonusStampPosition}
        onHide={() => setShowBonusTooltip(false)}
        show={isBonusMode && !currentShowGenderSelection && showBonusTooltip && bonusAnimationComplete && !showConfirmDialog}
      />
      
      <TooltipPortal
        type="max-votes"
        position={bonusButtonPosition}
        show={hasReachedMaxVotes && !hasClickedBonus && !currentShowGenderSelection}
      />

      <div className="w-full flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-16">
        {/* Vote Status Section - Top on mobile, right on desktop */}
        <div className={`${currentShowGenderSelection ? 'order-2 lg:order-1' : 'order-2 lg:order-2'} w-full lg:w-auto`}>
          <VoteStatus
            currentVotes={currentVotes}
            maxVotes={maxVotes}
            bonusVotesUsed={bonusVotesUsed}
            isBonusMode={isBonusMode}
            hasReachedMaxVotes={hasReachedMaxVotes}
            hasClickedBonus={hasClickedBonus}
            showGenderSelection={currentShowGenderSelection}
            showNextError={currentShowNextError}
            showBonusTooltip={showBonusTooltip}
            onBonusClick={handleBonusClick}
            onNextClick={handleNextClick}
            onBonusAnimationComplete={setBonusAnimationComplete}
            onBonusButtonPositionChange={setBonusButtonPosition}
            onBonusStampPositionChange={setBonusStampPosition}
            onHideBonusTooltip={() => setShowBonusTooltip(false)}
          />
        </div>

        {/* Search Bar Section - Bottom on mobile, right on desktop - Hidden in Gender Selection */}
        {!currentShowGenderSelection && (
          <div className="order-1 lg:order-1 flex-1 w-full lg:w-auto">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <div className="flex-1 min-w-0">
                <SearchBar
                  value={searchQuery}
                  onChange={handleSearchQueryChange}
                />
              </div>
              {/* 모바일용 NEXT 버튼 */}
              <div className="block lg:hidden flex-shrink-0">
                <VoteButton
                  type="next"
                  onClick={handleNextClick}
                  showError={currentShowNextError}
                />
                {/* NEXT 버튼 에러 메시지 */}
                {currentShowNextError && (
                  <div className="absolute top-full right-0 mt-2 bg-white px-2 text-xs font-medium text-[#990033] transition-opacity duration-3000 ease-in-out z-10 whitespace-nowrap">
                    일반 투표를 1개 이상 선택해주세요.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Gender Selection UI */}
        {currentShowGenderSelection && (
          <div className="order-1 lg:order-2 w-full lg:w-auto">
            <GenderSelection
              selectedGender={currentSelectedGender}
              onGenderSelect={handleGenderSelect}
              onBackClick={handleBackClick}
              onSubmitClick={handleSubmitClick}
              isSubmitting={externalIsSubmitting}
            />
          </div>
        )}
      </div>
    </>
  );
});

export default VoteSection;
