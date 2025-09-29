'use client';

import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AnimeSearchBar from '@/components/search/ui/AnimeSearchBar';
import AnimeCard from '@/components/anime/AnimeCard';
import DaySelection, { DayOfWeek } from '@/components/search/ui/DaySelection';
import SearchFilters from '@/components/search/filters/SearchFilters';
import SearchInput from '@/components/search/ui/SearchInput';
import { getCurrentSchedule, getScheduleByYearAndQuarter, searchAnimes } from '@/api/search';
import SeasonSelector from '@/components/search/ui/SeasonSelector';
import type { AnimePreviewDto, AnimePreviewListDto, AnimeSearchListDto } from '@/types/api';
import { extractChosung } from '@/lib/searchUtils';
// import { useScrollRestoration } from '@/hooks/useScrollRestoration'; // 제거: 직접 구현
import { useImagePreloading } from '@/hooks/useImagePreloading';
import { useSmartImagePreloader } from '@/hooks/useSmartImagePreloader';
import { useQuery } from '@tanstack/react-query';
import { useAdvancedScrollRestoration } from '@/hooks/useAdvancedScrollRestoration';
import SearchLoadingSkeleton from '@/components/common/SearchLoadingSkeleton';
import PreloadingProgress from '@/components/common/PreloadingProgress';

