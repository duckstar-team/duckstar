'use client';

import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { AnimePreviewDto } from '@/components/search/types';

interface AnimeCardProps {
  anime: AnimePreviewDto;
  className?: string;
  isCurrentSeason?: boolean; // 현재 시즌인지 여부
}

export default function AnimeCard({ anime, className, isCurrentSeason = true }: AnimeCardProps) {
  const { animeId, mainThumbnailUrl, status, isBreak, titleKor, dayOfWeek, scheduledAt, isRescheduled, genre, medium, ottDtos } = anime;
  const [imageError, setImageError] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // 애니메이션 카드 클릭 핸들러
  const handleCardClick = () => {
    // 검색 페이지에서 상세화면으로 이동할 때 스크롤 저장
    if (pathname === '/search' && typeof window !== 'undefined') {
      const currentScrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      if (currentScrollY > 0) {
        sessionStorage.setItem('scroll-search-return', currentScrollY.toString());
        sessionStorage.setItem('to-anime-detail', 'true');
      }
    }
    
    // 홈페이지에서 상세화면으로 이동할 때 스크롤 저장
    if (pathname === '/' && typeof window !== 'undefined') {
      const currentScrollY = window.scrollY || 0;
      sessionStorage.setItem('home-scroll', currentScrollY.toString());
      sessionStorage.setItem('navigation-type', 'from-anime-detail');
    }
    
    // Next.js 클라이언트 사이드 라우팅 사용
    router.push(`/animes/${animeId}`);
  };
  
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
      return airTime;
    }
    
    // airTime이 없는 경우 scheduledAt 사용
    if (scheduledAt) {
      const date = new Date(scheduledAt);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
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
    
    // scheduledAt에서 요일과 시간, 분만 추출
    const targetDayOfWeek = scheduled.getDay(); // 0=일요일, 1=월요일, ..., 6=토요일
    const targetHours = scheduled.getHours();
    const targetMinutes = scheduled.getMinutes();
    
    // 이번 주와 다음 주의 방영 시간 계산
    const getThisWeekScheduledTime = () => {
      const thisWeekScheduled = new Date(now);
      thisWeekScheduled.setHours(targetHours, targetMinutes, 0, 0);
      
      const currentDayOfWeek = now.getDay();
      let daysUntilTarget = targetDayOfWeek - currentDayOfWeek;
      
      // 목표 요일이 지났다면 이번 주에서는 이미 지난 시간
      if (daysUntilTarget < 0) {
        daysUntilTarget += 7;
      }
      
      thisWeekScheduled.setDate(now.getDate() + daysUntilTarget);
      return thisWeekScheduled;
    };
    
    const getNextWeekScheduledTime = () => {
      const nextWeekScheduled = new Date(now);
      nextWeekScheduled.setHours(targetHours, targetMinutes, 0, 0);
      
      const currentDayOfWeek = now.getDay();
      let daysUntilTarget = targetDayOfWeek - currentDayOfWeek;
      
      // 다음 주로 설정
      if (daysUntilTarget <= 0) {
        daysUntilTarget += 7;
      } else {
        daysUntilTarget += 7;
      }
      
      nextWeekScheduled.setDate(now.getDate() + daysUntilTarget);
      return nextWeekScheduled;
    };
    
    const thisWeekScheduledTime = getThisWeekScheduledTime();
    const nextWeekScheduledTime = getNextWeekScheduledTime();
    
    if (status === 'NOW_SHOWING') {
      // 현재 방영중인지 확인 (이번 주 방영 시간 기준으로 23분 59초 동안)
      const thisWeekEndTime = new Date(thisWeekScheduledTime.getTime() + 23 * 60 * 1000 + 59 * 1000);
      const isCurrentlyAiring = now >= thisWeekScheduledTime && now <= thisWeekEndTime;
      
      // 현재 방영중인 경우: 방영 종료까지 남은 시간 표시
      if (isCurrentlyAiring) {
        const endDiff = thisWeekEndTime.getTime() - now.getTime();
        const endMinutes = Math.floor(endDiff / (1000 * 60));
        
        if (endMinutes > 0) {
          return `라이브 중: ${endMinutes}분 남음`;
        } else {
          return `라이브 중: 곧 종료`;
        }
      }
      
      // 이번 주 방영이 끝난 경우, 다음 주 방영 시간을 기준으로 판단
      if (now > thisWeekEndTime) {
        const nextDiff = nextWeekScheduledTime.getTime() - now.getTime();
        const hours = Math.floor(nextDiff / (1000 * 60 * 60));
        
        if (hours > 12) return null; // 12시간 초과인 경우 제외
        
        const minutes = Math.floor((nextDiff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0) {
          return `${hours}시간 ${minutes}분 남음`;
        } else {
          return `${minutes}분 남음`;
        }
      }
      
      // 이번 주 방영 시작 전인 경우 12시간 이내만 표시
      if (thisWeekScheduledTime > now) {
        const diff = thisWeekScheduledTime.getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        
        if (hours > 12) return null; // 12시간 초과인 경우 제외
        
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0) {
          return `${hours}시간 ${minutes}분 남음`;
        } else {
          return `${minutes}분 남음`;
        }
      }
    } else if (status === 'UPCOMING') {
      // 방영 예정인 경우 12시간 이내만 표시
      if (thisWeekScheduledTime <= now) {
        // 이번 주 방영이 지났다면 다음 주 방영 시간을 기준으로 판단
        const nextDiff = nextWeekScheduledTime.getTime() - now.getTime();
        const hours = Math.floor(nextDiff / (1000 * 60 * 60));
        
        if (hours > 12) return null; // 12시간 초과인 경우 제외
        
        const minutes = Math.floor((nextDiff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0) {
          return `${hours}시간 ${minutes}분 남음`;
        } else {
          return `${minutes}분 남음`;
        }
      } else {
        // 이번 주 방영 시작 전인 경우
        const diff = thisWeekScheduledTime.getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        
        if (hours > 12) return null; // 12시간 초과인 경우 제외
        
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0) {
          return `${hours}시간 ${minutes}분 남음`;
        } else {
          return `${minutes}분 남음`;
        }
      }
    }
    
    return null;
  };
  
  const timeRemaining = getTimeRemaining();
  
  // 현재 방영중인지 확인하는 함수 (24분 동안)
  const isCurrentlyAiring = () => {
    if (status !== 'NOW_SHOWING' || !scheduledAt) return false;
    
    const now = new Date();
    const scheduled = new Date(scheduledAt);
    const endTime = new Date(scheduled.getTime() + 24 * 60 * 1000); // 24분 후
    
    return now >= scheduled && now <= endTime;
  };
  
  // 상태별 배경색
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UPCOMING':
        return 'bg-orange-100 text-orange-800';
      case 'NOW_SHOWING':
        return 'bg-green-100 text-green-800';
      case 'COOLING':
        return 'bg-yellow-100 text-yellow-800';
      case 'ENDED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 상태별 텍스트
  const getStatusText = (status: string) => {
    switch (status) {
      case 'UPCOMING':
        // 이번주 메뉴에서는 UPCOMING 상태를 매체 타입에 따라 다르게 표시
        if (isCurrentSeason) {
          return medium === 'MOVIE' ? '개봉주' : '첫 방영';
        } else {
          // 시즌 메뉴에서는 '예정'으로 표시
          return '예정';
        }
      case 'NOW_SHOWING':
        return medium === 'MOVIE' ? '상영중' : '방영중';
      case 'COOLING':
        return '휴방';
      case 'ENDED':
        return '종영';
      default:
        return '알 수 없음';
    }
  };
  
  // 요일 한글 변환
  const getDayInKorean = (day: string) => {
    const dayMap: { [key: string]: string } = {
      'MON': '월', 'TUE': '화', 'WED': '수', 'THU': '목', 'FRI': '금', 'SAT': '토', 'SUN': '일'
    };
    
    // TVA 애니메이션 중에서 그룹이 없는 경우 "요일 미정" 표시
    if (medium === 'TVA' && (day === 'NONE' || day === 'SPECIAL')) {
      return '요일 미정';
    }
    
    return dayMap[day] || day;
  };

  // 매체 타입 한글 변환
  const getMediumInKorean = (medium: string) => {
    const mediumMap: { [key: string]: string } = {
      'TVA': 'TVA',
      'MOVIE': '극장판',
      'OVA': 'OVA',
      'SPECIAL': '특별편성'
    };
    return mediumMap[medium] || medium;
  };
  
  return (
    <div 
      className={cn(
        "bg-white rounded-2xl overflow-hidden transition-all duration-200 hover:scale-[1.02]",
        "flex flex-col h-full",
        "shadow-[0_1.9px_7.2px_rgba(0,0,0,0.1)]",
        "cursor-pointer",
        isCurrentlyAiring() && "ring-2 ring-[#990033]",
        className
      )}
      onClick={handleCardClick}
    >
      {/* Thumbnail Image */}
      <div className="relative w-full h-[340px] overflow-hidden">
        <img
          src={mainThumbnailUrl}
          alt={titleKor}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
        
        {/* OTT Services Overlay */}
        <div className="absolute bottom-3 left-3 flex gap-[10px] items-center justify-start">
          {(ottDtos || []).slice(0, 5).map((ott, index) => (
            <div
              key={index}
              className="relative shrink-0 size-[36px] cursor-pointer hover:scale-110 transition-transform duration-200 drop-shadow-[0_0_5.35px_rgba(0,0,0,0.5)]"
              onClick={(e) => {
                e.stopPropagation(); // 카드 클릭 이벤트 방지
                if (ott.watchUrl) {
                  window.open(ott.watchUrl, '_blank');
                }
              }}
            >
              {ott.ottType === 'NETFLIX' && (
                <div className="absolute inset-0">
                  <img
                    src="/icons/netflix-logo.svg"
                    alt="Netflix"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              {ott.ottType === 'LAFTEL' && (
                <div className="absolute inset-0">
                  <img
                    src="/icons/laftel-logo.svg"
                    alt="LAFTEL"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              {ott.ottType === 'TVING' && (
                <div className="absolute inset-0">
                  <img
                    src="/icons/tving-logo.svg"
                    alt="Tving"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              {ott.ottType === 'WAVVE' && (
                <div className="absolute inset-0">
                  <img
                    src="/icons/wavve-logo.svg"
                    alt="Wavve"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              {ott.ottType === 'WATCHA' && (
                <div className="absolute inset-0">
                  <img
                    src="/icons/watcha-logo.svg"
                    alt="Watcha"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              {!['NETFLIX', 'LAFTEL', 'TVING', 'WAVVE', 'WATCHA'].includes(ott.ottType) && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-800 font-['Pretendard']">
                    {ott.ottType ? ott.ottType.charAt(0) : '?'}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <span className={cn("px-2 py-1 rounded text-xs font-medium font-['Pretendard']", getStatusColor(status))}>
            {getStatusText(status)}
          </span>
        </div>
        

        
        {/* Live Badge - 현재 방영중인 경우에만 표시 */}
        {isCurrentlyAiring() && (
          <div className="absolute top-3 left-16">
            <span className="bg-[#990033] text-white px-2 py-1 rounded text-xs font-bold font-['Pretendard']">
              라이브
            </span>
          </div>
        )}
        
        {/* Break Badge */}
        {isBreak && (
          <div className="absolute top-12 left-3">
            <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium font-['Pretendard']">
              결방
            </span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Title and Air Time Section */}
        <div className="flex-1">
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
                      {medium === 'MOVIE' 
                        ? formatAirTime(scheduledAt, anime.airTime) // 극장판은 요일 없이 시간만 표시
                        : medium === 'TVA' && (dayOfWeek === 'NONE' || dayOfWeek === 'SPECIAL') 
                          ? `${getDayInKorean(dayOfWeek)} · ${formatAirTime(scheduledAt, anime.airTime)}`
                          : `${getDayInKorean(dayOfWeek)} ${formatAirTime(scheduledAt, anime.airTime)}`
                      }
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
            {timeRemaining && (
              <>
                <div className="w-[7px]"></div>
                <div className={cn(
                  "px-2 py-0.5 rounded-md flex items-center",
                  isCurrentlyAiring() 
                    ? "bg-[#990033]" 
                    : "bg-yellow-400"
                )}>
                  <span className={cn(
                    "text-[13px] font-bold font-['Pretendard']",
                    isCurrentlyAiring() 
                      ? "text-white" 
                      : "text-[#65142f]"
                  )}>
                    {timeRemaining}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Genres and Medium Type */}
        <div className="flex items-center justify-between mt-[5px]">
          {/* Genres */}
          <span className="text-[13px] font-medium text-[#868E96] font-['Pretendard'] pr-2">
            {genre}
          </span>
          
                      {/* Medium Type */}
            <span className="text-[13px] font-normal text-[#868E96] font-['Pretendard'] whitespace-nowrap">
              {getMediumInKorean(medium)}
            </span>
        </div>
      </div>
    </div>
  );
}
