'use client';

import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { AnimePreviewDto } from '@/components/search/types';
import StarRatingSimple from '@/components/StarRatingSimple';
import StarSubmissionBox from '@/components/star/StarSubmissionBox';
import { submitStarVote } from '@/api/client';
import { StarInfoDto } from '@/types/api';
import { addVotedEpisode } from '@/lib/voteStorage';

interface BigCandidateProps {
  anime: AnimePreviewDto;
  className?: string;
  isCurrentSeason?: boolean; // 현재 시즌인지 여부
  voteInfo?: {year: number, quarter: number, week: number} | null; // 투표 정보
  starInfo?: StarInfoDto; // 별점 정보 (사용자 투표 이력 포함)
  onVoteComplete?: () => void; // 투표 완료 시 호출되는 콜백
}

export default function BigCandidate({ anime, className, isCurrentSeason = true, voteInfo, starInfo, onVoteComplete }: BigCandidateProps) {
  // 별점 제출 상태 관리 - starInfo가 있고 userStarScore가 있으면 초기 상태를 submitted로 설정
  const [voteState, setVoteState] = useState<'submitting' | 'loading' | 'submitted'>(
    starInfo && starInfo.userStarScore && starInfo.userStarScore > 0 ? 'submitted' : 'submitting'
  );
  const [currentRating, setCurrentRating] = useState(
    starInfo && starInfo.userStarScore && starInfo.userStarScore > 0 ? starInfo.userStarScore / 2 : 0
  );
  
  // 별점 분포 데이터 상태 관리 - starInfo가 있으면 초기값 설정
  const [averageRating, setAverageRating] = useState(
    starInfo ? starInfo.starAverage : 0
  );
  const [participantCount, setParticipantCount] = useState(
    starInfo ? starInfo.voterCount : 0
  );
  const [distribution, setDistribution] = useState(() => {
    if (starInfo && starInfo.voterCount > 0) {
      const totalVotes = starInfo.voterCount;
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

  // 닫기 버튼 핸들러
  const handleClosePanel = (e: React.MouseEvent) => {
    e.stopPropagation(); // 이벤트 버블링 방지
    console.log('handleClosePanel called');
    setIsPanelVisible(false);
  };

  // 모바일 감지
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // 라벨 띠 호버 핸들러 (데스크톱에서만 호버 시 패널 표시)
  const handleLabelHover = () => {
    if (!isMobile && (voteState === 'submitted' || voteState === 'submitting')) {
      setIsPanelVisible(true);
    }
  };

  // 라벨 띠 호버 아웃 핸들러 (데스크톱에서만 호버 해제 시 패널 숨김)
  const handleLabelHoverOut = () => {
    if (!isMobile && voteState !== 'submitted' && voteState !== 'loading') {
      console.log('handleLabelHoverOut called');
      setIsPanelVisible(false);
    }
  };

  // 라벨 띠 클릭 핸들러 (모바일에서만 클릭 시 패널 토글)
  const handleLabelClick = () => {
    if (isMobile && (voteState === 'submitted' || voteState === 'submitting')) {
      console.log('handleLabelClick called, toggling panel');
      // 수정 버튼 클릭 후에는 패널을 강제로 열기
      if (voteState === 'submitting') {
        console.log('handleLabelClick: voteState is submitting, forcing panel open');
        setIsPanelVisible(true);
        return;
      }
      // submitted 상태에서도 패널을 강제로 열기
      if (voteState === 'submitted') {
        console.log('handleLabelClick: voteState is submitted, forcing panel open');
        setIsPanelVisible(true);
        return;
      }
      setIsPanelVisible(!isPanelVisible);
    }
  };

  // 패널 바깥 클릭 핸들러 (상태1에서만 패널 닫기)
  const handleClickOutside = (e: React.MouseEvent) => {
    if (voteState === 'submitting' && isPanelVisible) {
      console.log('handleClickOutside: closing panel');
      setIsPanelVisible(false);
    }
  };

  // 전역 클릭 이벤트 리스너 (카드 밖 클릭 감지)
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (voteState === 'submitting' && isPanelVisible) {
        // 클릭된 요소가 현재 카드 내부가 아닌 경우에만 패널 닫기
        const target = e.target as Element;
        const currentCard = document.querySelector(`[data-anime-item]`);
        
        if (currentCard && !currentCard.contains(target)) {
          console.log('handleGlobalClick: closing panel from outside card');
          setIsPanelVisible(false);
        }
      }
    };

    if (voteState === 'submitting' && isPanelVisible) {
      document.addEventListener('click', handleGlobalClick);
    }

    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, [voteState, isPanelVisible]);


  // API 응답을 별점 분포로 변환하는 함수
  const updateStarDistribution = (response: any) => {
    if (response.result) {
      const { starAverage, voterCount, star_0_5, star_1_0, star_1_5, star_2_0, star_2_5, star_3_0, star_3_5, star_4_0, star_4_5, star_5_0 } = response.result;
      
      setAverageRating(starAverage);
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
  };
  const { animeId, mainThumbnailUrl, status, isBreak, titleKor, dayOfWeek, scheduledAt, isRescheduled, genre, medium, airTime } = anime;
  const [imageError, setImageError] = useState(false);
  
  // 디데이 계산 함수 (8/22 형식에서 현재 시간까지의 차이)
  const calculateDaysUntilAir = (airTime: string) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    
    // airTime을 파싱 (예: "8/22")
    const [month, day] = airTime.split('/').map(Number);
    
    // 올해의 해당 날짜 생성
    const airDate = new Date(currentYear, month - 1, day);
    
    // 이미 지난 경우 D-DAY로 표시 (내년으로 설정하지 않음)
    if (airDate < now) {
      return 0; // D-DAY로 표시
    }
    
    const diffTime = airDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  // 방영 시간 포맷팅
  const formatAirTime = (scheduledAt: string, airTime?: string) => {
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
    
    // UPCOMING 상태이고 airTime이 있는 경우 (8/22 형식) 디데이 계산
    if (status === 'UPCOMING' && airTime && airTime.includes('/')) {
      const daysUntil = calculateDaysUntilAir(airTime);
      if (daysUntil > 0) {
        return `D-${daysUntil}`;
      } else if (daysUntil === 0) {
        return 'D-DAY';
      }
    }
    
    // airTime이 있는 경우 우선 사용 (검색 결과 포함)
    if (airTime) {
      // airTime에 이미 요일이 포함되어 있으면 그대로 사용
      if (airTime.includes('요일') || airTime.includes('일') || airTime.includes('월') || airTime.includes('화') || airTime.includes('수') || airTime.includes('목') || airTime.includes('금') || airTime.includes('토')) {
        return airTime;
      }
      // 요일이 없으면 요일 추가
      return `${getDayInKorean(dayOfWeek)} ${airTime}`;
    }
    
            // airTime이 없는 경우 scheduledAt 사용
            if (scheduledAt) {
              const date = new Date(scheduledAt);
              const hours = date.getHours().toString().padStart(2, '0');
              const minutes = date.getMinutes().toString().padStart(2, '0');
              return `${getDayInKorean(dayOfWeek)} ${hours}:${minutes}`;
            }
    
    // 종영 애니메이션의 경우 "(종영)" 표시 (시즌별 조회에서만)
    if (status === 'ENDED') {
      return '· 종영';
    }
    
    return '시간 미정';
  };
  
  // 방영까지 남은 시간 계산 (NOW_SHOWING 23분 59초 이내 또는 UPCOMING 12시간 이내)
  const getTimeRemaining = () => {
    // 시즌별 조회인 경우 추적하지 않음
    if (!isCurrentSeason) return null;
    
    if (!scheduledAt) return null;
    
    const now = new Date();
    const scheduled = new Date(scheduledAt);
    const diffMs = scheduled.getTime() - now.getTime();
    
    // UPCOMING 상태이고 12시간 이내인 경우
    if (status === 'UPCOMING' && diffMs > 0 && diffMs <= 12 * 60 * 60 * 1000) {
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}시간 ${minutes}분 후`;
    }
    
    // NOW_SHOWING 상태이고 23분 59초 이내인 경우
    if (status === 'NOW_SHOWING' && diffMs > 0 && diffMs <= 23 * 60 * 60 * 1000) {
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}시간 ${minutes}분 후`;
    }
    
    return null;
  };

  // 현재 방영 중인지 확인
  const isCurrentlyAiring = () => {
    return status === 'NOW_SHOWING' && !isBreak;
  };

          // 요일을 한국어로 변환 (한 글자)
          const getDayInKorean = (dayOfWeek: string) => {
            const dayMap: { [key: string]: string } = {
              'MONDAY': '월',
              'TUESDAY': '화',
              'WEDNESDAY': '수',
              'THURSDAY': '목',
              'FRIDAY': '금',
              'SATURDAY': '토',
              'SUNDAY': '일',
              'NONE': '미정',
              'SPECIAL': '특별',
              // 추가 가능한 값들
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

          // 투표 남은 시간 계산 (36시간 기준)
          const getVoteTimeRemaining = () => {
            if (!scheduledAt) return '시간 미정';
            
            const now = new Date();
            const scheduled = new Date(scheduledAt);
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

  // 미디어 타입을 한국어로 변환
  const getMediumInKorean = (medium: string) => {
    const mediumMap: { [key: string]: string } = {
      'TV': 'TV',
      'TVA': 'TVA',
      'MOVIE': '극장판',
      'OVA': 'OVA',
      'SPECIAL': '특별편성'
    };
    return mediumMap[medium] || medium;
  };
  
  return (
    <div 
      data-anime-item
      className={cn(
        "bg-white rounded-2xl overflow-hidden transition-all duration-200",
        // submitted 상태가 아닐 때만 호버 스케일 효과 적용
        voteState !== 'submitted' ? "hover:scale-[1.02]" : "",
        // submitted 상태일 때는 약간의 그림자 강화로 투표 완료 상태임을 시각적으로 표현
        voteState === 'submitted' ? "shadow-[0_4px_12px_rgba(0,0,0,0.15)]" : "",
        "flex flex-col h-full w-[285px]",
        "shadow-[0_1.9px_7.2px_rgba(0,0,0,0.1)]",
        "group", // cursor-pointer와 onClick 제거
        className
      )}
      onClick={handleClickOutside}
    >
      {/* Thumbnail Image */}
      <div className="relative w-full h-[340px] overflow-hidden bg-gray-300">
        <img
          src={mainThumbnailUrl}
          alt={titleKor}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
        
        {/* OTT Services Overlay - 제거됨 */}
        
        {/* Status Badge - 제거됨 */}
        
        {/* Live Badge - 제거됨 */}
        
        {/* Break Badge - 제거됨 */}
      </div>

      {/* Content Section */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Title and Air Time Section */}
        <div className="min-h-[120px] flex flex-col">
          {/* Title - 고정 높이로 2줄 기준 설정 */}
          <div className="h-[48px] relative">
            <h3 className="font-bold text-gray-900 text-[16px] leading-tight line-clamp-2 font-['Pretendard']">
              {titleKor}
            </h3>
            
            {/* 제목 아래 회색선 - 제목 프레임 내에서 아래 왼쪽 정렬 */}
            <div className="absolute bottom-0 left-0 w-[90px] h-0">
              <div className="w-full h-[1px] bg-[#ced4da]"></div>
            </div>
          </div>
          
          {/* Air Time and Countdown */}
          <div className="flex items-center mt-[9px]">
            <div className="flex items-center gap-2">
              {(() => {
                const airTimeText = formatAirTime(scheduledAt, anime.airTime);
                const isUpcomingCountdown = status === 'UPCOMING' && airTimeText.includes('D-');
                
                if (isUpcomingCountdown) {
                  // UPCOMING 상태의 "D-" 텍스트에 검정 바탕에 흰 글씨 스타일 적용
                  // scheduledAt에서 시간 추출
                  const getTimeFromScheduledAt = (scheduledAt: string) => {
                    if (!scheduledAt) return '';
                    const date = new Date(scheduledAt);
                    const hours = date.getHours().toString().padStart(2, '0');
                    const minutes = date.getMinutes().toString().padStart(2, '0');
                    return `${hours}:${minutes}`;
                  };
                  
                  return (
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-medium text-[#868E96] font-['Pretendard']">
                        {medium === 'MOVIE' 
                          ? getDayInKorean(dayOfWeek) // 극장판은 요일만 표시
                          : medium === 'TVA' && (dayOfWeek === 'NONE' || dayOfWeek === 'SPECIAL') 
                            ? getDayInKorean(dayOfWeek)
                            : getDayInKorean(dayOfWeek)
                        }
                      </span>
                      <span className="bg-black text-white px-2 py-1 rounded text-[13px] font-bold font-['Pretendard']">
                        {airTimeText}
                      </span>
                      <span className="text-[14px] font-medium text-[#868E96] font-['Pretendard']">
                        {getTimeFromScheduledAt(scheduledAt)}
                      </span>
                    </div>
                  );
                } else {
                  // 일반적인 airTime 표시
                  return (
                    <span className="text-[14px] font-medium text-[#868E96] font-['Pretendard']">
                      {formatAirTime(scheduledAt, anime.airTime)}
                    </span>
                  );
                }
              })()}
              {isRescheduled && (
                <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded font-['Pretendard']">
                  편성 변경
                </span>
              )}
            </div>
                    {/* 투표 남은 시간 배지 */}
                    <div className="w-[7px]"></div>
                    <div className="px-2 py-0.5 rounded-md flex items-center bg-[#990033]">
                      <span className="text-[13px] font-bold font-['Pretendard'] text-white">
                        ⏰ 투표: {getVoteTimeRemaining()} 남음
                      </span>
                    </div>
          </div>
          
          {/* Genres - 제목 섹션에 포함 */}
          <div className="mt-[5px]">
            <span className="text-[13px] font-medium text-[#868E96] font-['Pretendard']">
              {genre}
            </span>
          </div>
        </div>
      </div>

              {/* 라벨 띠 - 카드 호버 시 디자인 변경, 라벨 띠 호버 시 블랙박스 */}
              <div 
                className={`h-6 bg-[#F1F3F5] ${voteState === 'submitted' && isPanelVisible ? 'bg-black' : 'group-hover:bg-black hover:bg-black'} relative transition-colors duration-200 group/label cursor-pointer`}
                onMouseEnter={handleLabelHover}
                onMouseLeave={handleLabelHoverOut}
                onClick={handleLabelClick}
              >
                {/* 힌트 디자인 - 카드 호버 시 스타일 변경 (submitted 상태가 아니거나 패널이 숨겨진 경우 표시) */}
                {(voteState !== 'submitted' || !isPanelVisible) && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex items-center space-x-2">
                      <div className="text-gray-600 group-hover:text-white text-xs font-medium opacity-70 group-hover:opacity-100 transition-all duration-200">
                        마우스를 올려서 투표
                      </div>
                      <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[6px] border-transparent border-b-gray-600 group-hover:border-b-white opacity-60 group-hover:opacity-100 transition-all duration-200 animate-bounce"></div>
                    </div>
                  </div>
                )}
                
                {/* 라벨 띠 호버 시에만 올라오는 블랙박스 (submitted 상태에서는 항상 표시, 닫기 버튼으로 숨김 가능) */}
                <div 
                  className={`absolute bottom-0 left-0 right-0 h-[119px] bg-black transition-transform duration-300 ease-out ${
                    (voteState === 'submitted' || voteState === 'submitting') 
                      ? (isPanelVisible ? 'translate-y-0' : 'translate-y-full')
                      : 'translate-y-full group-hover/label:translate-y-0'
                  }`}
                  style={{ cursor: 'default !important' }}
                >
                  {/* StarSubmissionBox 사용 */}
                  <StarSubmissionBox
                    currentRating={currentRating}
                    averageRating={averageRating}
                    participantCount={participantCount}
                    distribution={distribution}
                    variant={voteState}
                    voteInfo={voteInfo}
                    onRatingChange={async (rating) => {
                      console.log('onRatingChange called with rating:', rating);
                      
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
                          
                          // API 응답으로 별점 분포 업데이트
                          updateStarDistribution(response);
                          
                          // 투표한 episode ID를 브라우저에 저장
                          addVotedEpisode(anime.episodeId);
                          
                          // 투표 완료 콜백 호출
                          if (onVoteComplete) {
                            onVoteComplete();
                          }
                          
                        } catch (error) {
                          // 에러 시 다시 제출 상태로 돌아감
                          setVoteState('submitting');
                          console.error('투표 중 오류:', error);
                          // TODO: 사용자에게 에러 메시지 표시
                        }
                      } else {
                        console.log('Rating = 0, closing panel without submission');
                        // 0점일 때 패널 닫기 (제출하지 않음)
                        setIsPanelVisible(false);
                        setVoteState('submitting'); // 제출 상태로 되돌림
                        return; // 함수 종료
                      }
                    }}
                    onEditClick={() => {
                      console.log('onEditClick called, current isPanelVisible:', isPanelVisible);
                      setVoteState('submitting');
                      // 수정 버튼 클릭 시 패널 강제 유지 (모바일/데스크톱 모두)
                      setIsPanelVisible(true);
                      // 수정 시 별점 초기화
                      setCurrentRating(0);
                      console.log('onEditClick: setIsPanelVisible(true) called, setCurrentRating(0)');
                    }}
                    onCloseClick={voteState === 'submitted' ? handleClosePanel : undefined}
                  />
                </div>
              </div>
    </div>
  );
}
