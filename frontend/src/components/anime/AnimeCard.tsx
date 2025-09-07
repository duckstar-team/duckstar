'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimePreviewDto } from '@/components/search/types';
import OptimizedImage from '../common/OptimizedImage';
import ProgressiveImage from '../common/ProgressiveImage';

interface AnimeCardProps {
  anime: AnimePreviewDto;
  className?: string;
}

export default function AnimeCard({ anime, className }: AnimeCardProps) {
  const { animeId, mainThumbnailUrl, status, isBreak, titleKor, dayOfWeek, scheduledAt, isRescheduled, genre, medium, ottDtos } = anime;
  const [imageError, setImageError] = useState(false);
  const router = useRouter();
  
  // 애니메이션 카드 클릭 핸들러
  const handleCardClick = () => {
    router.push(`/animes/${animeId}`);
  };
  
  // 방영 시간 포맷팅
  const formatAirTime = (scheduledAt: string) => {
    if (!scheduledAt) return '시간 미정';
    const date = new Date(scheduledAt);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };
  
  // 방영까지 남은 시간 계산 (NOW_SHOWING 23분 59초 이내 또는 UPCOMING 12시간 이내)
  const getTimeRemaining = () => {
    if (!scheduledAt) return null;
    
    const now = new Date();
    const scheduled = new Date(scheduledAt);
    
    if (status === 'NOW_SHOWING') {
      // 방영 시작 전: 방영 시작까지 남은 시간 표시 (12시간 이하만)
      if (now < scheduled) {
        const diff = scheduled.getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        
        if (hours > 12) return null; // 12시간 초과인 경우 제외
        
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0) {
          return `${hours}시간 ${minutes}분 남음`;
        } else {
          return `${minutes}분 남음`;
        }
      }
      
      // 방영 시작 후: 방영 종료까지 남은 시간 표시 (24분)
      const endTime = new Date(scheduled.getTime() + 24 * 60 * 1000);
      if (now > endTime) return null;
      
      const diff = endTime.getTime() - now.getTime();
      const minutes = Math.floor(diff / (1000 * 60));
      
      if (minutes > 0) {
        return `라이브 중: ${minutes}분 남음`;
      } else {
        return `라이브 중: 곧 종료`;
      }
    } else if (status === 'UPCOMING') {
      // 방영 예정인 경우 12시간 이내만 표시
      if (scheduled <= now) return null; // 이미 방영된 경우 제외
      
      const diff = scheduled.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      
      if (hours > 12) return null; // 12시간 초과인 경우 제외
      
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 0) {
        return `${hours}시간 ${minutes}분 남음`;
      } else {
        return `${minutes}분 남음`;
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
        return 'bg-blue-100 text-blue-800';
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
  
  // 요일 한글 변환
  const getDayInKorean = (day: string) => {
    const dayMap: { [key: string]: string } = {
      'MON': '월', 'TUE': '화', 'WED': '수', 'THU': '목', 'FRI': '금', 'SAT': '토', 'SUN': '일'
    };
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
        <OptimizedImage
          src={mainThumbnailUrl}
          alt={titleKor}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          fallbackSrc="/banners/duckstar-logo.svg"
          onError={() => setImageError(true)}
        />
        
        {/* OTT Services Overlay */}
        <div className="absolute bottom-3 left-3 flex gap-[10px] items-center justify-start">
          {ottDtos.slice(0, 5).map((ott, index) => (
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
            {status === 'UPCOMING' ? '예정' : 
             status === 'NOW_SHOWING' ? (anime.medium === 'MOVIE' ? '상영중' : '방영중') : 
             status === 'COOLING' ? '휴방' : '종영'}
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
              <span className="text-[14px] font-medium text-[#868E96] font-['Pretendard']">
                {getDayInKorean(dayOfWeek)} {formatAirTime(scheduledAt)}
              </span>
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
          <span className="text-[13px] font-medium text-[#868E96] font-['Pretendard']">
            {genre}
          </span>
          
                      {/* Medium Type */}
            <span className="text-[13px] font-normal text-[#868E96] font-['Pretendard']">
              {getMediumInKorean(medium)}
            </span>
        </div>
      </div>
    </div>
  );
}
