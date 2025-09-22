'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import AnimeSearchBar from '@/components/search/ui/AnimeSearchBar';
import AnimeCard from '@/components/anime/AnimeCard';
import DaySelection, { DayOfWeek } from '@/components/search/ui/DaySelection';
import SearchFilters from '@/components/search/filters/SearchFilters';
import SearchInput from '@/components/search/ui/SearchInput';
import { getCurrentSchedule, getScheduleByYearAndQuarter } from '@/api/search';
import SeasonSelector from '@/components/search/ui/SeasonSelector';
import type { AnimePreviewDto, AnimePreviewListDto } from '@/types/api';
import { searchMatch, extractChosung } from '@/lib/searchUtils';
import { getCurrentYearAndQuarter } from '@/lib/quarterUtils';
// import { useScrollRestoration } from '@/hooks/useScrollRestoration'; // 제거: 직접 구현
import { useImagePreloading } from '@/hooks/useImagePreloading';
import { useSmartImagePreloader } from '@/hooks/useSmartImagePreloader';
import { useQuery } from '@tanstack/react-query';
import { testAnimes } from '@/data/testAnimes';
import { scrollToTop, scrollToPosition, restoreScrollFromStorage, clearStorageFlags } from '@/utils/scrollUtils';
import SearchLoadingSkeleton from '@/components/common/SearchLoadingSkeleton';
import PreloadingProgress from '@/components/common/PreloadingProgress';

