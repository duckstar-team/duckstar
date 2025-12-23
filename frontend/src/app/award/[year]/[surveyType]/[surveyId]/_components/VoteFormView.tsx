'use client';

import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import VoteCard from './VoteCard';
import ConfirmDialog from './ConfirmDialog';
import SearchBar from '@/components/domain/search/SearchBar';
import VoteStatus from './VoteStatus';
import GenderSelection from './GenderSelection';
import VoteDisabledState from './VoteDisabledState';
import {
  ApiResponseAnimeCandidateListDto,
  ApiResponseAnimeVoteHistoryDto,
  AnimeCandidateDto,
  MemberAgeGroup,
  VoteStatusType,
  MemberGender,
  SurveyType,
} from '@/types';
import { Megaphone } from 'lucide-react';
import { MAX_VOTES } from '@/lib/constants';
import { queryConfig } from '@/lib/queryConfig';
import { searchMatch } from '@/lib/searchUtils';
import { getCategoryText } from '@/lib/surveyUtils';
import { revoteAnime } from '@/api/vote';
import { apiCall } from '@/api/http';
import { CandidateCardSkeleton } from '@/components/skeletons';
import { cn } from '@/lib/utils';
import { setSurveySession } from '@/lib/surveySessionStorage';
import { useAuth } from '@/context/AuthContext';
import VoteButton from './VoteButton';

interface VoteFormViewProps {
  surveyId: number;
  isRevoteMode: boolean;
  onRevoteSuccess: () => void;
  voteStatus?: VoteStatusType;
  surveyType?: SurveyType;
  surveyEndDate?: string;
}

