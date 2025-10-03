'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import VoteResultCardLoggedIn from "@/components/vote/VoteResultCardLoggedIn";
import VoteBanner from "@/components/vote/VoteBanner";
import VoteSection from "@/components/vote/VoteSection";
import VoteStamp from "@/components/vote/VoteStamp";
import VoteCard from "@/components/vote/VoteCard";
import ConfettiEffect from "@/components/vote/ConfettiEffect";
import ConfirmDialog from "@/components/vote/ConfirmDialog";
import VoteDisabledState from "@/components/vote/VoteDisabledState";
import { ApiResponseAnimeCandidateListDto, AnimeCandidateDto, ApiResponseAnimeVoteStatusDto, AnimeVoteStatusDto, VoteHistoryBallotDto, VoteStatus } from '@/types/api';
import useSWR, { mutate } from 'swr';
import { getSeasonFromDate } from '@/lib/utils';
import { fetcher, submitVote, revoteAnime } from '@/api/client';
import { searchMatch } from '@/lib/searchUtils';
import { hasVoteCookieId, hasVotedThisWeek } from '@/lib/cookieUtils';
import { useAuth } from '@/context/AuthContext';
import { useModal } from '@/components/AppContainer';
import { scrollUtils } from '@/hooks/useAdvancedScrollRestoration';

interface Anime {
  id: number;
  title: string;
  thumbnailUrl: string;
}

function VotePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();
  const { openLoginModal } = useModal();
  
  // 재투표 모드 상태 (URL 파라미터 대신 내부 상태로 관리)
  const [isRevoteMode, setIsRevoteMode] = useState(false);
  




  
  const [selected, setSelected] = useState<number[]>([]);
  const [bonusSelected, setBonusSelected] = useState<number[]>([]);
  const [errorCards, setErrorCards] = useState<Set<number>>(new Set());
  
  const [isBonusMode, setIsBonusMode] = useState(false);
  const [hasClickedBonus, setHasClickedBonus] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showGenderSelection, setShowGenderSelection] = useState(false);
  const [selectedGender, setSelectedGender] = useState<'male' | 'female' | null>(null);
  const [showVoteResult, setShowVoteResult] = useState(false);
  const [voteHistory, setVoteHistory] = useState<AnimeVoteStatusDto | null>(null);
  const [showNextError, setShowNextError] = useState(false);
  const [scrollCompleted, setScrollCompleted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showVotedThisWeekMessage, setShowVotedThisWeekMessage] = useState(false);
  const [bonusVotesRecalled, setBonusVotesRecalled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  
  // 이미지 프리로딩을 위한 ref
  const containerRef = useRef<HTMLDivElement>(null);

  // 이미지 프리로딩 함수 - 성능 최적화
  const preloadImages = useCallback((animes: Anime[]) => {
    if (!animes || animes.length === 0) return;
    
    // 우선순위 기반 이미지 로딩
    const priorityImages = animes.slice(0, 6); // 첫 6개만 우선 로드
    
    // 우선순위 이미지들을 병렬로 로드
    priorityImages.forEach((anime) => {
      const img = new Image();
      img.onload = () => {
        // 이미지 로드 완료
      };
      img.onerror = () => {
        // 에러 발생해도 계속 진행
      };
      img.src = anime.thumbnailUrl;
    });
  }, []);

  // 에러 카드 관리 헬퍼 함수
  const updateErrorCards = (animeId: number, shouldAdd: boolean) => {
    setErrorCards(prevErrors => {
      const newErrors = new Set(prevErrors);
      if (shouldAdd) {
        newErrors.add(animeId);
      } else {
        newErrors.delete(animeId);
      }
      return newErrors;
    });
  };

  // 투표 상태 조회 (통합 API) - 로그인 상태 또는 vote_cookie_id가 있을 때 호출
  const { data: voteStatusData, isLoading: isVoteStatusLoading } = useSWR(
    '/api/v1/vote/anime/status', // 항상 호출 (백엔드에서 쿠키 자동 인식)
    fetcher<ApiResponseAnimeVoteStatusDto>,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30000, // 30초 동안 중복 요청 방지
    }
  );

  // voted_this_week 쿠키 체크 - 클라이언트에서만 체크 (Hydration 에러 방지)
  useEffect(() => {
    const hasVoted = hasVotedThisWeek();
    
    // voted_this_week만 있고 vote_cookie_id가 없으면 메시지 표시
    if (hasVoted) {
      setShowVotedThisWeekMessage(true);
    }
  }, []);

  // 로그인 상태 변경 감지
  useEffect(() => {
    // 로그아웃된 상태에서 voted_this_week 쿠키가 있으면 메시지 표시
    if (!isAuthenticated && hasVotedThisWeek()) {
      setShowVotedThisWeekMessage(true);
      // 투표 결과 화면 숨김
      setShowVoteResult(false);
      setVoteHistory(null);
      // SWR 캐시 무효화 - 로그아웃 시 투표 상태 데이터 새로고침
      mutate('/api/v1/vote/anime/status');
    } else if (isAuthenticated) {
      // 로그인한 상태이면 메시지 숨김
      setShowVotedThisWeekMessage(false);
    }
  }, [isAuthenticated]);

  // voteStatusData 로드 후 추가 체크
  useEffect(() => {
    if (voteStatusData !== undefined) {
      // 실제 로그인 상태와 API 응답을 모두 고려하여 판단
      // memberId가 null이 아니면 실제 로그인한 사용자로 판단
      const isActuallyLoggedIn = isAuthenticated && voteStatusData?.result?.memberId !== null;
      
      if (isActuallyLoggedIn) {
        // 실제 로그인한 상태이면 메시지 숨김
        setShowVotedThisWeekMessage(false);
      } else {
        // 로그인하지 않은 상태에서 voted_this_week 쿠키가 있으면 메시지 표시
        if (hasVotedThisWeek()) {
          setShowVotedThisWeekMessage(true);
        }
      }
      
      // 투표한 이력이 있으면 투표 결과 표시 (로그인 또는 vote_cookie_id)
      // 단, 로그아웃 상태에서는 비로그인 투표 기록만 표시
      if (voteStatusData?.result?.hasVoted) {
        // 실제 로그인 상태이거나 비로그인 투표 기록인 경우만 결과 표시
        if (isActuallyLoggedIn || (voteStatusData?.result?.memberId === null && voteStatusData?.result?.hasVoted)) {
          setShowVoteResult(true);
          // 투표 내역 설정 (voteStatusData에서 가져온 정보 사용)
          setVoteHistory(voteStatusData.result);
        } else {
          // 로그아웃 상태에서 로그인한 사용자의 투표 기록은 숨김
          setShowVoteResult(false);
          setVoteHistory(null);
        }
      } else {
        // 투표하지 않은 경우 결과 화면 숨김
        setShowVoteResult(false);
        setVoteHistory(null);
      }
    }
  }, [voteStatusData, isAuthenticated]);

  // 후보 목록 조회 조건 (Hydration 에러 방지를 위해 클라이언트에서만 체크)
  const [shouldFetchCandidates, setShouldFetchCandidates] = useState<boolean | null>(null);
  
  useEffect(() => {
    // 재투표 모드인 경우 항상 후보 목록 조회
    if (isRevoteMode) {
      setShouldFetchCandidates(true);
      return;
    }
    
    // 로그인한 경우: voteStatusData 결과에 따라 결정
    if (voteStatusData !== undefined) {
      const result = !voteStatusData?.result?.hasVoted;
      setShouldFetchCandidates(result);
      return;
    }
    
    // 로그인하지 않은 경우: voted_this_week 쿠키가 없으면 API 호출
    const result = !hasVotedThisWeek();
    setShouldFetchCandidates(result);
  }, [voteStatusData, isRevoteMode]);
  
  const { data, error, isLoading } = useSWR<ApiResponseAnimeCandidateListDto>(
    shouldFetchCandidates === true ? '/api/v1/vote/anime' : null,
    fetcher<ApiResponseAnimeCandidateListDto>,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // 1분 동안 중복 요청 방지
    }
  );

  // 데이터 로드 시 이미지 프리로딩 실행 - 성능 최적화
  useEffect(() => {
    if (data?.result?.animeCandidates) {
      const animes = data.result.animeCandidates.map(anime => ({
        id: anime.animeCandidateId,
        title: anime.titleKor,
        thumbnailUrl: anime.mainThumbnailUrl || '/imagemainthumbnail@2x.png',
      }));
      
      // 우선순위 기반 프리로딩으로 초기 로딩 시간 단축
      preloadImages(animes);
    }
  }, [data, preloadImages]);

  // 재투표 모드에서 스티키 강제 활성화 (데이터 로딩 완료 후)
  useEffect(() => {
    if (isRevoteMode && voteStatusData?.result?.hasVoted && data?.result?.animeCandidates) {
      
      // 데이터 로딩 완료 후 스티키 강제 활성화
      const timer = setTimeout(() => {
        const stickySection = document.querySelector('[data-sticky-section]');
        if (stickySection) {
          // 스티키 강제 재계산
          (stickySection as HTMLElement).style.position = 'sticky';
          (stickySection as HTMLElement).style.top = '60px';
          (stickySection as HTMLElement).style.zIndex = '50';
          (stickySection as HTMLElement).style.transform = 'translateZ(0)';
          (stickySection as HTMLElement).style.backfaceVisibility = 'hidden';
          
          // 강제 리플로우
          void (stickySection as HTMLElement).offsetHeight;
          
        }
      }, 1000); // 데이터 로딩 완료 후 1초 대기
      
      return () => clearTimeout(timer);
    }
  }, [isRevoteMode, voteStatusData, data]);



  // 로그인한 사용자의 성별 정보로 성별 선택란 미리 선택
  useEffect(() => {
    if (data?.result?.memberGender && data.result.memberGender !== 'UNKNOWN') {
      const gender = data.result.memberGender === 'MALE' ? 'male' : 'female';
      setSelectedGender(gender);
    }
  }, [data?.result?.memberGender]);


  const handleSelect = (animeId: number, isBonusVote?: boolean) => {
    if (isBonusMode) {
      // 보너스 모드: 일반/보너스 투표 구분
      if (selected.includes(animeId)) {
        setSelected(prev => prev.filter(id => id !== animeId));
        updateErrorCards(animeId, false);
      } else if (bonusSelected.includes(animeId)) {
        setBonusSelected(prev => prev.filter(id => id !== animeId));
        updateErrorCards(animeId, false);
      } else {
        if (isBonusVote) {
          setBonusSelected(prev => [...prev, animeId]);
          updateErrorCards(animeId, false);
        } else if (selected.length < 10) {
          setSelected(prev => [...prev, animeId]);
          updateErrorCards(animeId, false);
        } else {
          updateErrorCards(animeId, true);
        }
      }
    } else {
      // 일반 모드
      setSelected(prev => {
        if (prev.includes(animeId)) {
          updateErrorCards(animeId, false);
          return prev.filter(id => id !== animeId);
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

  const handleBonusClick = () => {
    setIsBonusMode(true);
    setHasClickedBonus(true);
  };

  const handleNextClick = () => {
    if (selected.length === 0) {
      setShowNextError(true);
      setTimeout(() => {
        setShowNextError(false);
      }, 1000);
      return;
    }

    // 보너스 투표 사용 중이고 일반 투표가 10개 미만인 경우 확인 다이얼로그 표시
    if (bonusSelected.length > 0 && selected.length < 10) {
      setShowConfirmDialog(true);
      return;
    }
    
    // 일반적인 NEXT 처리
    proceedToNext();
  };

  const proceedToNext = () => {
    // 1단계: 모든 카드들이 투명해짐 (showGenderSelection이 true가 되면서 animate 조건이 활성화됨)
    setShowGenderSelection(true);
    
    // 검색 쿼리 초기화 (상태 4로 넘어갈 때 검색 필터 해제)
    setSearchQuery('');
    
    // 스크롤을 맨 위로 이동
    window.scrollTo(0, 0);
    
    // 3단계: 선택한 후보들이 나타남 (0.8초 동안 선명해짐)
    setTimeout(() => {
      setScrollCompleted(true);
    }, 500); // 투명해진 후 바로 시작 (총 0.8초)
  };

  const handleConfirmDialogConfirm = () => {
    // 보너스 투표를 모두 제거하고 일반 투표만 유지
    setBonusSelected([]);
    setBonusVotesRecalled(true);
    setShowConfirmDialog(false);
    // 다음 단계로 진행
    proceedToNext();
  };

  const handleConfirmDialogCancel = () => {
    setShowConfirmDialog(false);
  };

  const handleBackClick = () => {
    setShowGenderSelection(false);
    setScrollCompleted(false);
    // 뒤로가기 시에도 검색 쿼리 초기화
    setSearchQuery('');
  };

  const handleConfettiComplete = () => {
    setShowConfetti(false);
  };


  const handleGenderSelect = (gender: 'male' | 'female') => {
    setSelectedGender(gender);
  };

  const handleSubmitClick = async () => {
    if (!selectedGender) return;

    setIsSubmitting(true);
    
    try {
      if (isRevoteMode && voteStatusData?.result?.submissionId) {
        // 재투표 모드: 기존 투표 수정
        const currentVotes = voteStatusData.result.animeBallotDtos || [];
        const currentNormalVotes = currentVotes
          .filter(ballot => ballot.ballotType === 'NORMAL')
          .map(ballot => ballot.animeCandidateId);
        const currentBonusVotes = currentVotes
          .filter(ballot => ballot.ballotType === 'BONUS')
          .map(ballot => ballot.animeCandidateId);
        
        // 추가된 투표
        const added = [
          ...selected.filter(id => !currentNormalVotes.includes(id)).map(id => ({ candidateId: id, ballotType: "NORMAL" as const })),
          ...bonusSelected.filter(id => !currentBonusVotes.includes(id)).map(id => ({ candidateId: id, ballotType: "BONUS" as const }))
        ];
        
        // 제거된 투표
        const removed = [
          ...currentNormalVotes.filter(id => !selected.includes(id)).map(id => ({ candidateId: id, ballotType: "NORMAL" as const })),
          ...currentBonusVotes.filter(id => !bonusSelected.includes(id)).map(id => ({ candidateId: id, ballotType: "BONUS" as const }))
        ];
        
        // 수정된 투표 (일반 -> 보너스 또는 보너스 -> 일반)
        const updated = [];
        for (const id of selected) {
          if (currentBonusVotes.includes(id)) {
            updated.push({ candidateId: id, ballotType: "NORMAL" as const });
          }
        }
        for (const id of bonusSelected) {
          if (currentNormalVotes.includes(id)) {
            updated.push({ candidateId: id, ballotType: "BONUS" as const });
          }
        }
        
        const requestBody = {
          weekId: data?.result?.weekId,
          gender: selectedGender === 'male' ? 'MALE' : 'FEMALE',
          added,
          removed,
          updated
        };
        
        const result = await revoteAnime(voteStatusData.result.submissionId, requestBody);
        
        if (result.isSuccess) {
          // 투표 상태 데이터 캐시 업데이트
          const updatedVoteStatus = await mutate('/api/v1/vote/anime/status');
          
          // 빵빠레 효과 시작
          setShowConfetti(true);
          
          // 재투표 모드 비활성화
          setIsRevoteMode(false);
          
          // 투표 결과 화면으로 전환
          setShowVoteResult(true);
          
          // 재투표 모드에서 성공 시 투표 결과 화면으로 강제 이동
          // 업데이트된 투표 상태 데이터를 사용하여 voteHistory 설정
          if (updatedVoteStatus?.result) {
            setVoteHistory(updatedVoteStatus.result);
          } else if (voteStatusData?.result) {
            // fallback: 기존 데이터 사용
            setVoteHistory(voteStatusData.result);
          }
        } else {
          alert('재투표 제출에 실패했습니다. 다시 시도해주세요.');
        }
      } else {
        // 일반 투표 모드
        const ballotRequests = [
          ...selected.map(id => ({ candidateId: id, ballotType: "NORMAL" as const })),
          ...bonusSelected.map(id => ({ candidateId: id, ballotType: "BONUS" as const }))
        ];

        const requestBody = {
          weekId: data?.result?.weekId,
          gender: selectedGender === 'male' ? 'MALE' : 'FEMALE',
          ballotRequests
        };
        
        const result = await submitVote(requestBody);
        
        // 성공 시 SWR 캐시 업데이트
        if (result.isSuccess) {
          // 투표 상태 데이터 캐시 업데이트
          await mutate('/api/v1/vote/anime/status');
          
          // 빵빠레 효과 시작 (투표 제출 시에만)
          setShowConfetti(true);
          
          // 투표 결과 화면으로 전환
          setShowVoteResult(true);
          
          // voteStatusData가 업데이트되면 useEffect에서 voteHistory를 설정할 것임
        } else {
          alert('투표 제출에 실패했습니다. 다시 시도해주세요.');
        }
      }
      
      // API 호출 성공 시 바로 TOP으로 이동
      window.scrollTo(0, 0);
      
    } catch (error) {
      alert(isRevoteMode ? '재투표 제출에 실패했습니다. 다시 시도해주세요.' : '투표 제출에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 전체 선택된 카드 목록 (일반 + 보너스)
  const allSelected = [...selected, ...bonusSelected];
  
  // 보너스 투표 사용량
  const bonusVotesUsed = bonusSelected.length;

  // VoteCategory에 따른 텍스트 매핑
  const getCategoryText = (category: string) => {
    switch (category) {
      case 'ANIME':
        return '애니메이션';
      case 'HERO':
        return '남성 캐릭터';
      case 'HEROINE':
        return '여성 캐릭터';
      default:
        return '애니메이션';
    }
  };

  // 현재 투표 카테고리 텍스트
  const categoryText = getCategoryText(voteHistory?.category || 'ANIME');

  // 분기와 주차 정보를 가져와서 결과 공개 메시지 생성
  const getResultAnnouncementMessage = () => {
    const weekDto = voteHistory?.weekDto || data?.result?.weekDto;
    if (!weekDto) {
      return "덕스타 결과는 일요일 22시에 공개됩니다.";
    }

    const quarter = weekDto.quarter || 1;
    const week = weekDto.week || 1;

    return `${quarter}분기 ${week}주차 덕스타 결과는 일요일 22시에 공개됩니다.`;
  };

  // 재투표 모드 처리
  useEffect(() => {
    if (isRevoteMode && voteStatusData?.result?.hasVoted) {
      // 재투표 모드에서는 성별 선택 화면을 표시하지 않음 (초기 모드 유지)
      setShowGenderSelection(false);
    }
  }, [isRevoteMode, voteStatusData]);

  // 재투표 모드로 이동할 때 결과 화면 상태 초기화
  useEffect(() => {
    if (isRevoteMode) {
      // 재투표 모드로 이동할 때 결과 화면 관련 상태 초기화
      setShowVoteResult(false);
      setVoteHistory(null);
      setShowConfetti(false);
      
      // 재투표 모드에서는 기존 투표 데이터를 기표칸에 미리 채우기
      if (voteStatusData?.result?.hasVoted && voteStatusData.result.animeBallotDtos) {
        const normalVotes = voteStatusData.result.animeBallotDtos
          .filter(ballot => ballot.ballotType === 'NORMAL')
          .map(ballot => ballot.animeCandidateId);
        const bonusVotes = voteStatusData.result.animeBallotDtos
          .filter(ballot => ballot.ballotType === 'BONUS')
          .map(ballot => ballot.animeCandidateId);
        
        // 기존 투표 데이터를 즉시 상태에 설정
        setSelected(normalVotes);
        setBonusSelected(bonusVotes);
        
        // 보너스 투표가 있으면 보너스 모드 활성화
        if (bonusVotes.length > 0) {
          setIsBonusMode(true);
          setHasClickedBonus(true);
        }
        
        // 성별 정보 설정
        if (data?.result?.memberGender && data.result.memberGender !== 'UNKNOWN') {
          const gender = data.result.memberGender === 'MALE' ? 'male' : 'female';
          setSelectedGender(gender);
        }
      }
    }
  }, [isRevoteMode, voteStatusData, data]);

  // 투표 상태 데이터가 로드되면 상태 업데이트
  useEffect(() => {
    if (voteStatusData?.result && voteStatusData.result.hasVoted) {
      setVoteHistory(voteStatusData.result);
      setShowVoteResult(true);
    }
  }, [voteStatusData]);

  // 재투표 모드에서 투표 결과 화면 표시 강제 업데이트
  useEffect(() => {
    if (isRevoteMode && showVoteResult && voteStatusData?.result) {
      setVoteHistory(voteStatusData.result);
    }
  }, [isRevoteMode, showVoteResult, voteStatusData]);

  // 스크롤 복원 로직 - 상세화면에서 돌아왔을 때
  useEffect(() => {
    const navigationType = sessionStorage.getItem('navigation-type');
    if (navigationType === 'from-vote-result' && showVoteResult) {
      // 상세화면에서 돌아온 경우 스크롤 복원
      const savedY = sessionStorage.getItem('scroll-vote-result');
      if (savedY) {
        const y = parseInt(savedY);
        if (!isNaN(y) && y > 0) {
          // CSS scroll-behavior 강제 무시하여 깜빡임 방지
          const originalScrollBehavior = document.documentElement.style.scrollBehavior;
          document.documentElement.style.scrollBehavior = 'auto';
          document.body.style.scrollBehavior = 'auto';
          
          // 즉시 스크롤 복원 (애니메이션 없이)
          window.scrollTo(0, y);
          document.body.scrollTop = y;
          document.documentElement.scrollTop = y;
          
          // 추가 즉시 복원 (확실하게)
          setTimeout(() => {
            window.scrollTo(0, y);
            document.body.scrollTop = y;
            document.documentElement.scrollTop = y;
          }, 0);
          
          // CSS 복원
          setTimeout(() => {
            document.documentElement.style.scrollBehavior = originalScrollBehavior;
            document.body.style.scrollBehavior = originalScrollBehavior;
          }, 100);
        }
      }
      
      // 플래그 정리
      sessionStorage.removeItem('navigation-type');
    }
  }, [showVoteResult]);

  // 페이지 로드 시 스크롤 복원 (더 빠른 복원을 위해)
  useEffect(() => {
    const navigationType = sessionStorage.getItem('navigation-type');
    if (navigationType === 'from-vote-result') {
      const savedY = sessionStorage.getItem('scroll-vote-result');
      if (savedY) {
        const y = parseInt(savedY);
        if (!isNaN(y) && y > 0) {
          // 페이지 로드 즉시 스크롤 복원
          const originalScrollBehavior = document.documentElement.style.scrollBehavior;
          document.documentElement.style.scrollBehavior = 'auto';
          document.body.style.scrollBehavior = 'auto';
          
          window.scrollTo(0, y);
          document.body.scrollTop = y;
          document.documentElement.scrollTop = y;
          
          // CSS 복원
          setTimeout(() => {
            document.documentElement.style.scrollBehavior = originalScrollBehavior;
            document.body.style.scrollBehavior = originalScrollBehavior;
          }, 50);
        }
      }
    }
  }, []);



  // 전체 애니메이션 리스트 생성 (API 데이터만 사용) - 메모이제이션
  const allAnimeList: Anime[] = useMemo(() => {
    return data?.result?.animeCandidates?.map((anime: AnimeCandidateDto) => ({
      id: anime.animeCandidateId,
      title: anime.titleKor || '제목 없음',
      thumbnailUrl: anime.mainThumbnailUrl || '/imagemainthumbnail@2x.png',
    })) || [];
  }, [data?.result?.animeCandidates]);

  // 검색어에 따라 애니메이션 리스트 필터링 (검색 페이지와 동일한 로직 적용) - 메모이제이션
  const filteredAnimeList: Anime[] = useMemo(() => {
    return searchQuery.trim() === '' 
      ? allAnimeList 
      : allAnimeList.filter(anime => 
          searchMatch(searchQuery, anime.title)
        );
  }, [allAnimeList, searchQuery]);

  // 상태 4에서 투표된 아이템만 필터링하고 정렬 (애니메이션 완료 후에만 필터링) - 메모이제이션
  const animeList: Anime[] = useMemo(() => {
    if (showGenderSelection && scrollCompleted) {
      return filteredAnimeList
        .filter(anime => selected.includes(anime.id) || bonusSelected.includes(anime.id))
        .sort((a, b) => {
          const aIsNormal = selected.includes(a.id);
          const bIsNormal = selected.includes(b.id);
          
          // 일반 투표된 아이템을 먼저, 보너스 투표된 아이템을 나중에
          if (aIsNormal && !bIsNormal) return -1;
          if (!aIsNormal && bIsNormal) return 1;
          return 0;
        });
    }
    return filteredAnimeList;
  }, [filteredAnimeList, showGenderSelection, scrollCompleted, selected, bonusSelected]);

  // 전체 후보자 수
  const totalCandidates = data?.result?.candidatesCount || animeList.length;

  // 투표 상태 확인 로딩 중 - 스켈레톤 UI
  if (isVoteStatusLoading) {
    return (
      <main className="w-full">
        <section>
          <div className="w-full h-24 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse" />
        </section>
        <div className="w-full max-w-[1240px] mx-auto px-4 py-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="h-8 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
          </div>
        </div>
      </main>
    );
  }

  // 투표하지 않은 사람이지만 후보 목록 로딩 중 - 스켈레톤 UI (shouldFetchCandidates가 null이거나 로딩 중일 때)
  if (shouldFetchCandidates === null || isLoading) {
    return (
      <main className="w-full">
        <section>
          <div className="w-full h-24 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse" />
        </section>
        <div className="w-full max-w-[1240px] mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-white rounded-xl shadow border border-gray-200 p-4">
                <div className="flex items-center gap-4">
                  <div className="w-28 h-36 bg-gray-200 rounded-md animate-pulse" />
                  <div className="flex-1">
                    <div className="h-6 bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  // 투표하지 않은 사람이지만 후보 목록 에러
  if (error) {
    return <div className="text-center text-red-500">투표 후보를 불러오는 중 오류가 발생했습니다.</div>;
  }

  // 투표한 사람인 경우 바로 투표 결과 화면 표시 (투표 제출 후 또는 기존 투표자)
  // 단, 재투표 모드일 때는 투표 화면을 표시
  // 또한 URL에 revote 파라미터가 있으면 항상 투표 화면을 표시
  // 재투표 모드에서는 제출 완료 후에만 결과 화면 표시
  if ((!isRevoteMode && ((voteStatusData?.result?.hasVoted && (isAuthenticated || voteStatusData?.result?.nickName === null)) || showVoteResult)) || 
      (isRevoteMode && showVoteResult && voteHistory && !isSubmitting)) {
    // 투표 내역이 아직 로드되지 않은 경우 로딩 표시
    if (!voteHistory) {
      return <div className="text-center">투표 기록을 불러오는 중...</div>;
    }
    return (
      <main className="w-full bg-gray-50">
        {/* 빵빠레 효과 */}
        <ConfettiEffect 
          isActive={showConfetti} 
          onComplete={handleConfettiComplete}
        />
        {/* 배너 - 전체 너비, 패딩 없음 */}
        <section>
          <VoteBanner 
            customTitle={`이번 주 ${categoryText} 투표 기록`}
            weekDto={voteHistory?.weekDto || data?.result?.weekDto} 
          />
        </section>

        {/* 메인 컨텐츠 */}
        <div className="w-full max-w-[1240px] mx-auto px-4 py-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* 투표 결과 섹션 */}
            <div className="p-4 sm:p-6">
              <div className="bg-[#ffffff] box-border content-stretch flex flex-col lg:flex-row gap-3 sm:gap-4 lg:gap-[55px] items-center justify-center px-4 lg:px-0 min-h-16 relative w-full">
                
                <div className="content-stretch flex flex-col lg:flex-row gap-3 sm:gap-4 lg:gap-[60px] items-center justify-center lg:justify-end relative shrink-0">
                  {/* Normal Vote Result */}
                  <VoteStamp
                    type="normal"
                    isActive={true}
                    currentVotes={voteHistory.normalCount || 0}
                    maxVotes={10}
                    showResult={true}
                    showGenderSelection={true}
                  />
                  
                  {/* Bonus Vote Result */}
                  {voteHistory.bonusCount > 0 && (
                    <VoteStamp
                      type="bonus"
                      isActive={true}
                      currentVotes={voteHistory.bonusCount || 0}
                      maxVotes={voteHistory.bonusCount || 0}
                      bonusVotesUsed={voteHistory.bonusCount || 0}
                      showResult={true}
                    />
                  )}
                </div>

                {/* Submission DateTime */}
                <div className="bg-[#f8f9fa] box-border content-stretch flex gap-2.5 items-center justify-center lg:justify-end px-3 sm:px-5 py-[5px] relative rounded-lg shrink-0">
                  <div className="flex flex-col font-['Pretendard:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#000000] text-sm sm:text-base lg:text-[20px] text-nowrap text-center lg:text-right">
                    <p className="leading-[normal] whitespace-pre">제출 시각: {new Date(voteHistory.submittedAt).toLocaleString('ko-KR')}</p>
                  </div>
                </div>

                {/* 재투표하기 버튼 - 로그인한 사용자만 표시 */}
                {isAuthenticated && (
                  <div className="flex justify-center lg:justify-end">
                    <button
                      onClick={() => {
                        // 재투표 모드 활성화
                        setIsRevoteMode(true);
                      }}
                      className="text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 cursor-pointer flex items-center gap-2"
                      style={{ backgroundColor: '#FFB310' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#FFC633';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#FFB310';
                      }}
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      재투표하기
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 감사 메시지 및 결과 공개 안내 */}
          <div className="w-full bg-[#F1F3F5] rounded-xl p-4 sm:p-6 pb-0 mt-6">
            <div className="flex flex-col items-center gap-2 sm:gap-3">
              <div className="text-center text-black text-xl sm:text-2xl lg:text-3xl font-semibold font-['Pretendard']">
                {voteHistory.nickName ? `${voteHistory.nickName} 님, 소중한 참여 감사합니다!` : '소중한 참여 감사합니다!'}
              </div>
              <div className="px-4 sm:px-6 py-2 sm:py-2.5 bg-[#F8F9FA] rounded-[12px] relative -mb-5 lg:-mb-11">
                <div className="text-center text-black text-sm sm:text-base font-medium font-['Pretendard']">{getResultAnnouncementMessage()}</div>
              </div>

          </div>
        </div>

          {/* 투표된 아이템 리스트 */}
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-end justify-between mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-semibold">투표한 {categoryText}</h2>
              
              {/* 비로그인 투표 시 로그인 안내 문구 */}
              {(!isAuthenticated && (!voteHistory.nickName || hasVoteCookieId())) && (
                <div className="relative group">
                  <button 
                    onClick={openLoginModal}
                    className="text-gray-500 text-base hover:text-gray-700 transition-colors duration-200 flex items-center gap-1 cursor-pointer"
                    style={{ 
                      borderBottom: '1px solid #c4c7cc',
                      lineHeight: '1.1'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderBottomColor = '#374151';
                      const svg = e.currentTarget.querySelector('svg');
                      if (svg) svg.style.stroke = '#374151';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderBottomColor = '#c4c7cc';
                      const svg = e.currentTarget.querySelector('svg');
                      if (svg) svg.style.stroke = '#9ca3af';
                    }}
                  >
                    로그인으로 투표 내역 저장하기
                    <svg className="w-4 h-4" fill="none" stroke="#9ca3af" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  
                  {/* 툴팁 */}
                  <div className="absolute bottom-full left-2/3 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                    <div className="bg-gray-800 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap relative">
                      언제든 재투표 가능!
                      {/* 툴팁 화살표 */}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {voteHistory.animeBallotDtos && voteHistory.animeBallotDtos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full">
                  {voteHistory.animeBallotDtos.map((ballot: VoteHistoryBallotDto) => (
                    <div key={ballot.animeId}>
                      <VoteResultCardLoggedIn
                        ballot={ballot}
                        weekDto={data?.result?.weekDto}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <p className="text-gray-500 text-base sm:text-lg">투표한 {categoryText}이 없습니다.</p>
                </div>
              )}
            </div>
          </div>
        </main>
    );
  }


  // VoteStatus에 따른 조건부 렌더링
  const voteStatus = data?.result?.status;
  
  // 투표가 비활성화된 상태 (PAUSED, CLOSED)인 경우
  if (voteStatus && voteStatus !== 'OPEN') {
    return (
      <VoteDisabledState 
        status={voteStatus} 
        weekDto={data?.result?.weekDto}
      />
    );
  }

  // voted_this_week 메시지 표시
  if (showVotedThisWeekMessage) {
    return (
      <main className="w-full">
        {/* 배너 - 전체 너비, 패딩 없음 */}
        <section>
          <VoteBanner 
            weekDto={data?.result?.weekDto} 
            customTitle={`${data?.result?.weekDto?.year || 2025} ${getSeasonFromDate(data?.result?.weekDto?.startDate || '2025-07-13')} ${getCategoryText('ANIME')} 투표`}
          />
        </section>

        {/* 메인 컨텐츠 */}
        <div className="w-full max-w-[1240px] mx-auto px-4 py-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <div className="text-2xl mb-2">😎</div>
              <h2 className="text-xl font-semibold mb-2">기존 투표 이력이 확인되었습니다</h2>
              <p className="text-gray-600 mb-6">다음 주차 투표는 일요일 22시에 시작됩니다.</p>
              <p className="text-sm text-gray-500 mb-6">투표한 적이 없으시다면, 중복 투표 방지를 위해 로그인이 필요합니다.</p>
              <button
                onClick={openLoginModal}
                className="text-black font-semibold py-2 px-6 rounded-lg transition-colors duration-200 cursor-pointer"
                style={{ backgroundColor: '#FED783' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#FED783';
                  e.currentTarget.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#FED783';
                  e.currentTarget.style.opacity = '1';
                }}
              >
                로그인하기
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // 투표 결과 화면 렌더링
  return (
    <main className="w-full min-h-screen overflow-visible" ref={containerRef} style={{ overflow: 'visible' }}>
      {/* 배너 - 전체 너비, 패딩 없음 */}
      <section style={{ overflow: 'visible' }}>
        <VoteBanner 
          weekDto={data?.result?.weekDto} 
          customTitle={isRevoteMode 
            ? `${data?.result?.weekDto?.year || 2025} ${getSeasonFromDate(data?.result?.weekDto?.startDate || '2025-07-13')} ${getCategoryText('ANIME')} 재투표` 
            : `${data?.result?.weekDto?.year || 2025} ${getSeasonFromDate(data?.result?.weekDto?.startDate || '2025-07-13')} ${getCategoryText('ANIME')} 투표`
          }
        />
      </section>


      {/* 투표 섹션 */}
      <section 
        className="w-full overflow-visible" 
        style={{ overflow: 'visible' }}
      >
        {/* 알림 섹션 */}
        <div className="w-full max-w-[1240px] mx-auto px-4 pt-6">
          <div className="bg-white rounded-t-[8px] shadow-sm border border-gray-200 border-b-0">
            <div className="flex flex-col gap-2.5 pb-[9px] pl-3 pr-3 sm:pl-6 sm:pr-6 pt-3">
              {!showGenderSelection ? (
                <div className="bg-[#f1f2f3] flex h-8 sm:h-9 items-center justify-start pl-1 pr-2 sm:pl-2 sm:pr-3 lg:pr-5 py-0 rounded-lg w-fit max-w-full">
                  <div className="flex gap-1 sm:gap-2 lg:gap-2.5 items-center justify-start px-1 sm:px-2 lg:px-2.5 py-0">
                    <div className="relative size-3 sm:size-4 overflow-hidden">
                      <img
                        src="/icons/voteSection-notify-icon.svg"
                        alt="Notification Icon"
                        className="w-full h-full"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col font-['Pretendard',_sans-serif] font-semibold justify-center text-[#23272b] text-xs sm:text-base min-w-0 flex-1">
                    <p className="leading-normal break-words">
                      마음에 든 {categoryText}을 투표해주세요!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-[#f1f2f3] flex h-11 sm:h-9 items-center justify-start pl-1 pr-2 sm:pl-2 sm:pr-3 lg:pr-5 py-0 rounded-lg w-fit ml-auto max-w-full">
                  <div className="flex gap-1 sm:gap-2 lg:gap-2.5 items-center justify-start px-1 sm:px-2 lg:px-2.5 py-0">
                    <div className="relative size-3 sm:size-4 overflow-hidden">
                      <img
                        src="/icons/voteSection-notify-icon.svg"
                        alt="Notification Icon"
                        className="w-full h-full"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col font-['Pretendard',_sans-serif] font-semibold justify-center text-[#23272b] text-xs sm:text-base min-w-0 flex-1">
                    <p className="leading-normal break-words">
                      성별은 투표 성향 통계에 꼭 필요한 정보예요.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="w-full max-w-[1240px] mx-auto px-4">
          <div className="bg-white rounded-b-[8px] shadow-sm border border-gray-200 border-t-0 relative">
            
            {/* 투표 섹션 */}
            <div className="p-6">
              <VoteSection
                currentVotes={selected.length}
                maxVotes={10}
                bonusVotesUsed={bonusVotesUsed}
                searchQuery={searchQuery}
                hasClickedBonus={hasClickedBonus}
                showGenderSelection={showGenderSelection}
                selectedGender={selectedGender}
                showNextError={showNextError}
                showConfirmDialog={showConfirmDialog}
                isSubmitting={isSubmitting}
                external={true}
                weekDto={data?.result?.weekDto}
                onSearchQueryChange={setSearchQuery}
                onNextClick={handleNextClick}
                onBackClick={handleBackClick}
                onGenderSelect={handleGenderSelect}
                onBonusClick={handleBonusClick}
                onSubmitClick={handleSubmitClick}
              />
            </div>

          </div>
        </div>
      </section>

      {/* 컨텐츠 영역 - 중앙 정렬, 패딩 적용 */}
      <div className="w-full max-w-[1240px] mx-auto px-4 py-6">
        {/* 헤더 */}
        <section className="mb-6">
          <p className="text-gray-500 text-sm mt-1">
            선택한 애니메이션: <span className="font-bold">{allSelected.length}</span> / {totalCandidates}
          </p>
        </section>

        {/* 투표 카드 리스트 */}
        <section>
          {searchQuery.trim() !== '' && (
            <div className="mb-4">
              <p className="text-gray-600 text-sm">
                &ldquo;{searchQuery}&rdquo; 검색 결과: <span className="font-semibold">{animeList.length}</span>개
              </p>
            </div>
          )}
          
          {animeList.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                {searchQuery.trim() !== '' 
                  ? `"${searchQuery}"에 대한 검색 결과가 없습니다.`
                  : "표시할 애니메이션이 없습니다."
                }
              </p>
            </div>
          ) : (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full"
              initial={{ opacity: 1 }}
              animate={{ 
                opacity: 1
              }}
              transition={{ 
                duration: 0.3,
                ease: "easeInOut"
              }}
              style={{ willChange: 'auto' }} // 성능 최적화
            >
              {animeList.map((anime, index) => (
                <motion.div
                  key={anime.id}
                  initial={{ opacity: 1, y: 0, scale: 1 }}
                  animate={{ 
                    opacity: showGenderSelection 
                      ? (scrollCompleted ? [0, 1] : [1, 0.8, 0.5, 0.2, 0]) // 모든 카드: 단계적으로 투명해짐
                      : 1,
                    y: 0, // y 이동 제거
                    scale: 1 // scale 애니메이션 제거
                  }}
                  transition={{ 
                    duration: showGenderSelection ? 0.5 : 0.3, // 투명해지는 시간 0.5초, 선명해지는 시간 0.8초
                    delay: showGenderSelection 
                      ? (scrollCompleted ? index * 0.05 : 0) // 투명해질 때는 동시에, 나타날 때만 순차적으로
                      : 0,
                    ease: "easeInOut",
                    times: showGenderSelection && !scrollCompleted 
                      ? [0, 0.2, 0.4, 0.6, 1] // 단계적 투명화 시간
                      : undefined
                  }}
                  style={{
                    pointerEvents: showGenderSelection ? 'none' : 'auto',
                    willChange: showGenderSelection ? 'opacity' : 'auto' // 성능 최적화
                  }}
                >
                  <VoteCard
                    thumbnailUrl={anime.thumbnailUrl}
                    title={anime.title}
                    checked={selected.includes(anime.id) || bonusSelected.includes(anime.id)}
                    onChange={showGenderSelection ? undefined : (isBonusVote?: boolean) => handleSelect(anime.id, isBonusVote)}
                    showError={!isBonusMode && errorCards.has(anime.id)}
                    currentVotes={selected.length}
                    maxVotes={10}
                    isBonusMode={isBonusMode}
                    bonusVotesUsed={bonusVotesUsed}
                    isBonusVote={bonusSelected.includes(anime.id)}
                    onMouseLeave={() => handleCardMouseLeave(anime.id)}
                    weekDto={data?.result?.weekDto}
                    disabled={showGenderSelection}
                    showGenderSelection={showGenderSelection}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </section>
      </div>

      {/* 확인 다이얼로그 */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onConfirm={handleConfirmDialogConfirm}
        onCancel={handleConfirmDialogCancel}
      />

    </main>
  );
}

export default function VotePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-500"></div>
          </div>
          <p className="text-gray-600">페이지를 불러오는 중...</p>
        </div>
      </div>
    }>
      <VotePageContent />
    </Suspense>
  );
}
