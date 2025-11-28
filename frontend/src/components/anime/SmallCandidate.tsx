'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StarCandidateDto, StarInfoDto } from '@/types/api';
// import { formatTimeRemaining } from '@/lib/timeUtils';
import { useAuth } from '@/context/AuthContext';
import { useModal } from '@/components/AppContainer';
import StarRatingSimple from '@/components/StarRatingSimple';
import StarDistributionChart from '@/components/chart/StarDistributionChart';
import { submitStarVote, withdrawStar } from '@/api/client';
import { addVotedEpisode } from '@/lib/voteStorage';

import { AnimePreviewDto } from '@/types/api';

interface SmallCandidateProps {
  anime: AnimePreviewDto;
  isCurrentSeason: boolean;
  voteInfo: {
    year: number;
    quarter: number;
    week: number;
  };
  starInfo?: StarInfoDto;
  voterCount?: number; // 투표자 수
  onVoteComplete?: (episodeId: number, voteTimeLeft: number) => void;
}

// 영어 요일을 한글로 변환하는 함수
const getKoreanDayOfWeek = (dayOfWeek: string): string => {
  const dayMap: { [key: string]: string } = {
    'MON': '월',
    'TUE': '화',
    'WED': '수',
    'THU': '목',
    'FRI': '금',
    'SAT': '토',
    'SUN': '일'
  };
  return dayMap[dayOfWeek] || dayOfWeek;
};

