'use client';

import { cn } from '@/lib';
import { useState, useEffect } from 'react';
import { Schemas, OttType } from '@/types';
import { useNavigation } from '@/hooks/useNavigation';

interface AnimeCardProps {
  anime: Schemas['AnimePreviewDto'];
  className?: string;
  isCurrentSeason?: boolean; // 현재 시즌인지 여부
  isUpcomingGroup?: boolean; // "곧 시작" 그룹인지 여부
}

export default function AnimeCard({
  anime,
  className,
  isCurrentSeason = true,
  isUpcomingGroup = false,
}: AnimeCardProps) {
  const {
    animeId,
    mainThumbnailUrl,
    status,
    isBreak,
    titleKor,
    dayOfWeek,
    scheduledAt,
    isRescheduled,
    genre,
    medium,
    ottDtos,
  } = anime;
  const [imageError, setImageError] = useState(false);
  const [screenSize, setScreenSize] = useState('desktop');
  const { navigateToDetail } = useNavigation();

  // 화면 크기 감지
  useEffect(() => {
    const checkScreenSize = () => {
      if (window.innerWidth >= 640) {
        setScreenSize('desktop');
      } else if (window.innerWidth >= 400) {
        setScreenSize('tablet');
      } else {
        setScreenSize('mobile');
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // 애니메이션 카드 클릭 핸들러
  const handleCardClick = () => {
    navigateToDetail(animeId);
  };

  // 디데이 계산 함수 (DayOfWeekShort 기준)
  const calculateDaysUntilAir = (targetDayOfWeek: string) => {
    if (
      !targetDayOfWeek ||
      targetDayOfWeek === 'NONE' ||
      targetDayOfWeek === 'SPECIAL'
    ) {
      return 0;
    }

    // DayOfWeekShort를 숫자로 변환 (MON=1, TUE=2, ..., SUN=0)
    const dayMap: Record<string, number> = {
      MON: 1,
      TUE: 2,
      WED: 3,
      THU: 4,
      FRI: 5,
      SAT: 6,
      SUN: 0,
    };

    const targetDay = dayMap[targetDayOfWeek];
    if (targetDay === undefined) {
      return 0;
    }

    // 현재 요일 구하기 (0=일요일, 1=월요일, ..., 6=토요일)
    const now = new Date();
    const currentDay = now.getDay();

    // 현재 요일부터 목표 요일까지의 차이 계산
    let daysDiff = targetDay - currentDay;

    // 음수이면 다음 주로 계산
    if (daysDiff < 0) {
      daysDiff += 7;
    }

    // 오늘이 목표 요일이면 D-DAY (0)
    // 다음 요일이면 D-1, 그 다음이면 D-2, ...
    return daysDiff;
  };

  // 방영 시간 포맷팅
  const formatAirTime = (scheduledAt: string, airTime?: string) => {
    // dateTime 형식인지 확인 (ISO 8601 형식: "T" 포함 또는 숫자와 하이픈/콜론 포함)
    const isDateTimeFormat = (str: string) => {
      return /^\d{4}-\d{2}-\d{2}/.test(str) || str.includes('T');
    };

    // 극장판의 경우 airTime 필드 사용
    if (medium === 'MOVIE' && airTime) {
      if (isDateTimeFormat(airTime)) {
        const date = new Date(airTime);
        if (!isNaN(date.getTime())) {
          const month = date.getMonth() + 1;
          const day = date.getDate();
          return `${month}/${day} 개봉`;
        }
      }
      return `${airTime} 개봉`;
    }

    // 극장판이지만 airTime이 없는 경우 scheduledAt 사용
    if (medium === 'MOVIE' && scheduledAt) {
      const date = new Date(scheduledAt);
      const month = date.getMonth() + 1; // 0부터 시작하므로 +1
      const day = date.getDate();
      return `${month}/${day} 개봉`;
    }

    // UPCOMING 상태인 경우 scheduledAt 기준으로 디데이 계산
    // 단, scheduledAt이 현재 시각을 지나지 않았을 때만 표시
    if (status === 'UPCOMING' && dayOfWeek !== 'SPECIAL') {
      // scheduledAt이 현재 시각을 지나지 않았는지 확인
      if (scheduledAt) {
        const scheduledDate = new Date(scheduledAt);
        const now = new Date();

        // scheduledAt이 현재 시각보다 미래인 경우에만 디데이 표시
        if (!isNaN(scheduledDate.getTime()) && scheduledDate > now) {
          // scheduledAt의 날짜와 현재 날짜를 비교하여 D-Day 계산
          // 00:00 ~ 05:00 시간대는 전날로 간주
          let scheduledYear = scheduledDate.getFullYear();
          let scheduledMonth = scheduledDate.getMonth();
          let scheduledDay = scheduledDate.getDate();
          const scheduledHours = scheduledDate.getHours();

          // 00:00 ~ 05:00인 경우 하루 빼기
          if (scheduledHours < 5) {
            const prevDay = new Date(
              scheduledYear,
              scheduledMonth,
              scheduledDay - 1
            );
            scheduledYear = prevDay.getFullYear();
            scheduledMonth = prevDay.getMonth();
            scheduledDay = prevDay.getDate();
          }

          const scheduledDateOnly = new Date(
            scheduledYear,
            scheduledMonth,
            scheduledDay
          );
          const nowDateOnly = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );
          const daysDiff = Math.floor(
            (scheduledDateOnly.getTime() - nowDateOnly.getTime()) /
              (1000 * 60 * 60 * 24)
          );

          if (daysDiff > 0) {
            return `D-${daysDiff}`;
          } else if (daysDiff === 0) {
            return 'D-DAY';
          }
        }
        // scheduledAt이 현재 시각을 지났으면 시간만 표시
        if (!isNaN(scheduledDate.getTime()) && scheduledDate <= now) {
          let hours = scheduledDate.getHours();
          const minutes = scheduledDate
            .getMinutes()
            .toString()
            .padStart(2, '0');
          // 00:00 ~ 04:59인 경우 24시간 더하기
          if (hours < 5) {
            hours += 24;
          }
          return `${hours.toString().padStart(2, '0')}:${minutes}`;
        }
      } else {
        // scheduledAt이 없으면 요일 기준으로만 계산
        const daysUntil = calculateDaysUntilAir(dayOfWeek);
        if (daysUntil > 0) {
          return `D-${daysUntil}`;
        } else if (daysUntil === 0) {
          return 'D-DAY';
        }
      }
    }

    // airTime이 있는 경우 우선 사용 (검색 결과 포함)
    if (airTime) {
      // dateTime 형식인 경우 시간만 표시
      if (isDateTimeFormat(airTime)) {
        const airDate = new Date(airTime);
        if (!isNaN(airDate.getTime())) {
          let hours = airDate.getHours();
          const minutes = airDate.getMinutes().toString().padStart(2, '0');
          // 00:00 ~ 04:59인 경우 24시간 더하기
          if (hours < 5) {
            hours += 24;
          }
          return `${hours.toString().padStart(2, '0')}:${minutes}`;
        }
      }
      // HH:MM 또는 HH:MM:SS 형식인 경우 (LocalTime은 HH:MM:SS로 올 수 있음)
      if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(airTime)) {
        const [hoursStr, minutesStr] = airTime.split(':');
        let hours = parseInt(hoursStr, 10);
        // 00:00 ~ 04:59인 경우 24시간 더하기
        if (hours < 5) {
          hours += 24;
        }
        return `${hours.toString().padStart(2, '0')}:${minutesStr}`;
      }
      return airTime;
    }

    // airTime이 없는 경우 scheduledAt 사용
    if (scheduledAt) {
      const date = new Date(scheduledAt);
      let hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      // 00:00 ~ 04:59인 경우 24시간 더하기
      if (hours < 5) {
        hours += 24;
      }
      return `${hours.toString().padStart(2, '0')}:${minutes}`;
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
      const thisWeekEndTime = new Date(
        thisWeekScheduledTime.getTime() + 23 * 60 * 1000 + 59 * 1000
      );
      const isCurrentlyAiring =
        now >= thisWeekScheduledTime && now <= thisWeekEndTime;

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
  const getStatusColor = (status?: string) => {
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
  const getStatusText = (status?: string) => {
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
      MON: '월',
      TUE: '화',
      WED: '수',
      THU: '목',
      FRI: '금',
      SAT: '토',
      SUN: '일',
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
      TVA: 'TVA',
      MOVIE: '극장판',
      OVA: 'OVA',
      SPECIAL: '특별편성',
    };
    return mediumMap[medium] || medium;
  };

  return (
    <div
      data-anime-item
      className={cn(
        'overflow-hidden rounded-lg bg-white transition-all duration-200 hover:scale-[1.02] sm:rounded-2xl dark:bg-zinc-800',
        'flex h-full w-full max-w-[250px] flex-col sm:max-w-[280px]',
        'shadow-[0_1.9px_7.2px_rgba(0,0,0,0.1)]',
        'cursor-pointer',
        isCurrentlyAiring() && 'ring-brand ring-2',
        className
      )}
      onClick={handleCardClick}
      title={titleKor}
    >
      {/* Thumbnail Image */}
      <div
        className={cn(
          'relative w-full overflow-hidden',
          screenSize === 'mobile' ? 'h-[180px]' : 'h-[240px] sm:h-[340px]'
        )}
      >
        <img
          src={mainThumbnailUrl}
          alt={titleKor}
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
        />

        {/* OTT Services Overlay */}
        <div className="xs:px-3 absolute bottom-3 flex items-center justify-start gap-1.5 px-1 sm:gap-[10px]">
          {(ottDtos || []).slice(0, 5).map((ott, index) => (
            <div
              key={index}
              className="relative min-w-0 cursor-pointer drop-shadow-[0_0_5.35px_rgba(0,0,0,0.5)] transition-transform duration-200 hover:scale-110"
              onClick={(e) => {
                e.stopPropagation(); // 카드 클릭 이벤트 방지
                if (ott.watchUrl) {
                  window.open(ott.watchUrl, '_blank');
                }
              }}
            >
              {ott.ottType === OttType.NETFLIX && (
                <img
                  src="/icons/netflix-logo.svg"
                  alt="Netflix"
                  className="h-full w-full object-contain"
                />
              )}
              {ott.ottType === OttType.LAFTEL && (
                <img
                  src="/icons/laftel-logo.svg"
                  alt="LAFTEL"
                  className="h-full w-full object-contain"
                />
              )}
              {ott.ottType === OttType.TVING && (
                <img
                  src="/icons/tving-logo.svg"
                  alt="Tving"
                  className="h-full w-full object-contain"
                />
              )}
              {ott.ottType === OttType.WAVVE && (
                <img
                  src="/icons/wavve-logo.svg"
                  alt="Wavve"
                  className="h-full w-full object-contain"
                />
              )}
              {ott.ottType === OttType.WATCHA && (
                <img
                  src="/icons/watcha-logo.svg"
                  alt="Watcha"
                  className="h-full w-full object-contain"
                />
              )}
            </div>
          ))}
        </div>

        {/* Status Badge - 모바일 375px 미만에서 "곧 시작" 그룹에서는 숨김 */}
        <div
          className={cn(
            'absolute top-3 left-3',
            isUpcomingGroup && 'max-[374px]:hidden'
          )}
        >
          <span
            className={cn(
              'rounded px-2 py-1 text-xs font-medium',
              getStatusColor(status)
            )}
          >
            {getStatusText(status)}
          </span>
        </div>

        {/* Live Badge - 현재 방영중인 경우에만 표시 */}
        {isCurrentlyAiring() && (
          <div className="absolute top-3 left-16">
            <span className="bg-brand rounded px-2 py-1 text-xs font-bold text-white">
              라이브
            </span>
          </div>
        )}

        {/* Break Badge */}
        {isBreak && (
          <div className="absolute top-12 left-3">
            <span className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
              결방
            </span>
          </div>
        )}

        {/* Time Remaining Badge - 모바일에서만 포스터 오른쪽 위에 표시 */}
        {timeRemaining && screenSize === 'mobile' && (
          <div className="absolute top-3 right-3">
            <div
              className={cn(
                'flex items-center rounded-md px-2 py-1',
                isCurrentlyAiring()
                  ? 'bg-brand'
                  : 'bg-yellow-400 dark:bg-[#FED783]'
              )}
            >
              <span
                className={cn(
                  'text-[10px] font-bold',
                  isCurrentlyAiring() ? 'text-white' : 'text-[#65142f]'
                )}
              >
                {timeRemaining}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div
        className={cn(
          'flex flex-1 flex-col text-left',
          screenSize === 'mobile' ? 'p-2' : 'p-3 sm:p-4'
        )}
      >
        {/* Title and Air Time Section */}
        <div className="flex-1">
          {/* Title - 고정 높이로 2줄 기준 설정 */}
          <div
            className={cn(
              'relative',
              screenSize === 'mobile' ? 'h-[32px]' : 'h-[40px] sm:h-[48px]'
            )}
          >
            <h3
              className={cn(
                'line-clamp-2 leading-tight font-bold',
                screenSize === 'mobile'
                  ? 'text-[12px]'
                  : 'text-[14px] sm:text-[16px]'
              )}
            >
              {titleKor}
            </h3>

            {/* 제목 아래 회색선 - 제목 프레임 내에서 아래 왼쪽 정렬 */}
            <div className="absolute bottom-0 left-0 h-0 w-[90px]">
              <div className="h-[1px] w-full bg-[#ced4da] dark:bg-zinc-700"></div>
            </div>
          </div>

          {/* Air Time and Countdown */}
          <div
            className={cn(
              'flex items-center',
              screenSize === 'mobile' ? 'mt-[6px]' : 'mt-[9px]'
            )}
          >
            <div className="flex items-center gap-2">
              {(() => {
                const airTimeText = formatAirTime(
                  scheduledAt,
                  anime.airTime?.toString() || ''
                );
                const isUpcomingCountdown =
                  status === 'UPCOMING' && airTimeText.includes('D-');

                if (isUpcomingCountdown) {
                  // UPCOMING 상태의 "D-" 텍스트에 검정 바탕에 흰 글씨 스타일 적용
                  // scheduledAt에서 시간 추출
                  const getTimeFromScheduledAt = (scheduledAt: string) => {
                    if (!scheduledAt) return '';
                    const date = new Date(scheduledAt);
                    let hours = date.getHours();
                    const minutes = date
                      .getMinutes()
                      .toString()
                      .padStart(2, '0');
                    // 00:00 ~ 04:59인 경우 24시간 더하기
                    if (hours < 5) {
                      hours += 24;
                    }
                    return `${hours.toString().padStart(2, '0')}:${minutes}`;
                  };

                  return (
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-medium text-[#868E96]">
                        {medium === 'MOVIE'
                          ? getDayInKorean(dayOfWeek) // 극장판은 요일만 표시
                          : medium === 'TVA' && dayOfWeek === 'SPECIAL'
                            ? getDayInKorean(dayOfWeek)
                            : getDayInKorean(dayOfWeek)}
                      </span>
                      <span className="hidden rounded-md bg-black px-2 py-0.5 text-[13px] font-bold text-white sm:inline-block">
                        {airTimeText}
                      </span>
                      <span className="text-[14px] font-medium text-[#868E96]">
                        {getTimeFromScheduledAt(scheduledAt)}
                      </span>
                    </div>
                  );
                } else {
                  // 일반적인 airTime 표시
                  return (
                    <span className="text-[14px] font-medium text-[#868E96]">
                      {medium === 'MOVIE'
                        ? formatAirTime(
                            scheduledAt,
                            anime.airTime?.toString() || ''
                          ) // 극장판은 요일 없이 시간만 표시
                        : medium === 'TVA' && dayOfWeek === 'SPECIAL'
                          ? `${getDayInKorean(dayOfWeek)} · ${formatAirTime(scheduledAt, anime.airTime?.toString() || '')}`
                          : `${getDayInKorean(dayOfWeek)} ${formatAirTime(scheduledAt, anime.airTime?.toString() || '')}`}
                    </span>
                  );
                }
              })()}
              {isRescheduled && (
                <span className="rounded bg-orange-100 px-2 py-1 text-xs text-orange-600">
                  편성 변경
                </span>
              )}
            </div>
            {timeRemaining && screenSize === 'desktop' && (
              <>
                <div className="hidden w-[7px] sm:block"></div>
                <div
                  className={cn(
                    'flex items-center rounded-md px-2 py-0.5',
                    isCurrentlyAiring()
                      ? 'bg-brand'
                      : 'bg-yellow-400 dark:bg-[#FED783]'
                  )}
                >
                  <span
                    className={cn(
                      'text-[13px] font-bold',
                      isCurrentlyAiring() ? 'text-white' : 'text-[#65142f]'
                    )}
                  >
                    {timeRemaining}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Genres and Medium Type - 데스크톱에서만 표시 */}
        {screenSize === 'desktop' && (
          <div className="mt-[5px] flex items-center justify-between">
            {/* Genres */}
            <span className="pr-2 text-[13px] font-medium text-[#868E96]">
              {genre}
            </span>

            {/* Medium Type */}
            <span className="text-[13px] font-normal whitespace-nowrap text-[#868E96]">
              {getMediumInKorean(medium)}
            </span>
          </div>
        )}

        {/* Tablet: D-DAY and Time Remaining - 태블릿에서만 표시 */}
        {screenSize === 'tablet' && (
          <div className="mt-[5px] flex items-center justify-between">
            {/* D-DAY 배지 */}
            {(() => {
              const airTimeText = formatAirTime(
                scheduledAt,
                anime.airTime?.toString() || ''
              );
              const isUpcomingCountdown =
                status === 'UPCOMING' && airTimeText.includes('D-');

              if (isUpcomingCountdown) {
                return (
                  <span className="rounded-md bg-black px-2 py-1 text-[12px] font-bold text-white">
                    {airTimeText}
                  </span>
                );
              }
              return null;
            })()}

            {/* 시간 정보 */}
            {timeRemaining && (
              <div
                className={cn(
                  'flex items-center rounded-md px-2 py-1',
                  isCurrentlyAiring()
                    ? 'bg-brand'
                    : 'bg-yellow-400 dark:bg-[#FED783]'
                )}
              >
                <span
                  className={cn(
                    'text-[12px] font-bold',
                    isCurrentlyAiring() ? 'text-white' : 'text-[#65142f]'
                  )}
                >
                  {timeRemaining}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
