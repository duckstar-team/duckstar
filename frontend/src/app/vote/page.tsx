'use client';

import React, { useState, useEffect } from "react";
import VoteCard from "@/components/vote/VoteCard";
import VoteBanner from "@/components/vote/VoteBanner";
import VoteSection from "@/components/vote/VoteSection";
import VoteStamp from "@/components/vote/VoteStamp";
import { ApiResponseAnimeCandidateListDto, AnimeCandidateDto } from '@/types/api';
import useSWR from 'swr';
import { getSeasonFromDate } from '@/lib/utils';

// SWR fetcher 함수 (쿠키 포함)
const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then(res => res.json());

interface Anime {
  id: number;
  title: string;
  thumbnailUrl: string;
  medium: "TVA" | "MOVIE";
}

export default function VotePage() {
  const [selected, setSelected] = useState<number[]>([]);
  const [bonusSelected, setBonusSelected] = useState<number[]>([]);
  const [errorCards, setErrorCards] = useState<Set<number>>(new Set());
  const [isBonusMode, setIsBonusMode] = useState(false);
  const [hasClickedBonus, setHasClickedBonus] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showGenderSelection, setShowGenderSelection] = useState(false);
  const [selectedGender, setSelectedGender] = useState<'male' | 'female' | null>(null);
  const [showVoteResult, setShowVoteResult] = useState(false);
  const [voteHistory, setVoteHistory] = useState<any>(null);
  const [showNextError, setShowNextError] = useState(false);

  // 투표 참여 여부 확인
  const { data: voteCheckData } = useSWR(
    '/api/v1/vote/anime/check-voted',
    fetcher
  );

  // API에서 투표 후보 목록을 가져오기
  const { data, error, isLoading } = useSWR<ApiResponseAnimeCandidateListDto>(
    '/api/v1/vote/anime',
    fetcher
  );

  const handleSelect = (animeId: number, isBonusVote?: boolean) => {
    if (isBonusMode) {
      // 보너스 모드에서는 일반 투표와 보너스 투표를 구분
      if (selected.includes(animeId)) {
        // 일반 투표 해제
        setSelected(prev => prev.filter(id => id !== animeId));
        setErrorCards(prevErrors => {
          const newErrors = new Set(prevErrors);
          newErrors.delete(animeId);
          return newErrors;
        });
      } else if (bonusSelected.includes(animeId)) {
        // 보너스 투표 해제
        setBonusSelected(prev => prev.filter(id => id !== animeId));
        setErrorCards(prevErrors => {
          const newErrors = new Set(prevErrors);
          newErrors.delete(animeId);
          return newErrors;
        });
      } else {
        // 새로운 투표 추가
        if (isBonusVote) {
          // 보너스 투표 추가 (무제한)
          setBonusSelected(prev => [...prev, animeId]);
          setErrorCards(prevErrors => {
            const newErrors = new Set(prevErrors);
            newErrors.delete(animeId);
            return newErrors;
          });
        } else if (selected.length < 10) {
          // 일반 투표 추가
          setSelected(prev => [...prev, animeId]);
          setErrorCards(prevErrors => {
            const newErrors = new Set(prevErrors);
            newErrors.delete(animeId);
            return newErrors;
          });
        } else {
          // 일반 투표가 10개에 도달했는데 일반 투표 시도
          setErrorCards(prevErrors => {
            const newErrors = new Set(prevErrors);
            newErrors.add(animeId);
            return newErrors;
          });
        }
      }
    } else {
      // 일반 모드 (기존 로직)
      setSelected(prev => {
        if (prev.includes(animeId)) {
          // 선택 해제
          setErrorCards(prevErrors => {
            const newErrors = new Set(prevErrors);
            newErrors.delete(animeId);
            return newErrors;
          });
          return prev.filter(id => id !== animeId);
        } else if (prev.length < 10) {
          // 일반 투표 (10개 미만)
          setErrorCards(prevErrors => {
            const newErrors = new Set(prevErrors);
            newErrors.delete(animeId);
            return newErrors;
          });
          return [...prev, animeId];
        } else {
          // 10표 초과 시도
          setErrorCards(prevErrors => {
            const newErrors = new Set(prevErrors);
            newErrors.add(animeId);
            return newErrors;
          });
          
          return prev; // 선택 상태 변경하지 않음
        }
      });
    }
  };

  const handleCardMouseLeave = (animeId: number) => {
    // 1초 후에 해당 카드의 에러 메시지 숨기기
    setTimeout(() => {
      setErrorCards(prevErrors => {
        const newErrors = new Set(prevErrors);
        newErrors.delete(animeId);
        return newErrors;
      });
    }, 1000);
  };

  const handleBonusClick = () => {
    setIsBonusMode(true);
    setHasClickedBonus(true);
  };

  const handleNextClick = () => {
    // 일반 투표 수가 0표이면 에러 메시지 표시
    if (selected.length === 0) {
      setShowNextError(true);
      // 1초 후 에러 메시지 숨기기
      setTimeout(() => {
        setShowNextError(false);
      }, 1000);
      return;
    }
    setShowGenderSelection(true);
  };

  const handleBackClick = () => {
    setShowGenderSelection(false);
  };

  const handleGenderSelect = (gender: 'male' | 'female') => {
    setSelectedGender(gender);
  };

  const handleSubmitClick = async () => {
    if (!selectedGender) {
      console.log('성별을 선택해주세요!');
      return;
    }

    try {
      // 투표 데이터를 ballotDtos 형태로 변환
      const ballotDtos = [
        ...selected.map(id => ({ animeCandidateId: id, ballotType: "NORMAL" as const })),
        ...bonusSelected.map(id => ({ animeCandidateId: id, ballotType: "BONUS" as const }))
      ];

      // POST API 호출 (쿠키 포함)
      const requestBody = {
        weekId: data?.result?.weekId,
        gender: selectedGender === 'male' ? 'MALE' : 'FEMALE',
        ballotDtos: ballotDtos
      };
      
      console.log('투표 제출 요청 데이터:', requestBody);
      
      const response = await fetch('/api/v1/vote/anime', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // 쿠키 포함
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API 응답 에러:', response.status, errorText);
        throw new Error(`투표 제출에 실패했습니다. (${response.status}: ${errorText})`);
      }

      const result = await response.json();
      console.log('투표 제출 완료:', result);
      
      // 성공 시 투표 내역 조회 API 호출 (VoteReceiptDto와 AnimeVoteHistoryDto는 다른 구조)
      if (result.result) {
        // 투표 완료 후 투표 체크 데이터 업데이트
        if (voteCheckData && voteCheckData.result) {
          voteCheckData.result.hasVoted = true;
          voteCheckData.result.submissionId = result.result.submissionId;
        }
        
        // 투표 내역 조회 API 호출 (AnimeVoteHistoryDto 구조)
        try {
          const historyResponse = await fetch(`/api/v1/vote/anime/history/${result.result.submissionId}`, {
            credentials: 'include'
          });
          
          if (historyResponse.ok) {
            const historyResult = await historyResponse.json();
            if (historyResult.result) {
              // AnimeVoteHistoryDto 구조로 결과 화면 업데이트
              setVoteHistory(historyResult.result);
              setShowVoteResult(true);
            } else {
              console.error('투표 내역 데이터가 올바르지 않습니다:', historyResult);
              alert('투표는 완료되었지만 내역을 불러올 수 없습니다.');
            }
          } else {
            console.error('투표 내역 조회 실패:', historyResponse.status);
            alert('투표는 완료되었지만 내역을 불러올 수 없습니다.');
          }
        } catch (error) {
          console.error('투표 내역 조회 실패:', error);
          alert('투표는 완료되었지만 내역을 불러올 수 없습니다.');
        }
      } else {
        console.error('투표 결과 데이터가 올바르지 않습니다:', result);
        alert('투표는 완료되었지만 결과를 불러올 수 없습니다.');
      }
      
    } catch (error) {
      console.error('투표 제출 오류:', error);
      alert('투표 제출에 실패했습니다. 다시 시도해주세요.');
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

  // 투표 참여 여부 확인 및 투표 내역 가져오기
  useEffect(() => {
    if (voteCheckData?.result?.hasVoted && voteCheckData?.result?.submissionId) {
      // 이미 투표한 경우, 투표 내역 가져오기
      fetch(`/api/v1/vote/anime/history/${voteCheckData.result.submissionId}`, {
        credentials: 'include'
      })
        .then(res => {
          // 401 오류는 인증 실패이므로 조용히 처리하고 투표 화면을 계속 표시
          if (res.status === 401) {
            console.log('인증되지 않은 사용자입니다. 투표 화면을 계속 표시합니다.');
            return null;
          }
          
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          
          // 응답이 비어있는지 확인
          const contentType = res.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            throw new Error('응답이 JSON 형식이 아닙니다');
          }
          return res.text().then(text => {
            if (!text) {
              throw new Error('빈 응답입니다');
            }
            try {
              return JSON.parse(text);
            } catch (e) {
              throw new Error('JSON 파싱 실패: ' + text);
            }
          });
        })
        .then(data => {
          if (data && data.result) {
            setVoteHistory(data.result);
            setShowVoteResult(true);
          } else if (data === null) {
            // 401 오류로 인해 null이 반환된 경우 - 정상적인 상황
            console.log('인증되지 않은 사용자입니다. 투표 화면을 계속 표시합니다.');
          } else {
            console.error('투표 내역 데이터가 올바르지 않습니다:', data);
          }
        })
        .catch(err => {
          console.error('투표 내역 조회 실패:', err);
          // 에러가 발생해도 투표 화면은 계속 표시
        });
    }
  }, [voteCheckData]);

  // 로딩 상태 처리
  if (isLoading) {
    return <div className="text-center">로딩 중...</div>;
  }

  // 에러 상태 처리
  if (error) {
    return <div className="text-center text-red-500">데이터를 불러오는 중 오류가 발생했습니다.</div>;
  }

  // 전체 애니메이션 리스트 생성 (API 데이터 또는 테스트 데이터)
  const allAnimeList: Anime[] = data?.result?.animeCandidates?.map((anime: AnimeCandidateDto) => ({
    id: anime.animeCandidateId,
    title: anime.titleKor || '제목 없음',
    thumbnailUrl: anime.mainThumbnailUrl || '/imagemainthumbnail@2x.png',
    medium: anime.medium
  })) || [
    // 테스트 데이터 (API 데이터가 없을 때)
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

  // 검색어에 따라 애니메이션 리스트 필터링
  const filteredAnimeList: Anime[] = searchQuery.trim() === '' 
    ? allAnimeList 
    : allAnimeList.filter(anime => 
        anime.title.toLowerCase().includes(searchQuery.toLowerCase())
      );

  // 상태 4에서 투표된 아이템만 필터링하고 정렬
  const animeList: Anime[] = showGenderSelection 
    ? filteredAnimeList
        .filter(anime => selected.includes(anime.id) || bonusSelected.includes(anime.id))
        .sort((a, b) => {
          const aIsNormal = selected.includes(a.id);
          const bIsNormal = selected.includes(b.id);
          
          // 일반 투표된 아이템을 먼저, 보너스 투표된 아이템을 나중에
          if (aIsNormal && !bIsNormal) return -1;
          if (!aIsNormal && bIsNormal) return 1;
          return 0;
        })
    : filteredAnimeList;

  // 전체 후보자 수
  const totalCandidates = data?.result?.candidatesCount || animeList.length;

  // 투표 결과 화면 렌더링
  if (showVoteResult && voteHistory) {
    return (
      <main className="w-full">
        {/* 배너 - 전체 너비, 패딩 없음 */}
        <section>
          <VoteBanner 
            customTitle={`이번 주 ${categoryText} 투표 기록`}
            weekDto={voteHistory?.weekDto || data?.result?.weekDto} 
          />
        </section>

        {/* 메인 컨텐츠 */}
        <div className="w-full max-w-[1240px] mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* 투표 결과 섹션 */}
            <div className="p-6">
              <div className="bg-[#ffffff] box-border content-stretch flex flex-col lg:flex-row gap-4 lg:gap-[55px] items-center justify-center px-4 lg:px-0 h-16 relative w-full">
                
                <div className="content-stretch flex flex-col lg:flex-row gap-4 lg:gap-[60px] items-center justify-center lg:justify-end relative shrink-0">
                  {/* Normal Vote Result */}
                  <VoteStamp
                    type="normal"
                    isActive={true}
                    currentVotes={voteHistory.normalCount || 0}
                    maxVotes={10}
                    showResult={true}
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
                <div className="bg-[#f8f9fa] box-border content-stretch flex gap-2.5 items-center justify-center lg:justify-end px-5 py-[5px] relative rounded-lg shrink-0">
                  <div className="flex flex-col font-['Pretendard:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#000000] text-base lg:text-[20px] text-nowrap text-center lg:text-right">
                    <p className="leading-[normal] whitespace-pre">제출 시각: {new Date(voteHistory.submittedAt).toLocaleString('ko-KR')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 감사 메시지 및 결과 공개 안내 */}
          <div className="w-full bg-[#F1F3F5] rounded-xl p-6 pb-0 mt-6">
            <div className="flex flex-col items-center gap-3">
              <div className="text-center text-black text-3xl font-semibold font-['Pretendard']">소중한 참여 감사합니다!</div>
              <div className="px-6 py-2.5 bg-[#F8F9FA] rounded-[12px] relative -mb-5">
                <div className="text-center text-black text-base font-medium font-['Pretendard']">{getResultAnnouncementMessage()}</div>
              </div>
            </div>
          </div>
          
          {/* 투표된 아이템 리스트 */}
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4">투표한 {categoryText}</h2>
            {(() => {
              console.log('투표 결과 데이터:', voteHistory);
              return voteHistory.animeBallotDtos && voteHistory.animeBallotDtos.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
                  {voteHistory.animeBallotDtos.map((ballot: any) => (
                    <VoteCard
                      key={ballot.animeId}
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
                  ))}
                </div>
              ) : (
                              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">투표한 {categoryText}이 없습니다.</p>
              </div>
              );
            })()}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full">
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
          <div className="flex flex-col gap-2.5 pb-[9px] pl-6 pr-6 pt-3">
            {!showGenderSelection ? (
              <div className="bg-[#f1f2f3] flex h-9 items-center justify-start pl-2 pr-5 py-0 rounded-lg w-fit">
                <div className="flex gap-2.5 items-center justify-start px-2.5 py-0">
                  <div className="relative size-4 overflow-hidden">
                    <img
                      src="/icons/voteSection-notify-icon.svg"
                      alt="Notification Icon"
                      className="w-full h-full"
                    />
                  </div>
                </div>
                <div className="flex flex-col font-['Pretendard',_sans-serif] font-semibold justify-center text-[#23272b] text-base">
                  <p className="leading-normal whitespace-pre">
                    분기 신작 {categoryText}을 투표해주세요!
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-[#f1f2f3] flex h-9 items-center justify-start pl-2 pr-5 py-0 rounded-lg w-fit ml-auto">
                <div className="flex gap-2.5 items-center justify-start px-2.5 py-0">
                  <div className="relative size-4 overflow-hidden">
                    <img
                      src="/icons/voteSection-notify-icon.svg"
                      alt="Notification Icon"
                      className="w-full h-full"
                    />
                  </div>
                </div>
                <div className="flex flex-col font-['Pretendard',_sans-serif] font-semibold justify-center text-[#23272b] text-base">
                  <p className="leading-normal whitespace-pre">
                    성별은 투표 성향 통계에 꼭 필요한 정보예요.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 투표 섹션 - Sticky */}
      <section className="sticky top-[60px] z-40 w-full">
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
                &quot;{searchQuery}&quot; 검색 결과: <span className="font-semibold">{animeList.length}</span>개
              </p>
            </div>
          )}
          
          {animeList.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                {searchQuery.trim() !== '' 
                  ? `&quot;${searchQuery}&quot;에 대한 검색 결과가 없습니다.`
                  : "표시할 애니메이션이 없습니다."
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
              {animeList.map((anime) => (
                <VoteCard
                  key={anime.id}
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
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
