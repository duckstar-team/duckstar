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
import QuarterNavigation from './QuarterNavigation';
import SelectionStatusNavigation from './SelectionStatusNavigation';

interface VoteFormViewProps {
  surveyId: number;
  isRevoteMode: boolean;
  onRevoteSuccess: () => void;
  voteStatus?: VoteStatusType;
  surveyType?: SurveyType;
  surveyEndDate?: Date;
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
  const voteSectionRef = useRef<HTMLDivElement>(null);

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
  const [activeQuarter, setActiveQuarter] = useState<number | null>(null);
  const quarterRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  const [isVoteSectionSticky, setIsVoteSectionSticky] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(0);

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

  // 재투표 모드 처리
  useEffect(() => {
    if (isRevoteMode && voteStatusData?.result?.animeBallotDtos) {
      // 재투표 모드에서는 성별 선택 화면을 표시하지 않음 (초기 모드 유지)
      setGenderSelectionStep(null);
      setScrollCompleted(false);
    }
  }, [isRevoteMode, voteStatusData]);

  // 재투표 모드로 이동할 때 기존 투표 내역으로 초기화
  useEffect(() => {
    if (isRevoteMode) {
      // 재투표 모드에서는 기존 투표 데이터를 기표칸에 미리 채우기
      if (
        voteStatusData?.result?.animeBallotDtos &&
        voteStatusData.result.animeBallotDtos.length > 0
      ) {
        const normalVotes = voteStatusData.result.animeBallotDtos
          .filter((ballot) => ballot.ballotType === 'NORMAL')
          .map((ballot) => ballot.animeCandidateId);
        const bonusVotes = voteStatusData.result.animeBallotDtos
          .filter((ballot) => ballot.ballotType === 'BONUS')
          .map((ballot) => ballot.animeCandidateId);

        // 기존 투표 데이터를 즉시 상태에 설정
        setSelected(normalVotes);
        setBonusSelected(bonusVotes);

        // 보너스 투표가 있으면 보너스 모드 활성화
        if (bonusVotes.length > 0) {
          setIsBonusMode(true);
          setHasClickedBonus(true);
        }

        // 성별 정보 설정
        if (
          candidateData?.result?.memberGender &&
          candidateData.result.memberGender !== 'UNKNOWN'
        ) {
          setSelectedGender(candidateData.result.memberGender);
        }
      }
    }
  }, [isRevoteMode, voteStatusData, candidateData]);

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

  // 사이드바 너비 계산
  useEffect(() => {
    const calculateSidebarWidth = () => {
      if (!containerRef.current) return;

      const mainElement = containerRef.current.closest('main');
      if (mainElement) {
        const rect = mainElement.getBoundingClientRect();
        // 메인 요소의 left offset이 사이드바 너비
        setSidebarWidth(rect.left);
      } else {
        // 사이드바를 직접 찾기
        const sidebar = document.querySelector(
          'aside, [data-sidebar], .sidebar'
        );
        if (sidebar) {
          const sidebarRect = sidebar.getBoundingClientRect();
          setSidebarWidth(sidebarRect.width);
        }
      }
    };

    calculateSidebarWidth();
    window.addEventListener('resize', calculateSidebarWidth);

    return () => {
      window.removeEventListener('resize', calculateSidebarWidth);
    };
  }, []);

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

    // 선택한 후보만 보기 필터링
    if (showOnlySelected) {
      return filteredAnimeList.filter(
        (anime) =>
          selected.includes(anime.animeCandidateId) ||
          bonusSelected.includes(anime.animeCandidateId)
      );
    }

