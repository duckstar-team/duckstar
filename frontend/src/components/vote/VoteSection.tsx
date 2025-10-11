'use client';

import { useState, useEffect, memo, useCallback, useRef } from 'react';
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
  weekDto?: { year: number; startDate: string } | null;
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
  external = false,
  weekDto = null
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
  const [bonusButtonPosition, setBonusButtonPosition] = useState({ x: 0, y: 0 });
  const [bonusStampPosition, setBonusStampPosition] = useState({ x: 0, y: 0 });
  
  // 스티키 상태 관리
  const [isVoteSectionSticky, setIsVoteSectionSticky] = useState(false);
  const voteSectionRef = useRef<HTMLDivElement>(null);
  
  // 툴팁 표시 상태 관리
  const [showBonusTooltip, setShowBonusTooltip] = useState(true);
  const [showStampTooltip, setShowStampTooltip] = useState(true);
  const [hasTooltipBeenHidden, setHasTooltipBeenHidden] = useState(false);
  const [hasStampTooltipBeenHidden, setHasStampTooltipBeenHidden] = useState(false);

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

  // 투표가 리셋될 때 툴팁 상태도 리셋
  useEffect(() => {
    if (currentVotes === 0) {
      setHasTooltipBeenHidden(false);
      setHasStampTooltipBeenHidden(false);
      setShowBonusTooltip(true);
      setShowStampTooltip(true);
    }
  }, [currentVotes]);

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
    // 보너스 버튼 클릭 시 툴팁이 재등장하지 않도록 설정
    setHasTooltipBeenHidden(true);
    setShowBonusTooltip(false);
    
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

  // 위치 업데이트 핸들러 (간단하게 유지)
  const handleBonusButtonPositionChange = useCallback((position: { x: number; y: number }) => {
    setBonusButtonPosition(position);
  }, []);

  const handleBonusStampPositionChange = useCallback((position: { x: number; y: number }) => {
    setBonusStampPosition(position);
  }, []);

  // 스티키 상태 감지
  useEffect(() => {
    const handleScroll = () => {
      if (!voteSectionRef.current) return;
      
      const rect = voteSectionRef.current.getBoundingClientRect();
      const shouldBeSticky = rect.top <= 60; // 헤더 높이 60px
      
      if (shouldBeSticky !== isVoteSectionSticky) {
        setIsVoteSectionSticky(shouldBeSticky);
      }
    };

    // 초기 체크
    handleScroll();
    
    // 스크롤 이벤트 리스너
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isVoteSectionSticky]);

  // 보너스 버튼 등장 시 툴팁 표시 로직 (간단하게)
  useEffect(() => {
    const shouldShowBonusTooltip = hasReachedMaxVotes && !hasClickedBonus && !currentShowGenderSelection && !hasTooltipBeenHidden;
    setShowBonusTooltip(shouldShowBonusTooltip);
  }, [hasReachedMaxVotes, hasClickedBonus, currentShowGenderSelection, hasTooltipBeenHidden]);

  // 보너스 도장 툴팁 표시 로직 (보너스 버튼 툴팁과 동일한 안정적인 조건)
  useEffect(() => {
    const shouldShowStampTooltip = hasClickedBonus && !currentShowGenderSelection && !hasStampTooltipBeenHidden;
    setShowStampTooltip(shouldShowStampTooltip);
  }, [hasClickedBonus, currentShowGenderSelection, hasStampTooltipBeenHidden]);


  return (
    <>
      {/* Tooltip Portals - 보너스 도장 툴팁 */}
      <TooltipPortal
        type="bonus"
        position={bonusStampPosition}
        onHide={() => setHasStampTooltipBeenHidden(true)}
        show={showStampTooltip && !showConfirmDialog}
      />
      

      {/* Sticky VoteSection - 헤더 60px 아래에 고정, 사이드바 너비 제외 */}
      {isVoteSectionSticky && (
        <div 
          className="fixed top-[60px] left-0 w-full bg-white border-b border-gray-200 z-40 transition-all duration-300 ease-in-out md:left-[200px] md:w-[calc(100%-200px)]"
          data-vote-section-sticky
        >
          <div className="w-full mx-auto px-4 py-6">
            <div className="w-full flex flex-col lg:flex-row items-center justify-between gap-4 sm:gap-6 lg:gap-16">
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
                  isSubmitting={externalIsSubmitting}
                  onBonusClick={handleBonusClick}
                  onNextClick={handleNextClick}
                  onBonusButtonPositionChange={handleBonusButtonPositionChange}
                  onBonusStampPositionChange={handleBonusStampPositionChange}
                  showBonusTooltip={showBonusTooltip}
                  onTooltipHide={() => setHasTooltipBeenHidden(true)}
                  weekDto={weekDto}
                />
              </div>

              {/* Search Bar Section - Bottom on mobile, right on desktop - Hidden in Gender Selection */}
              {!currentShowGenderSelection && (
                <div className="order-1 lg:order-1 flex-1 w-full lg:w-auto min-w-0">
                  <div className="flex items-center flex-wrap gap-2 sm:gap-4 min-w-0 w-full">
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
          </div>
        </div>
      )}

      <div 
        ref={voteSectionRef}
        className="w-full flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-16"
      >
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
            isSubmitting={externalIsSubmitting}
            onBonusClick={handleBonusClick}
            onNextClick={handleNextClick}
            onBonusButtonPositionChange={handleBonusButtonPositionChange}
            onBonusStampPositionChange={handleBonusStampPositionChange}
            showBonusTooltip={showBonusTooltip}
            onTooltipHide={() => setHasTooltipBeenHidden(true)}
            weekDto={weekDto}
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