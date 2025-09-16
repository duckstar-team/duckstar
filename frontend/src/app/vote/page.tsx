'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import VoteCard from "@/components/vote/VoteCard";
import VoteBanner from "@/components/vote/VoteBanner";
import VoteSection from "@/components/vote/VoteSection";
import VoteStamp from "@/components/vote/VoteStamp";
import ConfettiEffect from "@/components/vote/ConfettiEffect";
import ConfirmDialog from "@/components/vote/ConfirmDialog";
import { ApiResponseAnimeCandidateListDto, AnimeCandidateDto, ApiResponseAnimeVoteStatusDto, AnimeVoteStatusDto, VoteHistoryBallotDto } from '@/types/api';
import useSWR, { mutate } from 'swr';
import { getSeasonFromDate } from '@/lib/utils';
import { fetcher, submitVote } from '@/api/client';
import { searchMatch } from '@/lib/searchUtils';
import { scrollToTop, scrollToPosition, clearStorageFlags } from '@/utils/scrollUtils';

interface Anime {
  id: number;
  title: string;
  thumbnailUrl: string;
  medium: 'TVA' | 'MOVIE';
}

export default function VotePage() {
  const router = useRouter();
  

  // 스티키 요소 초기화를 위한 useEffect
  useEffect(() => {
    // 컴포넌트 마운트 후 스티키 요소 강제 재계산
    const timer = setTimeout(() => {
      const stickySection = document.querySelector('[data-sticky-section]');
      if (stickySection) {
        // 강제 리플로우로 스티키 위치 재계산
        void (stickySection as HTMLElement).offsetHeight;
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // 투표 결과 화면 스크롤 복원 로직
  useEffect(() => {
    const sidebarNav = sessionStorage.getItem('sidebar-navigation');
    const logoNav = sessionStorage.getItem('logo-navigation');
    const fromAnimeDetail = sessionStorage.getItem('from-anime-detail');
    const toVoteResult = sessionStorage.getItem('to-vote-result');
    const voteResultScroll = sessionStorage.getItem('vote-result-scroll');

    // 스크롤 복원 상태 확인

    const isSidebarNavigation = sidebarNav === 'true';
    const isLogoNavigation = logoNav === 'true';
    const isFromAnimeDetail = fromAnimeDetail === 'true' && toVoteResult === 'true';

    if (isSidebarNavigation) {
      // 모든 관련 플래그 정리
      clearStorageFlags('sidebar-navigation', 'vote-result-scroll', 'from-anime-detail', 'to-vote-result');
      scrollToTop();
    } else if (isLogoNavigation) {
      // 모든 관련 플래그 정리
      clearStorageFlags('logo-navigation', 'vote-result-scroll', 'from-anime-detail', 'to-vote-result');
      scrollToTop();
    } else if (isFromAnimeDetail) {
      if (voteResultScroll) {
        const y = parseInt(voteResultScroll);
        scrollToPosition(y);
        // 플래그는 두 번째 useEffect에서 정리하도록 유지
      } else {
        clearStorageFlags('from-anime-detail', 'to-vote-result');
      }
    } else {
      // 모든 관련 플래그 정리
      clearStorageFlags('vote-result-scroll', 'sidebar-navigation', 'logo-navigation', 'from-anime-detail', 'to-vote-result');
      scrollToTop();
    }
  }, []);
  
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

  // 투표 상태 조회 (통합 API) - 캐시 시간 연장
  const { data: voteStatusData, isLoading: isVoteStatusLoading } = useSWR(
    '/api/v1/vote/anime/status',
    fetcher<ApiResponseAnimeVoteStatusDto>,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30000, // 30초 동안 중복 요청 방지
    }
  );

  // 투표하지 않은 경우에만 후보 목록 조회 - 캐시 시간 연장
  const shouldFetchCandidates = voteStatusData && !voteStatusData.result?.hasVoted;
  
  const { data, error, isLoading } = useSWR<ApiResponseAnimeCandidateListDto>(
    shouldFetchCandidates ? '/api/v1/vote/anime' : null,
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
        medium: anime.medium as 'TVA' | 'MOVIE'
      }));
      
      // 우선순위 기반 프리로딩으로 초기 로딩 시간 단축
      preloadImages(animes);
    }
  }, [data, preloadImages]);


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
    
    // 2단계: 투명해지는 애니메이션 완료 후 페이지 최상단으로 이동
    setTimeout(() => {
      // 여러 방법으로 스크롤을 맨 위로 강제 이동
      scrollToTop();
      
      // 상태 4로 이동 - 스크롤을 맨 위로 이동
    }, 500); // 투명해지는 시간 (0.5초)
    
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
      if (result.result) {
        // 투표 상태 데이터 캐시 업데이트
        await mutate('/api/v1/vote/anime/status');
        
        // 빵빠레 효과 시작 (투표 제출 시에만)
        setShowConfetti(true);
        
        // 투표 결과 화면으로 전환
        setShowVoteResult(true);
      } else {
        alert('투표는 완료되었지만 결과를 불러올 수 없습니다.');
      }
      
      // API 호출 성공 시 바로 TOP으로 이동
      window.scrollTo({ 
        top: 0, 
        behavior: 'auto' 
      });
      
    } catch (error) {
      alert('투표 제출에 실패했습니다. 다시 시도해주세요.');
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

  // 투표 상태 데이터가 로드되면 상태 업데이트
  useEffect(() => {
    if (voteStatusData?.result && voteStatusData.result.hasVoted) {
      setVoteHistory(voteStatusData.result);
      setShowVoteResult(true);
    }
  }, [voteStatusData]);

  // 투표 결과 데이터 로드 후 스크롤 복원
  useEffect(() => {
    if (voteHistory) {
      const savedY = sessionStorage.getItem('vote-result-scroll');
      const isFromAnimeDetail = sessionStorage.getItem('from-anime-detail') === 'true';
      const isToVoteResult = sessionStorage.getItem('to-vote-result') === 'true';

      if (savedY && isFromAnimeDetail && isToVoteResult) {
        const y = parseInt(savedY);
        // 스크롤 복원
        scrollToPosition(y);
        setTimeout(() => {
          scrollToPosition(y);
          // 스크롤 복원 완료 후 플래그 정리
          clearStorageFlags('from-anime-detail', 'to-vote-result');
        }, 50);
      }
    }
  }, [voteHistory]);

  // 전체 애니메이션 리스트 생성 (API 데이터 또는 기본 데이터) - 메모이제이션
  const allAnimeList: Anime[] = useMemo(() => {
    return data?.result?.animeCandidates?.map((anime: AnimeCandidateDto) => ({
      id: anime.animeCandidateId,
      title: anime.titleKor || '제목 없음',
      thumbnailUrl: anime.mainThumbnailUrl || '/imagemainthumbnail@2x.png',
      medium: anime.medium
    })) || [
      // 기본 데이터 (API 데이터가 없을 때)
      {
        id: 1,
        title: "9-nine- Ruler's Crown",
        thumbnailUrl: "/imagemainthumbnail@2x.png",
        medium: "TVA" as const,
      },
      {
        id: 2,
        title: "NEW 팬티 & 스타킹 with 가터벨트",
        thumbnailUrl: "/imagemainthumbnail@2x.png",
        medium: "TVA" as const,
      },
      {
        id: 3,
        title: "그 비스크 돌은 사랑을 한다 Season 2",
        thumbnailUrl: "/imagemainthumbnail@2x.png",
        medium: "TVA" as const,
      },
      {
        id: 4,
        title: "원피스",
        thumbnailUrl: "/imagemainthumbnail@2x.png",
        medium: "MOVIE" as const,
      }
    ];
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

  // 투표하지 않은 사람이지만 후보 목록 로딩 중 - 스켈레톤 UI
  if (isLoading) {
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

  // 투표한 사람인 경우 바로 투표 결과 화면 표시
  if (voteStatusData?.result?.hasVoted) {
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
              </div>
            </div>
          </div>

          {/* 감사 메시지 및 결과 공개 안내 */}
          <div className="w-full bg-[#F1F3F5] rounded-xl p-4 sm:p-6 pb-0 mt-6">
            <div className="flex flex-col items-center gap-2 sm:gap-3">
              <div className="text-center text-black text-xl sm:text-2xl lg:text-3xl font-semibold font-['Pretendard']">소중한 참여 감사합니다!</div>
              <div className="px-4 sm:px-6 py-2 sm:py-2.5 bg-[#F8F9FA] rounded-[12px] relative -mb-5 lg:-mb-11">
                <div className="text-center text-black text-sm sm:text-base font-medium font-['Pretendard']">{getResultAnnouncementMessage()}</div>
              </div>

          </div>
        </div>

          {/* 투표된 아이템 리스트 */}
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">투표한 {categoryText}</h2>
            {voteHistory.animeBallotDtos && voteHistory.animeBallotDtos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full">
                  {voteHistory.animeBallotDtos.map((ballot: VoteHistoryBallotDto) => (
                    <div
                      key={ballot.animeId}
                      className="cursor-pointer hover:opacity-80 transition-opacity duration-200"
                      onClick={() => {
                        // 투표 결과 화면에서 애니메이션 상세 화면으로 갈 때 스크롤 위치 저장
                        const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
                        sessionStorage.setItem('vote-result-scroll', scrollY.toString());
                        sessionStorage.setItem('to-anime-detail', 'true');
                        router.push(`/animes/${ballot.animeId}`);
                      }}
                    >
                      <div style={{ pointerEvents: 'none' }}>
                        <VoteCard
                          thumbnailUrl={ballot.mainThumbnailUrl}
                          title={ballot.titleKor || '제목 없음'}
                          checked={true}
                          onChange={undefined}
                          showError={false}
                          currentVotes={voteHistory.normalCount || 0}
                          maxVotes={10}
                          isBonusMode={(voteHistory.bonusCount || 0) > 0}
                          bonusVotesUsed={voteHistory.bonusCount || 0}
                          isBonusVote={ballot.ballotType === 'BONUS'}
                          onMouseLeave={() => {}}
                          weekDto={data?.result?.weekDto}
                          medium={ballot.medium}
                          disabled={true}
                        />
                      </div>
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


  // 투표 결과 화면 렌더링
  return (
    <main className="w-full" ref={containerRef}>
      {/* 배너 - 전체 너비, 패딩 없음 */}
      <section>
        <VoteBanner 
          weekDto={data?.result?.weekDto} 
          customTitle={`${data?.result?.weekDto?.year || 2025} ${getSeasonFromDate(data?.result?.weekDto?.startDate || '2025-07-13')} ${getCategoryText('ANIME')} 투표`}
        />
      </section>

      {/* 알림 섹션 - 고정 */}
      <section className="w-full max-w-[1240px] mx-auto px-4 pt-6">
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
                    분기 신작 {categoryText}을 투표해주세요!
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
      </section>

      {/* 투표 섹션 - Sticky */}
      <section 
        className="sticky top-[60px] z-50 w-full" 
        data-sticky-section
        style={{ 
          willChange: 'transform',
          position: 'sticky',
          top: '60px',
          zIndex: 50
        }}
      >
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
                    onChange={showGenderSelection ? undefined : (isBonusVote) => handleSelect(anime.id, isBonusVote)}
                    showError={!isBonusMode && errorCards.has(anime.id)}
                    currentVotes={selected.length}
                    maxVotes={10}
                    isBonusMode={isBonusMode}
                    bonusVotesUsed={bonusVotesUsed}
                    isBonusVote={bonusSelected.includes(anime.id)}
                    onMouseLeave={() => handleCardMouseLeave(anime.id)}
                    weekDto={data?.result?.weekDto}
                    medium={anime.medium}
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
