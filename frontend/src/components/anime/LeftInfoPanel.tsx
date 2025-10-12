'use client';

import React, { useState, useRef, useEffect } from 'react';
import '../../styles/customScrollbar.css';
import { cn } from '@/lib/utils';
import CharacterList from './CharacterList';
import { CharacterData } from './CharacterCard';
import ImageModal from './ImageModal';
import { useImageCache } from '../../hooks/useImageCache';
import RightCommentPanel from './RightCommentPanel';

export type TabOption = 'info' | 'characters' | 'performance' | 'comments';

interface TabOptionConfig {
  key: TabOption;
  label: string;
  width: string;
  isBeta?: boolean;
  badgeText?: string;
}

interface LeftInfoPanelProps {
  onBack: () => void;
  onImageModalToggle?: (isOpen: boolean) => void; // 이미지 모달 상태 전달
  isAdmin?: boolean; // 관리자 여부
  onImageEdit?: () => void; // 이미지 편집 핸들러
  isEditingImage?: boolean; // 이미지 편집 중 여부
  imageFile?: File | null; // 선택된 이미지 파일
  onImageUpdate?: () => void; // 이미지 업데이트 핸들러
  onImageEditCancel?: () => void; // 이미지 편집 취소 핸들러
  isMobile?: boolean;
  animeId?: number; // 댓글 패널용 애니 ID
  rawAnimeData?: any; // 댓글 패널용 원본 데이터
  anime: {
    animeId: number;
    mainThumbnailUrl: string;
    mainImageUrl?: string; // 배경 이미지용 (optional로 변경)
    thumbnailImageUrl?: string; // 배경용 썸네일
    thumbnailPosterUrl?: string; // 포스터용 썸네일
    titleKor: string;
    titleJpn?: string;
    status: 'UPCOMING' | 'NOW_SHOWING' | 'COOLING' | 'ENDED';
    dayOfWeek: 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN' | 'SPECIAL' | 'NONE';
    scheduledAt: string;
    genre: string;
    medium: 'TVA' | 'MOVIE' | 'OVA' | 'SPECIAL';
    year?: number;
    quarter?: number;
    seasons?: Array<{ year: number; seasonType: string }>; // 모든 시즌 정보
    // 추가 정보들
    studio?: string;
    director?: string;
    source?: string;
    startDate?: string;
    rating?: string;
    synopsis?: string;
    officialSite?: string | Record<string, string>; // 문자열 또는 객체
    ottDtos?: { ottType: string; watchUrl?: string }[];
  };
  characters?: CharacterData[];
}

// 시즌 타입을 한국어로 변환하는 함수
const getSeasonInKorean = (seasonType: string): string => {
  const seasonMap: { [key: string]: string } = {
    'SPRING': '봄',
    'SUMMER': '여름',
    'AUTUMN': '가을',
    'WINTER': '겨울'
  };
  return seasonMap[seasonType] || seasonType;
};