export default function VoteFormView({
  surveyId,
  isRevoteMode,
  onRevoteSuccess,
  voteStatus,
  surveyType,
  surveyEndDate,
}: VoteFormViewProps) {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const stickyContainerRef = useRef<HTMLDivElement>(null);

  // 상태 관리
  const [selected, setSelected] = useState<number[]>([]);
  const [bonusSelected, setBonusSelected] = useState<number[]>([]);
  const [errorCards, setErrorCards] = useState<Set<number>>(new Set());
  const [isBonusMode, setIsBonusMode] = useState(false);
  const [hasClickedBonus, setHasClickedBonus] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [genderSelectionStep, setGenderSelectionStep] = useState<
    'gender' | 'age' | null
  >(null);
  const [selectedGender, setSelectedGender] = useState<MemberGender | null>(
    null
  );
  const [selectedAgeGroup, setSelectedAgeGroup] =
    useState<MemberAgeGroup | null>(null);
  const [showNextError, setShowNextError] = useState(false);
  const [scrollCompleted, setScrollCompleted] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasReachedMaxVotes, setHasReachedMaxVotes] = useState(false);
  const [bonusButtonPosition, setBonusButtonPosition] = useState({
    x: 0,
    y: 0,
  });
  const [bonusStampPosition, setBonusStampPosition] = useState({ x: 0, y: 0 });
  const [showBonusTooltip, setShowBonusTooltip] = useState(true);
  const [showStampTooltip, setShowStampTooltip] = useState(true);
  const [hasTooltipBeenHidden, setHasTooltipBeenHidden] = useState(false);
  const [hasStampTooltipBeenHidden, setHasStampTooltipBeenHidden] =
    useState(false);

  // 후보 목록 조회
  const {
    data: candidateData,
    isLoading,
    error,
  } = useQuery<ApiResponseAnimeCandidateListDto>({
    queryKey: ['anime-candidates', surveyId],
    queryFn: async () => {
      const response = await fetch(
        `/api/v1/vote/surveys/${surveyId}/candidates`
      );
      if (!response.ok) throw new Error('애니메이션 후보 조회 실패');
      return response.json() as Promise<ApiResponseAnimeCandidateListDto>;
    },
    enabled: !!surveyId,
    ...queryConfig.vote,
  });

  // 재투표 모드일 때 기존 투표 내역 조회
  const { data: voteStatusData } = useQuery({
    queryKey: ['vote-status', surveyId],
    queryFn: async () => {
      const response = await fetch(`/api/v1/vote/surveys/${surveyId}/me`);
      if (!response.ok) throw new Error('투표 내역 조회 실패');
      return response.json() as Promise<ApiResponseAnimeVoteHistoryDto>;
    },
    enabled: !!surveyId && isRevoteMode,
    ...queryConfig.vote,
  });

  // 로그인한 사용자의 성별 정보로 성별 선택란 미리 선택 (초기값만 설정, 한 번만)
  useEffect(() => {
    if (
      candidateData?.result?.memberGender &&
      candidateData.result.memberGender !== 'UNKNOWN' &&
      !selectedGender
    ) {
      setSelectedGender(candidateData.result.memberGender);
    }
  }, [candidateData?.result?.memberGender, selectedGender]);

  // 로그인한 사용자의 연령대 정보로 연령대 선택란 미리 선택 (초기값만 설정, 한 번만)
  useEffect(() => {
    if (candidateData?.result?.memberAgeGroup && !selectedAgeGroup) {
      setSelectedAgeGroup(candidateData.result.memberAgeGroup);
    }
  }, [candidateData?.result?.memberAgeGroup, selectedAgeGroup, isRevoteMode]);

  // 재투표 모드일 때 기존 투표 내역으로 초기화
  useEffect(() => {
    if (isRevoteMode && voteStatusData?.result?.animeBallotDtos) {
      const normalVotes = voteStatusData.result.animeBallotDtos
        .filter((ballot) => ballot.ballotType === 'NORMAL')
        .map((ballot) => ballot.animeCandidateId);
      const bonusVotes = voteStatusData.result.animeBallotDtos
        .filter((ballot) => ballot.ballotType === 'BONUS')
        .map((ballot) => ballot.animeCandidateId);

      setSelected(normalVotes);
      setBonusSelected(bonusVotes);

      if (bonusVotes.length > 0) {
        setIsBonusMode(true);
        setHasClickedBonus(true);
      }
    }
  }, [isRevoteMode, voteStatusData]);

  // 에러 카드 관리 헬퍼 함수
  const updateErrorCards = (animeId: number, shouldAdd: boolean) => {
    setErrorCards((prevErrors) => {
      const newErrors = new Set(prevErrors);
      if (shouldAdd) {
        newErrors.add(animeId);
      } else {
        newErrors.delete(animeId);
      }
      return newErrors;
    });
  };

  // 최대 투표 수 도달 체크
  useEffect(() => {
    if (selected.length >= MAX_VOTES && !hasReachedMaxVotes) {
      setHasReachedMaxVotes(true);
    }
  }, [selected.length, hasReachedMaxVotes]);

  // 선택 초기화 시 툴팁 리셋
  useEffect(() => {
    if (selected.length === 0) {
      setHasTooltipBeenHidden(false);
      setHasStampTooltipBeenHidden(false);
      setShowBonusTooltip(true);
      setShowStampTooltip(true);
    }
  }, [selected.length]);

  // Container query가 메인 콘텐츠 영역 너비를 기준으로 동작하도록 설정
  useEffect(() => {
    if (!containerRef.current || !stickyContainerRef.current) return;

    const updateContainerWidth = () => {
      if (containerRef.current && stickyContainerRef.current) {
        // 부모 <main> 요소의 실제 너비 측정 (사이드바 제외)
        const mainElement = containerRef.current.closest('main');
        if (mainElement) {
          const rect = mainElement.getBoundingClientRect();
          stickyContainerRef.current.style.width = `${rect.width}px`;
        }
      }
    };

    updateContainerWidth();
    window.addEventListener('resize', updateContainerWidth);

    // ResizeObserver로 부모 요소 크기 변경 감지
    const resizeObserver = new ResizeObserver(updateContainerWidth);
    if (containerRef.current.parentElement) {
      resizeObserver.observe(containerRef.current.parentElement);
    }

    return () => {
      window.removeEventListener('resize', updateContainerWidth);
      resizeObserver.disconnect();
    };
  }, []);

  // 보너스 툴팁 표시 조건
  useEffect(() => {
    const shouldShowBonusTooltip =
      hasReachedMaxVotes &&
      !hasClickedBonus &&
      !genderSelectionStep &&
      !hasTooltipBeenHidden;
    setShowBonusTooltip(shouldShowBonusTooltip);
  }, [
    hasReachedMaxVotes,
    hasClickedBonus,
    genderSelectionStep,
    hasTooltipBeenHidden,
  ]);

  // 스탬프 툴팁 표시 조건
  useEffect(() => {
    const shouldShowStampTooltip =
      hasClickedBonus && !genderSelectionStep && !hasStampTooltipBeenHidden;
    setShowStampTooltip(shouldShowStampTooltip);
  }, [hasClickedBonus, genderSelectionStep, hasStampTooltipBeenHidden]);

  // 전체 애니메이션 리스트 생성
  const allAnimeList = candidateData?.result?.animeCandidates || [];

  const filteredAnimeList: AnimeCandidateDto[] = useMemo(() => {
    return searchQuery.trim() === ''
      ? allAnimeList
      : allAnimeList.filter((anime) =>
          searchMatch(searchQuery, anime.titleKor)
        );
  }, [allAnimeList, searchQuery]);

  const animeList: AnimeCandidateDto[] = useMemo(() => {
    if (genderSelectionStep && scrollCompleted) {
      return filteredAnimeList
        .filter(
          (anime) =>
            selected.includes(anime.animeCandidateId) ||
            bonusSelected.includes(anime.animeCandidateId)
        )
        .sort((a, b) => {
          const aIsNormal = selected.includes(a.animeCandidateId);
          const bIsNormal = selected.includes(b.animeCandidateId);

          if (aIsNormal && !bIsNormal) return -1;
          if (!aIsNormal && bIsNormal) return 1;
          return 0;
        });
    }
    return filteredAnimeList;
  }, [
    filteredAnimeList,
    genderSelectionStep,
    scrollCompleted,
    selected,
    bonusSelected,
  ]);

  const totalCandidates =
    candidateData?.result?.candidatesCount || animeList.length;
  const categoryText = getCategoryText('ANIME'); // 기본값 사용

  // 핸들러 함수들
  const handleSelect = (animeId: number, isBonusVote?: boolean) => {
    if (isBonusMode) {
      if (selected.includes(animeId)) {
        setSelected((prev) => prev.filter((id) => id !== animeId));
        updateErrorCards(animeId, false);
      } else if (bonusSelected.includes(animeId)) {
        setBonusSelected((prev) => prev.filter((id) => id !== animeId));
        updateErrorCards(animeId, false);
      } else {
        if (isBonusVote) {
          setBonusSelected((prev) => [...prev, animeId]);
          updateErrorCards(animeId, false);
        } else if (selected.length < 10) {
          setSelected((prev) => [...prev, animeId]);
          updateErrorCards(animeId, false);
        } else {
          updateErrorCards(animeId, true);
        }
      }
    } else {
      setSelected((prev) => {
        if (prev.includes(animeId)) {
          updateErrorCards(animeId, false);
          return prev.filter((id) => id !== animeId);
        } else if (prev.length < 10) {
          updateErrorCards(animeId, false);
          return [...prev, animeId];
        } else {
          updateErrorCards(animeId, true);
          return prev;
        }
      });
    }
  };

  const handleCardMouseLeave = (animeId: number) => {
    setTimeout(() => {
      updateErrorCards(animeId, false);
    }, 1000);
  };

  const handleBonusClick = useCallback(() => {
    setHasTooltipBeenHidden(true);
    setShowBonusTooltip(false);
    setIsBonusMode(true);
    setHasClickedBonus(true);
  }, []);

  const handleNextClick = () => {
    if (selected.length === 0) {
      setShowNextError(true);
      setTimeout(() => {
        setShowNextError(false);
      }, 1000);
      return;
    }

    if (bonusSelected.length > 0 && selected.length < 10) {
      setShowConfirmDialog(true);
      return;
    }

    proceedToNext();
  };

  const proceedToNext = () => {
    setGenderSelectionStep('gender');
    setSearchQuery('');
    window.scrollTo(0, 0);
    setTimeout(() => {
      setScrollCompleted(true);
    }, 500);
  };

  const handleConfirmDialogConfirm = () => {
    setBonusSelected([]);
    setShowConfirmDialog(false);
    proceedToNext();
  };

  const handleBackClick = () => {
    if (genderSelectionStep === 'age') {
      setGenderSelectionStep('gender');
    } else {
      setGenderSelectionStep(null);
      setScrollCompleted(false);
      setSearchQuery('');
    }
  };

  const handleSubmitClick = async () => {
    if (!selectedGender || !selectedAgeGroup || !surveyId) return;

    setIsSubmitting(true);

    try {
      if (isRevoteMode && voteStatusData?.result?.submissionId) {
        const currentVotes = voteStatusData.result.animeBallotDtos || [];
        const currentNormalVotes = currentVotes
          .filter((ballot) => ballot.ballotType === 'NORMAL')
          .map((ballot) => ballot.animeCandidateId);
        const currentBonusVotes = currentVotes
          .filter((ballot) => ballot.ballotType === 'BONUS')
          .map((ballot) => ballot.animeCandidateId);

        const added = [
          ...selected
            .filter((id) => !currentNormalVotes.includes(id))
            .map((id) => ({ candidateId: id, ballotType: 'NORMAL' as const })),
          ...bonusSelected
            .filter((id) => !currentBonusVotes.includes(id))
            .map((id) => ({ candidateId: id, ballotType: 'BONUS' as const })),
        ];

        const removed = [
          ...currentNormalVotes
            .filter((id) => !selected.includes(id))
            .map((id) => ({ candidateId: id, ballotType: 'NORMAL' as const })),
          ...currentBonusVotes
            .filter((id) => !bonusSelected.includes(id))
            .map((id) => ({ candidateId: id, ballotType: 'BONUS' as const })),
        ];

        const updated = [];
        for (const id of selected) {
          if (currentBonusVotes.includes(id)) {
            updated.push({ candidateId: id, ballotType: 'NORMAL' as const });
          }
        }
        for (const id of bonusSelected) {
          if (currentNormalVotes.includes(id)) {
            updated.push({ candidateId: id, ballotType: 'BONUS' as const });
          }
        }

        const requestBody = {
          surveyId: surveyId,
          gender: selectedGender,
          ageGroup: selectedAgeGroup,
          added,
          removed,
          updated,
        };

        const result = await revoteAnime(
          voteStatusData.result.submissionId!,
          requestBody
        );

        if (result.isSuccess) {
          await queryClient.invalidateQueries({
            queryKey: ['vote-status', surveyId],
          });
          await queryClient.invalidateQueries({
            queryKey: ['survey-status', surveyId],
          });
          await queryClient.invalidateQueries({
            queryKey: ['anime-candidates', surveyId],
          });

          // 비로그인 상태에서 투표 성공 시 세션키 저장
          if (!isAuthenticated && surveyType && surveyEndDate) {
            setSurveySession(surveyType, surveyEndDate);
          }

          onRevoteSuccess();
        } else {
          alert('재투표 제출에 실패했습니다. 다시 시도해주세요.');
        }
      } else {
        const ballotRequests = [
          ...selected.map((id) => ({
            candidateId: id,
            ballotType: 'NORMAL' as const,
          })),
          ...bonusSelected.map((id) => ({
            candidateId: id,
            ballotType: 'BONUS' as const,
          })),
        ];

        const requestBody = {
          surveyId: surveyId,
          gender: selectedGender,
          ageGroup: selectedAgeGroup,
          ballotRequests,
        };

        const result = await apiCall<{ isSuccess: boolean }>(
          '/api/v1/vote/surveys',
          {
            method: 'POST',
            body: JSON.stringify(requestBody),
          }
        );

        if (result.isSuccess) {
          await queryClient.invalidateQueries({
            queryKey: ['vote-status', surveyId],
          });
          await queryClient.invalidateQueries({
            queryKey: ['survey-status', surveyId],
          });
          await queryClient.invalidateQueries({
            queryKey: ['anime-candidates', surveyId],
          });

          // 비로그인 상태에서 투표 성공 시 세션키 저장
          if (!isAuthenticated && surveyType && surveyEndDate) {
            setSurveySession(surveyType, surveyEndDate);
          }

          onRevoteSuccess();
        } else {
          alert('투표 제출에 실패했습니다. 다시 시도해주세요.');
        }
      }

      window.scrollTo(0, 0);
    } catch (error) {
      alert(
        isRevoteMode
          ? '재투표 제출에 실패했습니다. 다시 시도해주세요.'
          : '투표 제출에 실패했습니다. 다시 시도해주세요.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBonusButtonPositionChange = useCallback(
    (position: { x: number; y: number }) => {
      setBonusButtonPosition(position);
    },
    []
  );

  const handleBonusStampPositionChange = useCallback(
    (position: { x: number; y: number }) => {
      setBonusStampPosition(position);
    },
    []
  );

  // 로딩 상태
  if (isLoading) {
    return <CandidateCardSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center text-red-500">
        <p>{error.message || '투표 후보를 불러오는 중 오류가 발생했습니다.'}</p>
      </div>
    );
  }

  if (voteStatus && voteStatus !== 'OPEN') {
    return <VoteDisabledState status={voteStatus} weekDto={undefined} />;
  }

  const allSelected = [...selected, ...bonusSelected];
  const showGenderSelection = genderSelectionStep !== null;

  return (
    <main className="min-h-screen w-full" ref={containerRef}>
      {/* 투표 안내 문구 */}
      <section
        className={cn(
          'max-width px-10!',
          genderSelectionStep !== null && 'flex md:justify-end'
        )}
      >
        <div className="flex h-8 w-fit items-center gap-2 rounded-md bg-gray-200 px-3 text-sm font-semibold text-gray-600 shadow-md backdrop-blur-sm">
          <Megaphone className="size-4.5" />
          {showGenderSelection
            ? genderSelectionStep === 'gender'
              ? '성별은 투표 성향 통계에 꼭 필요한 정보예요.'
              : '연령대는 투표 성향 통계에 필수적인 정보예요.'
            : `마음에 든 ${categoryText}에 투표해주세요!`}
        </div>
      </section>

      {/* Sticky VoteSection - 헤더 60px 아래에 고정, 메인 콘텐츠 영역 너비 기준 */}
      <section
        ref={stickyContainerRef}
        className="@container sticky top-15 z-40 mt-4 border-b border-gray-200 bg-white py-4"
        data-vote-section-sticky
      >
        <div className="max-width flex items-center justify-between gap-8 px-10! @max-lg:flex-col @lg:gap-16">
          {/* Vote Status Section */}
          <div
            className={`${showGenderSelection && '@lg:order-1'} order-2 w-full @lg:w-auto`}
          >
            <VoteStatus
              currentVotes={selected.length}
              bonusVotesUsed={bonusSelected.length}
              isBonusMode={isBonusMode}
              hasReachedMaxVotes={hasReachedMaxVotes}
              hasClickedBonus={hasClickedBonus}
              showGenderSelection={showGenderSelection}
              isSubmitting={isSubmitting}
              onBonusClick={handleBonusClick}
              onBonusButtonPositionChange={handleBonusButtonPositionChange}
              onBonusStampPositionChange={handleBonusStampPositionChange}
            />
          </div>

          {/* Search Bar or Gender Selection */}
          {showGenderSelection ? (
            <div className="order-2 w-full @lg:w-auto">
              <GenderSelection
                genderSelectionStep={genderSelectionStep}
                setGenderSelectionStep={setGenderSelectionStep}
                selectedGender={selectedGender}
                selectedAgeGroup={selectedAgeGroup}
                setSelectedGender={setSelectedGender}
                setSelectedAgeGroup={setSelectedAgeGroup}
                onBackClick={handleBackClick}
                onSubmitClick={handleSubmitClick}
                isSubmitting={isSubmitting}
                isRevoteMode={isRevoteMode}
              />
            </div>
          ) : (
            <div className="order-1 flex w-full items-center justify-between @lg:order-2 @lg:w-auto">
              <div className="min-w-2/3 @lg:min-w-100">
                <SearchBar value={searchQuery} onChange={setSearchQuery} />
              </div>

              <VoteButton
                type="next"
                onClick={handleNextClick}
                showError={showNextError}
              />
            </div>
          )}
        </div>
      </section>

      <section className="max-width px-10! py-6!">
        <p className="mt-1 mb-6 text-sm text-gray-500">
          선택한 애니메이션 :{' '}
          <span className="text-brand font-bold">{allSelected.length}</span> /{' '}
          {totalCandidates}
        </p>

        {searchQuery.trim() !== '' && (
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              &ldquo;{searchQuery}&rdquo; 검색 결과:{' '}
              <span className="font-semibold">{animeList.length}</span>개
            </p>
          </div>
        )}

        {animeList.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-lg text-gray-500">
              {searchQuery.trim() !== ''
                ? `"${searchQuery}"에 대한 검색 결과가 없습니다.`
                : '표시할 애니메이션이 없습니다.'}
            </p>
          </div>
        ) : (
          <motion.div
            className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2"
            initial={{ opacity: 1 }}
            animate={{
              opacity: 1,
            }}
            transition={{
              duration: 0.3,
              ease: 'easeInOut',
            }}
            style={{ willChange: 'auto' }}
          >
            {animeList.map((anime, index) => (
              <motion.div
                key={anime.animeCandidateId}
                initial={{ opacity: 1, y: 0, scale: 1 }}
                animate={{
                  opacity: showGenderSelection
                    ? scrollCompleted
                      ? [0, 1]
                      : [1, 0.8, 0.5, 0.2, 0]
                    : 1,
                  y: 0,
                  scale: 1,
                }}
                transition={{
                  duration: showGenderSelection ? 0.5 : 0.3,
                  delay: showGenderSelection
                    ? scrollCompleted
                      ? index * 0.05
                      : 0
                    : 0,
                  ease: 'easeInOut',
                  times:
                    showGenderSelection && !scrollCompleted
                      ? [0, 0.2, 0.4, 0.6, 1]
                      : undefined,
                }}
                style={{
                  pointerEvents: showGenderSelection ? 'none' : 'auto',
                  willChange: showGenderSelection ? 'opacity' : 'auto',
                }}
              >
                <VoteCard
                  anime={anime}
                  checked={
                    selected.includes(anime.animeCandidateId) ||
                    bonusSelected.includes(anime.animeCandidateId)
                  }
                  onChange={
                    showGenderSelection
                      ? undefined
                      : (isBonusVote?: boolean) =>
                          handleSelect(anime.animeCandidateId, isBonusVote)
                  }
                  showError={
                    !isBonusMode && errorCards.has(anime.animeCandidateId)
                  }
                  currentVotes={selected.length}
                  isBonusMode={isBonusMode}
                  isBonusVote={bonusSelected.includes(anime.animeCandidateId)}
                  onMouseLeave={() =>
                    handleCardMouseLeave(anime.animeCandidateId)
                  }
                  disabled={showGenderSelection}
                  showGenderSelection={showGenderSelection}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      <ConfirmDialog
        isOpen={showConfirmDialog}
        onConfirm={handleConfirmDialogConfirm}
        onCancel={() => setShowConfirmDialog(false)}
      />
    </main>
  );
}
