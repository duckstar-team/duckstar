'use client';

import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AnimeSearchBar from '@/components/search/ui/AnimeSearchBar';
import AnimeCard from '@/components/anime/AnimeCard';
import DaySelection, { DayOfWeek } from '@/components/search/ui/DaySelection';
import SearchFilters from '@/components/search/filters/SearchFilters';
import SearchInput from '@/components/search/ui/SearchInput';
import { getScheduleByYearAndQuarter } from '@/api/search';
import SeasonSelector from '@/components/search/ui/SeasonSelector';
import type { AnimePreviewDto, AnimePreviewListDto } from '@/types/api';
import { extractChosung } from '@/lib/searchUtils';
import { useImagePreloading } from '@/hooks/useImagePreloading';
import { useSmartImagePreloader } from '@/hooks/useSmartImagePreloader';
import { useQuery } from '@tanstack/react-query';
import { queryConfig } from '@/lib/queryConfig';
import SearchLoadingSkeleton from '@/components/common/SearchLoadingSkeleton';
import PreloadingProgress from '@/components/common/PreloadingProgress';

function SeasonPageContent() {
  const router = useRouter();
  const params = useParams();
  const year = parseInt(params.year as string);
  const quarter = parseInt(params.quarter as string);
  
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('월');
  const [selectedOttServices, setSelectedOttServices] = useState<string[]>([]);
  const [randomAnimeTitle, setRandomAnimeTitle] = useState<string>('');
  const [isPreloading, setIsPreloading] = useState(false);
  const [preloadingStatus, setPreloadingStatus] = useState({ total: 0, loaded: 0, active: 0 });
  const preloadingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [showOnlyAiring, setShowOnlyAiring] = useState(false);
  
  // 스티키 요소들을 위한 상태와 ref
  const [isDaySelectionSticky, setIsDaySelectionSticky] = useState(false);
  const [isSeasonSelectorSticky, setIsSeasonSelectorSticky] = useState(false);
  const [seasonSelectorHeight, setSeasonSelectorHeight] = useState(0);
  
  const daySelectionRef = useRef<HTMLDivElement>(null);
  const seasonSelectorRef = useRef<HTMLDivElement>(null);

  // 이미지 프리로딩 훅
  const { preloadAnimeDetails } = useImagePreloading();
  const { getQueueStatus } = useSmartImagePreloader();

  // 초기화
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  // React Query를 사용한 데이터 페칭 (통일된 캐싱 전략)
  const { data: scheduleData, error, isLoading, isFetching } = useQuery<AnimePreviewListDto>({
    queryKey: ['schedule', year, quarter],
    queryFn: () => getScheduleByYearAndQuarter(year, quarter),
    enabled: isInitialized,
    ...queryConfig.search, // 통일된 검색 데이터 캐싱 전략 적용
  });

  // 데이터 로드 후 요일 상태 복원
  useEffect(() => {
    if (scheduleData && !isLoading) {
      const savedDay = sessionStorage.getItem('selected-day');
      if (savedDay) {
        // 시즌별 페이지에서 유효한 요일인지 확인
        const validDays = ['월', '화', '수', '목', '금', '토', '일', '특별편성 및 극장판'];
        const isValidDay = validDays.includes(savedDay);
        
        if (isValidDay) {
          setSelectedDay(savedDay as DayOfWeek);
          
          // 첫 번째 존재하는 섹션 찾기
          setTimeout(() => {
            const dayOrder = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun', 'special'];
            let firstExistingSection = null;
            
            for (const day of dayOrder) {
              const sectionId = `${day}-${year}-${quarter}`;
              const element = document.getElementById(sectionId);
              if (element && element.children.length > 0) {
                firstExistingSection = day;
                break;
              }
            }
            
            // 현재 복원된 요일이 첫 번째 섹션인지 확인
            const dayMapping: Record<string, string> = {
              '일': 'sun',
              '월': 'mon', 
              '화': 'tue',
              '수': 'wed',
              '목': 'thu',
              '금': 'fri',
              '토': 'sat',
              '특별편성 및 극장판': 'special'
            };
            
            const currentDayKey = dayMapping[savedDay];
            
            if (firstExistingSection === currentDayKey) {
              // 첫 번째 섹션으로 이동할 때는 스크롤 탑
              window.scrollTo({ top: 0, behavior: 'instant' });
            } else {
              // 다른 섹션으로 이동할 때는 해당 섹션으로 스크롤
              scrollToDay(savedDay as DayOfWeek);
            }
          }, 100);
        } else {
          // 유효하지 않은 요일('곧 시작' 등)인 경우 기본값인 '월' 사용
          setSelectedDay('월');
        }
        
        // 복원 후 저장된 상태 제거
        sessionStorage.removeItem('selected-day');
      }
    }
  }, [scheduleData, isLoading, year, quarter]);

  // 애니메이션 데이터 처리 (시즌별 페이지용)
  const currentData = useMemo(() => {
    if (!scheduleData) return null;
    
    // DTO에서 받은 year, quarter 사용 (URL 파라미터와 일치해야 함)
    return {
      year: scheduleData.year,
      quarter: scheduleData.quarter,
      schedule: scheduleData.schedule
    };
  }, [scheduleData]);

  // OTT 필터 핸들러
  const handleOttFilterChange = (service: string, checked: boolean) => {
    if (checked) {
      setSelectedOttServices(prev => [...prev, service]);
    } else {
      setSelectedOttServices(prev => prev.filter(s => s !== service));
    }
  };

  // 요일별 그룹핑 (기존 /search 페이지와 동일한 로직)
  const groupedAnimes = useMemo(() => {
    if (!currentData || !('schedule' in currentData)) {
      return {};
    }

    const dayOrder: (keyof typeof currentData.schedule)[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN', 'SPECIAL'];
    const grouped: { [key: string]: AnimePreviewDto[] } = {};
    
    // 방영 중 필터링 함수
    const filterAiringAnimes = (animes: AnimePreviewDto[]) => {
      if (showOnlyAiring) {
        const filtered = animes.filter(anime => anime.status === 'NOW_SHOWING');
        return filtered;
      }
      return animes;
    };
    
    // OTT 필터링 함수
    const filterOttAnimes = (animes: AnimePreviewDto[]) => {
      if (selectedOttServices.length === 0) {
        return animes;
      }
      
      return animes.filter(anime => {
        if (!anime.ottDtos || anime.ottDtos.length === 0) {
          return false;
        }
        
        return anime.ottDtos.some(ott => 
          selectedOttServices.includes(ott.ottType.toLowerCase())
        );
      });
    };
    
    // 각 요일별로 애니메이션 그룹핑
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
      
      if (dayAnimes.length > 0) {
        const filteredAnimes = filterOttAnimes(filterAiringAnimes(dayAnimes));
        if (filteredAnimes.length > 0) {
          // 정교한 정렬: 방영중/상영중 우선, 시간순 정렬
          filteredAnimes.sort((a, b) => {
            // 1. 방영중/상영중을 앞으로
            const aStatus = a.status === 'NOW_SHOWING' ? 0 : 1;
            const bStatus = b.status === 'NOW_SHOWING' ? 0 : 1;
            
            if (aStatus !== bStatus) {
              return aStatus - bStatus;
            }
            
            // 2. 방영중/상영중끼리는 시간순 정렬 (airTime 기준)
            if (aStatus === 0 && bStatus === 0) {
              const aTime = a.airTime || '00:00';
              const bTime = b.airTime || '00:00';
              return aTime.localeCompare(bTime);
            }
            
            // 3. 예정 상태들은 시간순 정렬
            if (aStatus === 1 && bStatus === 1) {
              const aTime = a.airTime || '00:00';
              const bTime = b.airTime || '00:00';
              return aTime.localeCompare(bTime);
            }
            
            // 기본값: 제목순
            return a.titleKor.localeCompare(b.titleKor);
          });
          
          grouped[day] = filteredAnimes;
        }
      }
    });
    
    return grouped;
  }, [currentData, showOnlyAiring, selectedOttServices]);

  // 빈 요일 확인 (기존 /search 페이지와 동일한 로직)
  const emptyDays = useMemo(() => {
    const dayOrder: DayOfWeek[] = ['월', '화', '수', '목', '금', '토', '일'];
    return dayOrder.filter(day => {
      // dayOfWeek 매핑: 한글 -> 영문
      const dayMapping: Record<string, string> = {
        '일': 'SUN',
        '월': 'MON', 
        '화': 'TUE',
        '수': 'WED',
        '목': 'THU',
        '금': 'FRI',
        '토': 'SAT'
      };
      
      const dayKey = dayMapping[day];
      return !groupedAnimes[dayKey] || groupedAnimes[dayKey].length === 0;
    });
  }, [groupedAnimes]);

  // 검색 핸들러
  const handleSearch = (query: string) => {
    if (query.trim()) {
      router.push(`/search-results?keyword=${encodeURIComponent(query)}`);
    }
  };

  // 요일 선택 핸들러 (시즌별 페이지용 간단한 로직)
  const handleDaySelect = (day: DayOfWeek) => {
    setSelectedDay(day);
    
    // 첫 번째 존재하는 섹션 찾기
    setTimeout(() => {
      const dayOrder = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun', 'special'];
      let firstExistingSection = null;
      
      for (const dayKey of dayOrder) {
        const sectionId = `${dayKey}-${year}-${quarter}`;
        const element = document.getElementById(sectionId);
        if (element && element.children.length > 0) {
          firstExistingSection = dayKey;
          break;
        }
      }
      
      // 현재 선택된 요일의 섹션 ID
      const dayMapping: Record<string, string> = {
        '일': 'sun',
        '월': 'mon', 
        '화': 'tue',
        '수': 'wed',
        '목': 'thu',
        '금': 'fri',
        '토': 'sat',
        '특별편성 및 극장판': 'special'
      };
      
      const currentDayKey = dayMapping[day];
      const currentSectionId = `${currentDayKey}-${year}-${quarter}`;
      
      // 첫 번째 섹션인지 확인
      if (firstExistingSection === currentDayKey) {
        // 첫 번째 섹션으로 이동할 때는 스크롤 탑
        window.scrollTo({ top: 0, behavior: 'instant' });
        setIsDaySelectionSticky(false);
        setIsSeasonSelectorSticky(false);
      } else {
        // 다른 섹션으로 이동할 때는 해당 섹션으로 스크롤
        scrollToDay(day);
      }
    }, 100);
  };

  // 요일 키 매핑 함수
  const getDayKey = (day: DayOfWeek): string => {
    const dayMapping: Record<string, string> = {
      '일': 'sun',
      '월': 'mon', 
      '화': 'tue',
      '수': 'wed',
      '목': 'thu',
      '금': 'fri',
      '토': 'sat',
      '곧 시작': 'upcoming',
      '특별편성 및 극장판': 'special'
    };
    
    return dayMapping[day] || day;
  };

  // 시즌 선택 핸들러
  const handleSeasonSelect = (year: number, quarter: number) => {
    // 동일한 시즌 클릭 시 아무 반응하지 않음
    if (year === parseInt(params.year as string) && quarter === parseInt(params.quarter as string)) {
      return;
    }
    
    // "이번 주" 선택인지 확인 (year === 0 && quarter === 0)
    if (year === 0 && quarter === 0) {
      // 이번 주로 이동할 때는 현재 선택된 요일을 저장
      sessionStorage.setItem('selected-day', selectedDay);
      
      // 애니메이션 아이템들에 페이드 아웃 효과
      const animeItems = document.querySelectorAll('[data-anime-item]');
      animeItems.forEach(item => {
        (item as HTMLElement).style.transition = 'opacity 0.2s ease-out';
        (item as HTMLElement).style.opacity = '0';
      });
      
      // 페이드 아웃과 동시에 스크롤 탑으로 이동 (번쩍임 방지)
      window.scrollTo({ top: 0, behavior: 'instant' });
      
      // 즉시 페이지 이동 (setTimeout 제거)
      router.push('/search');
    } else {
      // 다른 시즌으로 이동 시 현재 요일 저장
      sessionStorage.setItem('selected-day', selectedDay);
      
      // 애니메이션 아이템들에 페이드 아웃 효과
      const animeItems = document.querySelectorAll('[data-anime-item]');
      animeItems.forEach(item => {
        (item as HTMLElement).style.transition = 'opacity 0.2s ease-out';
        (item as HTMLElement).style.opacity = '0';
      });
      
      // 페이드 아웃과 동시에 스크롤 탑으로 이동 (번쩍임 방지)
      window.scrollTo({ top: 0, behavior: 'instant' });
      
      // 즉시 페이지 이동 (setTimeout 제거)
      router.push(`/search/${year}/${quarter}`);
    }
  };

  // OTT 필터 핸들러
  const handleOttServiceChange = (service: string, checked: boolean) => {
    if (checked) {
      setSelectedOttServices(prev => [...prev, service]);
    } else {
      setSelectedOttServices(prev => prev.filter(s => s !== service));
    }
  };

  // 방영 중 필터 핸들러
  const handleShowOnlyAiringChange = (checked: boolean) => {
    setShowOnlyAiring(checked);
  };

  // 1. DaySelection 스티키 처리 (기존 /search와 동일)
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

  // 2. SeasonSelector 스티키 처리 (기존 /search와 동일)
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

  // 3. 스티키 요소들의 높이 측정 (기존 /search와 동일)
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

  // 요일 네비게이션 스크롤 핸들러 (페이드 효과 포함)
  const scrollToDay = (day: DayOfWeek) => {
    const dayMapping: Record<string, string> = {
      '일': 'sun',
      '월': 'mon', 
      '화': 'tue',
      '수': 'wed',
      '목': 'thu',
      '금': 'fri',
      '토': 'sat',
      '곧 시작': 'upcoming',
      '특별편성 및 극장판': 'special'
    };
    
    const dayKey = dayMapping[day];
    if (dayKey) {
      const sectionId = `${dayKey}-${year}-${quarter}`;
      const element = document.getElementById(sectionId);
      
      if (element) {
        const headerHeight = 60;
        const daySelectionHeight = 44;
        const margin = 74;
        const targetY = element.offsetTop - headerHeight - daySelectionHeight - margin;
        
        // 메뉴 내부 스크롤은 즉시 이동
        window.scrollTo({ top: Math.max(0, targetY), behavior: 'instant' });
      }
    }
  };

  // 4. 스크롤-요일 네비게이션 연동
  useEffect(() => {
    if (!groupedAnimes || Object.keys(groupedAnimes).length === 0) return;
    
    // 데이터 로딩 완료 후 약간의 지연을 두고 네비게이션 연동 시작
    const timeout = setTimeout(() => {
      const handleNavigationScroll = () => {
        const scrollY = window.scrollY;
        
        // 시즌별 페이지에서는 "곧 시작" 그룹이 없으므로 요일들만 처리 (월요일부터 시작)
        const sections = [
          { id: `mon-${year}-${quarter}`, day: '월' },
          { id: `tue-${year}-${quarter}`, day: '화' },
          { id: `wed-${year}-${quarter}`, day: '수' },
          { id: `thu-${year}-${quarter}`, day: '목' },
          { id: `fri-${year}-${quarter}`, day: '금' },
          { id: `sat-${year}-${quarter}`, day: '토' },
          { id: `sun-${year}-${quarter}`, day: '일' },
          { id: `special-${year}-${quarter}`, day: '특별편성 및 극장판' }
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
    }, 10); // 데이터 로딩 완료 후 10ms 지연
    
    return () => {
      clearTimeout(timeout);
    };
  }, [groupedAnimes, year, quarter]);

  // 로딩 상태
  if (isLoading) {
    return <SearchLoadingSkeleton />;
  }

  // 에러 상태
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">데이터를 불러오는 중 오류가 발생했습니다</h2>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            다시 시도
          </button>
        </div>
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
                value=""
                onChange={() => {}}
                onSearch={() => {}}
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
              <div className="bg-white box-border content-stretch flex gap-2.5 items-center justify-center px-[25px] py-2.5 relative rounded-[12px] w-fit">
                <SeasonSelector
                  onSeasonSelect={handleSeasonSelect}
                  className="w-fit"
                  currentYear={year}
                  currentQuarter={quarter}
                />
              </div>
              
              {/* 방영 중 애니만 보기 체크박스 */}
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
            </div>
          </div>
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
              <div className="bg-white box-border content-stretch flex gap-2.5 items-center justify-center px-[25px] py-2.5 relative rounded-[12px] w-fit">
                <SeasonSelector
                  onSeasonSelect={handleSeasonSelect}
                  className="w-fit"
                  currentYear={year}
                  currentQuarter={quarter}
                />
              </div>
              
              {/* 방영 중 애니만 보기 체크박스 */}
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
            </div>
          </div>
        </div>
      )}

      {/* DaySelection 또는 OTT 필터 큐 - SearchSection 아래에 배치 */}
      <div className="w-full h-[95px] bg-white">
        <div className="max-w-7xl mx-auto px-6 pt-[50px] pb-8">
          {selectedOttServices.length === 0 ? (
            <div ref={daySelectionRef} className="mb-[40px] flex justify-center">
              <div className="ml-[100px]">
                <DaySelection
                  selectedDay={selectedDay}
                  onDaySelect={(day) => {
                    handleDaySelect(day);
                    scrollToDay(day);
                  }}
                  emptyDays={new Set(emptyDays)}
                  isThisWeek={false}
                  isSticky={isDaySelectionSticky}
                />
              </div>
            </div>
          ) : (
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
                        onClick={() => handleOttFilterChange(ottService, false)}
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
          )}
        </div>
      </div>

      {/* Sticky DaySelection 또는 OTT 필터 큐 - SeasonSelector 아래에 고정 */}
      {isDaySelectionSticky && (
        <div 
          className="fixed left-[65px] w-full bg-white border-b border-gray-200 z-30"
          style={{ 
            top: isSeasonSelectorSticky ? `${60 + seasonSelectorHeight}px` : '60px',
            zIndex: 30,
            transition: 'all 0.3s ease-in-out'
          }}
        >
          <div className="flex justify-center">
            <div className="ml-[120px] md:ml-[368px] w-full">
              <div className="max-w-7xl mx-auto px-6">
                {selectedOttServices.length === 0 ? (
                  <DaySelection
                    selectedDay={selectedDay}
                    onDaySelect={(day) => {
                      handleDaySelect(day);
                      scrollToDay(day);
                    }}
                    initialPosition={true}
                    emptyDays={new Set(emptyDays)}
                    isThisWeek={false}
                    isSticky={isDaySelectionSticky}
                  />
                ) : (
                  <div className="flex justify-start">
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
                              onClick={() => handleOttFilterChange(ottService, false)}
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
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Anime Grid Section - F8F9FA 배경 */}
      <div className="w-full" style={{ backgroundColor: '#F8F9FA' }}>
        <div className="max-w-7xl mx-auto px-6 pt-8 pb-8">
          {/* Anime Grid - OTT 필터링 시 요일 구분 없이 표시 */}
          {groupedAnimes && Object.keys(groupedAnimes).length > 0 ? (
            <div className="space-y-0" data-content-loaded>
              {selectedOttServices.length > 0 ? (
                // OTT 필터링 시: 모든 애니메이션을 하나의 그리드로 표시
                <div>
                  <div className="flex items-end gap-3 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                      필터링 결과
                    </h2>
                    <span className="text-[12px] font-normal text-[#868E96] font-['Pretendard']">
                      {Object.values(groupedAnimes).flat().length}개의 애니메이션
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[30px]">
                    {Object.values(groupedAnimes).flat().map((anime) => (
                      <AnimeCard
                        key={anime.animeId}
                        anime={anime}
                        isCurrentSeason={false}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                // OTT 필터링 없을 때: 요일별로 구분하여 표시 (기존 /search와 동일)
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
                const sectionId = `${baseSectionId}-${year}-${quarter}`;
                
                return (
                  <div key={day} id={sectionId}>
                    {/* 요일 제목 */}
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
                            scrollToDay(koreanDay as DayOfWeek);
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

                    {/* 애니메이션 그리드 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[30px] mb-12">
                      {dayAnimes.map((anime) => (
                        <AnimeCard
                          key={anime.animeId}
                          anime={anime}
                          isCurrentSeason={false}
                        />
                      ))}
                    </div>
                    
                    {/* 요일 사이 세퍼레이터 (마지막 요일 제외) */}
                    {day !== 'SPECIAL' && (
                      <div className="border-t border-gray-200 h-6"></div>
                    )}
                  </div>
                );
              })
              )}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {year}년 {quarter}분기 데이터가 없습니다
              </h3>
              <p className="text-gray-600 mb-6">
                다른 시즌을 선택해보세요
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 프리로딩 진행률 표시 */}
      {isPreloading && (
        <PreloadingProgress 
          total={preloadingStatus.total}
          loaded={preloadingStatus.loaded}
          active={preloadingStatus.active}
        />
      )}
    </div>
  );
}

export default function SeasonPage() {
  return (
    <Suspense fallback={<SearchLoadingSkeleton />}>
      <SeasonPageContent />
    </Suspense>
  );
}