export default function LeftInfoPanel({ 
  anime, 
  onBack, 
  characters,
  onImageModalToggle,
  isAdmin = false,
  onImageEdit,
  isEditingImage = false,
  imageFile,
  onImageUpdate,
  onImageEditCancel,
  isMobile = false,
  animeId,
  rawAnimeData
}: LeftInfoPanelProps) {
  // 이미지 캐시 훅 사용
  const { isImageLoaded, isImageError } = useImageCache();
  
  // 탭 상태 관리
  const [currentTab, setCurrentTab] = useState<TabOption>('info');
  const [hoveredTab, setHoveredTab] = useState<TabOption | null>(null);
  
  // 화면 크기 감지 (1280px 미만에서 스크롤 컨테이너 없이 자연스러운 레이아웃)
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [isMediumScreen, setIsMediumScreen] = useState(false);
  const [isVerySmallScreen, setIsVerySmallScreen] = useState(false);
  
  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 1280);
      setIsMediumScreen(window.innerWidth >= 600 && window.innerWidth < 1024);
      setIsVerySmallScreen(window.innerWidth < 425);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);
  
  // Synopsis 접기/펼치기 상태 관리
  const [isSynopsisExpanded, setIsSynopsisExpanded] = useState(false);
  const [showExpandButton, setShowExpandButton] = useState(false);
  const synopsisRef = useRef<HTMLDivElement>(null);
  const [selectedBarStyle, setSelectedBarStyle] = useState({
    width: '0px',
    left: '0px',
    opacity: 0,
    transition: 'all 0.3s ease-out'
  });
  const [hoveredBarStyle, setHoveredBarStyle] = useState({
    width: '0px',
    left: '0px',
    opacity: 0,
    transition: 'all 0.3s ease-out'
  });
  
  // 화면 높이 계산
  const [windowHeight, setWindowHeight] = useState(0);
  
  useEffect(() => {
    const updateDimensions = () => {
      setWindowHeight(window.innerHeight);
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<{ [key in TabOption]: HTMLButtonElement | null }>({} as Record<TabOption, HTMLButtonElement | null>);

  // 높이 계산 (헤더 높이 60px, 상단 여백 30px, 하단 여백 30px)
  const headerHeight = 60;
  const topPadding = 30;
  const bottomPadding = 30;
  const availableHeight = windowHeight - headerHeight - topPadding - bottomPadding;
  const panelHeight = Math.max(availableHeight, 500); // 최소 500px
  
  // 비율 계산 (기본 높이 700px 기준)
  const baseHeight = 700;
  const heightRatio = Math.max(panelHeight / baseHeight, 0.7); // 최소 70% 비율
  
  // 각 섹션별 높이 계산
  const mainImageBaseHeight = 385; // 메인 이미지 기본 높이
  const titleOverlayBaseHeight = 192; // 제목 오버레이 기본 높이
  const titleOverlayBaseTop = 157; // 제목 오버레이 기본 top 위치
  const lowerPanelBaseTop = 337; // 하단 패널 기본 top 위치
  
  // 메인 이미지 섹션 높이 (전체 높이의 55% 정도, 최소 250px, 최대 400px)
  const mainImageHeight = Math.min(Math.max(panelHeight * 0.55, 250), 400);
  
  // 제목 오버레이 섹션 높이와 위치 (메인 이미지 높이에 맞춰 조정)
  // 창이 작아질 때도 적절한 높이 유지
  const titleOverlayHeight = Math.min(
    Math.max(titleOverlayBaseHeight * heightRatio, 160), // 최소 160px
    panelHeight * 0.4 // 최대 전체 높이의 40%
  );
  const titleOverlayTop = Math.max(mainImageHeight * 0.35, 100); // 메인 이미지의 35% 지점으로 다시 위로
  
  // 하단 정보 패널 위치와 높이 (제목 오버레이와 완전히 연결되도록 조정)
  // 제목 오버레이의 하단과 하단 패널의 상단이 완전히 연결되도록
  // 창 높이가 줄어들어도 항상 연결되도록 보장
  const lowerPanelTop = titleOverlayTop + titleOverlayHeight; // 제목 오버레이 하단과 정확히 연결
  const lowerPanelHeight = Math.max(panelHeight - lowerPanelTop, 150);
  
  // 정보 컨텐츠 섹션(회색 블록) 높이 계산
  const tabMenuHeight = 44; // 탭 메뉴 높이
  const panelTopPadding = 15.593; // 상단 패딩
  const gapBetween = 9.653; // 탭과 컨텐츠 간격
  const panelBottomPadding = 15; // 하단 패딩
  const totalPadding = panelTopPadding + gapBetween + panelBottomPadding;
  
  const infoContentHeight = Math.max(lowerPanelHeight - tabMenuHeight - totalPadding + 5, 125); // 5px 추가, 최소 높이도 5px 증가
  
  // 스크롤 컨테이너 높이 계산 (회색 블록 내부 패딩 제외)
  const grayBlockPadding = 20; // 회색 블록 내부 상하 패딩 (10px + 10px)
  const scrollContainerHeight = Math.max(infoContentHeight - grayBlockPadding, 90);
  
  // 등장인물 탭용 스크롤 컨테이너 높이 계산
  const characterScrollContainerHeight = Math.max(infoContentHeight, 90);

  const tabOptions: TabOptionConfig[] = (isMobile || (animeId && rawAnimeData)) ? [
    { key: 'info' as const, label: '애니 정보', width: 'flex-1', isBeta: false },
    { key: 'characters' as const, label: '등장인물', width: 'flex-1', isBeta: false },
    { key: 'performance' as const, label: '분기 성적', width: 'flex-1', isBeta: true, badgeText: '준비중' },
    { key: 'comments' as const, label: '댓글', width: 'flex-1', isBeta: false }
  ] : [
    { key: 'info' as const, label: '애니 정보', width: 'flex-1', isBeta: false },
    { key: 'characters' as const, label: '등장인물', width: 'flex-1', isBeta: false },
    { key: 'performance' as const, label: '분기 성적', width: 'flex-1', isBeta: true, badgeText: '준비중' }
  ];

  // 네비게이션 바 위치 업데이트
  const updateNavigationBar = (tab: TabOption | null, immediate = false) => {
    if (!tab || !tabRefs.current[tab] || !containerRef.current) {
      setSelectedBarStyle({ width: '0px', left: '0px', opacity: 0, transition: 'all 0.3s ease-out' });
      return;
    }

    const tabElement = tabRefs.current[tab];
    const containerElement = containerRef.current;
    
    const tabRect = tabElement.getBoundingClientRect();
    const containerRect = containerElement.getBoundingClientRect();
    
    const left = tabRect.left - containerRect.left;
    const width = tabRect.width;
    
    setSelectedBarStyle({
      width: `${width}px`,
      left: `${left}px`,
      opacity: 1,
      transition: immediate ? 'none' : 'all 0.3s ease-out'
    });
  };

  // 호버된 네비게이션 바 위치 업데이트
  const updateHoveredBar = (tab: TabOption | null) => {
    if (!tab || !tabRefs.current[tab] || !containerRef.current) {
      setHoveredBarStyle({ width: '0px', left: '0px', opacity: 0, transition: 'all 0.3s ease-out' });
      return;
    }

    const tabElement = tabRefs.current[tab];
    const containerElement = containerRef.current;
    
    const tabRect = tabElement.getBoundingClientRect();
    const containerRect = containerElement.getBoundingClientRect();
    
    const left = tabRect.left - containerRect.left;
    const width = tabRect.width;
    
    setHoveredBarStyle({
      width: `${width}px`,
      left: `${left}px`,
      opacity: 1,
      transition: 'all 0.3s ease-out'
    });
  };

  // 마우스 이벤트 핸들러
  const handleMouseEnter = (tab: TabOption) => {
    if (tab === currentTab) return;
    
    setHoveredTab(tab);
    updateHoveredBar(tab);
  };

  const handleMouseLeave = () => {
    setHoveredTab(null);
    setHoveredBarStyle(prev => ({ ...prev, opacity: 0 }));
  };

  // anime 객체가 null인 경우 early return
  if (!anime) {
    return (
      <div className={`w-full ${isMobile ? '' : 'max-w-[612px]'} h-[1144px] bg-white rounded-xl border border-[#D1D1D6] flex items-center justify-center`}>
        <div className="text-gray-500">애니메이션 정보를 불러오는 중...</div>
      </div>
    );
  }

  // anime 객체가 null일 경우를 대비한 기본값 설정
  const {
    mainThumbnailUrl = '',
    mainImageUrl = '',
    thumbnailImageUrl = '',
    thumbnailPosterUrl = '',
    titleKor = '',
    titleJpn = '',
    status = '',
    dayOfWeek = '',
    scheduledAt = '',
    genre = '',
    medium = '',
    year = 2025,
    quarter = 2,
    studio = '',
    director = '',
    source = '',
    startDate = '',
          rating = '',
          synopsis = '',
    officialSite,
    ottDtos = []
  } = anime;

  // 이미지 로딩 상태 관리 (간소화)
  const [currentPosterImage, setCurrentPosterImage] = useState(mainThumbnailUrl || "/banners/duckstar-logo.svg");
  const [currentBackgroundImage, setCurrentBackgroundImage] = useState(mainThumbnailUrl || "/banners/duckstar-logo.svg");
  const [backgroundPosition, setBackgroundPosition] = useState("center center");
  const [isMainImageLoaded, setIsMainImageLoaded] = useState(false);
  const [isCachedImage, setIsCachedImage] = useState(false); // 캐시된 이미지 여부
  const [skipTransition, setSkipTransition] = useState(false); // 전환 효과 건너뛰기
  const [initialImageSet, setInitialImageSet] = useState(false); // 초기 이미지 설정 여부
  
  // 이미지 모달 상태
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  // 이미지 캐시 확인 함수 (간단하고 확실한 방법)
  const isImageCached = (imageUrl: string): Promise<boolean> => {
    return new Promise((resolve) => {
      // 브라우저 캐시를 직접 확인하는 가장 확실한 방법
      const img = new window.Image();
      
      // 타임아웃 설정 (1초)
      const timeout = setTimeout(() => {
        resolve(false);
      }, 1000);
      
      img.onload = () => {
        clearTimeout(timeout);
        resolve(true);
      };
      
      img.onerror = () => {
        clearTimeout(timeout);
        resolve(false);
      };
      
      // CORS 설정 없이 로드 시도
      img.src = imageUrl;
    });
  };

  // 이미지 위치 계산 함수 - 모든 이미지의 중앙점을 맞춤
  const calculateImagePosition = (imageUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        const containerWidth = 586; // 배경 컨테이너 너비
        const containerHeight = 828; // 배경 컨테이너 높이
        const containerAspectRatio = containerWidth / containerHeight;
        const imageAspectRatio = img.width / img.height;
        
        // 모든 이미지의 중앙점을 컨테이너 중앙에 맞춤
        let position = "center center";
        
        if (imageAspectRatio > containerAspectRatio) {
          // 이미지가 더 넓음 - 높이에 맞춤, 좌우 중앙
          position = "center center";
        } else {
          // 이미지가 더 높음 - 너비에 맞춤, 상하 중앙
          position = "center center";
        }
        
        resolve(position);
      };
      img.onerror = () => resolve("center center");
      img.src = imageUrl;
    });
  };

  // 초기 캐시 확인 및 이미지 설정
  useEffect(() => {
    if (mainImageUrl && mainThumbnailUrl && mainImageUrl !== mainThumbnailUrl && !initialImageSet) {
      const checkInitialCache = async () => {
        const isCached = await isImageCached(mainImageUrl);
        if (isCached) {
          setCurrentBackgroundImage(mainImageUrl);
          setIsMainImageLoaded(true);
          setIsCachedImage(true);
          setSkipTransition(true);
          setInitialImageSet(true);
        }
      };
      checkInitialCache();
    }
  }, [mainImageUrl, mainThumbnailUrl, initialImageSet]);

  // 메인 이미지 프리로딩 및 교체 (배경 이미지) - 최적화된 버전
  useEffect(() => {
    if (mainImageUrl && mainThumbnailUrl && mainImageUrl !== mainThumbnailUrl && !isCachedImage) {
      const preloadMainImage = async () => {
        try {
          // 메인 이미지 캐시 확인 (Promise 기반)
          const isCached = await isImageCached(mainImageUrl);
          
          if (isCached) {
            // 캐시되어 있으면 바로 메인 이미지 사용 (thumb -> main 전환 건너뛰기)
            // 전환 효과 완전히 건너뛰기
            setSkipTransition(true);
            setIsCachedImage(true);
            
            // 즉시 상태 업데이트 (전환 효과 없이)
            const position = await calculateImagePosition(mainImageUrl);
            setBackgroundPosition(position);
            
            // 배경 이미지를 즉시 변경 (전환 없이)
            setCurrentBackgroundImage(mainImageUrl);
            setIsMainImageLoaded(true);
          } else {
            // 캐시되어 있지 않으면 썸네일 먼저 표시 후 progressive loading
            // 이미지 로딩을 위한 새로운 Image 객체 생성
            const img = new window.Image();
            
            // CORS 설정 - duckstar.kr 도메인은 CORS 설정하지 않음
            if (!mainImageUrl.includes('duckstar.kr')) {
              img.crossOrigin = 'anonymous';
            }
            
            // 이미지 로딩 옵션 설정
            img.decoding = 'async';
            img.loading = 'eager'; // 즉시 로딩
            
            // 성공 콜백
            img.onload = async () => {
              try {
                // 메인 이미지의 중앙점을 계산하여 설정
                const position = await calculateImagePosition(mainImageUrl);
                setBackgroundPosition(position);
                setCurrentBackgroundImage(mainImageUrl);
                setIsMainImageLoaded(true);
              } catch (error) {
                // 위치 계산 실패해도 이미지는 표시
                setCurrentBackgroundImage(mainImageUrl);
                setIsMainImageLoaded(true);
              }
            };
            
            // 에러 콜백
            img.onerror = () => {
              // 에러 시 썸네일 유지 (이미 설정된 상태)
            };
            
            // 이미지 로딩 시작
            img.src = mainImageUrl;
          }
        } catch (error) {
          // 에러 시 썸네일 유지
        }
      };
      
      // 지연 실행으로 초기 로딩 부담 감소
      const timeoutId = setTimeout(preloadMainImage, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [mainImageUrl, mainThumbnailUrl]);


  // 썸네일 이미지 위치 계산 (초기 로드 시)
  useEffect(() => {
    if (mainThumbnailUrl) {
      calculateImagePosition(mainThumbnailUrl).then(setBackgroundPosition);
    }
  }, [mainThumbnailUrl]);
  
  // mainThumbnailUrl이 로드되면 포스터 이미지 상태 업데이트
  useEffect(() => {
    if (mainThumbnailUrl) {
      setCurrentPosterImage(mainThumbnailUrl);
    }
  }, [mainThumbnailUrl]);

  // 초기 네비게이션 바 위치 설정
  useEffect(() => {
    updateNavigationBar(currentTab, true);
  }, [currentTab]);

  // Synopsis 텍스트가 2줄을 넘는지 확인
  useEffect(() => {
    if (synopsis && synopsisRef.current) {
      const element = synopsisRef.current;
      const lineHeight = 24; // 16px * 1.5 line-height
      const maxHeight = lineHeight * 2; // 2줄
      
      // 임시로 전체 텍스트를 표시하여 높이 측정
      element.style.webkitLineClamp = 'unset';
      element.style.display = 'block';
      element.style.whiteSpace = 'pre-wrap'; // 줄바꿈 고려
      const fullHeight = element.scrollHeight;
      
      // 2줄 제한 적용
      element.style.webkitLineClamp = '2';
      element.style.display = '-webkit-box';
      element.style.whiteSpace = 'pre-wrap'; // 줄바꿈 유지
      
      // 더 정확한 높이 계산을 위해 실제 줄 수 확인
      const actualLines = Math.ceil(fullHeight / lineHeight);
      
      // 텍스트 길이도 함께 고려 (문자 수 기준)
      const textLength = synopsis.length;
      const isLongText = textLength > 100; // 100자 이상
      const isManyLines = actualLines > 3; // 3줄 이상
      
      // 텍스트가 길거나 줄 수가 많을 때만 펼치기 버튼 표시
      if (isLongText || isManyLines) {
        setShowExpandButton(true);
      } else {
        setShowExpandButton(false);
      }
    }
  }, [synopsis]);

  // 요일 한글 변환
  const getDayInKorean = (day: string) => {
    const dayMap: { [key: string]: string } = {
      'MON': '월', 'TUE': '화', 'WED': '수', 'THU': '목', 'FRI': '금', 'SAT': '토', 'SUN': '일'
    };
    return dayMap[day] || day;
  };

  // 분기 한글 변환
  const getQuarterInKorean = (quarter: number) => {
    const quarterMap: { [key: number]: string } = {
      1: '겨울', 2: '봄', 3: '여름', 4: '가을'
    };
    return quarterMap[quarter] || '';
  };

  // 방영 시간 포맷팅
  const formatAirTime = (scheduledAt: string) => {
    if (!scheduledAt) return '';
    
    // ISO 문자열이 아닌 경우 (예: "21:25") 직접 반환
    if (scheduledAt.includes(':') && !scheduledAt.includes('T')) {
      return scheduledAt;
    }
    
    try {
      const date = new Date(scheduledAt);
      // 유효한 날짜인지 확인
      if (isNaN(date.getTime())) {
        return '';
      }
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch (error) {
      return '';
    }
  };

  // OTT 클릭 핸들러
  const handleOttClick = (watchUrl?: string) => {
    if (watchUrl) {
      window.open(watchUrl, '_blank');
    }
  };

  // 이미지 클릭 핸들러 (메인 이미지 모달 열기)
  const handleImageClick = () => {
    // 메인 이미지가 있으면 메인 이미지를, 없으면 썸네일을 사용
    const imageToShow = mainImageUrl || mainThumbnailUrl;
    if (imageToShow) {
      setIsImageModalOpen(true);
      onImageModalToggle?.(true); // 부모 컴포넌트에 모달 열림 알림
    }
  };

  // 이미지 모달 닫기 핸들러
  const handleImageModalClose = () => {
    setIsImageModalOpen(false);
    onImageModalToggle?.(false); // 부모 컴포넌트에 모달 닫힘 알림
  };

  // API 응답에서 캐릭터 데이터를 매핑하는 함수
  const mapCastPreviewsToCharacters = (castPreviews: unknown[]): CharacterData[] => {
    if (!castPreviews || !Array.isArray(castPreviews)) {
      return [];
    }

    return castPreviews.map((cast, index) => {
      const castData = cast as Record<string, unknown>;
      return {
        characterId: (castData.characterId as number) || index + 1,
        nameKor: (castData.nameKor as string) || (castData.name as string) || '이름 없음',
        nameJpn: (castData.nameJpn as string) || (castData.nameOrigin as string),
        nameEng: (castData.nameEng as string) || (castData.nameEnglish as string),
        imageUrl: (castData.imageUrl as string) || (castData.characterImageUrl as string),
        description: (castData.description as string) || (castData.characterDescription as string),
        voiceActor: (castData.voiceActor as string) || (castData.cvName as string) || (castData.cv as string),
        role: (castData.role as 'MAIN' | 'SUPPORTING' | 'MINOR') || (index < 2 ? 'MAIN' : index < 4 ? 'SUPPORTING' : 'MINOR'),
        gender: (castData.gender as 'FEMALE' | 'MALE' | 'OTHER') || (index % 2 === 0 ? 'FEMALE' : 'MALE'),
        age: castData.age as number,
        height: castData.height as number,
        weight: castData.weight as number,
        birthday: castData.birthday as string,
        bloodType: castData.bloodType as string,
        occupation: castData.occupation as string,
        personality: castData.personality ? (Array.isArray(castData.personality) ? castData.personality as string[] : [castData.personality as string]) : [],
        abilities: castData.abilities ? (Array.isArray(castData.abilities) ? castData.abilities as string[] : [castData.abilities as string]) : [],
        relationships: ((castData.relationships as Array<{ characterName: string; relationship: string }>) || []).map((rel, relIndex) => ({
          characterId: relIndex + 1,
          characterName: rel.characterName,
          relationship: rel.relationship
        }))
      };
    });
  };

  // 캐릭터 이미지 프리로딩
  const preloadCharacterImages = (characters: CharacterData[]) => {
    characters.forEach(character => {
      if (character.imageUrl) {
        const img = new window.Image();
        img.src = character.imageUrl;
      }
    });
  };

  // mock 데이터 제거 - API 실패 시 빈 배열 처리

  // 캐릭터 이미지 프리로딩 실행
  useEffect(() => {
    if (characters && characters.length > 0) {
      preloadCharacterImages(characters);
    }
  }, [characters]);

  return (
    <>
      <div 
        className="relative rounded-[12px] w-full overflow-hidden"
        style={{ height: isSmallScreen ? 'auto' : `${panelHeight}px` }}
        data-name="Left_Info_Pannel"
      >
      <div 
        aria-hidden="true" 
        className={`absolute border-2 border-[#ced4da] border-solid pointer-events-none rounded-[13px] z-50 ${isMobile ? 'inset-0' : ''}`}
        style={!isMobile ? { top: '-1px', left: '-1px', right: '-1px', bottom: '-1px' } : {}}
      />
      
      {/* 이전 버튼 - left panel 좌상단 */}
        <div className="absolute top-4 left-4 z-20">
          <button
            onClick={onBack}
            className="flex items-center justify-center w-8 h-8 bg-white/90 hover:bg-white rounded-full transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer"
          >
          <svg className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>
      
      {/* 메인 이미지 섹션 */}
      <div 
        className={`${isSmallScreen ? 'relative' : 'absolute'} bg-white left-0 overflow-clip rounded-tl-[12px] rounded-tr-[12px] top-0 w-full cursor-pointer hover:opacity-95 transition-opacity duration-200`}
        style={{ height: isSmallScreen ? 'auto' : `${mainImageHeight}px` }}
        onClick={handleImageClick}
        title="이미지를 클릭하여 크게 보기"
      >
        <div 
          className={`${isSmallScreen ? 'relative' : 'absolute'} bg-no-repeat bg-center bg-cover w-full ${!skipTransition && !isMainImageLoaded && !isCachedImage ? 'transition-opacity duration-300' : ''}`}
          style={{ 
            backgroundImage: `url('${currentBackgroundImage}')`,
            backgroundPosition: 'center center',
            backgroundSize: 'cover',
            opacity: isMainImageLoaded || isCachedImage ? 1 : 0.9,
            height: isSmallScreen ? '400px' : (isMobile ? '100%' : '828px'),
            top: isSmallScreen ? 'auto' : (isMobile ? '0' : '-221px')
          }}
        />
        
        {/* 관리자 편집 버튼 */}
        {isAdmin && (
          <div className="absolute top-4 right-4 z-10">
            {!isEditingImage ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onImageEdit?.();
                }}
                className="bg-black/50 hover:bg-black/70 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                이미지 편집
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onImageUpdate?.();
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                >
                  저장
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onImageEditCancel?.();
                  }}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                >
                  취소
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* 편집 중일 때 선택된 파일 정보 표시 */}
        {isEditingImage && imageFile && (
          <div className="absolute bottom-4 left-4 right-4 bg-black/70 text-white p-3 rounded-lg">
            <div className="text-sm font-medium">선택된 파일: {imageFile.name}</div>
            <div className="text-xs text-gray-300 mt-1">
              크기: {(imageFile.size / 1024 / 1024).toFixed(2)} MB
            </div>
          </div>
        )}
      </div>
      
      {/* 제목 및 정보 오버레이 */}
      <div 
        className={`${isSmallScreen ? 'relative' : 'absolute'} left-0 w-full`}
        style={{ 
          height: isSmallScreen ? 'auto' : `${titleOverlayHeight}px`,
          top: isSmallScreen ? 'auto' : `${titleOverlayTop}px`
        }}
      >
        <div className={`absolute bg-gradient-to-b bottom-0 box-border content-stretch flex flex-col from-[#00000000] gap-[9.653px] items-start justify-start left-0 overflow-clip pt-[29.701px] pb-[15px] right-[0.1px] to-[#00000073] to-[93.023%] via-[#00000033] via-[11.628%] ${isMobile ? 'pl-4 pr-4' : 'pl-[22.276px] pr-[11.88px]'}`}>
          {/* 한글 제목 */}
          <div className={`[text-shadow:rgba(0,0,0,0.4)_0px_0px_14.85px] font-bold font-['Pretendard'] leading-[0] not-italic relative shrink-0 text-[29.2px] text-white w-full ${isMobile ? 'max-w-none' : 'max-w-[395px]'}`}>
            <p className="leading-[normal]">{titleKor}</p>
          </div>
          
          {/* 일본어 제목 */}
          {titleJpn && (
            <div className={`[text-shadow:rgba(0,0,0,0.4)_0px_0px_14.85px] font-medium font-['Pretendard'] leading-[0] not-italic relative shrink-0 text-[14.6px] text-white w-full ${isMobile ? 'max-w-none' : 'max-w-[400px]'}`}>
              <p className="leading-[normal]">{titleJpn}</p>
            </div>
          )}
          
          {/* 정보 텍스트 */}
          <div className={`[text-shadow:rgba(0,0,0,0.4)_0px_0px_14.85px] font-medium font-['Pretendard'] leading-[0] not-italic relative shrink-0 text-[14.6px] text-white w-full ${isMobile ? 'max-w-none' : 'max-w-[400px]'}`}>
            <p className="leading-[normal]">
              {anime.seasons && anime.seasons.length > 0 
                ? anime.seasons.map(season => `${season.year}년 ${getSeasonInKorean(season.seasonType)}`).join(' · ')
                : `${year}년 ${getQuarterInKorean(quarter)}`
              } · {medium === 'MOVIE' ? '극장판' : medium} 
              {dayOfWeek !== 'NONE' && ` · ${getDayInKorean(dayOfWeek)} ${formatAirTime(scheduledAt)}`}
            </p>
          </div>
          
          {/* OTT 서비스 아이콘들 */}
          <div className="content-stretch flex gap-3 items-start justify-start relative shrink-0" data-name="ottList">
            {ottDtos?.map((ott, index) => (
              <div 
                key={index} 
                className="relative shrink-0 w-9 h-9 cursor-pointer hover:opacity-80 transition-opacity" 
                data-node-id={`ott-${index}`}
                onClick={() => handleOttClick(ott.watchUrl)}
                title={`${ott.ottType} 클릭하여 시청하기`}
              >
                <div className="absolute left-0 w-9 h-9 top-0">
                  {ott.ottType === 'NETFLIX' && (
                    <img 
                      src="/icons/netflix-logo.svg" 
                      alt="Netflix" 
                      className="w-full h-full object-contain" 
                    />
                  )}
                  {ott.ottType === 'LAFTEL' && (
                    <img 
                      src="/icons/laftel-logo.svg" 
                      alt="LAFTEL" 
                      className="w-full h-full object-contain" 
                    />
                  )}
                  {ott.ottType === 'TVING' && (
                    <img 
                      src="/icons/tving-logo.svg" 
                      alt="TVING" 
                      className="w-full h-full object-contain" 
                    />
                  )}
                  {ott.ottType === 'WAVVE' && (
                    <img 
                      src="/icons/wavve-logo.svg" 
                      alt="WAVVE" 
                      className="w-full h-full object-contain" 
                    />
                  )}
                  {ott.ottType === 'WATCHA' && (
                    <img 
                      src="/icons/watcha-logo.svg" 
                      alt="WATCHA" 
                      className="w-full h-full object-contain" 
                    />
                  )}
                  {/* 기타 OTT 서비스에 대한 fallback */}
                  {!['NETFLIX', 'LAFTEL', 'TVING', 'WAVVE', 'WATCHA'].includes(ott.ottType) && (
                    <div className="w-full h-full bg-white/90 rounded-full flex items-center justify-center shadow-sm">
                      <span className="text-xs font-bold text-gray-800 font-['Pretendard']">
                        {ott.ottType.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* 우측 작은 이미지 - 모바일에서는 숨김 */}
      {!isMobile && (
        <div 
          className="absolute bg-center bg-cover bg-no-repeat h-[206.958px] right-[18px] rounded-[8.91px] top-[111.38px] w-[146.423px] cursor-pointer hover:opacity-95 transition-opacity duration-200 shadow-lg hover:shadow-xl"
          style={{ 
            backgroundImage: `url('${currentPosterImage}')`
          }}
          onClick={handleImageClick}
          title="이미지를 클릭하여 크게 보기"
        />
      )}
      
      {/* 하단 정보 패널 */}
        <div 
          className={`${isSmallScreen ? 'relative' : 'absolute'} bg-white box-border content-stretch flex flex-col gap-[9.653px] items-center justify-start left-0 overflow-clip pt-[10px] rounded-bl-[12px] rounded-br-[12px] w-full ${isMobile ? 'px-1' : 'px-0'}`}
          style={{ 
            top: isSmallScreen ? 'auto' : `${lowerPanelTop}px`,
            height: isSmallScreen ? 'auto' : `${lowerPanelHeight}px`
          }}
        >
        
        {/* 탭 메뉴 */}
        <div 
          ref={containerRef}
          className="flex items-center justify-start relative overflow-hidden"
          style={{ 
            width: '100%',
            maxWidth: isMobile ? '100%' : '584px'
          }}
          onMouseLeave={handleMouseLeave}
        >
          {/* 선택된 탭의 네비게이션 바 */}
          <div
            className="absolute bottom-0 h-[1.856px] bg-[#990033] pointer-events-none"
            style={{
              width: selectedBarStyle.width,
              left: selectedBarStyle.left,
              opacity: selectedBarStyle.opacity,
              transition: selectedBarStyle.transition
            }}
          />

          {/* 호버된 탭의 네비게이션 바 */}
          <div
            className={cn(
              "absolute bottom-0 h-[1.856px] pointer-events-none",
              hoveredTab && tabOptions.find(opt => opt.key === hoveredTab)?.isBeta 
                ? "bg-gray-400" 
                : "bg-[#990033]"
            )}
            style={{
              width: hoveredBarStyle.width,
              left: hoveredBarStyle.left,
              opacity: hoveredBarStyle.opacity,
              transition: hoveredBarStyle.transition
            }}
          />

          {tabOptions.map((option) => {
            const isSelected = currentTab === option.key;
            const isHovered = hoveredTab === option.key;
            const isBeta = option.isBeta || false;
            
            return (
              <button
                key={option.key}
                ref={(el) => { tabRefs.current[option.key] = el; }}
                onClick={() => {
                  if (!isBeta) {
                    setCurrentTab(option.key);
                    updateNavigationBar(option.key, true); // 클릭 시 즉시 이동
                  }
                }}
                onMouseEnter={() => handleMouseEnter(option.key)}
                className={cn(
                  "h-11 relative flex-shrink-0 flex items-center justify-center transition-all duration-200",
                  isBeta ? "opacity-50" : "cursor-pointer",
                  option.width
                )}
              >
                <div className={cn(
                  `justify-start font-normal font-['Pretendard'] leading-snug text-center transition-colors duration-200 ${isVerySmallScreen ? 'text-[16px]' : 'text-[18px]'}`,
                  isBeta 
                    ? "font-normal text-[#adb5bd]"
                    : isSelected || isHovered
                      ? "font-semibold text-[#990033]"
                      : "font-normal text-[#adb5bd]"
                )}>
                  <p className={`whitespace-pre ${isVerySmallScreen ? 'leading-[14px]' : 'leading-[16.336px]'}`}>{option.label}</p>
                </div>
                
                {/* 준비중 배지 */}
                {isBeta && option.badgeText && (
                  <div className="absolute right-4 bottom-1 z-10">
                    <span className="text-[10px] px-1 py-0.5 rounded bg-gray-100 text-gray-600 font-['Pretendard']">
                      {option.badgeText}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
        
        {/* 등장인물 탭 - 회색 배경 없이 */}
        {currentTab === 'characters' && (
          <div 
            className="w-full custom-scrollbar overflow-y-auto"
            style={{ 
              height: isSmallScreen ? 'auto' : `${characterScrollContainerHeight}px`,
              scrollbarWidth: 'thin',
              scrollbarColor: '#CBD5E0 #F7FAFC'
            }}
          >
            <CharacterList
              characters={characters || []}
              className="w-full"
              isMobile={isMobile}
            />
          </div>
        )}

        {/* 댓글 탭 - 모바일 또는 댓글 데이터가 있을 때 표시 */}
        {(isMobile || (animeId && rawAnimeData)) && currentTab === 'comments' && (
          <div 
            className="w-full custom-scrollbar overflow-y-auto"
            style={{ 
              height: isSmallScreen ? 'auto' : `${characterScrollContainerHeight}px`,
              scrollbarWidth: 'thin',
              scrollbarColor: '#CBD5E0 #F7FAFC'
            }}
          >
            <RightCommentPanel
              animeId={animeId || anime.animeId}
              isImageModalOpen={false}
              animeData={anime}
              rawAnimeData={rawAnimeData}
            />
          </div>
        )}

        {/* 정보 내용 - 애니 정보와 분기 성적 탭용 */}
        {currentTab !== 'characters' && currentTab !== 'comments' && (
          <div 
            className={`bg-[#f8f9fa] box-border relative rounded-[12px] shrink-0 w-full ${isMobile ? 'pl-2 pr-2' : 'pl-[25px]'}`}
            style={{ 
              height: isSmallScreen ? 'auto' : `${infoContentHeight}px`,
              paddingTop: '10px',
              paddingBottom: '10px',
              maxWidth: isMobile ? '100%' : '554px'
            }}
          >
            {/* 스크롤 컨테이너 */}
             <div 
               className="overflow-y-auto custom-scrollbar"
               style={{ 
                 width: isMobile ? '100%' : 'calc(100% + 12.5px)',
                 marginRight: isMobile ? '0' : '10px',
                 height: isSmallScreen ? 'auto' : `${scrollContainerHeight}px`
               }}
             >
            
            {/* 탭별 내용 렌더링 */}
            {currentTab === 'info' && (
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: isMobile ? '50% 50%' : '1fr 1fr',
              gap: '0px',
              width: '100%',
              overflow: 'hidden'
            }}>
              {/* 왼쪽 정보 */}
              <div 
                className={`box-border flex flex-col ${isMobile ? 'items-center' : 'items-start'} justify-start relative shrink-0 ${isMobile ? 'p-2 w-full' : 'p-[11.138px]'}`}
              >
            <div className={`box-border content-stretch flex flex-col gap-[11.138px] ${isMobile ? 'items-center' : 'items-start'} justify-center leading-[0] not-italic ${isMobile ? 'px-2 py-2' : 'px-[11.138px] py-[2.97px]'} relative shrink-0 ${isMobile ? 'text-[20px]' : 'text-[18.25px]'} w-full`} style={{ height: `${Math.max(77.41 * heightRatio, 50)}px` }}>
              <div className={`font-['Pretendard'] font-normal relative shrink-0 text-[#adb5bd] ${isMobile ? (isMediumScreen ? 'text-lg' : 'text-base') : 'text-[18.25px]'} text-center`}>
                <p className="leading-[16.336px] whitespace-nowrap">제작사</p>
              </div>
              <div className={`font-['Pretendard'] font-medium relative shrink-0 text-black w-full ${isMobile ? 'text-center' : 'text-left'}`} style={{ height: `${Math.max(44 * heightRatio, 30)}px` }}>
                <p className={`${isMobile ? (isMediumScreen ? 'text-lg' : 'text-base') : 'text-[18px]'} leading-[normal] break-words`}>{studio || ''}</p>
              </div>
            </div>
            
            <div className={`box-border content-stretch flex flex-col gap-[11.138px] ${isMobile ? 'items-center' : 'items-start'} justify-center leading-[0] not-italic ${isMobile ? 'px-2 py-2' : 'px-[11.138px] py-[2.97px]'} relative shrink-0 ${isMobile ? (isMediumScreen ? 'text-lg' : 'text-base') : 'text-[18.25px]'} w-full`} style={{ height: `${Math.max(77.41 * heightRatio, 50)}px` }}>
              <div className={`font-['Pretendard'] font-normal relative shrink-0 text-[#adb5bd] ${isMobile ? (isMediumScreen ? 'text-lg' : 'text-base') : 'text-[18.25px]'} text-center`}>
                <p className="leading-[16.336px] whitespace-nowrap">감독</p>
              </div>
              <div className={`font-['Pretendard'] font-medium relative shrink-0 text-black w-full ${isMobile ? 'text-center' : 'text-left'}`} style={{ height: `${Math.max(44 * heightRatio, 30)}px` }}>
                <p className={`${isMobile ? (isMediumScreen ? 'text-lg' : 'text-base') : 'text-[18px]'} leading-[normal] break-words`}>{director || ''}</p>
              </div>
            </div>
            
            <div className={`box-border content-stretch flex flex-col gap-[11.138px] ${isMobile ? 'items-center' : 'items-start'} justify-start leading-[0] not-italic ${isMobile ? 'px-2 py-2' : 'px-[11.138px] py-[2.97px]'} relative shrink-0 ${isMobile ? (isMediumScreen ? 'text-lg' : 'text-base') : 'text-[18.25px]'} w-full`}>
              <div className={`font-['Pretendard'] font-normal relative shrink-0 text-[#adb5bd] ${isMobile ? (isMediumScreen ? 'text-lg' : 'text-base') : 'text-[18.25px]'} text-center`}>
                <p className="leading-[16.336px] whitespace-nowrap">장르</p>
              </div>
              <div className={`font-['Pretendard'] font-medium relative shrink-0 text-black w-full ${isMobile ? 'text-center' : 'text-left'}`}>
                <p className={`${isMobile ? (isMediumScreen ? 'text-lg' : 'text-base') : 'text-[18px]'} leading-[normal] break-words`}>{genre || ''}</p>
              </div>
            </div>
          </div>
          
          {/* 오른쪽 정보 */}
           <div 
             className={`box-border flex flex-col ${isMobile ? 'items-center' : 'items-start'} justify-start relative shrink-0 ${isMobile ? 'p-2 w-full' : 'p-[11.138px]'}`}
           >
             <div className={`box-border content-stretch flex flex-col gap-[11.138px] ${isMobile ? 'items-center' : 'items-start'} justify-center leading-[0] not-italic ${isMobile ? 'px-2 py-2' : 'px-[17.821px] py-[2.97px]'} relative shrink-0 ${isMobile ? (isMediumScreen ? 'text-lg' : 'text-base') : 'text-[18.25px]'} w-full`} style={{ height: `${Math.max(77.41 * heightRatio, 50)}px` }}>
               <div className={`font-['Pretendard'] font-normal relative shrink-0 text-[#adb5bd] ${isMobile ? (isMediumScreen ? 'text-lg' : 'text-base') : 'text-[18.25px]'} text-center`}>
                 <p className="leading-[16.336px] whitespace-nowrap">원작</p>
               </div>
               <div className={`font-['Pretendard'] font-medium relative shrink-0 text-black w-full ${isMobile ? 'text-center' : 'text-left'}`} style={{ height: `${Math.max(44 * heightRatio, 30)}px` }}>
                 <p className={`${isMobile ? (isMediumScreen ? 'text-lg' : 'text-base') : 'text-[18px]'} leading-[normal] break-words`}>{source || ''}</p>
               </div>
             </div>
            
            <div className={`box-border content-stretch flex flex-col gap-[11.138px] ${isMobile ? 'items-center' : 'items-start'} justify-center leading-[0] not-italic ${isMobile ? 'px-2 py-2' : 'px-[17.821px] py-[2.97px]'} relative shrink-0 ${isMobile ? (isMediumScreen ? 'text-lg' : 'text-base') : 'text-[18.25px]'} w-full`} style={{ height: `${Math.max(77.41 * heightRatio, 50)}px` }}>
              <div className={`font-['Pretendard'] font-normal relative shrink-0 text-[#adb5bd] ${isMobile ? (isMediumScreen ? 'text-lg' : 'text-base') : 'text-[18.25px]'} text-center`}>
                <p className="leading-[16.336px] whitespace-nowrap">{medium === 'MOVIE' ? '개봉일' : '방영 시작일'}</p>
              </div>
              <div className={`font-['Pretendard'] font-medium relative shrink-0 text-black w-full ${isMobile ? 'text-center' : 'text-left'}`} style={{ height: `${Math.max(44 * heightRatio, 30)}px` }}>
                <p className={`${isMobile ? (isMediumScreen ? 'text-lg' : 'text-base') : 'text-[18px]'} leading-[normal] break-words`}>{startDate || ''}</p>
              </div>
            </div>
            
            <div className={`box-border content-stretch flex flex-col gap-[11.138px] ${isMobile ? 'items-center' : 'items-start'} justify-start leading-[0] not-italic ${isMobile ? 'px-2 py-2' : 'px-[17.821px] py-[2.97px]'} relative shrink-0 ${isMobile ? (isMediumScreen ? 'text-lg' : 'text-base') : 'text-[18.25px]'} w-full`}>
              <div className={`font-['Pretendard'] font-normal relative shrink-0 text-[#adb5bd] ${isMobile ? (isMediumScreen ? 'text-lg' : 'text-base') : 'text-[18.25px]'} text-center`}>
                <p className="leading-[16.336px] whitespace-nowrap">등급</p>
              </div>
              <div className={`font-['Pretendard'] font-medium relative shrink-0 text-black w-full ${isMobile ? 'text-center' : 'text-left'}`} style={{ height: `${Math.max(44 * heightRatio, 30)}px` }}>
                <p className={`${isMobile ? (isMediumScreen ? 'text-lg' : 'text-base') : 'text-[18px]'} leading-[normal] break-words`}>{rating || ''}</p>
              </div>
            </div>
            
            <div className={`box-border content-stretch flex flex-col gap-[11.138px] ${isMobile ? 'items-center' : 'items-start'} justify-start leading-[0] not-italic ${isMobile ? 'px-2 py-2' : 'px-[17.821px] py-[2.97px]'} relative shrink-0 ${isMobile ? (isMediumScreen ? 'text-lg' : 'text-base') : 'text-[18.25px]'} w-full`}>
              <div className={`font-['Pretendard'] font-normal relative shrink-0 text-[#adb5bd] ${isMobile ? (isMediumScreen ? 'text-lg' : 'text-base') : 'text-[18.25px]'} text-center`}>
                <p className="leading-[16.336px] whitespace-nowrap">공식 사이트</p>
              </div>
              <div className={`font-['Pretendard'] font-medium relative shrink-0 text-black ${isMobile ? 'w-full flex justify-center' : 'w-[225.727px]'}`}>
                <div className={`flex flex-wrap ${isMobile ? 'gap-2' : 'gap-[6px]'} items-start ${isMobile ? 'justify-center' : 'justify-start'}`}>
                {officialSite ? (
                  // officialSite가 문자열인 경우
                  typeof officialSite === 'string' ? (
                    <a 
                      href={officialSite} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={`relative shrink-0 ${isMobile ? 'w-6 h-6' : 'w-[25px] h-[25px]'} cursor-pointer hover:opacity-80 transition-opacity`}
                      title="공식 사이트 방문"
                    >
                      <img 
                        src="/icons/aniHome-site-others.svg" 
                        alt="Official Site" 
                        className="w-full h-full object-contain" 
                      />
                    </a>
                  ) : (
                    // officialSite가 객체인 경우 모든 사이트 표시
                    // OTHERS를 맨 앞으로 정렬하고, OTHERS가 여러 개일 때 모두 처리
                    Object.entries(officialSite as Record<string, string>)
                      .sort(([a], [b]) => {
                        if (a === 'OTHERS') return -1;
                        if (b === 'OTHERS') return 1;
                        return 0;
                      })
                      .flatMap(([siteType, url], index) => {
                        // OTHERS가 여러 URL을 포함한 경우 (쉼표나 세미콜론으로 구분)
                        if (siteType === 'OTHERS' && (url.includes(',') || url.includes(';'))) {
                          const urls = url.split(/[,;]/).map(u => u.trim()).filter(u => u);
                          return urls.map((singleUrl, urlIndex) => (
                            <a 
                              key={`${index}-${urlIndex}`}
                              href={singleUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className={`relative shrink-0 ${isMobile ? 'w-6 h-6' : 'w-[25px] h-[25px]'} cursor-pointer hover:opacity-80 transition-opacity`}
                              title={`${siteType} 방문하기`}
                            >
                              <img 
                                src="/icons/aniHome-site-others.svg" 
                                alt="Others" 
                                className="w-full h-full object-contain" 
                              />
                            </a>
                          ));
                        }
                        
                        // 일반적인 경우 (단일 URL)
                        return (
                          <a 
                            key={index}
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className={`relative shrink-0 ${isMobile ? 'w-6 h-6' : 'w-[25px] h-[25px]'} cursor-pointer hover:opacity-80 transition-opacity`}
                            title={`${siteType} 방문하기`}
                          >
                            {/* 사이트 타입에 따른 아이콘 매핑 */}
                            {siteType === 'X' && (
                              <img 
                                src="/icons/aniHome-site-x.svg" 
                                alt="X (Twitter)" 
                                className="w-full h-full object-contain" 
                              />
                            )}
                            {siteType === 'INSTAGRAM' && (
                              <img 
                                src="/icons/aniHome-site-instagram.svg" 
                                alt="Instagram" 
                                className="w-full h-full object-contain" 
                              />
                            )}
                            {siteType === 'YOUTUBE' && (
                              <img 
                                src="/icons/aniHome-site-youtube.svg" 
                                alt="YouTube" 
                                className="w-full h-full object-contain" 
                              />
                            )}
                            {siteType === 'TIKTOK' && (
                              <img 
                                src="/icons/aniHome-site-tiktok.svg" 
                                alt="TikTok" 
                                className="w-full h-full object-contain" 
                              />
                            )}
                            {siteType === 'OTHERS' && (
                              <img 
                                src="/icons/aniHome-site-others.svg" 
                                alt="Others" 
                                className="w-full h-full object-contain" 
                              />
                            )}
                            {/* 매핑되지 않은 사이트 타입은 기본 아이콘 사용 */}
                            {!['X', 'INSTAGRAM', 'YOUTUBE', 'TIKTOK', 'OTHERS'].includes(siteType) && (
                              <img 
                                src="/icons/aniHome-site-others.svg" 
                                alt={siteType} 
                                className="w-full h-full object-contain" 
                              />
                            )}
                          </a>
                        );
                      })
                  )
                ) : null}
                </div>
              </div>
            </div>
          </div>
          
          {/* Synopsis 섹션 - 그리드 아래에 배치 */}
          {synopsis && (
            <div className={`col-span-2 mt-4 pt-3 ${isMobile ? 'px-2' : 'pl-[15px] pr-[50px]'}`}>
              {/* 구분선 */}
              <div className="mb-4 border-b border-gray-200"></div>
              
              <div className="font-['Pretendard'] font-normal text-[#adb5bd] text-[18.25px] mb-2 pb-1">
                <p className="leading-[16.336px]">줄거리</p>
              </div>
               <div 
                 ref={synopsisRef}
                 className={cn(
                   "font-['Pretendard'] font-medium text-black text-[16px] leading-[1.6] transition-all duration-300",
                   !isSynopsisExpanded && showExpandButton && "line-clamp-2",
                   isMobile && "w-full max-w-full overflow-hidden"
                 )}
                 style={{
                   display: !isSynopsisExpanded && showExpandButton ? '-webkit-box' : 'block',
                   WebkitLineClamp: !isSynopsisExpanded && showExpandButton ? 2 : 'unset',
                   WebkitBoxOrient: 'vertical',
                   overflow: 'hidden',
                   whiteSpace: 'pre-wrap', // 줄바꿈 문자(\n)를 실제 줄바꿈으로 표시
                   wordBreak: isMobile ? 'break-word' : 'normal',
                   maxWidth: isMobile ? '100%' : 'none'
                 }}
               >
                 <p className={`${isMobile ? 'text-left break-words' : 'text-justify'}`}>{synopsis}</p>
               </div>
              {showExpandButton && (
                <div className="flex justify-end mt-2">
                  <button
                    onClick={() => {
                      setIsSynopsisExpanded(!isSynopsisExpanded);
                      // 펼치기 버튼을 눌렀을 때만 스크롤을 바텀으로 이동
                      if (!isSynopsisExpanded) {
                        setTimeout(() => {
                          const scrollContainer = document.querySelector('.custom-scrollbar');
                          if (scrollContainer) {
                            scrollContainer.scrollTo({
                              top: scrollContainer.scrollHeight,
                              behavior: 'smooth'
                            });
                          }
                        }, 200); // 애니메이션 완료 후 스크롤
                      }
                    }}
                    className="flex items-center gap-1 text-[#990033] text-[14px] font-['Pretendard'] font-medium hover:underline transition-all duration-200 cursor-pointer"
                  >
                    <span>{isSynopsisExpanded ? '접기' : '펼치기'}</span>
                    <svg 
                      className={`w-3 h-3 transition-transform duration-200 ${isSynopsisExpanded ? 'rotate-180' : ''}`}
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          )}
            </div>
          )}


            {/* 분기 성적 탭 (준비중) */}
            {currentTab === 'performance' && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-gray-400 text-lg font-medium mb-2">
                    분기 성적
                  </div>
                  <div className="text-gray-300 text-sm">
                    준비 중입니다
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>
        )}
      </div>

    </div>

    {/* 이미지 확대 모달 */}
    <ImageModal
      isOpen={isImageModalOpen}
      onClose={handleImageModalClose}
      imageUrl={mainImageUrl || mainThumbnailUrl}
      title={titleKor}
    />
    </>
  );
}
