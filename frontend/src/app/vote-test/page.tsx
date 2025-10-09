'use client';

import React, { useState, useEffect } from "react";
import BigCandidate from "@/components/anime/BigCandidate";
import VoteBanner from "@/components/legacy-vote/VoteBanner";
import { AnimePreviewDto } from "@/components/search/types";

export default function VoteTestPage() {
  const [thisWeekAnimes, setThisWeekAnimes] = useState<AnimePreviewDto[]>([]);
  const [lastWeekAnimes, setLastWeekAnimes] = useState<AnimePreviewDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voteInfo, setVoteInfo] = useState<{year: number, quarter: number, week: number} | null>(null);

  useEffect(() => {
    const simulateCoexistenceScenario = () => {
      try {
        setLoading(true);
        
        // 투표 정보 설정 (예시)
        setVoteInfo({
          year: 2024,
          quarter: 3,
          week: 11
        });

        // 현재 시간 시뮬레이션 (10월 6일 월요일 오후 8시)
        const now = new Date('2025-10-06T20:00:00.000Z'); // 월요일 오후 8시
        const monday6PM = new Date('2025-10-06T18:00:00.000Z'); // 월요일 오후 6시

        // 10월 6일 오후 8시 기준 테스트 데이터 - 10/5 22:00, 10/6 01:30, 10/6 20:00 애니메이션
        const mockAnimes: AnimePreviewDto[] = [
          // 10/5 22:00 애니메이션 (지난 주차)
          {
            animeId: 1,
            mainThumbnailUrl: "https://via.placeholder.com/300x400/45B7D1/FFFFFF?text=10/5+22:00",
            status: "NOW_SHOWING" as const,
            isBreak: false,
            titleKor: "10월 5일 22:00 애니메이션",
            dayOfWeek: "SUN" as const,
            scheduledAt: "2025-10-05T22:00:00.000Z", // 일요일 22:00
            isRescheduled: false,
            airTime: "22:00",
            genre: "판타지",
            medium: "TVA" as const,
            ottDtos: []
          },
          // 10/6 01:30 애니메이션 (지난 주차)
          {
            animeId: 2,
            mainThumbnailUrl: "https://via.placeholder.com/300x400/96CEB4/FFFFFF?text=10/6+01:30",
            status: "NOW_SHOWING" as const,
            isBreak: false,
            titleKor: "10월 6일 01:30 애니메이션",
            dayOfWeek: "MON" as const,
            scheduledAt: "2025-10-06T01:30:00.000Z", // 월요일 01:30
            isRescheduled: false,
            airTime: "01:30",
            genre: "코미디",
            medium: "TVA" as const,
            ottDtos: []
          },
          // 10/6 20:00 애니메이션 (이번 주차)
          {
            animeId: 3,
            mainThumbnailUrl: "https://via.placeholder.com/300x400/FF6B6B/FFFFFF?text=10/6+20:00",
            status: "NOW_SHOWING" as const,
            isBreak: false,
            titleKor: "10월 6일 20:00 애니메이션",
            dayOfWeek: "MON" as const,
            scheduledAt: "2025-10-06T20:00:00.000Z", // 월요일 20:00 (월요일 6시 이후)
            isRescheduled: false,
            airTime: "20:00",
            genre: "액션",
            medium: "TVA" as const,
            ottDtos: []
          }
        ];

        // 실제 필터링 로직 적용
        const thisWeekAnimes = mockAnimes.filter((anime) => {
          if (!anime.scheduledAt) return false;
          
          const scheduledTime = new Date(anime.scheduledAt);
          const timeDiff = now.getTime() - scheduledTime.getTime();
          const hoursDiff = timeDiff / (1000 * 60 * 60);
          
          // 월요일 오후 6시 이후에 방영했고, 36시간 이내
          const isAfterMonday6PM = scheduledTime >= monday6PM;
          const isWithin36Hours = hoursDiff >= 0 && hoursDiff <= 36;
          
          console.log(`이번주차 체크 - ${anime.titleKor}:`, {
            scheduledTime: scheduledTime.toISOString(),
            monday6PM: monday6PM.toISOString(),
            isAfterMonday6PM,
            hoursDiff: hoursDiff.toFixed(1),
            isWithin36Hours,
            result: isAfterMonday6PM && isWithin36Hours
          });
          
          return isAfterMonday6PM && isWithin36Hours;
        });
        
        const lastWeekAnimes = mockAnimes.filter((anime) => {
          if (!anime.scheduledAt) return false;
          
          const scheduledTime = new Date(anime.scheduledAt);
          const timeDiff = now.getTime() - scheduledTime.getTime();
          const hoursDiff = timeDiff / (1000 * 60 * 60);
          
          // 월요일 오후 6시 이전에 방영했지만 아직 36시간 안 지남
          const isBeforeMonday6PM = scheduledTime < monday6PM;
          const isWithin36Hours = hoursDiff >= 0 && hoursDiff <= 36;
          
          console.log(`지난주차 체크 - ${anime.titleKor}:`, {
            scheduledTime: scheduledTime.toISOString(),
            monday6PM: monday6PM.toISOString(),
            isBeforeMonday6PM,
            hoursDiff: hoursDiff.toFixed(1),
            isWithin36Hours,
            result: isBeforeMonday6PM && isWithin36Hours
          });
          
          return isBeforeMonday6PM && isWithin36Hours;
        });
        
        console.log('=== 디버깅 정보 ===');
        console.log('현재 시간:', now.toISOString());
        console.log('월요일 오후 6시 기준:', monday6PM.toISOString());
        console.log('이번 주차 애니메이션:', thisWeekAnimes.length, '개');
        console.log('지난 주차 애니메이션:', lastWeekAnimes.length, '개');
        
        // 각 애니메이션의 상세 정보 출력
        mockAnimes.forEach((anime, index) => {
          const scheduledTime = new Date(anime.scheduledAt);
          const timeDiff = now.getTime() - scheduledTime.getTime();
          const hoursDiff = timeDiff / (1000 * 60 * 60);
          const isAfterMonday6PM = scheduledTime >= monday6PM;
          const isBeforeMonday6PM = scheduledTime < monday6PM;
          const isWithin36Hours = hoursDiff >= 0 && hoursDiff <= 36;
          
          console.log(`애니메이션 ${index + 1} (${anime.titleKor}):`, {
            방영시간: scheduledTime.toISOString(),
            현재시간: now.toISOString(),
            경과시간: `${hoursDiff.toFixed(1)}시간`,
            월요일6시이후: isAfterMonday6PM,
            월요일6시이전: isBeforeMonday6PM,
            '36시간이내': isWithin36Hours,
            '이번주차조건': isAfterMonday6PM && isWithin36Hours,
            '지난주차조건': isBeforeMonday6PM && isWithin36Hours
          });
        });
        
        setThisWeekAnimes(thisWeekAnimes);
        setLastWeekAnimes(lastWeekAnimes);
      } catch (err) {
        setError(err instanceof Error ? err.message : '테스트 데이터 생성에 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    simulateCoexistenceScenario();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="w-full max-w-[1240px] mx-auto px-4 py-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-600 mt-2">테스트 데이터를 생성하는 중...</p>
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
            startDate: '',
            endDate: ''
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

        {/* 이번 주차 섹션 */}
        {thisWeekAnimes.length > 0 && (
          <div className="mb-8">
            <div className={`${thisWeekAnimes.length <= 3 ? 'flex flex-wrap justify-center items-center gap-[40px]' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[40px] justify-items-center'}`}>
              {thisWeekAnimes.map((anime) => (
                <BigCandidate
                  key={anime.animeId}
                  anime={anime}
                  isCurrentSeason={true}
                  voteInfo={voteInfo}
                />
              ))}
            </div>
          </div>
        )}

        {/* 지난 주차 섹션 */}
        {lastWeekAnimes.length > 0 && (
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-[50px] mt-[50px]">
              <h3 className="text-xl font-bold text-gray-900 text-center">지난 주차</h3>
            </div>
            <div className={`${lastWeekAnimes.length <= 3 ? 'flex flex-wrap justify-center items-center gap-[40px]' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[40px] justify-items-center'}`}>
              {lastWeekAnimes.map((anime) => (
                <BigCandidate
                  key={anime.animeId}
                  anime={anime}
                  isCurrentSeason={true}
                  voteInfo={voteInfo}
                />
              ))}
            </div>
          </div>
        )}

        {/* 투표 가능한 애니메이션이 없는 경우 */}
        {thisWeekAnimes.length === 0 && lastWeekAnimes.length === 0 && (
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
