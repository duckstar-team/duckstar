'use client';

import React, { useState } from "react";
import VoteCard from "@/components/vote/VoteCard";
import VoteBanner from "@/components/vote/VoteBanner";
import VoteSection from "@/components/vote/VoteSection";
import { ApiResponseAnimeCandidateListDto, AnimeCandidateDto } from '@/types/api';
import useSWR from 'swr';

// SWR fetcher 함수
const fetcher = (url: string) => fetch(url).then(res => res.json());

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

  // 전체 선택된 카드 목록 (일반 + 보너스)
  const allSelected = [...selected, ...bonusSelected];
  
  // 보너스 투표 사용량
  const bonusVotesUsed = bonusSelected.length;

  // 로딩 상태 처리
  if (isLoading) {
    return <div className="text-center">로딩 중...</div>;
  }

  // 에러 상태 처리
  if (error) {
    return <div className="text-center text-red-500">데이터를 불러오는 중 오류가 발생했습니다.</div>;
  }

  // 애니메이션 리스트 생성 (API 데이터 또는 테스트 데이터)
  const animeList: Anime[] = data?.result?.animeCandidates?.map((anime: AnimeCandidateDto) => ({
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

  // 전체 후보자 수
  const totalCandidates = data?.result?.candidatesCount || animeList.length;

  return (
    <main className="w-full">
      {/* 배너 - 전체 너비, 패딩 없음 */}
      <section>
        <VoteBanner weekDto={data?.result?.weekDto} />
      </section>

      {/* 알림 섹션 - 고정 */}
      <section className="w-full max-w-[1240px] mx-auto px-4 pt-6">
        <div className="bg-white rounded-t-[8px] shadow-sm border border-gray-200 border-b-0">
          <div className="flex flex-col gap-2.5 pb-[15px] pl-6 pr-6 pt-3">
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
                  분기 신작 애니메이션을 투표해주세요!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 투표 섹션 - Sticky */}
      <section className="sticky top-[60px] z-40 w-full">
        <div className="w-full max-w-[1240px] mx-auto px-4">
          <div className="bg-white rounded-b-[8px] shadow-sm border border-gray-200 border-t-0">
            {/* Separator */}
            <div className="max-w-[1240px] mx-auto h-0 w-full">
              <div className="w-full h-px bg-[#e9ecef]" />
            </div>
            
            {/* 투표 섹션 */}
            <div className="p-6">
              <VoteSection
                currentVotes={selected.length}
                maxVotes={10}
                bonusVotesUsed={bonusVotesUsed}
                hasClickedBonus={hasClickedBonus}
                external={true}
                onBonusClick={handleBonusClick}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
            {animeList.map((anime) => (
              <VoteCard
                key={anime.id}
                thumbnailUrl={anime.thumbnailUrl}
                title={anime.title}
                checked={selected.includes(anime.id) || bonusSelected.includes(anime.id)}
                onChange={(isBonusVote) => handleSelect(anime.id, isBonusVote)}
                showError={!isBonusMode && errorCards.has(anime.id)}
                currentVotes={selected.length}
                maxVotes={10}
                isBonusMode={isBonusMode}
                bonusVotesUsed={bonusVotesUsed}
                isBonusVote={bonusSelected.includes(anime.id)}
                onMouseLeave={() => handleCardMouseLeave(anime.id)}
                weekDto={data?.result?.weekDto}
                medium={anime.medium}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
