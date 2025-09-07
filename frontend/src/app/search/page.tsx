'use client';

import { useState, useEffect, useRef } from 'react';
import AnimeSearchBar from '@/components/search/ui/AnimeSearchBar';
import AnimeCard from '@/components/anime/AnimeCard';
import DaySelection, { DayOfWeek } from '@/components/search/ui/DaySelection';
import SearchFilters from '@/components/search/filters/SearchFilters';
import SearchInput from '@/components/search/ui/SearchInput';
import { getCurrentSchedule, getScheduleByYearAndQuarter } from '@/api/search';
import type { AnimePreviewDto, AnimePreviewListDto } from '@/types/api';
import { getCurrentYearAndQuarter } from '@/lib/quarterUtils';
import { searchMatch, extractChosung } from '@/lib/searchUtils';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';
import { useImagePreloading } from '@/hooks/useImagePreloading';
import useSWR from 'swr';
import { fetcher } from '@/api/client';

// 테스트용 애니메이션 데이터
const testAnimes = [
  {
    id: 1,
    title: "노랫소리는 밀푀유",
    thumbnailUrl: "/banners/duckstar-logo.svg", // 임시 이미지
    airTime: "목 21:25",
    timeRemaining: "15시간 9분 남음",
    genres: ["음악", "아카펠라"],
    ottServices: ["LAFTEL", "Netflix"],
    medium: "TVA" as const
  },
  {
    id: 2,
    title: "귀멸의 칼날",
    thumbnailUrl: "/banners/duckstar-logo.svg",
    airTime: "일 23:00",
    timeRemaining: "3일 17시간 남음",
    genres: ["액션", "판타지"],
    ottServices: ["Crunchyroll"],
    medium: "TVA" as const
  },
  {
    id: 3,
    title: "원피스",
    thumbnailUrl: "/banners/duckstar-logo.svg",
    airTime: "일 09:30",
    timeRemaining: "3일 8시간 남음",
    genres: ["액션", "모험"],
    ottServices: ["Crunchyroll", "Funimation"],
    medium: "TVA" as const
  },
  {
    id: 4,
    title: "나루토",
    thumbnailUrl: "/banners/duckstar-logo.svg",
    airTime: "토 18:00",
    timeRemaining: "2일 16시간 남음",
    genres: ["액션", "닌자"],
    ottServices: ["Crunchyroll"],
    medium: "TVA" as const
  },
  {
    id: 5,
    title: "드래곤볼",
    thumbnailUrl: "/banners/duckstar-logo.svg",
    airTime: "토 10:00",
    timeRemaining: "2일 8시간 남음",
    genres: ["액션", "SF"],
    ottServices: ["Crunchyroll", "Funimation"],
    medium: "TVA" as const
  },
  {
    id: 6,
    title: "블리치",
    thumbnailUrl: "/banners/duckstar-logo.svg",
    airTime: "금 22:00",
    timeRemaining: "1일 20시간 남음",
    genres: ["액션", "초자연"],
    ottServices: ["Crunchyroll"],
    medium: "TVA" as const
  }
];

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('일'); // 기본값을 "일"로 설정
  const [selectedOttServices, setSelectedOttServices] = useState<string[]>([]);
  const [randomAnimeTitle, setRandomAnimeTitle] = useState<string>('');
  
  // DaySelection sticky 관련 상태
  const [isDaySelectionSticky, setIsDaySelectionSticky] = useState(false);
  
  // Ref들
  const daySelectionRef = useRef<HTMLDivElement>(null);

  // 이미지 프리로딩 훅
  const { preloadSearchResults } = useImagePreloading();

  // 현재 연도와 분기
  const { year, quarter } = getCurrentYearAndQuarter();
  const swrKey = `/api/v1/search/${year}/${quarter}`;

  // SWR을 사용한 데이터 페칭 (개선된 캐싱 설정)
  const { data: scheduleData, error, isLoading } = useSWR<AnimePreviewListDto>(
    swrKey,
    () => getCurrentSchedule(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1분간 중복 요청 방지
      revalidateIfStale: false, // 캐시된 데이터가 있으면 재검증하지 않음
      revalidateOnMount: true, // 컴포넌트 마운트 시에만 재검증
      refreshInterval: 0, // 자동 새로고침 비활성화
      errorRetryCount: 3, // 에러 시 3번 재시도
      errorRetryInterval: 5000, // 재시도 간격 5초
      shouldRetryOnError: (error) => {
        // 4xx 에러는 재시도하지 않음
        return !error?.status || error.status >= 500;
      },
    }
  );

  // 스크롤 복원 훅 사용 (search 페이지에서만 활성화)
  useScrollRestoration({
    saveInterval: 150,
    smooth: false,
    restoreDelay: 100,
  });

  // 분기를 시즌으로 변환 (기존 형식 유지)
  const getSeasonInKorean = (quarter: number): string => {
    switch (quarter) {
      case 1:
        return '겨울';
      case 2:
        return '봄';
      case 3:
        return '여름';
      case 4:
        return '가을';
      default:
        return '알 수 없음';
    }
  };

  // 공통 로직의 extractChosung 함수 사용

  // 데이터 로딩 완료 시 초기 설정
  useEffect(() => {
    if (scheduleData) {
      // "곧 시작" 그룹이 있는지 확인하고, 있으면 "곧 시작"으로, 없으면 "일"로 기본값 설정
      const upcomingAnimes = Object.values(scheduleData.schedule).flat().filter(anime => {
        // NOW_SHOWING 상태이고 scheduledAt이 유효한 애니메이션만
        return anime.status === 'NOW_SHOWING' && anime.scheduledAt;
      });
      
      if (upcomingAnimes.length > 0) {
        setSelectedDay('곧 시작');
      } else {
        setSelectedDay('일');
      }
      
      // 서버에서 받은 애니메이션 중에서 랜덤으로 하나 선택
      if (scheduleData.schedule) {
        const allAnimes = Object.values(scheduleData.schedule).flat();
        if (allAnimes.length > 0) {
          const randomIndex = Math.floor(Math.random() * allAnimes.length);
          const selectedAnime = allAnimes[randomIndex];
          
          // 검색 결과 이미지 프리로딩
          preloadSearchResults(allAnimes);
          const chosung = extractChosung(selectedAnime.titleKor);
          const koreanCount = (selectedAnime.titleKor.match(/[가-힣]/g) || []).length;
          
          // 한글이 3글자 이상인 순수 한글 제목만 초성 표시
          if (koreanCount >= 3 && chosung.length >= 3) {
            const limitedChosung = chosung.slice(0, 3);
            setRandomAnimeTitle(`${selectedAnime.titleKor} (예: ${limitedChosung}...)`);
          } else {
            // 혼합 제목이나 한글이 적은 경우는 초성 없이 표시
            setRandomAnimeTitle(selectedAnime.titleKor);
          }
        }
      }
    }
  }, [scheduleData]);
  
  // DaySelection sticky 처리 및 스크롤 위치에 따른 자동 네비게이션 업데이트
  useEffect(() => {
    // OTT 필터링이 활성화된 경우 또는 검색 중일 때 sticky 처리하지 않음
    if (selectedOttServices.length > 0 || searchQuery.trim()) {
      setIsDaySelectionSticky(false);
      return;
    }
    
    const headerHeight = 60; // 헤더 높이
    const daySelectionHeight = 44; // DaySelection 높이 (h-11 = 44px)
    const daySelectionMargin = 40; // DaySelection 하단 마진 (mb-[40px])
    
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const daySelectionTop = daySelectionRef.current?.offsetTop || 0;
      
      // DaySelection이 헤더 아래로 스크롤될 때 sticky 활성화
      if (scrollY >= daySelectionTop - headerHeight) {
        setIsDaySelectionSticky(true);
      } else {
        setIsDaySelectionSticky(false);
      }
      
             // 스크롤 위치에 따라 현재 보이는 섹션 감지 및 네비게이션 자동 업데이트
       const sections = [
         { id: 'upcoming', day: '곧 시작' as DayOfWeek },
         { id: 'sun', day: '일' as DayOfWeek },
         { id: 'mon', day: '월' as DayOfWeek },
         { id: 'tue', day: '화' as DayOfWeek },
         { id: 'wed', day: '수' as DayOfWeek },
         { id: 'thu', day: '목' as DayOfWeek },
         { id: 'fri', day: '금' as DayOfWeek },
         { id: 'sat', day: '토' as DayOfWeek },
         { id: 'special', day: '특별편성 및 극장판' as DayOfWeek }
       ];
      
      // 현재 스크롤 위치에서 가장 가까운 섹션 찾기
      let currentSection = sections[0];
      let minDistance = Infinity;
      
      sections.forEach(({ id, day }) => {
        const element = document.getElementById(id);
        if (element) {
          const elementTop = element.offsetTop - headerHeight - daySelectionHeight - daySelectionMargin;
          const distance = Math.abs(scrollY - elementTop);
          
          if (distance < minDistance) {
            minDistance = distance;
            currentSection = { id, day };
          }
        }
      });
      
      // 현재 섹션과 다른 경우에만 selectedDay 업데이트 (무한 루프 방지)
      if (currentSection.day !== selectedDay) {
        setSelectedDay(currentSection.day);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [selectedOttServices.length, selectedDay, searchQuery]);
  
  // 섹션으로 스크롤하는 함수
  const scrollToSection = (sectionId: string) => {
    // OTT 필터링이 활성화된 경우 DaySelection을 표시하지 않음
    if (selectedOttServices.length > 0) {
      return;
    }
    
    if (sectionId === 'top') {
      // 페이지 상단으로 스크롤
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      return;
    }
    
    const element = document.getElementById(sectionId);
    if (element) {
      const headerHeight = 60; // 헤더 높이
      const daySelectionHeight = 44; // DaySelection 높이 (h-11 = 44px)
      const daySelectionMargin = 40; // DaySelection 하단 마진 (mb-[40px])
      
      // 요일 제목 위의 세퍼레이터에 정확히 위치하도록 계산
      // 세퍼레이터가 헤더 아래 60px + DaySelection 높이 + 여백에 위치
      const elementTop = element.offsetTop - headerHeight - daySelectionHeight - daySelectionMargin;
      
      window.scrollTo({
        top: elementTop,
        behavior: 'smooth'
      });
    }
  };
  


  // 전체 보기를 위한 요일별 그룹화된 데이터
  const groupedAnimes = scheduleData ? (() => {

    const dayOrder: (keyof typeof scheduleData.schedule)[] = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SPECIAL'];
    const grouped: { [key: string]: AnimePreviewDto[] } = {};
    
    // "곧 시작" 그룹 추가 (12시간 이내 방영 예정인 애니메이션들 + 현재 방영중인 애니메이션들)
    // OTT 필터링이 활성화된 경우 또는 검색 중일 때 "곧 시작" 그룹은 제외
    if (selectedOttServices.length === 0 && !searchQuery.trim()) {
      const upcomingAnimes = Object.values(scheduleData!.schedule).flat().filter(anime => {
        // NOW_SHOWING 상태이고 scheduledAt이 유효한 애니메이션만
        if (anime.status !== 'NOW_SHOWING' || !anime.scheduledAt) return false;
        
        const now = new Date();
        const scheduled = new Date(anime.scheduledAt);
        
        // scheduledAt이 유효한 날짜인지 확인
        if (isNaN(scheduled.getTime())) return false;
        
        // scheduledAt에서 요일과 시간, 분만 추출
        const targetDayOfWeek = scheduled.getDay();
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
        
        // 현재 방영중인지 확인 (이번 주 방영 시간 기준으로 23분 59초 동안)
        const thisWeekEndTime = new Date(thisWeekScheduledTime.getTime() + 23 * 60 * 1000 + 59 * 1000);
        const isCurrentlyAiring = now >= thisWeekScheduledTime && now <= thisWeekEndTime;
        
        // 현재 방영중인 경우 항상 포함
        if (isCurrentlyAiring) return true;
        
        // 이번 주 방영이 끝난 경우, 다음 주 방영 시간을 기준으로 판단
        if (now > thisWeekEndTime) {
          // 다음 주 방영 시간까지 12시간 이내인지 확인
          const diff = nextWeekScheduledTime.getTime() - now.getTime();
          const hours = Math.floor(diff / (1000 * 60 * 60));
          
          return hours <= 12 && hours >= 0;
        }
        
        // 이번 주 방영 시작 전인 경우 12시간 이내만 포함
        if (thisWeekScheduledTime > now) {
          const diff = thisWeekScheduledTime.getTime() - now.getTime();
          const hours = Math.floor(diff / (1000 * 60 * 60));
          
          // 12시간 이내이고, 남은 시간이 유효한 경우만
          return hours <= 12 && hours >= 0;
        }
        
        return false;
      });
      
      if (upcomingAnimes.length > 0) {
        // 검색어 필터링 (제목에 대해서만 검색)
        let filteredUpcoming = [...upcomingAnimes];
        if (searchQuery.trim()) {
          filteredUpcoming = filteredUpcoming.filter(anime => 
            searchMatch(searchQuery, anime.titleKor)
          );
        }
        
        if (filteredUpcoming.length > 0) {
          // 방영 시간 순서대로 정렬 (현재 방영중인 것 먼저, 그 다음 방영 예정 순)
          filteredUpcoming.sort((a, b) => {
            if (!a.scheduledAt || !b.scheduledAt) return 0;
            
            const now = new Date();
            const aScheduled = new Date(a.scheduledAt);
            const bScheduled = new Date(b.scheduledAt);
            
            // 현재 방영중인지 확인
            const aEndTime = new Date(aScheduled.getTime() + 24 * 60 * 1000);
            const bEndTime = new Date(bScheduled.getTime() + 24 * 60 * 1000);
            const aIsCurrentlyAiring = now >= aScheduled && now <= aEndTime;
            const bIsCurrentlyAiring = now >= bScheduled && now <= bEndTime;
            
            // 현재 방영중인 것을 먼저 표시
            if (aIsCurrentlyAiring && !bIsCurrentlyAiring) return -1;
            if (!aIsCurrentlyAiring && bIsCurrentlyAiring) return 1;
            
            // 둘 다 방영중이거나 둘 다 방영 예정인 경우, 방영 시간 순서대로 정렬
            return aScheduled.getTime() - bScheduled.getTime();
          });
          
          grouped['UPCOMING'] = filteredUpcoming;
        }
      }
    }
    
    dayOrder.forEach(day => {
      if (day === 'SPECIAL') {
        // 특별편성 및 극장판: SPECIAL 요일 + MOVIE 타입 애니메이션
        const specialAnimes = scheduleData.schedule['SPECIAL'] || [];
        const movieAnimes = Object.values(scheduleData.schedule).flat().filter(anime => 
          anime.medium === 'MOVIE'
        );
        
        // 중복 제거 (animeId 기준)
        const uniqueMovieAnimes = movieAnimes.filter(anime => 
          !scheduleData.schedule['SPECIAL']?.some(special => special.animeId === anime.animeId)
        );
        
        let allAnimes = [...specialAnimes, ...uniqueMovieAnimes];
        
        // 검색어 필터링 (제목에 대해서만 검색)
        if (searchQuery.trim()) {
          allAnimes = allAnimes.filter(anime => 
            searchMatch(searchQuery, anime.titleKor)
          );
        }
        
                // OTT 서비스 필터링
        if (selectedOttServices.length > 0) {
          allAnimes = allAnimes.filter(anime => {
            const hasMatchingOtt = selectedOttServices.every(selectedOtt => 
              anime.ottDtos.some(ott => 
                ott.ottType && ott.ottType.toLowerCase() === selectedOtt
              )
            );
            return hasMatchingOtt;
          });
        }
        
        if (allAnimes.length > 0) {
          // 시간 순서대로 정렬 (scheduledAt 기준)
          allAnimes.sort((a, b) => {
            if (!a.scheduledAt || !b.scheduledAt) return 0;
            
            // scheduledAt에서 시간 부분만 추출
            const aTime = new Date(a.scheduledAt);
            const bTime = new Date(b.scheduledAt);
            
            // 시간을 분 단위로 변환하여 비교 (같은 날짜 내에서 시간 순서)
            const aMinutes = aTime.getHours() * 60 + aTime.getMinutes();
            const bMinutes = bTime.getHours() * 60 + bTime.getMinutes();
            
            return aMinutes - bMinutes;
          });
          
          grouped[day] = allAnimes;
        }
      } else if (scheduleData.schedule[day] && scheduleData.schedule[day].length > 0) {
        let dayAnimes = [...scheduleData.schedule[day]];
        
        // 검색어 필터링 (제목에 대해서만 검색)
        if (searchQuery.trim()) {
          dayAnimes = dayAnimes.filter(anime => 
            searchMatch(searchQuery, anime.titleKor)
          );
        }
        
        // OTT 서비스 필터링
        if (selectedOttServices.length > 0) {
          dayAnimes = dayAnimes.filter(anime => {
            const hasMatchingOtt = selectedOttServices.every(selectedOtt => 
              anime.ottDtos.some(ott => 
                ott.ottType && ott.ottType.toLowerCase() === selectedOtt
              )
            );
            return hasMatchingOtt;
          });
        }
        
        if (dayAnimes.length > 0) {
          // 시간 순서대로 정렬 (scheduledAt 기준)
          dayAnimes.sort((a, b) => {
            if (!a.scheduledAt || !b.scheduledAt) return 0;
            
            // scheduledAt에서 시간 부분만 추출
            const aTime = new Date(a.scheduledAt);
            const bTime = new Date(b.scheduledAt);
            
            // 시간을 분 단위로 변환하여 비교 (같은 날짜 내에서 시간 순서)
            const aMinutes = aTime.getHours() * 60 + aTime.getMinutes();
            const bMinutes = bTime.getHours() * 60 + bTime.getMinutes();
            
            return aMinutes - bMinutes;
          });
          
          grouped[day] = dayAnimes;
        }
      }
    });
    
    return grouped;
  })() : null;

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8F9FA' }}>
      {/* SearchSection - #F1F3F5 배경, 창 폭 가득, 높이 196px, 레이어 맨 뒤 */}
      <div className="w-full bg-[#F1F3F5] h-[196px] relative">
        {/* SearchFilters 컨테이너 - 하얀색 배경, 위아래 #DADCE0 테두리, 높이 100px, 헤더에서 20px 갭 */}
        <div className="absolute top-5 left-0 w-full h-[100px] bg-white border-t border-b border-[#DADCE0] z-10">
          {/* 배경만 유지 */}
        </div>
        
        {/* SearchFilters와 검색창을 같은 프레임에 배치 */}
        <div className="absolute top-[40px] left-0 w-full px-6 z-10 flex justify-center">
          <div className="w-[852px]">
            {/* SearchFilters */}
            <div className="mb-4">
              <div className="w-[383.98px] h-[36px] flex items-center justify-between">
                <SearchFilters
                  selectedOttServices={selectedOttServices}
                  onOttFilterChange={(ottService) => {
                    if (ottService === 'clear') {
                      setSelectedOttServices([]);
                    } else {
                      setSelectedOttServices(prev => 
                        prev.includes(ottService)
                          ? prev.filter(id => id !== ottService)
                          : [...prev, ottService]
                      );
                    }
                  }}
                  className="w-full"
                />
              </div>
            </div>
            
            {/* SearchInput과 OTT 필터 큐 */}
            <div className="relative">
              <SearchInput
                value={searchQuery}
                onChange={handleSearchChange}
                onSearch={() => {
                  // 검색 실행 로직 (현재는 필터링이 실시간으로 되고 있음)
                }}
                placeholder={randomAnimeTitle || "분기 신작 애니/캐릭터를 검색해보세요..."}
                className="w-full h-[62px]"
              />
              
              {/* OTT 필터 큐 - 검색창 오른쪽에 오버레이 */}
              {selectedOttServices.length > 0 && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex gap-3 items-center">
                  {/* OTT 필터 아이콘들 */}
                  <div className="flex gap-2 items-center">
                    {selectedOttServices.map((ottService, index) => (
                      <div key={index} className="relative">
                        <div 
                          onClick={() => setSelectedOttServices(prev => prev.filter(id => id !== ottService))}
                          className="w-9 h-9 rounded-full overflow-hidden cursor-pointer hover:scale-105 transition-transform"
                        >
                          <img
                            src={`/icons/${ottService.toLowerCase()}-logo.svg`}
                            alt={ottService}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <img
                          src="/icons/remove-filter.svg"
                          alt="제거"
                          className="absolute -top-1 -right-1 w-[17px] h-[17px] pointer-events-none"
                        />
                      </div>
                    ))}
                  </div>
                  
                  {/* 필터 초기화 버튼 */}
                  <button
                    onClick={() => setSelectedOttServices([])}
                    className="text-sm text-gray-500 hover:text-gray-700 underline font-['Pretendard'] whitespace-nowrap cursor-pointer"
                  >
                    필터 초기화
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* YearAndSeason 컴포넌트 - 회색 배경을 중앙으로 꿰뚫는 위치 */}
        <div className="absolute -bottom-6 left-0 w-full z-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="bg-white box-border content-stretch flex gap-2.5 items-center justify-center px-[25px] py-2.5 relative rounded-[12px] w-fit">
              <div className="font-['Pretendard'] font-medium leading-[0] not-italic relative shrink-0 text-[18px] text-black text-nowrap">
                <p className="leading-[22px] whitespace-pre">{year}년 {getSeasonInKorean(quarter)} 애니메이션</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Content Section */}
      <div className="w-full h-[95px] bg-white">
        <div className="max-w-7xl mx-auto px-6 pt-[50px] pb-8">
          {/* Day Selection - OTT 필터링 시 또는 검색 중일 때 숨김 */}
          {selectedOttServices.length === 0 && !searchQuery.trim() && (
            <div ref={daySelectionRef} className="mb-[40px] flex justify-center">
              <DaySelection
                selectedDay={selectedDay}
                onDaySelect={setSelectedDay}
                onScrollToSection={scrollToSection}
              />
            </div>
          )}



        </div>
      </div>

      {/* Anime Grid Section - F8F9FA 배경 */}
      <div className="w-full" style={{ backgroundColor: '#F8F9FA' }}>
        <div className="max-w-7xl mx-auto px-6 pt-8 pb-8">
          {/* Anime Grid - OTT 필터링 시 요일 구분 없이 표시 */}
          {groupedAnimes ? (
            <div className="space-y-0">
              {selectedOttServices.length > 0 || searchQuery.trim() ? (
                // OTT 필터링 시 또는 검색 중일 때: 모든 애니메이션을 하나의 그리드로 표시
                <div>
                  <div className="flex items-end gap-3 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">검색 결과</h2>
                    <span className="text-[12px] font-normal text-[#868E96] font-['Pretendard']">
                      {Object.values(groupedAnimes).flat().length}개의 애니메이션
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[30px]">
                    {Object.values(groupedAnimes).flat().map((anime) => (
                      <AnimeCard
                        key={anime.animeId}
                        anime={anime}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                // OTT 필터링 없을 때: 요일별로 구분하여 표시
                  Object.entries(groupedAnimes).map(([day, dayAnimes], index) => {
                    const dayInKorean = {
                      'UPCOMING': '곧 시작',
                      'SUN': '일요일',
                      'MON': '월요일',
                      'TUE': '화요일',
                      'WED': '수요일',
                      'THU': '목요일',
                      'FRI': '금요일',
                      'SAT': '토요일',
                      'SPECIAL': '특별편성 및 극장판'
                    }[day];
                    
                    // 요일별 섹션 ID 생성
                    const sectionId = day === 'UPCOMING' ? 'upcoming' : 
                                     day === 'SPECIAL' ? 'special' : day.toLowerCase();
                    
                    return (
                      <div key={day} id={sectionId}>
                        {/* 요일 제목 - 검색 중일 때는 숨김 */}
                        {!searchQuery.trim() && (
                          <div className="flex items-end gap-3 mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">{dayInKorean}</h2>
                            {day === 'UPCOMING' && (
                              <span className="text-[12px] font-normal text-[#868E96] font-['Pretendard']">
                                앞으로 12시간 이내
                              </span>
                            )}
                          </div>
                        )}

                        {/* 애니메이션 그리드 */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[30px] mb-12">
                          {dayAnimes.map((anime) => (
                            <AnimeCard
                              key={anime.animeId}
                              anime={anime}
                            />
                          ))}
                        </div>
                        
                        {/* 요일 사이 세퍼레이터 (마지막 요일 제외, 검색 중일 때는 숨김) */}
                        {day !== 'SPECIAL' && !searchQuery.trim() && (
                          <div className="border-t border-gray-200 h-6"></div>
                        )}
                      </div>
                    );
                  })
                )}
            </div>
        ) : (
          // 데이터 로딩 중 또는 에러
          <div className="text-center py-16">
            {isLoading ? (
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
              ) : error ? (
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              ) : (
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              )}
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {isLoading ? '데이터를 불러오는 중...' : 
                 error ? '데이터 로딩에 실패했습니다' : 
                 '검색 결과가 없습니다'}
              </h3>
              <p className="text-gray-500">
                {isLoading ? '잠시만 기다려주세요' : 
                 error ? '다시 시도해주세요' : 
                 '다른 검색어를 시도해보세요'}
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Sticky DaySelection - 헤더 60px 아래에 고정, 검색 중일 때는 숨김 */}
      {isDaySelectionSticky && !searchQuery.trim() && (
        <div 
          className="fixed top-[60px] left-0 w-full bg-white border-b border-gray-200 z-30"
          style={{ 
            top: '60px',
            zIndex: 30,
            transition: 'all 0.3s ease-in-out'
          }}
        >
          <div className="flex justify-center">
            <div className="ml-[120px] md:ml-[300px] w-full">
              <div className="max-w-7xl mx-auto px-6">
                <DaySelection
                  selectedDay={selectedDay}
                  onDaySelect={setSelectedDay}
                  onScrollToSection={scrollToSection}
                />
              </div>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}
