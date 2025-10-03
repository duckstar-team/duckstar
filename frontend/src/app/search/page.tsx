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
import { queryConfig } from '@/lib/queryConfig';
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
  
  const [isInitialized, setIsInitialized] = useState(false); // 초기화 완료 여부
  
  // 검색 관련 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // 스티키 요소들을 위한 상태와 ref
  const [isDaySelectionSticky, setIsDaySelectionSticky] = useState(false);
  const [isSeasonSelectorSticky, setIsSeasonSelectorSticky] = useState(false);
  const [seasonSelectorHeight, setSeasonSelectorHeight] = useState(0);
  
  const daySelectionRef = useRef<HTMLDivElement>(null);
  const seasonSelectorRef = useRef<HTMLDivElement>(null);
  
  // 시즌별 스크롤 위치 매핑 관련 함수들
  const getSeasonKey = (year: number | null, quarter: number | null) => {
    if (year === null || quarter === null) return 'this-week';
    return `${year}-${quarter}`;
  };
  
  const getDayKey = (day: DayOfWeek): string => {
    const dayMap: { [key in DayOfWeek]: string } = {
      '곧 시작': 'upcoming',
      '일': 'sun',
      '월': 'mon',
      '화': 'tue',
      '수': 'wed',
      '목': 'thu',
      '금': 'fri',
      '토': 'sat',
      '특별편성 및 극장판': 'special'
    };
    return dayMap[day];
  };
  
  const getStoredScrollMap = () => {
    const stored = sessionStorage.getItem('season-scroll-map');
    return stored ? JSON.parse(stored) : {};
  };
  
  const saveScrollMap = (seasonKey: string, positions: { [key: string]: number }) => {
    const existingMap = getStoredScrollMap();
    existingMap[seasonKey] = {
      ...positions,
      measuredAt: Date.now()
    };
    sessionStorage.setItem('season-scroll-map', JSON.stringify(existingMap));
  };
  
  const measureDayPositions = (seasonKey: string) => {
    const dayElements = ['upcoming', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'special'];
    const positions: { [key: string]: number } = {};
    
    dayElements.forEach(day => {
      // '이번 주'의 경우 시즌 키 없이 섹션 ID 생성
      const sectionId = seasonKey === 'this-week' ? day : `${day}-${seasonKey}`;
      const element = document.getElementById(sectionId);
      
      if (element) {
        // '이번 주' 메뉴에서 '곧 시작'은 항상 스크롤 탑으로 저장
        if (seasonKey === 'this-week' && day === 'upcoming') {
          positions[day] = 0;
        } else {
          positions[day] = element.offsetTop - 178;
        }
      }
    });
    
    return positions;
  };
  
  const getTargetSection = (fromDay: string, toSeasonData: any, isThisWeek: boolean = false) => {
    // 시즌 메뉴에서 첫 번째 존재하는 섹션 찾기
    if (!isThisWeek) {
      const dayOrder = ['upcoming', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'special'];
      let firstExistingIndex = -1;
      
      // 첫 번째 존재하는 섹션 찾기
      for (let i = 0; i < dayOrder.length; i++) {
        if (toSeasonData[dayOrder[i]]) {
          firstExistingIndex = i;
          break;
        }
      }
      
      // 첫 번째 존재하는 섹션 이전의 모든 요일은 스크롤 탑
      if (firstExistingIndex !== -1) {
        const currentIndex = dayOrder.indexOf(fromDay);
        if (currentIndex < firstExistingIndex) {
          return 'top';
        }
      }
    }
    
    // 1. 동일 섹션 확인
    if (toSeasonData[fromDay]) {
      return fromDay;
    }
    
    // 2. 다음 순서 섹션 찾기
    const dayOrder = ['upcoming', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'special'];
    const currentIndex = dayOrder.indexOf(fromDay);
    
    for (let i = currentIndex + 1; i < dayOrder.length; i++) {
      if (toSeasonData[dayOrder[i]]) {
        return dayOrder[i];
      }
    }
    
    // 3. 모든 섹션 없음
    return 'top';
  };
  
  const scrollToSavedPosition = (seasonKey: string, dayKey: string) => {
    const scrollMap = getStoredScrollMap();
    const position = scrollMap[seasonKey]?.[dayKey];
    
    if (position !== undefined) {
      window.scrollTo({ top: position, behavior: 'instant' });
    }
  };

  const [showOnlyAiring, setShowOnlyAiring] = useState(false); // 방영 중 애니만 보기
  
  // 체크박스 변경 핸들러
  const handleShowOnlyAiringChange = (checked: boolean) => {
    setShowOnlyAiring(checked);
    
    // "이번 주"가 아닌 경우에만 체크박스 상태를 sessionStorage에 저장
    const isCurrentlyThisWeek = selectedYear === null && selectedQuarter === null;
    if (!isCurrentlyThisWeek) {
      // 시즌별로 독립적인 필터링 상태 저장
      const seasonKey = `showOnlyAiring_${selectedYear}_${selectedQuarter}`;
      sessionStorage.setItem(seasonKey, checked.toString());
    }
    
    // 필터링 상태 변경 시 스크롤 매핑 업데이트 (기존 매핑 유지)
    setTimeout(() => {
      const currentSeasonKey = getSeasonKey(selectedYear, selectedQuarter);
      const scrollMap = getStoredScrollMap();
      const existingPositions = scrollMap[currentSeasonKey] || {};
      
      // 필터링된 데이터에 맞춰 위치만 업데이트
      const updatedPositions = measureDayPositions(currentSeasonKey);
      
      // 기존 위치와 새 위치를 병합 (데이터가 있는 섹션만 업데이트)
      const mergedPositions = { ...existingPositions };
      Object.keys(updatedPositions).forEach(day => {
        if (updatedPositions[day] !== undefined) {
          mergedPositions[day] = updatedPositions[day];
        }
      });
      
      saveScrollMap(currentSeasonKey, mergedPositions);
      
      // 시즌 메뉴에서 필터링 상태 변경 시 첫 번째 존재하는 섹션으로 네비게이션 바 업데이트
      if (!isCurrentlyThisWeek) {
        const dayOrder = ['upcoming', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'special'];
        const dayMap: { [key: string]: DayOfWeek } = {
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
        
        // 첫 번째 존재하는 섹션 찾기
        for (let i = 0; i < dayOrder.length; i++) {
          const sectionId = `${dayOrder[i]}-${selectedYear}-${selectedQuarter}`;
          const element = document.getElementById(sectionId);
          if (element && element.children.length > 0) {
            const firstDay = dayMap[dayOrder[i]];
            if (firstDay) {
              setSelectedDay(firstDay);
            }
            break;
          }
        }
      }
    }, 200);
  };
  


  // URL 쿼리 파라미터 처리 (검색 상태 복원 후에 실행)
  useEffect(() => {
    const queryParam = searchParams.get('q');
    const keywordParam = searchParams.get('keyword');
    const fromAnimeDetail = sessionStorage.getItem('from-anime-detail');
    const fromHeaderSearch = sessionStorage.getItem('from-header-search');
    
    // keyword 파라미터 우선 처리 (애니메이션 상세화면에서 돌아와도 유지)
    if (keywordParam) {
      setSearchQuery(keywordParam);
      setSearchInput(keywordParam);
      setIsSearching(true);
      
      // 애니메이션 상세화면에서 돌아온 경우 플래그 정리
      if (fromAnimeDetail === 'true') {
        sessionStorage.removeItem('from-anime-detail');
      }
      if (fromHeaderSearch === 'true') {
        sessionStorage.removeItem('from-header-search');
      }
    }
    // 기존 q 파라미터 처리 (하위 호환성)
    else if (queryParam && (fromHeaderSearch === 'true' || fromAnimeDetail !== 'true')) {
      setSearchQuery(queryParam);
      setSearchInput(queryParam);
      setIsSearching(true);
      
      // 헤더 검색 플래그 정리
      if (fromHeaderSearch === 'true') {
        sessionStorage.removeItem('from-header-search');
      }
    }
  }, [searchParams]);

  // 검색 상태 변경 시 스티키 상태 초기화
  useEffect(() => {
    if (isSearching) {
      // 검색 중일 때 스티키 상태 초기화
      setIsDaySelectionSticky(false);
      setIsSeasonSelectorSticky(false);
    }
  }, [isSearching]);

  // 페이지 로드 시 시즌 선택 상태 복원
  useEffect(() => {
    // from-anime-detail 플래그를 가장 먼저 확인
    const fromAnimeDetail = sessionStorage.getItem('from-anime-detail');
    
    const selectedSeason = sessionStorage.getItem('selected-season');
    const seasonChange = sessionStorage.getItem('navigation-type');
    
    // 저장된 요일 상태 복원 (시즌 메뉴에서 "이번 주"로 이동할 때)
    const savedDay = sessionStorage.getItem('selected-day');
    if (savedDay) {
      setSelectedDay(savedDay as DayOfWeek);
      // 복원 후 저장된 상태 제거
      sessionStorage.removeItem('selected-day');
      
      // 데이터 로딩 후 스크롤 복원 또는 빈 섹션 알림
      setTimeout(() => {
        const dayKey = getDayKey(savedDay as DayOfWeek);
        const element = document.getElementById(dayKey);
        
        if (element && element.children.length > 0) {
          // 해당 섹션이 존재하면 스크롤 이동
          const headerHeight = 60;
          const daySelectionHeight = 44;
          const margin = 74;
          const targetY = element.offsetTop - headerHeight - daySelectionHeight - margin;
          window.scrollTo({ top: Math.max(0, targetY), behavior: 'instant' });
        } else {
          // 해당 섹션이 없으면 스크롤 탑으로 이동하고 알림 표시
          window.scrollTo({ top: 0, behavior: 'instant' });
          
          // 빈 섹션 알림을 위한 커스텀 이벤트 발생
          const event = new CustomEvent('showEmptySectionMessage', {
            detail: { day: savedDay }
          });
          window.dispatchEvent(event);
        }
      }, 100);
    }
    
    
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
    
    
    // 초기화 완료 표시
    setIsInitialized(true);
  }, []);

  

  // 스크롤 컨테이너 찾기 함수는 이제 훅에서 제공됨




  // 이미지 프리로딩 훅
  const { preloadSearchResults } = useImagePreloading();
  const { getQueueStatus } = useSmartImagePreloader();

  // 분기 선택 핸들러
  const handleSeasonSelect = (year: number, quarter: number) => {
    // "이번 주" 선택인지 확인
    const isThisWeekSelected = year === 0 && quarter === 0;
    
    // 동일한 시즌 클릭 시 아무 반응하지 않음
    if (isThisWeekSelected && isThisWeek) {
      return; // 이미 "이번 주"인 경우
    }
    if (!isThisWeekSelected && selectedYear === year && selectedQuarter === quarter) {
      return; // 이미 해당 시즌인 경우
    }
    
    // 현재 시즌 키와 목표 시즌 키
    const currentSeasonKey = getSeasonKey(selectedYear, selectedQuarter);
    const targetSeasonKey = getSeasonKey(
      isThisWeekSelected ? null : year, 
      isThisWeekSelected ? null : quarter
    );
    
    // 현재 선택된 요일의 키
    const currentDayKey = getDayKey(selectedDay);
    
    // 상태 업데이트
    if (isThisWeekSelected) {
      setIsThisWeek(true);
      setSelectedYear(null);
      setSelectedQuarter(null);
    } else {
      // 시즌 메뉴로 이동
      const dayToSave = selectedDay === '곧 시작' ? '월' : selectedDay;
      sessionStorage.setItem('selected-day', dayToSave);
      
      // 애니메이션 아이템들에 페이드 아웃 효과
      const animeItems = document.querySelectorAll('[data-anime-item]');
      animeItems.forEach(item => {
        (item as HTMLElement).style.transition = 'opacity 0.2s ease-out';
        (item as HTMLElement).style.opacity = '0';
      });
      
      // 페이드 아웃과 동시에 스크롤 탑으로 이동 (번쩍임 방지)
      window.scrollTo({ top: 0, behavior: 'instant' });
      
      // 페이드 아웃 완료 후 페이지 이동
      setTimeout(() => {
        router.push(`/search/${year}/${quarter}`);
      }, 200);
      return;
    }
    
    // 필터링 상태 처리
    if (isThisWeekSelected) {
      setShowOnlyAiring(false);
    } else {
      const seasonKey = `showOnlyAiring_${year}_${quarter}`;
      const savedShowOnlyAiring = sessionStorage.getItem(seasonKey);
      setShowOnlyAiring(savedShowOnlyAiring === 'true');
    }
    
    // 시즌 정보 저장
    sessionStorage.setItem('selected-season', JSON.stringify(
      isThisWeekSelected ? { isThisWeek: true } : { year, quarter }
    ));
    
    // 스크롤 로직 처리
    const scrollMap = getStoredScrollMap();
    
    // 재방문 시 즉시 스크롤
    if (scrollMap[targetSeasonKey]) {
      // 예외 규칙: '이번 주' → 시즌 메뉴에서 '곧 시작' 또는 '일'은 스크롤 탑
      if (currentSeasonKey === 'this-week' && (selectedDay === '곧 시작' || selectedDay === '일')) {
        window.scrollTo({ top: 0, behavior: 'instant' });
        // 스티키 요소들 강제 해제
        setIsDaySelectionSticky(false);
        setIsSeasonSelectorSticky(false);
('🚀 이번 주 → 시즌 메뉴: 스크롤 탑');
        return;
      }
      
      // 예외 규칙: '일'은 시즌 메뉴에서만 스크롤 탑
      if (selectedDay === '일' && !isThisWeekSelected) {
        window.scrollTo({ top: 0, behavior: 'instant' });
        // 스티키 요소들 강제 해제
        setIsDaySelectionSticky(false);
        setIsSeasonSelectorSticky(false);
        return;
      }
      
      // 저장된 위치로 즉시 스크롤 (데이터 없으면 다음 순서 섹션 찾기)
      setTimeout(() => {
        // 실제 데이터 존재 여부를 확인하기 위해 DOM에서 섹션 확인
        const checkSectionExists = (dayKey: string) => {
          const sectionId = isThisWeekSelected ? dayKey : `${dayKey}-${targetSeasonKey}`;
          const element = document.getElementById(sectionId);
          return element && element.children.length > 0;
        };
        
        // 첫 번째 존재하는 섹션 찾기
        const dayOrder = ['upcoming', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'special'];
        let firstExistingIndex = -1;
        
        for (let i = 0; i < dayOrder.length; i++) {
          if (checkSectionExists(dayOrder[i])) {
            firstExistingIndex = i;
            break;
          }
        }
        
        // 첫 번째 존재하는 섹션 이전의 모든 요일은 스크롤 탑
        if (firstExistingIndex !== -1) {
          const currentIndex = dayOrder.indexOf(currentDayKey);
          if (currentIndex <= firstExistingIndex) {
            window.scrollTo({ top: 0, behavior: 'instant' });
            setIsDaySelectionSticky(false);
            setIsSeasonSelectorSticky(false);
            return;
          }
        }
        
        // 동일 섹션 확인
        if (checkSectionExists(currentDayKey)) {
          scrollToSavedPosition(targetSeasonKey, currentDayKey);
          return;
        }
        
        // 다음 순서 섹션 찾기
        const currentIndex = dayOrder.indexOf(currentDayKey);
        for (let i = currentIndex + 1; i < dayOrder.length; i++) {
          if (checkSectionExists(dayOrder[i])) {
            scrollToSavedPosition(targetSeasonKey, dayOrder[i]);
            return;
          }
        }
        
        // 모든 섹션 없음
        window.scrollTo({ top: 0, behavior: 'instant' });
        setIsDaySelectionSticky(false);
        setIsSeasonSelectorSticky(false);
      }, 50);
    } else {
      // 최초 방문 시 스크롤 탑
      window.scrollTo({ top: 0, behavior: 'instant' });
      // 스티키 요소들 강제 해제
      setIsDaySelectionSticky(false);
      setIsSeasonSelectorSticky(false);
    }
  };

  // 요일 선택 핸들러
  const handleDaySelect = (day: DayOfWeek) => {
    setSelectedDay(day);
    
    const currentSeasonKey = getSeasonKey(selectedYear, selectedQuarter);
    const dayKey = getDayKey(day);
    const scrollMap = getStoredScrollMap();
    
    // "이번 주"에서 빈 섹션 클릭 시 스크롤 이동하지 않음
    if (isThisWeek) {
      const checkSectionExists = (dayKey: string) => {
        const element = document.getElementById(dayKey);
        return element && element.children.length > 0;
      };
      
      if (!checkSectionExists(dayKey)) {
        return; // 빈 섹션이면 스크롤 이동하지 않음
      }
    }
    
    // 예외 규칙: '일'은 시즌 메뉴에서만 스크롤 탑
    if (day === '일' && !isThisWeek) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      // 스티키 요소들 강제 해제
      setIsDaySelectionSticky(false);
      setIsSeasonSelectorSticky(false);
      return;
    }
    
    // 저장된 위치가 있으면 즉시 스크롤 (데이터 없으면 다음 순서 섹션 찾기)
    if (scrollMap[currentSeasonKey]) {
      setTimeout(() => {
        // 실제 데이터 존재 여부를 확인하기 위해 DOM에서 섹션 확인
        const checkSectionExists = (dayKey: string) => {
          const sectionId = isThisWeek ? dayKey : `${dayKey}-${selectedYear}-${selectedQuarter}`;
          const element = document.getElementById(sectionId);
          return element && element.children.length > 0;
        };
        
        // 첫 번째 존재하는 섹션 찾기
        const dayOrder = ['upcoming', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'special'];
        let firstExistingIndex = -1;
        
        for (let i = 0; i < dayOrder.length; i++) {
          if (checkSectionExists(dayOrder[i])) {
            firstExistingIndex = i;
            break;
          }
        }
        
        // 첫 번째 존재하는 섹션 이전의 모든 요일은 스크롤 탑
        if (firstExistingIndex !== -1) {
          const currentIndex = dayOrder.indexOf(dayKey);
          if (currentIndex <= firstExistingIndex) {
            window.scrollTo({ top: 0, behavior: 'instant' });
            setIsDaySelectionSticky(false);
            setIsSeasonSelectorSticky(false);
            return;
          }
        }
        
        // 동일 섹션 확인
        if (checkSectionExists(dayKey)) {
          scrollToSavedPosition(currentSeasonKey, dayKey);
          return;
        }
        
        // 다음 순서 섹션 찾기
        const currentIndex = dayOrder.indexOf(dayKey);
        for (let i = currentIndex + 1; i < dayOrder.length; i++) {
          if (checkSectionExists(dayOrder[i])) {
            scrollToSavedPosition(currentSeasonKey, dayOrder[i]);
            return;
          }
        }
        
        // 모든 섹션 없음
        window.scrollTo({ top: 0, behavior: 'instant' });
        setIsDaySelectionSticky(false);
        setIsSeasonSelectorSticky(false);
      }, 50);
    } else {
      // 저장된 위치가 없으면 DOM에서 직접 찾아서 스크롤
      setTimeout(() => {
        const sectionId = isThisWeek ? dayKey : `${dayKey}-${selectedYear}-${selectedQuarter}`;
        const element = document.getElementById(sectionId);
        
        if (element) {
          const headerHeight = 60;
          const daySelectionHeight = 44;
          const margin = 50;
          const targetY = element.offsetTop - headerHeight - daySelectionHeight - margin;
          window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
        } else {
          // DOM에서 실제 존재하는 섹션들 확인
          const allSections = document.querySelectorAll('[id]');
          const sectionIds = Array.from(allSections).map(el => el.id).filter(id => 
            id.includes('upcoming') || id.includes('sun') || id.includes('mon') || 
            id.includes('tue') || id.includes('wed') || id.includes('thu') || 
            id.includes('fri') || id.includes('sat') || id.includes('special')
          );
        }
      }, 100);
    }
  };


  // React Query를 사용한 데이터 페칭 (통일된 캐싱 전략)
  const { data: scheduleData, error, isLoading, isFetching } = useQuery<AnimePreviewListDto>({
    queryKey: ['schedule', 'this-week'],
    queryFn: getCurrentSchedule, // 항상 '이번 주' 데이터만 호출
    enabled: isInitialized, // 초기화 완료 후에만 API 호출
    ...queryConfig.search, // 통일된 검색 데이터 캐싱 전략 적용
  });

  // 검색 쿼리 - 통일된 캐싱 전략 적용
  const { data: searchData, error: searchError, isLoading: isSearchLoading } = useQuery<AnimeSearchListDto>({
    queryKey: ['search', searchQuery], // 검색어만으로 키 생성
    queryFn: () => searchAnimes(searchQuery),
    enabled: isInitialized && searchQuery.trim().length > 0, // 검색어가 있을 때만 API 호출
    ...queryConfig.search, // 통일된 검색 데이터 캐싱 전략 적용
  });


  // 현재 연도와 분기는 더 이상 사용하지 않음 (isThisWeek로 관리)

  // 데이터 로딩 완료 후 애니메이션 상세화면에서 돌아올 때의 스크롤 복원 처리
  useEffect(() => {
    if (scheduleData || searchData) {
      // "이번 주"로 변경된 경우 방영 중 필터 해제
      const isCurrentlyThisWeek = selectedYear === null && selectedQuarter === null;
      if (isCurrentlyThisWeek && showOnlyAiring) {
        setShowOnlyAiring(false);
      }
      
      // 브라우저의 기본 스크롤 복원 사용 (커스텀 로직 제거)
      const fromAnimeDetail = sessionStorage.getItem('from-anime-detail');
      if (fromAnimeDetail === 'true') {
        // 플래그만 정리하고 브라우저 기본 동작 사용
        sessionStorage.removeItem('from-anime-detail');
        sessionStorage.removeItem('scroll-search-return');
      }
    }
  }, [scheduleData, searchData, showOnlyAiring, selectedYear, selectedQuarter, isThisWeek]);

  // 데이터 로딩 완료 후 시즌별 스크롤 위치 측정
  useEffect(() => {
    if (scheduleData && !searchQuery.trim()) {
      const seasonKey = getSeasonKey(selectedYear, selectedQuarter);
      const scrollMap = getStoredScrollMap();
      
      // 최초 방문인 경우 백그라운드에서 측정
      if (!scrollMap[seasonKey]) {
        setTimeout(() => {
          const positions = measureDayPositions(seasonKey);
          saveScrollMap(seasonKey, positions);
        }, 200); // DOM 완전 렌더링 대기
      }
    }
  }, [scheduleData, selectedYear, selectedQuarter, searchQuery]);

  // 1. DaySelection 스티키 처리
  useEffect(() => {
    const handleStickyScroll = () => {
      if (!daySelectionRef.current) return;
      
      const scrollY = window.scrollY;
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
    window.addEventListener('scroll', handleStickyScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleStickyScroll);
    };
  }, [isDaySelectionSticky]);

  // 2. SeasonSelector 스티키 처리
  useEffect(() => {
    const handleSeasonSelectorStickyScroll = () => {
      if (!seasonSelectorRef.current) return;
      
      const scrollY = window.scrollY;
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
    window.addEventListener('scroll', handleSeasonSelectorStickyScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleSeasonSelectorStickyScroll);
    };
  }, [isSeasonSelectorSticky]);

  // 3. 스티키 요소들의 높이 측정
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
  }, [isSeasonSelectorSticky]);


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
    // OTT 필터링이 활성화된 경우, 검색 중일 때, 또는 시즌 메뉴일 때 "곧 시작" 그룹은 제외
    if (selectedOttServices.length === 0 && !isSearchMode && isThisWeek) {
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
          // 남은 시간 기준으로 정렬 (라이브 중인 것은 반드시 앞에, 그 다음은 남은 시간이 적은 순)
          filteredUpcoming.sort((a, b) => {
            if (!a.scheduledAt || !b.scheduledAt) return 0;
            
            const now = new Date();
            const aScheduled = new Date(a.scheduledAt);
            const bScheduled = new Date(b.scheduledAt);
            
            // 현재 방영중인지 확인 (방영 시작부터 24시간 후까지)
            const aEndTime = new Date(aScheduled.getTime() + 24 * 60 * 60 * 1000);
            const bEndTime = new Date(bScheduled.getTime() + 24 * 60 * 60 * 1000);
            const aIsCurrentlyAiring = now >= aScheduled && now <= aEndTime;
            const bIsCurrentlyAiring = now >= bScheduled && now <= bEndTime;
            
            // 라이브 중인 애니는 반드시 앞에
            if (aIsCurrentlyAiring && !bIsCurrentlyAiring) return -1;
            if (!aIsCurrentlyAiring && bIsCurrentlyAiring) return 1;
            
            // 둘 다 라이브 중이거나 둘 다 방영 예정인 경우, 남은 시간이 적은 순으로 정렬
            const aTimeRemaining = aScheduled.getTime() - now.getTime();
            const bTimeRemaining = bScheduled.getTime() - now.getTime();
            
            return aTimeRemaining - bTimeRemaining;
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
          // 시즌 메뉴에서는 방영 중 애니를 제일 앞에 소팅
          if (!isThisWeek) {
            allAnimes.sort((a, b) => {
              // 방영 중인 것을 먼저 표시
              if (a.status === 'NOW_SHOWING' && b.status !== 'NOW_SHOWING') return -1;
              if (a.status !== 'NOW_SHOWING' && b.status === 'NOW_SHOWING') return 1;
              
              // 같은 상태끼리는 시간 순서대로 정렬
              if (!a.scheduledAt || !b.scheduledAt) return 0;
              const aTime = new Date(a.scheduledAt);
              const bTime = new Date(b.scheduledAt);
              return aTime.getTime() - bTime.getTime();
            });
          }
          
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
          // 시즌 메뉴에서는 방영 중 애니를 제일 앞에 소팅
          if (!isThisWeek) {
            dayAnimes.sort((a, b) => {
              // 방영 중인 것을 먼저 표시
              if (a.status === 'NOW_SHOWING' && b.status !== 'NOW_SHOWING') return -1;
              if (a.status !== 'NOW_SHOWING' && b.status === 'NOW_SHOWING') return 1;
              
              // 같은 상태끼리는 시간 순서대로 정렬
              if (!a.scheduledAt || !b.scheduledAt) return 0;
              const aTime = new Date(a.scheduledAt);
              const bTime = new Date(b.scheduledAt);
              return aTime.getTime() - bTime.getTime();
            });
          }
          
          grouped[day] = dayAnimes;
        }
      }
    });
    
    return grouped;
    })();
  }, [currentData, selectedOttServices, showOnlyAiring, isSearchMode, searchResults]);

  // 4. 스크롤-요일 네비게이션 연동
  useEffect(() => {
    if (!groupedAnimes || Object.keys(groupedAnimes).length === 0) return;
    
    // 데이터 로딩 완료 후 약간의 지연을 두고 네비게이션 연동 시작
    const timeout = setTimeout(() => {
      const handleNavigationScroll = () => {
      const scrollY = window.scrollY;
      
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

      // 스크롤이 0일 때는 첫 번째 존재하는 섹션을 찾기
      let activeSection = sections[0];
      
      if (scrollY === 0) {
        // 스크롤이 0일 때는 첫 번째 존재하는 섹션을 찾기
        for (let i = 0; i < sections.length; i++) {
          const section = sections[i];
          const element = document.getElementById(section.id);
          if (element && element.children.length > 0) {
            activeSection = section;
            break;
          }
        }
      } else {
        // 스크롤이 0이 아닐 때는 기존 로직 사용
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
      handleNavigationScroll();
      
      // 스크롤 이벤트 리스너 등록
      window.addEventListener('scroll', handleNavigationScroll, { passive: true });
      
      return () => {
        window.removeEventListener('scroll', handleNavigationScroll);
      };
    }, 10); // 데이터 로딩 완료 후 300ms 지연
    
    return () => {
      clearTimeout(timeout);
    };
  }, [groupedAnimes, isThisWeek, selectedYear, selectedQuarter]);


  const handleSearchInputChange = (input: string) => {
    setSearchInput(input);
  };

  const handleSearch = () => {
    const query = searchInput.trim();
    if (query) {
      // 검색 시 스티키 상태 초기화 (이전 스티키와 기본 요소 중복 방지)
      setIsDaySelectionSticky(false);
      setIsSeasonSelectorSticky(false);
      
      setSearchQuery(query);
      setIsSearching(true);
      // URL 업데이트
      router.push(`/search?keyword=${encodeURIComponent(query)}`);
    } else {
      setSearchQuery('');
      setIsSearching(false);
      // 검색 초기화 시 URL에서 keyword 파라미터 제거
      router.push('/search');
    }
  };

  const handleSearchChange = (query: string) => {
    setSearchInput(query);
  };

  // 검색 초기화 핸들러
  const handleSearchReset = () => {
    // 검색 초기화 시 스티키 상태 초기화
    setIsDaySelectionSticky(false);
    setIsSeasonSelectorSticky(false);
    
    setSearchQuery('');
    setSearchInput('');
    setIsSearching(false);
    // URL에서 keyword 파라미터 제거
    router.push('/search');
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
                    onClick={handleSearchReset}
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
                   onDaySelect={handleDaySelect}
                   emptyDays={emptyDays}
                   isThisWeek={isThisWeek}
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
            <div className={`${isThisWeek ? 'ml-[120px] md:ml-[340px]' : 'ml-[120px] md:ml-[368px]'} w-full`}>
              <div className="max-w-7xl mx-auto px-6">
                <DaySelection
                  selectedDay={selectedDay}
                  onDaySelect={handleDaySelect}
                  initialPosition={true}
                  emptyDays={emptyDays}
                  isThisWeek={isThisWeek}
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