// 애니메이션 데이터 (이제 별도 파일에서 import)

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('일'); // 기본값을 "일"로 설정
  const [selectedOttServices, setSelectedOttServices] = useState<string[]>([]);
  const [randomAnimeTitle, setRandomAnimeTitle] = useState<string>('');
  const [isPreloading, setIsPreloading] = useState(false);
  const [preloadingStatus, setPreloadingStatus] = useState({ total: 0, loaded: 0, active: 0 });
  const preloadingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // 분기 선택 상태
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedQuarter, setSelectedQuarter] = useState<number | null>(null);
  const [isThisWeek, setIsThisWeek] = useState(true); // 기본값을 "이번 주"로 설정
  
  // 시즌별 독립적인 스크롤 키 생성
  const scrollKey = useMemo(() => {
    if (isThisWeek) {
      return 'search-this-week';
    } else if (selectedYear && selectedQuarter) {
      return `search-${selectedYear}-${selectedQuarter}`;
    }
    return 'search-this-week'; // 기본값
  }, [isThisWeek, selectedYear, selectedQuarter]);

  // 고급 스크롤 복원 훅 사용
  const {
    saveScrollPosition,
    restoreScrollPosition,
    navigateWithScroll,
    navigateBackWithScroll,
    findScrollContainer,
    scrollToPosition,
    scrollToTop
  } = useAdvancedScrollRestoration({
    enabled: true,
    scrollKey: scrollKey, // 명시적으로 전달
    saveDelay: 1000, // 스크롤 저장 지연 시간을 1초로 증가
    restoreDelay: 10,
    restoreAfterDataLoad: true,
    containerSelector: 'main',
    navigationTypes: {
      sidebar: 'sidebar-navigation',
      logo: 'logo-navigation',
      detail: 'from-anime-detail'
    }
  });

  const [isInitialized, setIsInitialized] = useState(false); // 초기화 완료 여부
  
  // 스크롤 키 변경 추적
  useEffect(() => {
    console.log('🔧 스크롤 키 변경:', scrollKey, { isThisWeek, selectedYear, selectedQuarter });
  }, [scrollKey, isThisWeek, selectedYear, selectedQuarter]);
  const [showOnlyAiring, setShowOnlyAiring] = useState(false); // 방영 중 애니만 보기
  const [showEmptyMessage, setShowEmptyMessage] = useState<DayOfWeek | null>(null); // 메시지 상태 관리
  
  // 체크박스 변경 핸들러 (스크롤 위치 유지)
  const handleShowOnlyAiringChange = (checked: boolean) => {
    setShowOnlyAiring(checked);
    
    // "이번 주"가 아닌 경우에만 체크박스 상태를 sessionStorage에 저장
    const isCurrentlyThisWeek = selectedYear === null && selectedQuarter === null;
    if (!isCurrentlyThisWeek) {
      // 시즌별로 독립적인 필터링 상태 저장
      const seasonKey = `showOnlyAiring_${selectedYear}_${selectedQuarter}`;
      sessionStorage.setItem(seasonKey, checked.toString());
    }
    
    if (checked) {
      // 체크 시: 현재 선택된 요일로 스크롤 유지
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
    } else {
      // 체크 해제 시: 나타나는 첫 번째 섹션으로 자동 이동
      setTimeout(() => {
        const dayOrder = ['upcoming', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'special'];
        
        // 나타나는 첫 번째 섹션 찾기
        for (const sectionId of dayOrder) {
          const element = document.getElementById(sectionId);
          if (element && element.children.length > 0) {
            // 해당 섹션에 애니메이션이 있는지 확인
            const animeCards = element.querySelectorAll('[data-anime-card]');
            if (animeCards.length > 0) {
              // 첫 번째로 나타나는 섹션으로 이동
              scrollToSection(sectionId);
              
              // 해당 요일로 네비게이션 바도 업데이트
              const dayMap: { [key: string]: string } = {
                'upcoming': '곧 시작',
                'sun': '일',
                'mon': '월',
                'tue': '화',
                'wed': '수',
                'thu': '목',
                'fri': '금',
                'sat': '토',
                'special': '특별편성 및 극장판'
              };
              
              const newSelectedDay = dayMap[sectionId];
              if (newSelectedDay) {
                setSelectedDay(newSelectedDay as any);
              }
              break;
            }
          }
        }
      }, 200); // 데이터 업데이트를 위한 충분한 시간
    }
  };
  
  // 스티키 요소들을 위한 ref와 상태
  const seasonSelectorRef = useRef<HTMLDivElement>(null);
  const [seasonSelectorHeight, setSeasonSelectorHeight] = useState(0);


  // URL 쿼리 파라미터 처리 (검색 상태 복원 후에 실행)
  useEffect(() => {
    const queryParam = searchParams.get('q');
    const fromAnimeDetail = sessionStorage.getItem('from-anime-detail');
    const fromHeaderSearch = sessionStorage.getItem('from-header-search');
    
    // 헤더 검색에서 온 경우 또는 애니메이션 상세화면에서 돌아온 경우가 아닐 때만 URL 파라미터 처리
    if (queryParam && (fromHeaderSearch === 'true' || fromAnimeDetail !== 'true')) {
      setSearchQuery(queryParam);
      setSearchInput(queryParam);
      setIsSearching(true);
      
      // 헤더 검색 플래그 정리
      if (fromHeaderSearch === 'true') {
        sessionStorage.removeItem('from-header-search');
      }
    }
  }, [searchParams]);



  // 페이지 로드 시 시즌 선택 상태 복원
  useEffect(() => {
    // from-anime-detail 플래그를 가장 먼저 확인
    const fromAnimeDetail = sessionStorage.getItem('from-anime-detail');
    console.log('🔍 from-anime-detail 플래그 확인:', fromAnimeDetail);
    
    const selectedSeason = sessionStorage.getItem('selected-season');
    const seasonChange = sessionStorage.getItem('navigation-type');
    
    console.log('🔍 페이지 로드 시 네비게이션 타입:', { seasonChange, fromAnimeDetail });
    console.log('🔍 sessionStorage 전체 확인:', {
      'to-anime-detail': sessionStorage.getItem('to-anime-detail'),
      'from-anime-detail': sessionStorage.getItem('from-anime-detail'),
      'navigation-type': sessionStorage.getItem('navigation-type')
    });
    
    // 시즌 변경 중이거나 상세화면에서 돌아온 경우 복원하지 않음
    if (seasonChange === 'season-change' || fromAnimeDetail === 'true') {
      return;
    }
    
    // 시즌 선택 상태 복원
    if (selectedSeason) {
      try {
        const seasonData = JSON.parse(selectedSeason);
        if (seasonData.isThisWeek) {
          setIsThisWeek(true);
          setSelectedYear(null);
          setSelectedQuarter(null);
        } else {
          setIsThisWeek(false);
          setSelectedYear(seasonData.year);
          setSelectedQuarter(seasonData.quarter);
          
          // 해당 시즌의 필터링 상태도 복원
          const seasonKey = `showOnlyAiring_${seasonData.year}_${seasonData.quarter}`;
          const savedShowOnlyAiring = sessionStorage.getItem(seasonKey);
          if (savedShowOnlyAiring !== null) {
            setShowOnlyAiring(savedShowOnlyAiring === 'true');
          }
        }
      } catch (error) {
        console.error('시즌 선택 상태 복원 실패:', error);
      }
    }
    
    // 사이드바 네비게이션 감지 시 즉시 검색 상태 초기화
    const sidebarNav = sessionStorage.getItem('sidebar-navigation');
    if (sidebarNav === 'true') {
      setSearchQuery('');
      setSearchInput('');
      setIsSearching(false);
      // 검색 관련 sessionStorage 정리
      sessionStorage.removeItem('search-query');
      sessionStorage.removeItem('search-input');
      sessionStorage.removeItem('is-searching');
    }
    
    // 초기화 완료 표시
    setIsInitialized(true);
  }, []);

  
  // DaySelection sticky 관련 상태
  const [isDaySelectionSticky, setIsDaySelectionSticky] = useState(false);
  const [isSeasonSelectorSticky, setIsSeasonSelectorSticky] = useState(false);
  
  // Ref들
  const daySelectionRef = useRef<HTMLDivElement>(null);

  // 스크롤 컨테이너 찾기 함수는 이제 훅에서 제공됨

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
  const scrollToSection = (baseSectionId: string) => {
    if (baseSectionId === 'top' || baseSectionId === 'upcoming') {
      scrollToTop();
      return;
    }

    // 현재 시즌에 맞는 섹션 ID 생성
    const sectionId = isThisWeek ? baseSectionId : `${baseSectionId}-${selectedYear}-${selectedQuarter}`;

    // 첫 번째로 나타나는 섹션 찾기
    const dayOrder = ['upcoming', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'special'];
    let firstVisibleSection = null;
    
    for (const baseDaySectionId of dayOrder) {
      const daySectionId = isThisWeek ? baseDaySectionId : `${baseDaySectionId}-${selectedYear}-${selectedQuarter}`;
      const element = document.getElementById(daySectionId);
      if (element) {
        // 다양한 선택자로 애니메이션 카드 찾기
        const animeCards = element.querySelectorAll('div[class*="bg-white"], div[class*="rounded-2xl"], .anime-card, [data-anime-card]');
        if (animeCards.length > 0) {
          firstVisibleSection = baseDaySectionId;
          break;
        }
      }
    }

    // 현재 선택된 섹션이 첫 번째 섹션이면 스크롤 탑으로 이동
    const currentIndex = dayOrder.indexOf(baseSectionId);
    const firstIndex = dayOrder.indexOf(firstVisibleSection || '');
    
    if (currentIndex !== -1 && firstIndex !== -1 && currentIndex === firstIndex) {
      // 첫 번째 섹션이면 스크롤 탑으로 이동
      scrollToTop();
      return;
    }

    // 일반적인 섹션이면 오프셋을 고려한 위치로 이동
    const element = document.getElementById(sectionId);
    
    if (element) {
      const headerHeight = 60;
      const daySelectionHeight = 44;
      const margin = 70;
      
      const targetY = element.offsetTop - headerHeight - daySelectionHeight - margin;
      scrollToPosition(Math.max(0, targetY), 'instant');
    } else {
      // DOM 렌더링을 기다리고 다시 시도
      setTimeout(() => {
        const retryElement = document.getElementById(sectionId);
        if (retryElement) {
          const headerHeight = 60;
          const daySelectionHeight = 44;
          const margin = 70;
          
          const targetY = retryElement.offsetTop - headerHeight - daySelectionHeight - margin;
          scrollToPosition(Math.max(0, targetY), 'instant');
        }
      }, 200);
    }
  };


  // 이미지 프리로딩 훅
  const { preloadSearchResults } = useImagePreloading();
  const { getQueueStatus } = useSmartImagePreloader();

  // 분기 선택 핸들러
  const handleSeasonSelect = (year: number, quarter: number) => {
    console.log('🔍 시즌 변경:', { year, quarter, currentScrollKey: scrollKey });
    
    // 현재 스크롤 위치를 현재 시즌 키로 저장
    const currentScrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    if (currentScrollY > 0) {
      sessionStorage.setItem(`scroll-${scrollKey}`, currentScrollY.toString());
      console.log('💾 현재 시즌 스크롤 저장:', { scrollKey, scrollY: currentScrollY });
    }
    
    // 시즌 변경을 위한 네비게이션 타입 설정
    sessionStorage.setItem('navigation-type', 'season-change');
    
    // "이번 주" 선택인지 확인 (year=0, quarter=0으로 전달됨)
    const isThisWeekSelected = year === 0 && quarter === 0;
    
    if (isThisWeekSelected) {
      setIsThisWeek(true);
      setSelectedYear(null);
      setSelectedQuarter(null);
    } else {
      setIsThisWeek(false);
      setSelectedYear(year);
      setSelectedQuarter(quarter);
    }
    
    // "이번 주"로 변경된 경우 방영 중 필터 해제
    if (isThisWeekSelected) {
      setShowOnlyAiring(false);
    } else {
      // 다른 시즌으로 변경된 경우 해당 시즌의 저장된 필터링 상태 복원
      const seasonKey = `showOnlyAiring_${year}_${quarter}`;
      const savedShowOnlyAiring = sessionStorage.getItem(seasonKey);
      if (savedShowOnlyAiring !== null) {
        setShowOnlyAiring(savedShowOnlyAiring === 'true');
      } else {
        setShowOnlyAiring(false);
      }
    }
    
    // 선택된 시즌 정보를 sessionStorage에 저장
    if (isThisWeekSelected) {
      sessionStorage.setItem('selected-season', JSON.stringify({ isThisWeek: true }));
    } else {
      sessionStorage.setItem('selected-season', JSON.stringify({ year, quarter }));
    }
    
    // 시즌 변경 후 해당 요일 헤더로 스크롤 이동 (즉시)
    setTimeout(() => {
      // 현재 선택된 요일을 기반으로 섹션 ID 생성
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
      
      const baseSectionId = dayToSectionId[selectedDay as keyof typeof dayToSectionId];
      if (!baseSectionId) return;
      
      // 시즌 변경 후 실제 업데이트된 값들 사용
      const currentIsThisWeek = isThisWeekSelected;
      const currentSectionId = currentIsThisWeek ? baseSectionId : `${baseSectionId}-${year}-${quarter}`;
      
      // 해당 섹션의 요일 헤더로 스크롤 이동
      let element = document.getElementById(currentSectionId);
      
      // 해당 요일 헤더가 존재하지 않는 경우, 다음 요일 헤더로 이동
      if (!element) {
        const dayOrder = ['upcoming', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'special'];
        const currentIndex = dayOrder.indexOf(baseSectionId);
        
        // 다음 요일들 중에서 존재하는 첫 번째 헤더 찾기
        for (let i = currentIndex + 1; i < dayOrder.length; i++) {
          const nextBaseSectionId = dayOrder[i];
          const nextSectionId = currentIsThisWeek ? nextBaseSectionId : `${nextBaseSectionId}-${year}-${quarter}`;
          const nextElement = document.getElementById(nextSectionId);
          
          if (nextElement) {
            element = nextElement;
            // 네비게이션도 다음 요일로 업데이트
            const dayToKorean = {
              'upcoming': '곧 시작',
              'sun': '일',
              'mon': '월', 
              'tue': '화',
              'wed': '수',
              'thu': '목',
              'fri': '금',
              'sat': '토',
              'special': '특별편성 및 극장판'
            };
            const koreanDay = dayToKorean[nextBaseSectionId as keyof typeof dayToKorean];
            if (koreanDay) {
              setSelectedDay(koreanDay as DayOfWeek);
            }
            break;
          }
        }
      }
      
      if (element) {
        const headerHeight = 60;
        const daySelectionHeight = 44;
        const margin = 70;
        
        const targetY = element.offsetTop - headerHeight - daySelectionHeight - margin;
        scrollToPosition(Math.max(0, targetY), 'instant');
      }
    }, 0);
    
    // 드롭다운을 통해 다른 시즌 접근 시 스크롤 처리
    if (isThisWeekSelected) {
      // "이번 주" 선택 시: "곧 시작"~"일" 메뉴에서는 스크롤 탑, "월"~"특별편성 및 극장판"에서는 해당 요일의 섹션으로 스크롤 유지
      const topMenuDays = ['곧 시작', '일'];
      if (topMenuDays.includes(selectedDay)) {
        setSelectedDay('곧 시작');
        // "곧 시작"~"일" 메뉴에서는 스크롤 탑으로 이동
        scrollToTop();
      } else {
        // "월"~"특별편성 및 극장판" 메뉴에서는 해당 요일의 섹션으로 스크롤 유지
        const dayToSectionId = {
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
    } else {
      // 다른 시즌 선택 시: "곧 시작"~"일" 메뉴에서는 스크롤 탑, "월"~"특별편성 및 극장판"에서는 기존 스크롤 유지
      const topMenuDays = ['곧 시작', '일'];
      if (topMenuDays.includes(selectedDay)) {
        // "곧 시작"~"일" 메뉴에서는 스크롤 탑으로 이동
        scrollToTop();
      } else {
        // "월"~"특별편성 및 극장판" 메뉴에서는 기존 스크롤 유지
        const dayToSectionId = {
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
    }
  };

  // 검색 쿼리 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState(''); // 입력 중인 검색어
  const [isSearching, setIsSearching] = useState(false);

  // React Query를 사용한 데이터 페칭 (개선된 캐싱 설정)
  const { data: scheduleData, error, isLoading, isFetching } = useQuery<AnimePreviewListDto>({
    queryKey: isThisWeek 
      ? ['schedule', 'this-week']
      : selectedYear && selectedQuarter 
        ? ['schedule', selectedYear, selectedQuarter]
        : ['schedule', 'this-week'],
    queryFn: isThisWeek
      ? getCurrentSchedule // "이번 주"일 때는 /api/v1/search 호출
      : selectedYear && selectedQuarter
        ? () => getScheduleByYearAndQuarter(selectedYear, selectedQuarter)
        : getCurrentSchedule, // 기본값은 "이번 주"
    enabled: isInitialized && !searchQuery.trim(), // 검색 중이 아닐 때만 API 호출
    staleTime: 5 * 60 * 1000, // 5분간 fresh 상태 유지
    gcTime: 10 * 60 * 1000, // 10분간 캐시 유지
    refetchOnWindowFocus: false, // 윈도우 포커스 시 재요청 비활성화
    refetchOnReconnect: true, // 네트워크 재연결 시 재요청
    refetchOnMount: true, // 컴포넌트 마운트 시 재요청
    retry: 3, // 에러 시 3번 재시도
    retryDelay: 5000, // 재시도 간격 5초
    retryOnMount: true, // 마운트 시 재시도
  });

  // 검색 쿼리
  const { data: searchData, error: searchError, isLoading: isSearchLoading } = useQuery<AnimeSearchListDto>({
    queryKey: ['search', searchQuery],
    queryFn: () => searchAnimes(searchQuery),
    enabled: isInitialized && searchQuery.trim().length > 0, // 검색어가 있을 때만 API 호출
    staleTime: 2 * 60 * 1000, // 2분간 fresh 상태 유지
    gcTime: 5 * 60 * 1000, // 5분간 캐시 유지
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 3,
    retryDelay: 5000,
  });


  // 현재 연도와 분기는 더 이상 사용하지 않음 (isThisWeek로 관리)

  // 데이터 로딩 완료 후 스크롤 복원 처리
  useEffect(() => {
    if (scheduleData || searchData) {
      // "이번 주"로 변경된 경우 방영 중 필터 해제
      const isCurrentlyThisWeek = selectedYear === null && selectedQuarter === null;
      if (isCurrentlyThisWeek && showOnlyAiring) {
        setShowOnlyAiring(false);
      }
      
      // 데이터 로딩 완료 표시 (스크롤 복원을 위한 신호)
      const contentElement = document.querySelector('[data-content-loaded]');
      if (!contentElement) {
        // data-content-loaded 속성이 없으면 추가
        const mainContent = document.querySelector('main');
        if (mainContent) {
          mainContent.setAttribute('data-content-loaded', 'true');
        }
      }
      
      // 시즌별 스크롤 복원 (데이터 로딩 완료 후)
      setTimeout(() => {
        restoreScrollPosition();
      }, 100);
    }
  }, [scheduleData, searchData, showOnlyAiring, selectedYear, selectedQuarter, isThisWeek, restoreScrollPosition]);


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
      // "이번 주" 메뉴에서만 "곧 시작" 그룹 확인
      if (isThisWeek) {
        // "곧 시작" 그룹이 있는지 확인 (12시간 이내 방영 예정인 애니메이션들)
        const hasUpcomingGroup = Object.values(scheduleData.schedule).flat().some(anime => {
          if (anime.status !== 'NOW_SHOWING' || !anime.scheduledAt) return false;
          
          const now = new Date();
          const scheduled = new Date(anime.scheduledAt);
          const diff = scheduled.getTime() - now.getTime();
          const twelveHoursInMs = 12 * 60 * 60 * 1000;
          
          return diff <= twelveHoursInMs && diff >= 0;
        });
        
        if (hasUpcomingGroup) {
          setSelectedDay('곧 시작');
        } else {
          setSelectedDay('일');
        }
      }
      // 다른 시즌에서는 기존 요일 유지
      
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
          
          // 초성 추천 로직 개선 - 부정확한 추천 방지
          const shouldShowChosung = (() => {
            // 숫자나 특수문자가 포함된 경우 초성 추천 제외
            const hasNumbers = /\d/.test(selectedAnime.titleKor);
            const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(selectedAnime.titleKor);
            
            if (hasNumbers || hasSpecialChars) {
              return false;
            }
            
            // 1. 한글이 3글자 이상인 경우만 초성 추천 (정확도 우선)
            if (koreanCount >= 3 && chosung.length >= 3) {
              return true;
            }
            
            // 2. 한글이 2글자인 경우, 영문이 많지 않은 경우만 초성 추천
            if (koreanCount >= 2 && chosung.length >= 2) {
              const englishCount = (selectedAnime.titleKor.match(/[a-zA-Z]/g) || []).length;
              // 영문이 한글보다 많지 않은 경우만 초성 추천
              return englishCount <= koreanCount;
            }
            
            // 3. 그 외의 경우는 초성 추천하지 않음
            return false;
          })();
          
          if (shouldShowChosung) {
            const limitedChosung = chosung.slice(0, Math.min(4, chosung.length));
            setRandomAnimeTitle(`${selectedAnime.titleKor} (예: ${limitedChosung}...)`);
          } else {
            // 초성 추천이 부정확할 수 있는 경우는 원본 제목만 표시
            setRandomAnimeTitle(selectedAnime.titleKor);
          }
        }
      }
    }
  }, [scheduleData, isThisWeek]);
  
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

  // 현재 사용할 데이터 결정 (검색 중이면 검색 결과, 아니면 스케줄 데이터)
  const isSearchMode = searchQuery.trim().length > 0;
  const currentData = isSearchMode ? searchData : scheduleData;
  const currentError = isSearchMode ? searchError : error;
  const currentIsLoading = isSearchMode ? isSearchLoading : isLoading;
  
  // 초기 로딩 상태 확인 - 데이터가 아직 로드되지 않았고 에러도 없는 경우
  const isInitialLoading = !currentData && !currentError && !isSearchMode;
  
  // 검색 결과 데이터 (검색 API 응답 구조가 다름)
  const searchResults = isSearchMode && searchData ? searchData.animePreviews : [];

  // 전체 보기를 위한 요일별 그룹화된 데이터
  // 비어있는 요일들을 계산하는 로직
  const emptyDays = useMemo(() => {
    if (!currentData || !('schedule' in currentData) || isSearchMode) {
      return new Set<DayOfWeek>();
    }
    
    const emptyDaysSet = new Set<DayOfWeek>();
    const dayOrder: (keyof typeof currentData.schedule)[] = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SPECIAL'];
    
    // 각 요일별로 애니메이션이 있는지 확인
    dayOrder.forEach(day => {
      let dayAnimes = currentData.schedule[day] || [];
      
      // "특별편성 및 극장판"의 경우 MOVIE 타입 애니메이션도 포함
      if (day === 'SPECIAL') {
        const movieAnimes = Object.values(currentData.schedule).flat().filter(anime => 
          anime.medium === 'MOVIE'
        );
        
        // 중복 제거 (animeId 기준)
        const uniqueMovieAnimes = movieAnimes.filter(anime => 
          !currentData.schedule['SPECIAL']?.some((special: any) => special.animeId === anime.animeId)
        );
        
        dayAnimes = [...dayAnimes, ...uniqueMovieAnimes];
      }
      
      const filteredAnimes = showOnlyAiring 
        ? dayAnimes.filter(anime => anime.status === 'NOW_SHOWING')
        : dayAnimes;
      
      // OTT 필터링이 활성화된 경우
      const finalAnimes = selectedOttServices.length > 0 
        ? filteredAnimes.filter(anime => {
            const hasMatchingOtt = selectedOttServices.some(selectedOtt => 
              anime.ottDtos.some((ott: any) => 
                ott.ottType && ott.ottType.toLowerCase() === selectedOtt
              )
            );
            return hasMatchingOtt;
          })
        : filteredAnimes;
      
      if (finalAnimes.length === 0) {
        // 요일을 한국어로 변환
        const dayInKorean = {
          'SUN': '일',
          'MON': '월',
          'TUE': '화',
          'WED': '수',
          'THU': '목',
          'FRI': '금',
          'SAT': '토',
          'SPECIAL': '특별편성 및 극장판'
        }[day];
        
        if (dayInKorean) {
          emptyDaysSet.add(dayInKorean as DayOfWeek);
        }
      }
    });
    
    // "곧 시작" 그룹도 확인
    if (selectedOttServices.length === 0) {
      const upcomingAnimes = Object.values(currentData.schedule).flat().filter(anime => {
        if (anime.status !== 'NOW_SHOWING' || !anime.scheduledAt) return false;
        
        const now = new Date();
        const scheduled = new Date(anime.scheduledAt);
        
        if (isNaN(scheduled.getTime())) return false;
        
        const targetDayOfWeek = scheduled.getDay();
        const targetHours = scheduled.getHours();
        const targetMinutes = scheduled.getMinutes();
        
        const getThisWeekScheduledTime = () => {
          const thisWeekScheduled = new Date(now);
          thisWeekScheduled.setHours(targetHours, targetMinutes, 0, 0);
          
          const currentDayOfWeek = now.getDay();
          let daysUntilTarget = targetDayOfWeek - currentDayOfWeek;
          
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
        
        const thisWeekEndTime = new Date(thisWeekScheduledTime.getTime() + 23 * 60 * 1000 + 59 * 1000);
        const isCurrentlyAiring = now >= thisWeekScheduledTime && now <= thisWeekEndTime;
        
        if (isCurrentlyAiring) return true;
        
        if (now > thisWeekEndTime) {
          const nextWeekEndTime = new Date(nextWeekScheduledTime.getTime() + 23 * 60 * 1000 + 59 * 1000);
          const diff = nextWeekScheduledTime.getTime() - now.getTime();
          const twelveHoursInMs = 12 * 60 * 60 * 1000;
          
          return diff <= twelveHoursInMs && diff >= 0;
        }
        
        return false;
      });
      
      if (upcomingAnimes.length === 0) {
        emptyDaysSet.add('곧 시작');
      }
    }
    
    return emptyDaysSet;
  }, [currentData, showOnlyAiring, selectedOttServices, isSearchMode]);

  const groupedAnimes = useMemo(() => {
    if (!currentData) return {};
    
    return (() => {
    // 검색 중일 때는 다른 처리 방식 사용
    if (isSearchMode) {
      // 검색 결과를 하나의 그룹으로 처리
      if (searchResults.length > 0) {
        return {
          'SEARCH_RESULTS': searchResults
        };
      } else {
        // 검색 결과가 없는 경우
        return {};
      }
    }

    // 일반 스케줄 데이터 처리
    if (!currentData || !('schedule' in currentData)) {
      return {};
    }

    const dayOrder: (keyof typeof currentData.schedule)[] = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SPECIAL'];
    const grouped: { [key: string]: AnimePreviewDto[] } = {};
    
    // 방영 중 필터링 함수
    const filterAiringAnimes = (animes: AnimePreviewDto[]) => {
      if (showOnlyAiring) {
        const filtered = animes.filter(anime => anime.status === 'NOW_SHOWING');
        return filtered;
      }
      return animes;
    };
    
    // "곧 시작" 그룹 추가 (12시간 이내 방영 예정인 애니메이션들 + 현재 방영중인 애니메이션들)
    // OTT 필터링이 활성화된 경우 또는 검색 중일 때 "곧 시작" 그룹은 제외
    if (selectedOttServices.length === 0 && !isSearchMode) {
      const upcomingAnimes = Object.values(currentData.schedule).flat().filter(anime => {
        // NOW_SHOWING 또는 UPCOMING 상태이고 scheduledAt이 유효한 애니메이션만
        if ((anime.status !== 'NOW_SHOWING' && anime.status !== 'UPCOMING') || !anime.scheduledAt) return false;
        
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
          // 방영 중 필터링 적용
          const filteredUpcoming = filterAiringAnimes(upcomingAnimes);
        
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
        const specialAnimes = currentData.schedule['SPECIAL'] || [];
        const movieAnimes = Object.values(currentData.schedule).flat().filter(anime => 
          anime.medium === 'MOVIE'
        );
        
        // 중복 제거 (animeId 기준)
        const uniqueMovieAnimes = movieAnimes.filter(anime => 
          !currentData.schedule['SPECIAL']?.some((special: AnimePreviewDto) => special.animeId === anime.animeId)
        );
        
        let allAnimes = [...specialAnimes, ...uniqueMovieAnimes];
        
        // 방영 중 필터링 적용
        allAnimes = filterAiringAnimes(allAnimes);
        
                // OTT 서비스 필터링
        if (selectedOttServices.length > 0) {
          allAnimes = allAnimes.filter(anime => {
            const hasMatchingOtt = selectedOttServices.some(selectedOtt => 
              anime.ottDtos.some((ott: any) => 
                ott.ottType && ott.ottType.toLowerCase() === selectedOtt
              )
            );
            return hasMatchingOtt;
          });
        }
        
        if (allAnimes.length > 0) {
          // 상태별 정렬: 방영중 > 예정, 예정끼리는 디데이 순
          allAnimes.sort((a, b) => {
            // 1. 상태별 우선순위: NOW_SHOWING > UPCOMING
            if (a.status !== b.status) {
              if (a.status === 'NOW_SHOWING') return -1;
              if (b.status === 'NOW_SHOWING') return 1;
            }
            
            // 2. UPCOMING 상태끼리는 디데이 순으로 정렬
            if (a.status === 'UPCOMING' && b.status === 'UPCOMING') {
              // airTime이 있는 경우 디데이 계산
              const getDaysUntil = (anime: AnimePreviewDto) => {
                if (!anime.airTime || !anime.airTime.includes('/')) return Infinity;
                
                const now = new Date();
                const currentYear = now.getFullYear();
                const [month, day] = anime.airTime.split('/').map(Number);
                const airDate = new Date(currentYear, month - 1, day);
                
                if (airDate < now) {
                  airDate.setFullYear(currentYear + 1);
                }
                
                const diffTime = airDate.getTime() - now.getTime();
                return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              };
              
              const aDays = getDaysUntil(a);
              const bDays = getDaysUntil(b);
              
              return aDays - bDays;
            }
            
            // 3. 같은 상태끼리는 시간 순서대로 정렬 (NOW_SHOWING 등)
            if (a.status === b.status) {
              if (!a.scheduledAt || !b.scheduledAt) return 0;
              
              // scheduledAt에서 시간 부분만 추출
              const aTime = new Date(a.scheduledAt);
              const bTime = new Date(b.scheduledAt);
              
              // 시간을 분 단위로 변환하여 비교 (같은 날짜 내에서 시간 순서)
              const aMinutes = aTime.getHours() * 60 + aTime.getMinutes();
              const bMinutes = bTime.getHours() * 60 + bTime.getMinutes();
              
              return aMinutes - bMinutes;
            }
            
            return 0;
          });
          
          grouped[day] = allAnimes;
        }
      } else if (currentData.schedule[day] && currentData.schedule[day].length > 0) {
        let dayAnimes = [...currentData.schedule[day]];
        
        // 방영 중 필터링 적용
        dayAnimes = filterAiringAnimes(dayAnimes);
        
        // OTT 서비스 필터링
        if (selectedOttServices.length > 0) {
          dayAnimes = dayAnimes.filter(anime => {
            const hasMatchingOtt = selectedOttServices.some(selectedOtt => 
              anime.ottDtos.some((ott: any) => 
                ott.ottType && ott.ottType.toLowerCase() === selectedOtt
              )
            );
            return hasMatchingOtt;
          });
        }
        
        if (dayAnimes.length > 0) {
          // 상태별 정렬: 방영중 > 예정, 예정끼리는 디데이 순
          dayAnimes.sort((a, b) => {
            // 1. 상태별 우선순위: NOW_SHOWING > UPCOMING
            if (a.status !== b.status) {
              if (a.status === 'NOW_SHOWING') return -1;
              if (b.status === 'NOW_SHOWING') return 1;
            }
            
            // 2. UPCOMING 상태끼리는 디데이 순으로 정렬
            if (a.status === 'UPCOMING' && b.status === 'UPCOMING') {
              // airTime이 있는 경우 디데이 계산
              const getDaysUntil = (anime: AnimePreviewDto) => {
                if (!anime.airTime || !anime.airTime.includes('/')) return Infinity;
                
                const now = new Date();
                const currentYear = now.getFullYear();
                const [month, day] = anime.airTime.split('/').map(Number);
                const airDate = new Date(currentYear, month - 1, day);
                
                if (airDate < now) {
                  airDate.setFullYear(currentYear + 1);
                }
                
                const diffTime = airDate.getTime() - now.getTime();
                return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              };
              
              const aDays = getDaysUntil(a);
              const bDays = getDaysUntil(b);
              
              return aDays - bDays;
            }
            
            // 3. 같은 상태끼리는 시간 순서대로 정렬 (NOW_SHOWING 등)
            if (a.status === b.status) {
              if (!a.scheduledAt || !b.scheduledAt) return 0;
              
              // scheduledAt에서 시간 부분만 추출
              const aTime = new Date(a.scheduledAt);
              const bTime = new Date(b.scheduledAt);
              
              // 시간을 분 단위로 변환하여 비교 (같은 날짜 내에서 시간 순서)
              const aMinutes = aTime.getHours() * 60 + aTime.getMinutes();
              const bMinutes = bTime.getHours() * 60 + bTime.getMinutes();
              
              return aMinutes - bMinutes;
            }
            
            return 0;
          });
          
          grouped[day] = dayAnimes;
        }
      }
    });
    
    return grouped;
    })();
  }, [currentData, selectedOttServices, showOnlyAiring, isSearchMode, searchResults]);

  // 3. 스크롤 네비게이션 연동 - groupedAnimes가 정의된 후에 실행
  useEffect(() => {
    // groupedAnimes가 없으면 실행하지 않음
    if (!groupedAnimes) return;
    
    const container = findScrollContainer();
    
    const handleNavigationScroll = () => {
      const scrollY = container === window ? window.scrollY : (container as HTMLElement).scrollTop;
      
      // "곧 시작" 그룹이 있는지 확인하여 섹션 정의를 동적으로 생성
      const hasUpcomingGroup = groupedAnimes['UPCOMING'] && groupedAnimes['UPCOMING'].length > 0;
      
      // 현재 시즌에 맞는 섹션 ID 생성
      const getSectionId = (baseId: string) => {
        return isThisWeek ? baseId : `${baseId}-${selectedYear}-${selectedQuarter}`;
      };

      const sections = hasUpcomingGroup ? [
        { id: getSectionId('upcoming'), day: '곧 시작' },
        { id: getSectionId('sun'), day: '일' },
        { id: getSectionId('mon'), day: '월' },
        { id: getSectionId('tue'), day: '화' },
        { id: getSectionId('wed'), day: '수' },
        { id: getSectionId('thu'), day: '목' },
        { id: getSectionId('fri'), day: '금' },
        { id: getSectionId('sat'), day: '토' },
        { id: getSectionId('special'), day: '특별편성 및 극장판' }
      ] : [
        { id: getSectionId('sun'), day: '일' },
        { id: getSectionId('mon'), day: '월' },
        { id: getSectionId('tue'), day: '화' },
        { id: getSectionId('wed'), day: '수' },
        { id: getSectionId('thu'), day: '목' },
        { id: getSectionId('fri'), day: '금' },
        { id: getSectionId('sat'), day: '토' },
        { id: getSectionId('special'), day: '특별편성 및 극장판' }
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

  const handleSearchInputChange = (input: string) => {
    setSearchInput(input);
  };

  const handleSearch = () => {
    setSearchQuery(searchInput);
    setIsSearching(searchInput.trim().length > 0);
  };

  const handleSearchChange = (query: string) => {
    setSearchInput(query);
  };

  // 데이터 로딩 중이거나 (새로운 데이터를 가져오면서) 프리로딩 중일 때만 스켈레톤 UI 표시
  if (currentIsLoading || (isFetching && isPreloading)) {
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
                value={searchInput}
                onChange={handleSearchChange}
                onSearch={handleSearch}
                placeholder={randomAnimeTitle || "분기 신작 애니/캐릭터를 검색해보세요..."}
                className="w-full h-[62px]"
              />
              
            </div>
          </div>
        </div>
        
        {/* YearAndSeason 컴포넌트 - 회색 배경을 중앙으로 꿰뚫는 위치 */}
        <div className="absolute -bottom-6 left-0 w-full z-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex gap-5 items-center justify-start" ref={seasonSelectorRef}>
              {/* 검색 중일 때는 돌아가기 버튼, 아니면 시즌 선택 드롭다운 */}
              {searchQuery.trim() ? (
                <div className="bg-white box-border content-stretch flex gap-2.5 items-center justify-center px-[25px] py-2.5 relative rounded-[12px] w-fit">
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSearchInput('');
                      setIsSearching(false);
                      // 검색 상태 정리
                      sessionStorage.removeItem('search-query');
                      sessionStorage.removeItem('search-input');
                      sessionStorage.removeItem('is-searching');
                      // 스크롤 탑으로 이동
                      scrollToTop();
                    }}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="font-medium">이전</span>
                  </button>
                </div>
              ) : (
                <div className="bg-white box-border content-stretch flex gap-2.5 items-center justify-center px-[25px] py-2.5 relative rounded-[12px] w-fit">
                  <SeasonSelector
                    onSeasonSelect={handleSeasonSelect}
                    className="w-fit"
                    currentYear={isThisWeek ? undefined : selectedYear || undefined}
                    currentQuarter={isThisWeek ? undefined : selectedQuarter || undefined}
                  />
                </div>
              )}
              
              {/* 방영 중 애니만 보기 체크박스 - "이번 주"가 아니고 검색 중이 아닐 때만 표시 */}
              {!isThisWeek && !searchQuery.trim() && (
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
          {/* Day Selection 또는 OTT 필터 큐 */}
          {selectedOttServices.length === 0 && !searchQuery.trim() ? (
            <div ref={daySelectionRef} className="mb-[40px] flex justify-center">
              <DaySelection
                selectedDay={selectedDay}
                onDaySelect={setSelectedDay}
                onScrollToSection={scrollToSection}
                emptyDays={emptyDays}
                isThisWeek={isThisWeek}
                showEmptyMessage={showEmptyMessage}
                onEmptyMessageChange={setShowEmptyMessage}
              />
            </div>
          ) : selectedOttServices.length > 0 ? (
            <div className="mb-[40px] flex justify-start">
              <div className="flex gap-3 items-center">
                {/* 선택됨 텍스트 */}
                <span className="text-sm font-medium text-gray-700 font-['Pretendard']">
                  선택됨:
                </span>
                
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
            </div>
          ) : null}



        </div>
      </div>

      {/* Anime Grid Section - F8F9FA 배경 */}
      <div className="w-full" style={{ backgroundColor: '#F8F9FA' }}>
        <div className="max-w-7xl mx-auto px-6 pt-8 pb-8">
          {/* Anime Grid - OTT 필터링 시 요일 구분 없이 표시 */}
          {groupedAnimes && Object.keys(groupedAnimes).length > 0 ? (
            <div className="space-y-0" data-content-loaded>
              {selectedOttServices.length > 0 || isSearchMode ? (
                // OTT 필터링 시 또는 검색 중일 때: 모든 애니메이션을 하나의 그리드로 표시
                <div>
                  <div className="flex items-end gap-3 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {searchQuery.trim() ? '검색 결과' : '필터링 결과'}
                    </h2>
                    <span className="text-[12px] font-normal text-[#868E96] font-['Pretendard']">
                      {isSearchMode ? searchResults.length : Object.values(groupedAnimes).flat().length}개의 애니메이션
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[30px]">
                    {Object.values(groupedAnimes).flat().map((anime) => (
                      <AnimeCard
                        key={anime.animeId}
                        anime={anime}
                        isCurrentSeason={isThisWeek}
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
                    
                    // 요일별 섹션 ID 생성 (시즌별로 독립적)
                    const baseSectionId = day === 'UPCOMING' ? 'upcoming' : 
                                         day === 'SPECIAL' ? 'special' : day.toLowerCase();
                    const sectionId = isThisWeek ? baseSectionId : `${baseSectionId}-${selectedYear}-${selectedQuarter}`;
                    
                    return (
                      <div key={day} id={sectionId}>
                        {/* 요일 제목 - 검색 중일 때는 숨김 */}
                        {!searchQuery.trim() && (
                          <div className="flex items-end gap-3 mb-6">
                            <h2 
                              className="text-2xl font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                              onClick={() => {
                                // 요일 헤더 클릭 시 해당 요일 네비게이션 활성화 및 스크롤 이동
                                const dayToKorean = {
                                  'UPCOMING': '곧 시작',
                                  'SUN': '일',
                                  'MON': '월', 
                                  'TUE': '화',
                                  'WED': '수',
                                  'THU': '목',
                                  'FRI': '금',
                                  'SAT': '토',
                                  'SPECIAL': '특별편성 및 극장판'
                                };
                                
                                const koreanDay = dayToKorean[day as keyof typeof dayToKorean];
                                if (koreanDay) {
                                  setSelectedDay(koreanDay as DayOfWeek);
                                  scrollToSection(baseSectionId);
                                }
                              }}
                            >
                              {dayInKorean}
                            </h2>
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
                              isCurrentSeason={isThisWeek}
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
          // 데이터 로딩 중 또는 에러 또는 검색 결과 없음
          <div className="text-center py-16">
            {currentIsLoading || isInitialLoading ? (
                <div className="text-gray-400 mb-4">
                  <div className="mx-auto h-12 w-12 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-500"></div>
                  </div>
                </div>
              ) : error ? (
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              ) : (
                <div className="text-gray-400 mb-4">
                  {isSearchMode ? (
                    // 검색 결과 없음 - 빈 상태 아이콘
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  ) : selectedOttServices.length > 0 ? (
                    // OTT 필터링 결과 없음 - 필터 아이콘
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                  ) : showOnlyAiring ? (
                    // 방영 중 필터 결과 없음 - TV 아이콘
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  ) : (
                    // 일반 데이터 없음 - 빈 상태 아이콘
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )}
                </div>
              )}
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {currentIsLoading || isInitialLoading ? '데이터를 불러오는 중...' : 
                 currentError ? '데이터 로딩에 실패했습니다' : 
                 isSearchMode ? '검색 결과가 없습니다' : 
                 selectedOttServices.length > 0 ? '필터링 결과가 없습니다' : 
                 showOnlyAiring ? '방영 중인 애니메이션이 없습니다' : '데이터가 없습니다'}
              </h3>
              <p className="text-gray-500">
                {currentIsLoading || isInitialLoading ? '잠시만 기다려주세요' : 
                 currentError ? '다시 시도해주세요' : 
                 isSearchMode ? `"${searchQuery}"에 대한 검색 결과가 없습니다. 다른 검색어를 시도해보세요.` : 
                 selectedOttServices.length > 0 ? '선택한 OTT 서비스에 해당하는 애니메이션이 없습니다.' : 
                 showOnlyAiring ? '필터를 해제하거나 다른 시즌을 확인해보세요.' : '데이터를 불러오는 중입니다'}
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
              {/* 검색 중일 때는 돌아가기 버튼, 아니면 시즌 선택 드롭다운 */}
              {searchQuery.trim() ? (
                <div className="bg-white box-border content-stretch flex gap-2.5 items-center justify-center px-[25px] py-2.5 relative rounded-[12px] w-fit">
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSearchInput('');
                      setIsSearching(false);
                      // 검색 상태 정리
                      sessionStorage.removeItem('search-query');
                      sessionStorage.removeItem('search-input');
                      sessionStorage.removeItem('is-searching');
                      // 스크롤 탑으로 이동
                      scrollToTop();
                    }}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="font-medium">이전</span>
                  </button>
                </div>
              ) : (
                <div className="bg-white box-border content-stretch flex gap-2.5 items-center justify-center px-[25px] py-2.5 relative rounded-[12px] w-fit">
                  <SeasonSelector
                    onSeasonSelect={handleSeasonSelect}
                    className="w-fit"
                    currentYear={isThisWeek ? undefined : selectedYear || undefined}
                    currentQuarter={isThisWeek ? undefined : selectedQuarter || undefined}
                  />
                </div>
              )}
              
              {/* 방영 중 애니만 보기 체크박스 - "이번 주"가 아니고 검색 중이 아닐 때만 표시 */}
              {!isThisWeek && !searchQuery.trim() && (
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
          className="fixed left-[65px] w-full bg-white border-b border-gray-200 z-30"
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
                  emptyDays={emptyDays}
                  isThisWeek={isThisWeek}
                  showEmptyMessage={showEmptyMessage}
                  onEmptyMessageChange={setShowEmptyMessage}
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

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-500"></div>
          </div>
          <p className="text-gray-600">페이지를 불러오는 중...</p>
        </div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}