// 애니메이션 데이터 (이제 별도 파일에서 import)

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('일'); // 기본값을 "일"로 설정
  const [selectedOttServices, setSelectedOttServices] = useState<string[]>([]);
  const [randomAnimeTitle, setRandomAnimeTitle] = useState<string>('');
  const [isPreloading, setIsPreloading] = useState(false);
  const [preloadingStatus, setPreloadingStatus] = useState({ total: 0, loaded: 0, active: 0 });
  const preloadingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // 분기 선택 상태
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedQuarter, setSelectedQuarter] = useState<number | null>(null);
  const [isCustomSeason, setIsCustomSeason] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false); // 초기화 완료 여부
  const [showOnlyAiring, setShowOnlyAiring] = useState(false); // 방영 중 애니만 보기
  
  // 체크박스 변경 핸들러 (스크롤 위치 유지)
  const handleShowOnlyAiringChange = (checked: boolean) => {
    setShowOnlyAiring(checked);
    
    // 체크박스 상태를 sessionStorage에 저장
    sessionStorage.setItem('showOnlyAiring', checked.toString());
    
    // 현재 선택된 요일로 스크롤 유지
    if (selectedDay && selectedDay !== '곧 시작') {
      const dayToSectionId = {
        '일': 'sun',
        '월': 'mon', 
        '화': 'tue',
        '수': 'wed',
        '목': 'thu',
        '금': 'fri',
        '토': 'sat',
        '특별편성 및 극장판': 'special'
      };
      
      const sectionId = dayToSectionId[selectedDay as keyof typeof dayToSectionId];
      if (sectionId) {
        setTimeout(() => {
          scrollToSection(sectionId);
        }, 100);
      }
    }
  };
  
  // 스티키 요소들을 위한 ref와 상태
  const seasonSelectorRef = useRef<HTMLDivElement>(null);
  const [seasonSelectorHeight, setSeasonSelectorHeight] = useState(0);

  // 페이지 로드 시 스크롤 복원 또는 맨 위로 이동
  useEffect(() => {
    // 디버깅: 모든 sessionStorage 값 확인
    const sidebarNav = sessionStorage.getItem('sidebar-navigation');
    const logoNav = sessionStorage.getItem('logo-navigation');
    const fromAnimeDetail = sessionStorage.getItem('from-anime-detail');
    const searchScroll = sessionStorage.getItem('search-scroll');
    const selectedSeason = sessionStorage.getItem('selected-season');
    
    // 스크롤 복원 상태 확인
    
    // 사이드바 네비게이션인지 확인
    const isSidebarNavigation = sidebarNav === 'true';
    // 로고 네비게이션인지 확인
    const isLogoNavigation = logoNav === 'true';
    // 애니메이션 상세화면에서 돌아온 것인지 확인
    const isFromAnimeDetail = fromAnimeDetail === 'true';
    
    // 저장된 시즌 정보 복원
    if (selectedSeason && !isSidebarNavigation && !isLogoNavigation) {
      try {
        const { year, quarter } = JSON.parse(selectedSeason);
        setSelectedYear(year);
        setSelectedQuarter(quarter);
        
        // 현재 시즌인지 확인하여 isCustomSeason 설정
        const isCurrent = isCurrentSeason(year, quarter);
        setIsCustomSeason(!isCurrent);
      } catch (error) {
        console.error('Failed to parse selected season:', error);
      }
    }
    
    // 저장된 체크박스 상태 복원
    const savedShowOnlyAiring = sessionStorage.getItem('showOnlyAiring');
    if (savedShowOnlyAiring !== null) {
      setShowOnlyAiring(savedShowOnlyAiring === 'true');
    }
    
    if (isSidebarNavigation) {
      // 사이드바 네비게이션인 경우 스크롤을 맨 위로 이동
      // 모든 관련 플래그 정리
      clearStorageFlags('sidebar-navigation', 'search-scroll', 'shouldRestoreScroll', 'from-anime-detail', 'selected-season');
      scrollToTop();
    } else if (isLogoNavigation) {
      // 로고 네비게이션인 경우 스크롤을 맨 위로 이동
      // 모든 관련 플래그 정리
      clearStorageFlags('logo-navigation', 'search-scroll', 'shouldRestoreScroll', 'from-anime-detail', 'selected-season');
      scrollToTop();
    } else if (isFromAnimeDetail) {
      // 애니메이션 상세화면에서 돌아온 경우 스크롤 복원 시도
      if (searchScroll) {
        const y = parseInt(searchScroll);
        scrollToPosition(y);
        // 플래그는 두 번째 useEffect에서 정리하도록 유지
      } else {
        // 스크롤 위치가 없으면 즉시 플래그 제거
        sessionStorage.removeItem('from-anime-detail');
      }
    } else {
      // 리프레시 또는 직접 URL 접근인 경우 스크롤을 맨 위로 이동
      // 모든 관련 플래그 정리
      clearStorageFlags('search-scroll', 'shouldRestoreScroll', 'sidebar-navigation', 'logo-navigation', 'from-anime-detail');
      scrollToTop();
    }
    
    // 초기화 완료 표시
    setIsInitialized(true);
  }, []);
  
  // DaySelection sticky 관련 상태
  const [isDaySelectionSticky, setIsDaySelectionSticky] = useState(false);
  const [isSeasonSelectorSticky, setIsSeasonSelectorSticky] = useState(false);
  
  // Ref들
  const daySelectionRef = useRef<HTMLDivElement>(null);

  // 스크롤 컨테이너 찾기 함수
  const findScrollContainer = () => {
    const candidates = [
      document.documentElement, // html
      document.body, // body
      document.querySelector('main'), // main
    ];
    
    for (const container of candidates) {
      if (container && container.scrollHeight > container.clientHeight) {
        return container;
      }
    }
    
    return window;
  };

  // 1. DaySelection 스티키 처리
  useEffect(() => {
    const container = findScrollContainer();
    
    const handleStickyScroll = () => {
      if (!daySelectionRef.current) return;
      
      const scrollY = container === window ? window.scrollY : (container as HTMLElement).scrollTop;
      const daySelectionRect = daySelectionRef.current.getBoundingClientRect();
      const daySelectionTop = daySelectionRect.top + scrollY;
      
      // DaySelection이 화면 상단에서 60px 지점을 지나면 스티키
      const shouldBeSticky = scrollY >= daySelectionTop - 60;
      
      if (shouldBeSticky !== isDaySelectionSticky) {
        setIsDaySelectionSticky(shouldBeSticky);
      }
    };

    // 초기 체크
    handleStickyScroll();
    
    // 스크롤 이벤트 리스너
    container.addEventListener('scroll', handleStickyScroll, { passive: true });
    
    return () => {
      container.removeEventListener('scroll', handleStickyScroll);
    };
  }, [isDaySelectionSticky]);

  // 2. SeasonSelector 스티키 처리
  useEffect(() => {
    const container = findScrollContainer();
    
    const handleSeasonSelectorStickyScroll = () => {
      if (!seasonSelectorRef.current) return;
      
      const scrollY = container === window ? window.scrollY : (container as HTMLElement).scrollTop;
      const seasonSelectorRect = seasonSelectorRef.current.getBoundingClientRect();
      const seasonSelectorTop = seasonSelectorRect.top + scrollY;
      
      // 시즌 선택기가 화면 상단에서 60px 지점을 지나면 스티키
      const shouldBeSticky = scrollY >= seasonSelectorTop - 60;
      
      if (shouldBeSticky !== isSeasonSelectorSticky) {
        setIsSeasonSelectorSticky(shouldBeSticky);
      }
    };

    // 초기 체크
    handleSeasonSelectorStickyScroll();
    
    // 스크롤 이벤트 리스너
    container.addEventListener('scroll', handleSeasonSelectorStickyScroll, { passive: true });
    
    return () => {
      container.removeEventListener('scroll', handleSeasonSelectorStickyScroll);
    };
  }, [isSeasonSelectorSticky]);

  // 2. 스크롤 섹션 이동 함수
  const scrollToSection = (sectionId: string) => {
    if (sectionId === 'top') {
      const container = findScrollContainer();
      if (container === window) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        container.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    // "upcoming" 섹션은 페이지 맨 위로 스크롤
    if (sectionId === 'upcoming') {
      const container = findScrollContainer();
      if (container === window) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        container.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    const element = document.getElementById(sectionId);
    if (element) {
      const container = findScrollContainer();
      const headerHeight = 60;
      const daySelectionHeight = 44;
      const margin = 70;
      
      const targetY = element.offsetTop - headerHeight - daySelectionHeight - margin;
      
      if (container === window) {
        window.scrollTo({
          top: Math.max(0, targetY),
          behavior: 'smooth'
        });
      } else {
        container.scrollTo({
          top: Math.max(0, targetY),
          behavior: 'smooth'
        });
      }
    }
  };


  // 이미지 프리로딩 훅
  const { preloadSearchResults } = useImagePreloading();
  const { getQueueStatus } = useSmartImagePreloader();

  // 현재 시즌인지 확인하는 함수
  const isCurrentSeason = (year: number, quarter: number): boolean => {
    const current = getCurrentYearAndQuarter();
    return year === current.year && quarter === current.quarter;
  };

  // 분기 선택 핸들러
  const handleSeasonSelect = (year: number, quarter: number) => {
    setSelectedYear(year);
    setSelectedQuarter(quarter);
    
    // 현재 시즌인지 확인하여 isCustomSeason 설정
    const isCurrent = isCurrentSeason(year, quarter);
    setIsCustomSeason(!isCurrent);
    
    // 다른 시즌으로 이동할 때는 체크박스 상태를 sessionStorage에 저장하고 현재 분기로 돌아올 때만 복원
    if (!isCurrent) {
      // 과거 분기로 이동할 때는 체크박스 상태를 저장하고 해제
      sessionStorage.setItem('showOnlyAiring', showOnlyAiring.toString());
      setShowOnlyAiring(false);
    } else {
      // 현재 분기로 돌아올 때는 저장된 체크박스 상태 복원
      const savedShowOnlyAiring = sessionStorage.getItem('showOnlyAiring');
      if (savedShowOnlyAiring !== null) {
        setShowOnlyAiring(savedShowOnlyAiring === 'true');
      }
    }
    
    // 선택된 시즌 정보를 sessionStorage에 저장
    sessionStorage.setItem('selected-season', JSON.stringify({ year, quarter }));
    
    // 현재 분기로 돌아올 때 "곧 시작" 그룹이 있으면 "곧 시작"으로, 없으면 기존 요일 유지
    if (isCurrent) {
      // 데이터가 로드된 후 "곧 시작" 그룹이 있는지 확인
      setTimeout(() => {
        if (scheduleData?.upcomingAnimes && scheduleData.upcomingAnimes.length > 0) {
          setSelectedDay('곧 시작');
          scrollToSection('upcoming');
        } else if (selectedDay && selectedDay !== '곧 시작') {
          // "곧 시작" 그룹이 없으면 기존 선택된 요일로 스크롤
          const dayToSectionId = {
            '일': 'sun',
            '월': 'mon', 
            '화': 'tue',
            '수': 'wed',
            '목': 'thu',
            '금': 'fri',
            '토': 'sat',
            '특별편성 및 극장판': 'special'
          };
          
          const sectionId = dayToSectionId[selectedDay as keyof typeof dayToSectionId];
          if (sectionId) {
            scrollToSection(sectionId);
          }
        }
      }, 200); // 데이터 로딩을 위한 충분한 시간
    } else if (selectedDay && selectedDay !== '곧 시작') {
      // 다른 경우에는 현재 선택된 요일로 스크롤 유지
      const dayToSectionId = {
        '일': 'sun',
        '월': 'mon', 
        '화': 'tue',
        '수': 'wed',
        '목': 'thu',
        '금': 'fri',
        '토': 'sat',
        '특별편성 및 극장판': 'special'
      };
      
      const sectionId = dayToSectionId[selectedDay as keyof typeof dayToSectionId];
      if (sectionId) {
        setTimeout(() => {
          scrollToSection(sectionId);
        }, 100);
      }
    }
  };

  // React Query를 사용한 데이터 페칭 (개선된 캐싱 설정)
  const { data: scheduleData, error, isLoading, isFetching } = useQuery<AnimePreviewListDto>({
    queryKey: isCustomSeason && selectedYear && selectedQuarter 
      ? ['schedule', selectedYear, selectedQuarter]
      : ['schedule', 'current'],
    queryFn: isCustomSeason && selectedYear && selectedQuarter
      ? () => getScheduleByYearAndQuarter(selectedYear, selectedQuarter)
      : getCurrentSchedule, // 현재 시즌일 때는 /api/v1/search 호출
    enabled: isInitialized, // 초기화 완료 후에만 API 호출
    staleTime: 5 * 60 * 1000, // 5분간 fresh 상태 유지
    gcTime: 10 * 60 * 1000, // 10분간 캐시 유지
    refetchOnWindowFocus: false, // 윈도우 포커스 시 재요청 비활성화
    refetchOnReconnect: true, // 네트워크 재연결 시 재요청
    refetchOnMount: true, // 컴포넌트 마운트 시 재요청
    retry: 3, // 에러 시 3번 재시도
    retryDelay: 5000, // 재시도 간격 5초
    retryOnMount: true, // 마운트 시 재시도
  });

  // 현재 연도와 분기 (WeekDto에서만 가져오기)
  const currentYear = scheduleData?.weekDto?.year;
  const currentQuarter = scheduleData?.weekDto?.quarter;

  // 스크롤 복원 직접 구현 (search 화면에서만) - 깜빡임 방지
  useEffect(() => {
    if (scheduleData) {
      const savedY = sessionStorage.getItem('search-scroll');
      const isFromAnimeDetail = sessionStorage.getItem('from-anime-detail') === 'true';
      
      // 애니메이션 상세화면에서 돌아온 경우에만 스크롤 복원
      if (savedY && isFromAnimeDetail) {
        const y = parseInt(savedY);
        console.log('🔄 search 화면 스크롤 복원 (데이터 로드 후):', y);
        
        // 즉시 복원 (깜빡임 방지)
        // 1. window.scrollTo 시도
        window.scrollTo(0, y);
        
        // 2. body 스크롤도 시도 (body가 스크롤 컨테이너인 경우)
        document.body.scrollTop = y;
        
        // 3. documentElement 스크롤도 시도
        document.documentElement.scrollTop = y;
        
        // 추가로 지연 복원도 시도 (확실하게)
        setTimeout(() => {
          window.scrollTo(0, y);
          document.body.scrollTop = y;
          document.documentElement.scrollTop = y;
        }, 0);
        
        setTimeout(() => {
          window.scrollTo(0, y);
          document.body.scrollTop = y;
          document.documentElement.scrollTop = y;
          
          // 스크롤 복원 완료 후 플래그 정리
          sessionStorage.removeItem('from-anime-detail');
        }, 50);
      }
    }
  }, [scheduleData]);

  // 프리로딩 상태 모니터링 (캐시 상태 고려)
  useEffect(() => {
    if (scheduleData) {
      // 기존 인터벌 정리
      if (preloadingIntervalRef.current) {
        clearInterval(preloadingIntervalRef.current);
      }
      
      // 캐시된 데이터인지 확인 (isFetching이 false면 캐시된 데이터)
      const isCachedData = !isFetching;
      
      if (isCachedData) {
        // 캐시된 데이터면 프리로딩 상태를 false로 설정
        setIsPreloading(false);
        setPreloadingStatus({ total: 0, loaded: 0, active: 0 });
        return;
      }
      
      // 새로운 데이터면 프리로딩 시작
      setIsPreloading(true);
      
      // 1초마다 상태 확인
      preloadingIntervalRef.current = setInterval(() => {
        const status = getQueueStatus();
        const isStillLoading = status.total > 0 || status.active > 0;
        
        setIsPreloading(isStillLoading);
        setPreloadingStatus({
          total: status.total + status.loaded,
          loaded: status.loaded,
          active: status.active
        });
        
        // 로딩 완료 시 인터벌 정리
        if (!isStillLoading) {
          if (preloadingIntervalRef.current) {
            clearInterval(preloadingIntervalRef.current);
            preloadingIntervalRef.current = null;
          }
        }
      }, 1000);
      
      // cleanup 함수
      return () => {
        if (preloadingIntervalRef.current) {
          clearInterval(preloadingIntervalRef.current);
          preloadingIntervalRef.current = null;
        }
      };
    }
  }, [scheduleData, isFetching]); // isFetching도 의존성에 추가

  // 컴포넌트 언마운트 시 인터벌 정리
  useEffect(() => {
    return () => {
      if (preloadingIntervalRef.current) {
        clearInterval(preloadingIntervalRef.current);
        preloadingIntervalRef.current = null;
      }
    };
  }, []);

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
          console.log(`🎬 검색 페이지에서 프리로딩 시작: ${allAnimes.length}개 애니메이션`);
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
  
  // 스티키 요소들의 높이 측정
  useEffect(() => {
    const updateHeights = () => {
      if (seasonSelectorRef.current) {
        setSeasonSelectorHeight(seasonSelectorRef.current.offsetHeight);
      }
    };
    
    updateHeights();
    window.addEventListener('resize', updateHeights);
    
    return () => {
      window.removeEventListener('resize', updateHeights);
    };
  }, [isSeasonSelectorSticky]); // 스티키 상태 변경 시에도 높이 재측정

  // 전체 보기를 위한 요일별 그룹화된 데이터
  const groupedAnimes = useMemo(() => {
    if (!scheduleData) return {};
    
    return (() => {

    const dayOrder: (keyof typeof scheduleData.schedule)[] = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SPECIAL'];
    const grouped: { [key: string]: AnimePreviewDto[] } = {};
    
    // 방영 중 필터링 함수
    const filterAiringAnimes = (animes: AnimePreviewDto[]) => {
      if (showOnlyAiring) {
        return animes.filter(anime => anime.status === 'NOW_SHOWING');
      }
      return animes;
    };
    
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
          // 다음 주 방영 시간까지 12시간 이내인지 확인 (밀리초 단위로 정확히 계산)
          const diff = nextWeekScheduledTime.getTime() - now.getTime();
          const twelveHoursInMs = 12 * 60 * 60 * 1000; // 12시간을 밀리초로 변환
          
          return diff <= twelveHoursInMs && diff >= 0;
        }
        
        // 이번 주 방영 시작 전인 경우 12시간 이내만 포함
        if (thisWeekScheduledTime > now) {
          const diff = thisWeekScheduledTime.getTime() - now.getTime();
          const twelveHoursInMs = 12 * 60 * 60 * 1000; // 12시간을 밀리초로 변환
          
          // 12시간 이내이고, 남은 시간이 유효한 경우만
          return diff <= twelveHoursInMs && diff >= 0;
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
        
        // 방영 중 필터링 적용
        filteredUpcoming = filterAiringAnimes(filteredUpcoming);
        
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
        
        // 방영 중 필터링 적용
        allAnimes = filterAiringAnimes(allAnimes);
        
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
        
        // 방영 중 필터링 적용
        dayAnimes = filterAiringAnimes(dayAnimes);
        
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
    })();
  }, [scheduleData, searchQuery, selectedOttServices, showOnlyAiring]);

  // 3. 스크롤 네비게이션 연동 - groupedAnimes가 정의된 후에 실행
  useEffect(() => {
    // groupedAnimes가 없으면 실행하지 않음
    if (!groupedAnimes) return;
    
    const container = findScrollContainer();
    
    const handleNavigationScroll = () => {
      const scrollY = container === window ? window.scrollY : (container as HTMLElement).scrollTop;
      
      // "곧 시작" 그룹이 있는지 확인하여 섹션 정의를 동적으로 생성
      const hasUpcomingGroup = groupedAnimes['UPCOMING'] && groupedAnimes['UPCOMING'].length > 0;
      
      const sections = hasUpcomingGroup ? [
        { id: 'upcoming', day: '곧 시작' },
        { id: 'sun', day: '일' },
        { id: 'mon', day: '월' },
        { id: 'tue', day: '화' },
        { id: 'wed', day: '수' },
        { id: 'thu', day: '목' },
        { id: 'fri', day: '금' },
        { id: 'sat', day: '토' },
        { id: 'special', day: '특별편성 및 극장판' }
      ] : [
        { id: 'sun', day: '일' },
        { id: 'mon', day: '월' },
        { id: 'tue', day: '화' },
        { id: 'wed', day: '수' },
        { id: 'thu', day: '목' },
        { id: 'fri', day: '금' },
        { id: 'sat', day: '토' },
        { id: 'special', day: '특별편성 및 극장판' }
      ];

      // 각 섹션의 실제 위치 계산
      const sectionPositions = sections.map(({ id, day }) => {
        const element = document.getElementById(id);
        if (!element) return null;
        
        // 헤더(60px) + DaySelection(44px) + 카드 1행 높이(약 196px) = 300px
        // 이 값은 섹션 제목과 카드 1행이 모두 보이는 정확한 시점을 나타냄
        const offset = 380;
        
        return {
          id,
          day,
          top: element.offsetTop - offset
        };
      }).filter(Boolean);

      // 현재 스크롤 위치보다 위에 있는 섹션 중 가장 아래쪽 섹션 찾기
      let activeSection = sections[0];
      
      for (let i = sectionPositions.length - 1; i >= 0; i--) {
        const section = sectionPositions[i];
        if (section && scrollY >= section.top) {
          activeSection = { id: section.id, day: section.day };
          break;
        }
      }
      
      // 마지막 섹션("특별편성 및 극장판")에 대한 특별 처리
      // 마지막 섹션에 도달했을 때만 활성화 (다른 섹션보다 우선순위 높게)
      const lastSection = sectionPositions[sectionPositions.length - 1];
      if (lastSection && scrollY >= lastSection.top) {
        // 마지막 섹션에 도달했으면 다른 섹션보다 우선적으로 활성화
        activeSection = { id: lastSection.id, day: lastSection.day };
      }

      // selectedDay 업데이트
      setSelectedDay(prevSelectedDay => {
        if (activeSection.day !== prevSelectedDay) {
          return activeSection.day as DayOfWeek;
        }
        return prevSelectedDay;
      });
    };

    // 초기 실행
    const timeout = setTimeout(handleNavigationScroll, 100);
    
    // 스크롤 이벤트 리스너 등록
    container.addEventListener('scroll', handleNavigationScroll, { passive: true });
    
    return () => {
      clearTimeout(timeout);
      container.removeEventListener('scroll', handleNavigationScroll);
    };
  }, [groupedAnimes]);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  // 데이터 로딩 중이거나 (새로운 데이터를 가져오면서) 프리로딩 중일 때만 스켈레톤 UI 표시
  if (isLoading || (isFetching && isPreloading)) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#F8F9FA' }}>
        <SearchLoadingSkeleton 
          showBanner={true}
          cardCount={12}
          className="pt-8"
        />
      </div>
    );
  }

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
            <div className="flex gap-5 items-center justify-start" ref={seasonSelectorRef}>
              {/* 시즌 선택 드롭다운 */}
              <div className="bg-white box-border content-stretch flex gap-2.5 items-center justify-center px-[25px] py-2.5 relative rounded-[12px] w-fit">
                <SeasonSelector
                  onSeasonSelect={handleSeasonSelect}
                  className="w-fit"
                  currentYear={isCustomSeason ? selectedYear || undefined : currentYear}
                  currentQuarter={isCustomSeason ? selectedQuarter || undefined : currentQuarter}
                />
              </div>
              
              {/* 방영 중 애니만 보기 체크박스 - 현재 분기일 때만 표시 */}
              {!isCustomSeason && (
                <div className="bg-white box-border content-stretch flex gap-2 items-center justify-center px-[25px] py-2.5 relative rounded-[12px] w-fit">
                  <input
                    type="checkbox"
                    id="showOnlyAiring"
                    checked={showOnlyAiring}
                    onChange={(e) => handleShowOnlyAiringChange(e.target.checked)}
                    className="w-4 h-4 accent-[#990033]"
                  />
                  <label 
                    htmlFor="showOnlyAiring" 
                    className="text-sm font-medium text-gray-700 cursor-pointer font-['Pretendard']"
                  >
                    방영 중 애니만 보기
                  </label>
                </div>
              )}
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
            <div className="space-y-0" data-content-loaded>
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
                        isCurrentSeason={!isCustomSeason}
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
                              isCurrentSeason={!isCustomSeason}
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
      
      {/* Sticky SeasonSelector - 헤더 60px 아래에 고정 */}
      {isSeasonSelectorSticky && (
        <div 
          className="fixed top-[60px] left-0 w-full bg-white border-b border-gray-200 z-40"
          style={{ 
            top: '60px',
            left: '200px', // 사이드바 너비만큼 오른쪽으로 이동
            width: 'calc(100vw - 200px)', // 사이드바를 제외한 너비
            zIndex: 40,
            transition: 'all 0.3s ease-in-out'
          }}
        >
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex gap-5 items-center justify-start">
              {/* 애니메이션 그리드와 정렬을 위한 시즌 선택기만 표시 */}
              {/* 시즌 선택 드롭다운 */}
              <div className="bg-white box-border content-stretch flex gap-2.5 items-center justify-center px-[25px] py-2.5 relative rounded-[12px] w-fit">
                <SeasonSelector
                  onSeasonSelect={handleSeasonSelect}
                  className="w-fit"
                  currentYear={isCustomSeason ? selectedYear || undefined : currentYear}
                  currentQuarter={isCustomSeason ? selectedQuarter || undefined : currentQuarter}
                />
              </div>
              
              {/* 방영 중 애니만 보기 체크박스 - 현재 분기일 때만 표시 */}
              {!isCustomSeason && (
                <div className="bg-white box-border content-stretch flex gap-2 items-center justify-center px-[25px] py-2.5 relative rounded-[12px] w-fit">
                  <input
                    type="checkbox"
                    id="showOnlyAiringSticky"
                    checked={showOnlyAiring}
                    onChange={(e) => handleShowOnlyAiringChange(e.target.checked)}
                    className="w-4 h-4 accent-[#990033]"
                  />
                  <label 
                    htmlFor="showOnlyAiringSticky" 
                    className="text-sm font-medium text-gray-700 cursor-pointer font-['Pretendard']"
                  >
                    방영 중 애니만 보기
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Sticky DaySelection - SeasonSelector 아래에 고정, 검색 중일 때는 숨김 */}
      {isDaySelectionSticky && !searchQuery.trim() && (
        <div 
          className="fixed left-0 w-full bg-white border-b border-gray-200 z-30"
          style={{ 
            top: isSeasonSelectorSticky ? `${60 + seasonSelectorHeight}px` : '60px',
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
                  initialPosition={true}
                />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 프리로딩 진행률 표시 (새로운 데이터를 가져올 때만) */}
      {isFetching && isPreloading && (
        <PreloadingProgress 
          total={preloadingStatus.total}
          loaded={preloadingStatus.loaded}
          active={preloadingStatus.active}
        />
      )}
      
    </div>
  );
}