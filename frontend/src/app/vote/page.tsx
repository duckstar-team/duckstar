'use client';

import React, { useState, useEffect } from "react";
import VoteBanner from "@/components/legacy-vote/VoteBanner";
import BigCandidate from "@/components/anime/BigCandidate";
import { getStarCandidates, getUserInfo } from "@/api/client";
import { StarCandidateDto } from "@/types/api";
import { getVotedEpisodes } from "@/lib/voteStorage";
import { useRouter } from "next/navigation";
import { useModal } from "@/components/AppContainer";
import { hasVoteCookieId, getCookie } from "@/lib/cookieUtils";
import { useAuth } from "@/context/AuthContext";

export default function VotePage() {
  const router = useRouter();
  const { openLoginModal } = useModal();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [starCandidates, setStarCandidates] = useState<StarCandidateDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voteInfo, setVoteInfo] = useState<{year: number, quarter: number, week: number, startDate: string, endDate: string} | null>(null);
  const [hasVotedCandidates, setHasVotedCandidates] = useState(false);

  // 로그인 상태 변화 감지 - 로그아웃 시 즉시 투표 이력 화면 표시
  useEffect(() => {
    if (isAuthenticated === false) {
      console.log('로그아웃 감지됨, 투표 이력 확인 중...');
      
      const votedEpisodes = getVotedEpisodes();
      const hasVoteCookie = hasVoteCookieId();
      const currentEpisodeIds = starCandidates.map(candidate => candidate.episodeId);
      
      console.log('로그아웃 후 투표 조건 확인:', {
        isAuthenticated,
        hasVoteCookie,
        votedEpisodes,
        currentEpisodeIds,
        hasVotedEpisodes: votedEpisodes.length > 0,
        hasCurrentEpisodes: currentEpisodeIds.length > 0
      });
      
      // 로그아웃 상태에서 투표 이력이 현재 에피소드와 겹치는 경우
      const hasVoted = !hasVoteCookie && votedEpisodes.some(episodeId => 
        currentEpisodeIds.includes(episodeId)
      );
      
      console.log('로그아웃 후 최종 hasVoted:', hasVoted);
      setHasVotedCandidates(hasVoted);
    }
  }, [isAuthenticated, starCandidates]);

  useEffect(() => {
    const fetchStarCandidates = async () => {
      try {
        setLoading(true);
        
        // 로그인 상태 확인이 완료될 때까지 대기
        if (isLoading) {
          console.log('AuthContext 로딩 중...');
          return;
        }
        
        // AuthContext가 제대로 작동하지 않는 경우를 위한 백업 확인
        let actualLoginStatus = isAuthenticated;
        if (!isAuthenticated && !isLoading) {
          try {
            await getUserInfo();
            actualLoginStatus = true;
            console.log('직접 API 호출로 로그인 상태 확인됨');
          } catch (error) {
            actualLoginStatus = false;
            console.log('직접 API 호출로 로그아웃 상태 확인됨');
          }
        }
        
        // 새로운 별점 투표 API 사용
        const response = await getStarCandidates();
        
        if (!response.isSuccess) {
          throw new Error(response.message);
        }

        console.log('별점 투표 후보자 API 응답:', response);
        
        // 투표 정보 저장 (API에서 weekDto 사용)
        if (response.result && response.result.weekDto) {
          setVoteInfo({
            year: response.result.weekDto.year,
            quarter: response.result.weekDto.quarter,
            week: response.result.weekDto.week,
            startDate: response.result.weekDto.startDate,
            endDate: response.result.weekDto.endDate
          });
        }

        setStarCandidates(response.result?.starCandidates || []);
        
        // vote_cookie_id가 없으면서 투표한 episodeId가 현재 투표 오픈한 에피소드에 포함되어 있는지 확인
        const votedEpisodes = getVotedEpisodes();
        const hasVoteCookie = hasVoteCookieId();
        const currentEpisodeIds = response.result?.starCandidates?.map((candidate: StarCandidateDto) => candidate.episodeId) || [];
        
        // 디버깅 로그
        console.log('투표 조건 확인:', {
          isAuthenticated,
          actualLoginStatus,
          isLoading,
          user,
          hasVoteCookie,
          votedEpisodes,
          currentEpisodeIds,
          hasVotedEpisodes: votedEpisodes.length > 0,
          hasCurrentEpisodes: currentEpisodeIds.length > 0
        });
        
        // 겹치는 에피소드 확인
        const overlappingEpisodes = votedEpisodes.filter(episodeId => 
          currentEpisodeIds.includes(episodeId)
        );
        console.log('겹치는 에피소드:', overlappingEpisodes);
        
        // localStorage 직접 확인
        console.log('localStorage duckstar_voted_episodes:', localStorage.getItem('duckstar_voted_episodes'));
        console.log('localStorage duckstar_voted_episodes_ttl:', localStorage.getItem('duckstar_voted_episodes_ttl'));
        
        // 로그인하지 않았고, 투표한 episodeId 중에 현재 투표 오픈한 에피소드가 포함되어 있는 경우
        const hasVoted = !actualLoginStatus && !hasVoteCookie && votedEpisodes.some(episodeId => 
          currentEpisodeIds.includes(episodeId)
        );
        
        console.log('최종 hasVoted:', hasVoted);
        setHasVotedCandidates(hasVoted);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : '별점 투표 후보자를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchStarCandidates();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="w-full max-w-[1240px] mx-auto px-4 py-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-600 mt-2">투표 후보자를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="w-full max-w-[1240px] mx-auto px-4 py-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 이미 투표한 후보가 있는 경우 투표 이력 화면 표시
  if (hasVotedCandidates) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* 배너 섹션 */}
        <section className="w-full">
          <VoteBanner 
            weekDto={voteInfo ? {
              voteStatus: 'OPEN' as const,
              year: voteInfo.year,
              quarter: voteInfo.quarter,
              week: voteInfo.week,
              weekNumber: voteInfo.week,
              startDate: voteInfo.startDate,
              endDate: voteInfo.endDate
            } : undefined}
          />
        </section>

        {/* 메인 컨텐츠 */}
        <div className="w-full max-w-[1240px] mx-auto px-4 py-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <div className="text-2xl mb-2">😎</div>
              <h2 className="text-xl font-semibold mb-2">기존 투표 이력이 확인되었습니다</h2>
              <p className="text-gray-600 mb-6">다음 주차 투표는 월요일 18:00에 시작됩니다.</p>
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 배너 섹션 */}
      <section className="w-full">
        <VoteBanner 
          weekDto={voteInfo ? {
            voteStatus: 'OPEN' as const,
            year: voteInfo.year,
            quarter: voteInfo.quarter,
            week: voteInfo.week,
            weekNumber: voteInfo.week,
            startDate: voteInfo.startDate,
            endDate: voteInfo.endDate
          } : undefined}
        />
      </section>

      {/* 메인 컨텐츠 영역 */}
      <div className="w-full max-w-[1240px] mx-auto px-4 p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 pt-6 pb-2 mb-8">
          <div className="mb-6 flex flex-col items-center">
            {/* 기존 툴팁 컴포넌트 재사용 */}
            <div className="bg-[#f1f2f3] flex h-8 sm:h-9 items-center justify-start pl-1 pr-2 sm:pl-2 sm:pr-3 lg:pr-5 py-0 rounded-lg w-fit max-w-full mb-4">
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
                  마음에 든 애니메이션을 투표해주세요!
                </p>
              </div>
            </div>
            
            <div className="text-gray-700 text-center">
              <p className="mb-2">모든 후보는 방영 이후 36시간 이내에 투표할 수 있어요.</p>
              <p className="text-sm text-gray-500">*덕스타 투표 시 중복 방지를 위해 쿠키와 암호화된 IP 정보가 사용됩니다.</p>
            </div>
          </div>
        </div>

        {/* 별점 투표 후보자 섹션 */}
        {starCandidates.length > 0 && (
          <div className="mb-8">
            <div className={`${starCandidates.length <= 3 ? 'flex flex-wrap justify-center items-center gap-[40px]' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[40px] justify-items-center'}`}>
              {starCandidates.map((candidate) => (
                <BigCandidate
                  key={candidate.episodeId}
                  anime={{
                    animeId: candidate.episodeId, // 임시로 episodeId 사용
                    episodeId: candidate.episodeId,
                    mainThumbnailUrl: candidate.mainThumbnailUrl,
                    status: candidate.status,
                    isBreak: candidate.isBreak,
                    titleKor: candidate.titleKor,
                    dayOfWeek: candidate.dayOfWeek,
                    scheduledAt: candidate.scheduledAt,
                    isRescheduled: candidate.isRescheduled,
                    airTime: candidate.airTime,
                    genre: candidate.genre,
                    medium: candidate.medium,
                    ottDtos: []
                  }}
                  isCurrentSeason={true}
                  voteInfo={{
                    year: candidate.year,
                    quarter: candidate.quarter,
                    week: candidate.week
                  }}
                  starInfo={candidate.info}
                />
              ))}
            </div>
          </div>
        )}

        {/* 투표 가능한 애니메이션이 없는 경우 */}
        {starCandidates.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <p className="text-gray-600">현재 투표 가능한 애니메이션이 없습니다.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}