// 방영 시간 포맷팅 (BigCandidate와 동일한 로직)
const formatAirTime = (anime: AnimePreviewDto) => {
  const { scheduledAt, airTime, dayOfWeek, status, medium } = anime;
  
  // 극장판의 경우 airTime 필드 사용 (8/17 형식)
  if (medium === 'MOVIE' && airTime) {
    return `${airTime} 개봉`;
  }
  
  // 극장판이지만 airTime이 없는 경우 scheduledAt 사용
  if (medium === 'MOVIE' && scheduledAt) {
    const date = new Date(scheduledAt);
    const month = date.getMonth() + 1; // 0부터 시작하므로 +1
    const day = date.getDate();
    return `${month}/${day} 개봉`;
  }
  
  // airTime이 있는 경우 우선 사용 (검색 결과 포함)
  if (airTime) {
    // airTime에 이미 요일이 포함되어 있으면 그대로 사용
    if (airTime.includes('요일') || airTime.includes('일') || airTime.includes('월') || airTime.includes('화') || airTime.includes('수') || airTime.includes('목') || airTime.includes('금') || airTime.includes('토')) {
      return airTime;
    }
    // 요일이 없으면 요일 추가
    return `${getKoreanDayOfWeek(dayOfWeek || '')} ${airTime}`;
  }
  
  // airTime이 없는 경우 scheduledAt 사용
  if (scheduledAt) {
    const date = new Date(scheduledAt);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${getKoreanDayOfWeek(dayOfWeek || '')} ${hours}:${minutes}`;
  }
  
  // 종영 애니메이션의 경우 "(종영)" 표시
  if (status === 'ENDED') {
    return '· 종영';
  }
  
  return '시간 미정';
};


export default function SmallCandidate({
  anime,
  isCurrentSeason,
  voteInfo,
  starInfo,
  voterCount,
  onVoteComplete
}: SmallCandidateProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { openLoginModal } = useModal();
  
  // BigCandidate와 동일한 상태 관리
  const [voteState, setVoteState] = useState<'submitting' | 'loading' | 'submitted'>(
    starInfo && starInfo.userStarScore && starInfo.userStarScore > 0 ? 'submitted' : 'submitting'
  );
  const [currentRating, setCurrentRating] = useState(
    starInfo && starInfo.userStarScore && starInfo.userStarScore > 0 ? starInfo.userStarScore / 2 : 0
  );
  
  // 별점 분포 데이터 상태 관리 - starInfo가 있으면 초기값 설정
  // isBlocked가 true면 유저의 별점을 가산해서 계산 (사용자가 눈치채지 못하도록)
  const [averageRating, setAverageRating] = useState(() => {
    if (!starInfo) return 0;
    
    // isBlocked가 true이고 userStarScore가 있으면 가산 처리
    if (starInfo.isBlocked && starInfo.userStarScore !== undefined && starInfo.userStarScore > 0) {
      const newVoterCount = (voterCount ?? 0) + 1;
      const newDistributionArray = [
        starInfo.star_0_5,
        starInfo.star_1_0,
        starInfo.star_1_5,
        starInfo.star_2_0,
        starInfo.star_2_5,
        starInfo.star_3_0,
        starInfo.star_3_5,
        starInfo.star_4_0,
        starInfo.star_4_5,
        starInfo.star_5_0
      ];
      const userStarIndex = starInfo.userStarScore - 1;
      if (userStarIndex >= 0 && userStarIndex < newDistributionArray.length) {
        newDistributionArray[userStarIndex] += 1;
      }
      const weights = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0];
      const weightedSum = newDistributionArray.reduce((sum, count, index) => sum + weights[index] * count, 0);
      const newStarAverage = newVoterCount > 0 ? weightedSum / newVoterCount : 0;
      return newStarAverage / 2;
    }
    return starInfo.starAverage / 2;
  });
  
  const [participantCount, setParticipantCount] = useState(
    starInfo && starInfo.isBlocked && starInfo.userStarScore !== undefined && starInfo.userStarScore > 0
      ? (voterCount ?? 0) + 1
      : (voterCount ?? 0)
  );
  
  const [distribution, setDistribution] = useState(() => {
    if (!starInfo) return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    
    // isBlocked가 true이고 userStarScore가 있으면 가산 처리
    if (starInfo.isBlocked && starInfo.userStarScore !== undefined && starInfo.userStarScore > 0) {
      const newVoterCount = (voterCount ?? 0) + 1;
      const newDistributionArray = [
        starInfo.star_0_5,
        starInfo.star_1_0,
        starInfo.star_1_5,
        starInfo.star_2_0,
        starInfo.star_2_5,
        starInfo.star_3_0,
        starInfo.star_3_5,
        starInfo.star_4_0,
        starInfo.star_4_5,
        starInfo.star_5_0
      ];
      const userStarIndex = starInfo.userStarScore - 1;
      if (userStarIndex >= 0 && userStarIndex < newDistributionArray.length) {
        newDistributionArray[userStarIndex] += 1;
      }
      return newDistributionArray.map(count => count / newVoterCount);
    }
    
    // 정상적인 경우
    if ((voterCount ?? 0) > 0) {
      const totalVotes = voterCount ?? 0;
      return [
        starInfo.star_0_5 / totalVotes,
        starInfo.star_1_0 / totalVotes,
        starInfo.star_1_5 / totalVotes,
        starInfo.star_2_0 / totalVotes,
        starInfo.star_2_5 / totalVotes,
        starInfo.star_3_0 / totalVotes,
        starInfo.star_3_5 / totalVotes,
        starInfo.star_4_0 / totalVotes,
        starInfo.star_4_5 / totalVotes,
        starInfo.star_5_0 / totalVotes
      ];
    }
    return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  });

  // 별점 패널 표시 상태 관리 (submitted 상태에서 닫기 버튼으로 숨길 수 있음)
  // 이미 투표한 경우(submitted 상태) 패널을 미리 열어둠
  const [isPanelVisible, setIsPanelVisible] = useState(
    starInfo && starInfo.userStarScore && starInfo.userStarScore > 0
  );

  // bin 아이콘 표시 여부 관리 (별점 회수 후에는 false, 새로 투표하면 true)
  const [showBinIcon, setShowBinIcon] = useState(
    !!(starInfo && starInfo.userStarScore && starInfo.userStarScore > 0)
  );

  // 수정 모드 상태 관리 (사용자가 별점을 클릭해서 수정할 때만 true)
  const [isEditMode, setIsEditMode] = useState(false);

  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // 별점 분포 업데이트 함수 (BigCandidate와 동일)
  const updateStarDistribution = (response: any, userStarScore?: number) => {
    if (response.result && response.result.info) {
      const voteResult = response.result;
      const starInfo = voteResult.info;
      const voterCount = voteResult.voterCount;
      const { isBlocked, starAverage, star_0_5, star_1_0, star_1_5, star_2_0, star_2_5, star_3_0, star_3_5, star_4_0, star_4_5, star_5_0 } = starInfo;
      
      // isBlocked가 true면 유저의 별점을 가산해서 계산 (사용자가 눈치채지 못하도록)
      if (isBlocked && userStarScore !== undefined) {
        // 참여자 수: 기존 + 1
        const newVoterCount = voterCount + 1;
        
        // 별점 분포: 기존 분포에 유저의 별점을 가산
        const newDistributionArray = [
          star_0_5,
          star_1_0,
          star_1_5,
          star_2_0,
          star_2_5,
          star_3_0,
          star_3_5,
          star_4_0,
          star_4_5,
          star_5_0
        ];
        
        // 유저의 별점에 해당하는 인덱스 찾기
        // starScore는 1-10 스케일이고, 분포 배열은 0.5, 1.0, ..., 5.0 (10개)
        // starScore 1 -> 0.5점 (인덱스 0), starScore 2 -> 1.0점 (인덱스 1), ..., starScore 10 -> 5.0점 (인덱스 9)
        const userStarIndex = userStarScore - 1;
        if (userStarIndex >= 0 && userStarIndex < newDistributionArray.length) {
          newDistributionArray[userStarIndex] += 1;
        }
        
        // 별점 분포 배열을 사용해서 정확한 평균 계산 (백엔드와 동일한 방식)
        // 백엔드는 1-10 스케일로 weightedSum을 계산: 1.0*star_0_5 + 2.0*star_1_0 + ... + 10.0*star_5_0
        const weights = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0];
        const weightedSum = newDistributionArray.reduce((sum, count, index) => sum + weights[index] * count, 0);
        const newStarAverage = newVoterCount > 0 ? weightedSum / newVoterCount : 0;
        
        // 비율로 변환
        const newDistribution = newDistributionArray.map(count => count / newVoterCount);
        
        setAverageRating(newStarAverage / 2);
        setParticipantCount(newVoterCount);
        setDistribution(newDistribution);
      } else {
        // 정상적인 경우 기존 로직 사용
        setAverageRating(starAverage / 2);
        setParticipantCount(voterCount);
        
        // 별점 분포를 비율로 변환 (0.5점 단위)
        const totalVotes = voterCount;
        if (totalVotes > 0) {
          const newDistribution = [
            star_0_5 / totalVotes,
            star_1_0 / totalVotes,
            star_1_5 / totalVotes,
            star_2_0 / totalVotes,
            star_2_5 / totalVotes,
            star_3_0 / totalVotes,
            star_3_5 / totalVotes,
            star_4_0 / totalVotes,
            star_4_5 / totalVotes,
            star_5_0 / totalVotes
          ];
          setDistribution(newDistribution);
        }
      }
    }
  };

  // 닫기 버튼 핸들러 (BigCandidate와 동일)
  const handleClosePanel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPanelVisible(false);
  };

  // 투표 남은 시간 계산 (BigCandidate와 동일한 로직)
  const getVoteTimeRemaining = () => {
    if (!anime.scheduledAt) return '시간 미정';
    
    const now = new Date();
    const scheduled = new Date(anime.scheduledAt);
    const voteEndTime = new Date(scheduled.getTime() + 36 * 60 * 60 * 1000); // 36시간 후
    const diffMs = voteEndTime.getTime() - now.getTime();
    
    // 투표 시간이 지났으면 "종료"
    if (diffMs <= 0) {
      return '종료';
    }
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}시간 ${minutes}분 남음`;
    } else {
      return `${minutes}분 남음`;
    }
  };

  // 375px 미만에서만 "남음" 제거한 시간 표시
  const getVoteTimeRemainingShort = () => {
    if (!anime.scheduledAt) return '시간 미정';
    
    const now = new Date();
    const scheduled = new Date(anime.scheduledAt);
    const voteEndTime = new Date(scheduled.getTime() + 36 * 60 * 60 * 1000); // 36시간 후
    const diffMs = voteEndTime.getTime() - now.getTime();
    
    // 투표 시간이 지났으면 "종료"
    if (diffMs <= 0) {
      return '종료';
    }
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}시간 ${minutes}분`;
    } else {
      return `${minutes}분`;
    }
  };

  // 시간 계산
  useEffect(() => {
    const calculateTimeRemaining = () => {
      const remaining = getVoteTimeRemaining();
      setTimeRemaining(remaining);
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 60000); // 1분마다 업데이트

    return () => clearInterval(interval);
  }, [anime.scheduledAt]);



  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 w-full relative overflow-hidden">
      <div className="flex gap-5 items-start">
        {/* 썸네일 */}
        <div className="flex-shrink-0">
          <div 
            className="relative cursor-pointer"
            onClick={() => router.push(`/animes/${anime.animeId}`)}
          >
            <img
              src={anime.mainThumbnailUrl || '/imagemainthumbnail@2x.png'}
              alt={anime.titleKor || '제목 없음'}
              className="w-[90px] h-[120px] xs:w-[108px] xs:h-[144px] object-cover rounded-lg bg-gray-200"
            />
          </div>
        </div>

        {/* 콘텐츠 */}
        <div className="flex-1 min-w-0">
          {/* 제목과 시간 정보 */}
          <div className="mb-2">
              <h3 
                className="font-semibold text-lg text-black leading-tight mb-2 line-clamp-2 md:line-clamp-3 h-[3rem] md:h-[4.5rem] cursor-pointer hover:text-[#990033] transition-colors"
                onClick={() => router.push(`/animes/${anime.animeId}`)}
              >
              {anime.titleKor || '제목 없음'}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{formatAirTime(anime)}</span>
              {timeRemaining && timeRemaining !== '시간 미정' && timeRemaining !== '종료' && (
                <div className="bg-[#990033] text-white px-2 py-1 rounded text-xs font-bold">
                  <span className="max-[375px]:block min-[376px]:hidden">⏰ 투표 남음:<br/>{getVoteTimeRemainingShort()}</span>
                  <span className="hidden min-[376px]:inline">⏰ 투표: {timeRemaining}</span>
                </div>
              )}
            </div>
          </div>

            {/* 장르와 별점을 같은 줄에 배치 */}
            <div className="flex items-center justify-end sm:justify-between relative">
            <span className="text-xs text-gray-500 hidden sm:block truncate flex-shrink-1 min-w-0">{anime.genre || ''}</span>
            <div className="flex items-center gap-2 mt-3 sm:mt-0 relative flex-shrink-0">
              {/* bin 아이콘 - 수정 모드일 때만 표시 */}
              {isEditMode && showBinIcon && (
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    // 즉시 별점 초기화
                    setCurrentRating(0);
                    try {
                      await withdrawStar(anime.episodeId);
                      // 별점 회수 완료 시 상태 초기화
                      setVoteState('submitting');
                      setIsPanelVisible(false);
                      setShowBinIcon(false); // bin 아이콘 숨기기
                      setIsEditMode(false); // 수정 모드 비활성화
                      if (onVoteComplete) {
                        onVoteComplete(anime.episodeId, 0); // 회수 시 voteTimeLeft는 0
                      }
                    } catch (error) {
                      console.error('별점 회수 실패:', error);
                    }
                  }}
                  className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/20 rounded transition-colors duration-200 z-10 mt-1"
                  aria-label="별점 회수"
                >
                  <img 
                    src="/icons/bin-icon.svg" 
                    alt="별점 회수" 
                    className="w-4 h-4"
                  />
                </button>
              )}
              {/* 로딩 상태 표시 */}
              {voteState === 'loading' ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin">
                    <img 
                      src="/icons/star/star-Selected.svg" 
                      alt="로딩 중" 
                      className="w-5 h-5"
                    />
                  </div>
                  <span className="text-xs text-gray-500">투표 처리 중...</span>
                </div>
              ) : (
                /* BigCandidate와 동일한 별점 컴포넌트 */
                <StarRatingSimple
                  key={`star-${anime.episodeId}-${currentRating}`}
                  initialRating={currentRating}
                  readOnly={!!isPanelVisible}
                  onRatingChange={isPanelVisible ? undefined : async (rating) => {
                   console.log('onRatingChange called with rating:', rating);
                   
                   // 수정 모드 활성화 (사용자가 별점을 클릭했으므로)
                   setIsEditMode(true);
                   setCurrentRating(rating);
                   
                   if (rating > 0) {
                     console.log('Rating > 0, proceeding with vote');
                     // 로딩 상태로 전환
                     setVoteState('loading');
                     
                     try {
                       // 별점을 0.5-5.0에서 1-10으로 변환 (2배)
                       const starScore = Math.round(rating * 2);
                       // 실제 별점 투표 API 호출
                       const response = await submitStarVote(anime.episodeId, starScore);
                       setVoteState('submitted');
                       
                        // 데스크톱과 모바일 모두에서 패널 유지
                        setIsPanelVisible(true);
                        
                        // 호버 상태 강제 리셋을 위한 지연
                        setTimeout(() => {
                          // 별점 컴포넌트의 호버 상태를 리셋하기 위해 강제 리렌더링
                          const starElements = document.querySelectorAll('[data-star-rating]');
                          starElements.forEach(element => {
                            element.dispatchEvent(new Event('mouseleave'));
                          });
                        }, 100);
                       
                       // API 응답으로 별점 분포 업데이트
                       // isBlocked가 true면 유저의 별점을 가산해서 계산 (사용자가 눈치채지 못하도록)
                       updateStarDistribution(response, starScore);
                       
                       // 투표한 episode ID를 브라우저에 저장
                       addVotedEpisode(anime.episodeId);
                       
                       // 투표 남은 시간 계산 (36시간 후까지)
                       const now = new Date();
                       const scheduledAt = new Date(anime.scheduledAt);
                       const voteEndTime = new Date(scheduledAt.getTime() + 36 * 60 * 60 * 1000); // 36시간 후
                       const voteTimeLeft = Math.max(0, Math.floor((voteEndTime.getTime() - now.getTime()) / 1000)); // 초 단위
                       
                       // bin 아이콘 표시하기 (새로 투표했으므로)
                       setShowBinIcon(true);
                       
                       // 수정 모드 비활성화 (투표 완료)
                       setIsEditMode(false);
                       
                       // 투표 완료 콜백 호출
                       if (onVoteComplete) {
                         onVoteComplete(anime.episodeId, voteTimeLeft);
                       }
                       
                     } catch (error) {
                       // 에러 시 다시 제출 상태로 돌아감
                       setVoteState('submitting');
                       console.error('투표 중 오류:', error);
                       // TODO: 사용자에게 에러 메시지 표시
                     }
                   } else {
                     console.log('Rating is 0, staying in submitting state');
                     setVoteState('submitting');
                   }
                 }}
                 size="md"
               />
              )}
              
            </div>
          </div>
        </div>
      </div>
      
      {/* 별점 분산 통계 블랙박스 (투표 완료 후 표시) */}
      {isPanelVisible && (
        <div className="h-28 pt-2.5 absolute bg-black rounded-tl-xl rounded-tr-xl inline-flex justify-center items-center gap-5
          left-[110px] top-[70px] right-[10px]
          max-[480px]:left-[110px] max-[480px]:top-[38px] max-[480px]:right-[5px] max-[480px]:h-38 max-[480px]:flex-col max-[480px]:gap-3 max-[480px]:pb-3
          max-[640px]:h-32 max-[640px]:top-[60px]
          sm:h-32 sm:top-[64px] sm:left-[125px] sm:right-[15px]
          md:h-24 md:top-[80px]
          lg:left-[110px] lg:top-[40px] lg:right-[5px] lg:h-38 lg:flex-col lg:gap-3 lg:pb-3
          xl:left-[125px] xl:top-[80px] xl:right-[15px] xl:h-24 xl:flex-row xl:gap-5">
          {/* 수정 버튼 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsPanelVisible(false);
              setVoteState('submitting');
              setIsEditMode(true); // 수정 모드 활성화
            }}
            className="absolute top-1 right-1 z-5 px-2 pt-[3px] pb-1 rounded-sm inline-flex justify-center items-center gap-2.5 hover:opacity-80 transition-opacity"
            style={{
              background: 'linear-gradient(to right, #495057, #343A40)'
            }}
            aria-label="수정"
          >
            <div className="text-right justify-center text-white text-[10px] font-bold font-['Pretendard'] whitespace-nowrap">
              수정
            </div>
          </button>
          <div className="size- flex justify-center items-center gap-3.5 max-[480px]:flex-col max-[480px]:gap-4 max-[480px]:items-end max-[640px]:pb-3 sm:pb-10 md:pb-0 lg:flex-col lg:gap-4 lg:items-end xl:flex-row xl:gap-3.5 xl:items-center">
            {/* 평균별점과 막대그래프 (480px 미만에서는 위에 배치) */}
            <div className="flex items-center gap-3.5 max-[480px]:order-1">
              <div className="size- inline-flex flex-col justify-center items-center gap-1">
                <div className="size- inline-flex justify-center items-center gap-2">
                  <div className="size-4 relative">
                    <img 
                      src="/icons/star/star-Selected.svg" 
                      alt="별" 
                      className="w-5 h-5 left-0 top-0 absolute pb-1"
                    />
                  </div>
                  <div className="size- pt-0.5 flex justify-center items-center gap-2.5">
                    <div className="text-center justify-start text-white text-2xl font-semibold font-['Pretendard'] leading-snug">
                      {averageRating.toFixed(1)}
                    </div>
                  </div>
                </div>
                <div className="size- flex flex-col justify-start items-center gap-0.5 pb-1">
                  <div className="size- inline-flex justify-start items-center gap-1">
                    <div className="text-right justify-start text-gray-400 text-sm font-medium font-['Pretendard'] leading-snug">
                      {participantCount.toLocaleString()}명 참여
                    </div>
                  </div>
                </div>
              </div>
              <div className="w-24 h-10 relative pt-1">
                <StarDistributionChart
                  distribution={distribution}
                  totalVoters={participantCount}
                  width={96}
                  height={40}
                  barWidth={8}
                  barSpacing={2}
                  maxBarColor="#FF7B7B"
                  normalBarColor="rgba(255, 123, 123, 0.66)"
                />
              </div>
            </div>
            {/* 사용자별점 리스트 (480px 미만에서는 아래에 배치) */}
            <div className="size- relative flex justify-center items-center gap-2.5 max-[480px]:order-2 lg:order-2 xl:order-1">
              <div className="size- px-[2.96px] pb-1.5 flex justify-end items-center gap-[0.74px] pointer-events-none">
                <StarRatingSimple
                  key={`star-small-${anime.episodeId}-${currentRating}`}
                  maxStars={5}
                  initialRating={currentRating}
                  size="sm"
                  withBackground={true}
                  onRatingChange={() => {}} // 읽기 전용
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