    return filteredAnimeList;
  }, [
    filteredAnimeList,
    genderSelectionStep,
    scrollCompleted,
    selected,
    bonusSelected,
    showOnlySelected,
  ]);

  const totalCandidates =
    candidateData?.result?.candidatesCount || animeList.length;
  const categoryText = getCategoryText('ANIME'); // 기본값 사용

  // YEAR_END 타입일 때 분기별 네비게이션을 위한 로직
  const isYearEnd = String(surveyType).toUpperCase() === 'YEAR_END';

  // 분기별로 그룹화된 후보 목록 (필터링된 상태에서도 작동하도록 animeList 기준)
  const quartersInList = useMemo(() => {
    if (!isYearEnd) return [];
    const quarters = new Set<number>();
    animeList.forEach((anime) => {
      if (anime.quarter) {
        quarters.add(anime.quarter);
      }
    });
    return Array.from(quarters).sort((a, b) => a - b);
  }, [isYearEnd, animeList]);

  // 분기별 첫 번째 후보 찾기 (실제 렌더링되는 animeList 기준)
  const getFirstAnimeInQuarter = useCallback(
    (quarter: number): AnimeCandidateDto | null => {
      return animeList.find((anime) => anime.quarter === quarter) || null;
    },
    [animeList]
  );

  // 분기 클릭 핸들러
  const handleQuarterClick = useCallback(
    (quarter: number) => {
      if (quarter === 1) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      const firstAnime = getFirstAnimeInQuarter(quarter);
      if (!firstAnime) {
        console.warn(`분기 ${quarter}의 첫 번째 후보를 찾을 수 없습니다.`);
        return;
      }

      // ref 또는 data 속성으로 요소 찾기
      const tryScroll = () => {
        // 먼저 ref에서 찾기
        let element = quarterRefs.current.get(firstAnime.animeCandidateId);

        // ref에서 못 찾으면 data-anime-id 속성으로 직접 찾기
        if (!element) {
          const candidateElement = document.querySelector(
            `[data-anime-id="${firstAnime.animeCandidateId}"]`
          );
          if (candidateElement) {
            element = candidateElement as HTMLDivElement;
          }
        }

        if (element) {
          const offset = 100; // 헤더 높이 고려
          const rect = element.getBoundingClientRect();
          const scrollTop =
            window.pageYOffset || document.documentElement.scrollTop;
          const elementTop = rect.top + scrollTop;
          const targetPosition = elementTop - offset;

          window.scrollTo({
            top: Math.max(0, targetPosition),
            behavior: 'smooth',
          });
        } else {
          // ref가 아직 설정되지 않았다면 잠시 후 재시도
          setTimeout(() => {
            let retryElement = quarterRefs.current.get(
              firstAnime.animeCandidateId
            );
            if (!retryElement) {
              const candidateElement = document.querySelector(
                `[data-anime-id="${firstAnime.animeCandidateId}"]`
              );
              if (candidateElement) {
                retryElement = candidateElement as HTMLDivElement;
              }
            }
            if (retryElement) {
              const offset = 100;
              const rect = retryElement.getBoundingClientRect();
              const scrollTop =
                window.pageYOffset || document.documentElement.scrollTop;
              const elementTop = rect.top + scrollTop;
              const targetPosition = elementTop - offset;
              window.scrollTo({
                top: Math.max(0, targetPosition),
                behavior: 'smooth',
              });
            } else {
              console.warn(`분기 ${quarter}의 요소를 찾을 수 없습니다.`);
            }
          }, 100);
        }
      };

      // 다음 프레임에서 실행하여 DOM 업데이트 대기
      requestAnimationFrame(() => {
        tryScroll();
      });
    },
    [getFirstAnimeInQuarter, animeList]
  );

  // 스크롤 이벤트로 현재 보이는 분기 감지
  useEffect(() => {
    if (
      !isYearEnd ||
      quartersInList.length === 0 ||
      searchQuery.trim() !== ''
    ) {
      return;
    }

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollPosition = window.scrollY + 150; // 헤더 높이 + 여유 공간

          // 스크롤이 맨 위에 있으면 1분기
          if (scrollPosition < 200) {
            setActiveQuarter(1);
            ticking = false;
            return;
          }

          // 각 분기의 첫 번째 후보 위치 확인
          for (let i = quartersInList.length - 1; i >= 0; i--) {
            const quarter = quartersInList[i];
            const firstAnime = getFirstAnimeInQuarter(quarter);
            if (!firstAnime) continue;

            const element = quarterRefs.current.get(
              firstAnime.animeCandidateId
            );
            if (element) {
              const rect = element.getBoundingClientRect();
              const scrollTop =
                window.pageYOffset || document.documentElement.scrollTop;
              const elementTop = rect.top + scrollTop;
              if (scrollPosition >= elementTop) {
                setActiveQuarter(quarter);
                ticking = false;
                return;
              }
            }
          }

          // 아무것도 매칭되지 않으면 첫 번째 분기
          setActiveQuarter(quartersInList[0] || null);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // 초기 실행

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isYearEnd, quartersInList, getFirstAnimeInQuarter, searchQuery]);

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

          // 비로그인 상태에서 투표 성공 시 세션키 저장 (투표 내역 저장: false)
          if (!isAuthenticated && surveyType && surveyEndDate) {
            setSurveySession(surveyType, surveyEndDate, false);
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

          // 비로그인 상태에서 투표 성공 시 세션키 저장 (투표 내역 저장: false)
          if (!isAuthenticated && surveyType && surveyEndDate) {
            setSurveySession(surveyType, surveyEndDate, false);
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
          'max-width',
          genderSelectionStep !== null && 'flex md:justify-end'
        )}
      >
        <div className="flex h-8 w-fit items-center gap-2 rounded-md bg-gray-200 px-3 text-sm font-semibold whitespace-nowrap text-gray-600 shadow-md backdrop-blur-sm">
          <Megaphone className="size-4.5" />
          {showGenderSelection
            ? genderSelectionStep === 'gender'
              ? '성별은 투표 성향 통계에 꼭 필요한 정보예요.'
              : '연령대는 투표 성향 통계에 필수적인 정보예요.'
            : `마음에 든 ${categoryText}에 투표해주세요!`}
        </div>
      </section>

      {/* Sticky VoteSection - 헤더 60px 아래에 고정, 사이드바 너비 제외 */}
      {isVoteSectionSticky && (
        <div
          className="fixed top-[60px] z-40 border-b border-gray-200 bg-white py-4"
          data-vote-section-sticky
          style={{
            top: '60px',
            left: `${sidebarWidth}px`,
            width: `calc(100vw - ${sidebarWidth}px)`,
            zIndex: 40,
          }}
        >
          <div className="max-width flex items-center justify-between gap-8 @max-lg:flex-col @lg:gap-16">
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
        </div>
      )}

      {/* 원본 VoteSection */}
      <section
        ref={voteSectionRef}
        className="@container mt-4 border-b border-gray-200 bg-white py-4"
      >
        <div className="max-width flex items-center justify-between gap-8 @max-lg:flex-col @lg:gap-16">
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

      <section className="max-width py-6!">
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
            {animeList.map((anime, index) => {
              // 분기의 첫 번째 후보인지 확인 (animeList 기준)
              const isFirstInQuarter =
                isYearEnd &&
                anime.quarter &&
                animeList.findIndex((a) => a.quarter === anime.quarter) ===
                  index;

              return (
                <motion.div
                  key={anime.animeCandidateId}
                  ref={(el) => {
                    if (el && isFirstInQuarter) {
                      quarterRefs.current.set(anime.animeCandidateId, el);
                    } else if (!isFirstInQuarter) {
                      quarterRefs.current.delete(anime.animeCandidateId);
                    }
                  }}
                  data-quarter={isYearEnd ? anime.quarter : undefined}
                  data-anime-id={anime.animeCandidateId}
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
                  className="h-full"
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
              );
            })}
          </motion.div>
        )}
      </section>

      <ConfirmDialog
        isOpen={showConfirmDialog}
        onConfirm={handleConfirmDialogConfirm}
        onCancel={() => setShowConfirmDialog(false)}
      />

      {/* 분기 네비게이션 - YEAR_END 타입일 때만 표시 */}
      {isYearEnd && quartersInList.length > 0 && !showGenderSelection && (
        <QuarterNavigation
          quarters={quartersInList}
          onQuarterClick={handleQuarterClick}
          activeQuarter={activeQuarter}
        />
      )}

      {/* 선택 현황 네비게이션 - 항상 표시 */}
      {!showGenderSelection && (
        <SelectionStatusNavigation
          selectedCount={allSelected.length}
          totalCount={totalCandidates}
          isFiltered={showOnlySelected}
          onToggleFilter={() => setShowOnlySelected((prev) => !prev)}
          isYearEnd={isYearEnd}
        />
      )}
    </main>
  );
}
