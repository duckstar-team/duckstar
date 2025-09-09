'use client';

import React, { useState, useRef, useEffect } from 'react';

// 커스텀 스크롤바 스타일
const customScrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f7fafc;
    border-radius: 3px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #D9D9D9;
    border-radius: 3px;
    transition: background 0.2s ease;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #a0aec0;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:active {
    background: #718096;
  }
`;
import Image from 'next/image';
import { cn } from '@/lib/utils';
import CharacterList from './CharacterList';
import { CharacterData } from './CharacterCard';

export type TabOption = 'info' | 'performance' | 'characters';

interface TabOptionConfig {
  key: TabOption;
  label: string;
  width: string;
  isBeta?: boolean;
  badgeText?: string;
}

interface LeftInfoPanelProps {
  onBack: () => void;
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

export default function LeftInfoPanel({ anime, onBack, characters }: LeftInfoPanelProps) {
  // 탭 상태 관리
  const [currentTab, setCurrentTab] = useState<TabOption>('info');
  const [hoveredTab, setHoveredTab] = useState<TabOption | null>(null);
  
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

  const tabOptions: TabOptionConfig[] = [
    { key: 'info' as const, label: '애니 정보', width: 'w-[175px]', isBeta: false },
    { key: 'performance' as const, label: '분기 성적', width: 'w-[175px]', isBeta: true, badgeText: '준비중' },
    { key: 'characters' as const, label: '등장인물', width: 'w-[175px]', isBeta: false }
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

  const {
    mainThumbnailUrl,
    mainImageUrl,
    thumbnailImageUrl,
    thumbnailPosterUrl,
    titleKor,
    titleJpn,
    status,
    dayOfWeek,
    scheduledAt,
    genre,
    medium,
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

  // 이미지 캐시 확인 함수
  const isImageCached = (imageUrl: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = imageUrl;
    });
  };

  // 이미지 위치 계산 함수 (썸네일과 메인 이미지의 크기/위치를 동일하게 미리 계산)
  const calculateImagePosition = (imageUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        const containerWidth = 586; // 배경 컨테이너 너비
        const containerHeight = 828; // 배경 컨테이너 높이
        const containerAspectRatio = containerWidth / containerHeight;
        const imageAspectRatio = img.width / img.height;
        
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

  // 메인 이미지 프리로딩 및 교체 (배경 이미지)
  useEffect(() => {
    if (mainImageUrl && mainThumbnailUrl && mainImageUrl !== mainThumbnailUrl) {
      const preloadMainImage = async () => {
        try {
          // 메인 이미지 캐시 확인
          const isCached = await isImageCached(mainImageUrl);
          
          if (isCached) {
            // 캐시되어 있으면 바로 메인 이미지 사용
            const position = await calculateImagePosition(mainImageUrl);
            setBackgroundPosition(position);
            setCurrentBackgroundImage(mainImageUrl);
            setIsMainImageLoaded(true);
          } else {
            // 캐시되어 있지 않으면 썸네일 먼저 표시 후 progressive loading
            const position = await calculateImagePosition(mainImageUrl);
            setBackgroundPosition(position);
            
            // 메인 이미지 프리로드
            const img = new window.Image();
            img.onload = () => {
              setCurrentBackgroundImage(mainImageUrl);
              setIsMainImageLoaded(true);
            };
            img.onerror = () => {
            };
            img.src = mainImageUrl;
          }
        } catch (error) {
        }
      };
      
      preloadMainImage();
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
      const fullHeight = element.scrollHeight;
      
      // 2줄 제한 적용
      element.style.webkitLineClamp = '2';
      element.style.display = '-webkit-box';
      
      if (fullHeight > maxHeight) {
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
        gender: (castData.gender as string) || (index % 2 === 0 ? 'FEMALE' : 'MALE'),
        age: castData.age as number,
        height: castData.height as number,
        weight: castData.weight as number,
        birthday: castData.birthday as string,
        bloodType: castData.bloodType as string,
        occupation: castData.occupation as string,
        personality: castData.personality ? (Array.isArray(castData.personality) ? castData.personality as string[] : [castData.personality as string]) : [],
        abilities: castData.abilities ? (Array.isArray(castData.abilities) ? castData.abilities as string[] : [castData.abilities as string]) : [],
        relationships: (castData.relationships as Array<{ characterName: string; relationship: string }>) || []
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

  // 캐릭터 데이터 (임시 데이터 - 실제로는 API에서 가져와야 함)
  const mockCharacters: CharacterData[] = [
    {
      characterId: 1,
      nameKor: "노아",
      nameJpn: "ノア",
      nameEng: "Noah",
      imageUrl: "/banners/duckstar-logo.svg",
      description: "주인공. 밝고 긍정적인 성격으로 항상 주변 사람들을 웃게 만든다.",
      voiceActor: "김아영",
      role: "MAIN",
      gender: "FEMALE",
      age: 17,
      personality: ["밝음", "긍정적", "활발함"],
      abilities: ["노래", "춤"]
    },
    {
      characterId: 2,
      nameKor: "미나",
      nameJpn: "ミナ",
      nameEng: "Mina",
      imageUrl: "/banners/duckstar-logo.svg",
      description: "노아의 친구. 조용하지만 마음이 따뜻한 성격이다.",
      voiceActor: "박지은",
      role: "MAIN",
      gender: "FEMALE",
      age: 17,
      personality: ["조용함", "따뜻함", "신중함"],
      abilities: ["피아노", "독서"]
    },
    {
      characterId: 3,
      nameKor: "타쿠야",
      nameJpn: "タクヤ",
      nameEng: "Takuya",
      imageUrl: "/banners/duckstar-logo.svg",
      description: "반 친구. 운동을 좋아하고 리더십이 있다.",
      voiceActor: "이민호",
      role: "SUPPORTING",
      gender: "MALE",
      age: 17,
      personality: ["리더십", "운동적", "의리"],
      abilities: ["축구", "기타"]
    },
    {
      characterId: 4,
      nameKor: "사쿠라",
      nameJpn: "サクラ",
      nameEng: "Sakura",
      imageUrl: "/banners/duckstar-logo.svg",
      description: "선배. 예술에 대한 열정이 강하다.",
      voiceActor: "최유진",
      role: "SUPPORTING",
      gender: "FEMALE",
      age: 18,
      personality: ["예술적", "열정적", "독립적"],
      abilities: ["그림", "조각"]
    },
    {
      characterId: 5,
      nameKor: "히로시",
      nameJpn: "ヒロシ",
      nameEng: "Hiroshi",
      imageUrl: "/banners/duckstar-logo.svg",
      description: "교사. 학생들을 진심으로 아끼는 선생님이다.",
      voiceActor: "정우성",
      role: "MINOR",
      gender: "MALE",
      age: 35,
      personality: ["따뜻함", "책임감", "인내심"],
      abilities: ["교육", "상담"]
    }
  ];

  // 캐릭터 이미지 프리로딩 실행
  useEffect(() => {
    if (characters && characters.length > 0) {
      preloadCharacterImages(characters);
    }
  }, [characters]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: customScrollbarStyles }} />
      <div 
        className="relative rounded-[12px] w-[584px]" 
        style={{ height: `${panelHeight}px` }}
        data-name="Left_Info_Pannel"
      >
      <div aria-hidden="true" className="absolute border border-[#ced4da] border-solid inset-[-1px] pointer-events-none rounded-[13px]" />
      
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
        className="absolute bg-white left-0 overflow-clip rounded-tl-[12px] rounded-tr-[12px] top-0 w-[584px]"
        style={{ height: `${mainImageHeight}px` }}
      >
        <div 
          className={`absolute bg-cover bg-no-repeat h-[828px] left-[-2px] top-[-221px] w-[586px] ${!isMainImageLoaded ? 'transition-opacity duration-300' : ''}`}
          style={{ 
            backgroundImage: `url('${currentBackgroundImage}')`,
            backgroundPosition: backgroundPosition,
            opacity: isMainImageLoaded ? 1 : 0.9
          }} 
        />
      </div>
      
      {/* 제목 및 정보 오버레이 */}
      <div 
        className="absolute left-0 w-[584px]"
        style={{ 
          height: `${titleOverlayHeight}px`,
          top: `${titleOverlayTop}px`
        }}
      >
        <div className="absolute bg-gradient-to-b bottom-0 box-border content-stretch flex flex-col from-[#00000000] gap-[9.653px] items-start justify-start left-0 overflow-clip pl-[22.276px] pr-[11.88px] pt-[29.701px] pb-[15px] right-[0.1px] to-[#00000073] to-[93.023%] via-[#00000033] via-[11.628%]">
          {/* 한글 제목 */}
          <div className="[text-shadow:rgba(0,0,0,0.4)_0px_0px_14.85px] font-bold font-['Pretendard'] leading-[0] not-italic relative shrink-0 text-[29.2px] text-white w-[395px]">
            <p className="leading-[normal]">{titleKor}</p>
          </div>
          
          {/* 일본어 제목 */}
          {titleJpn && (
            <div className="[text-shadow:rgba(0,0,0,0.4)_0px_0px_14.85px] font-medium font-['Pretendard'] leading-[0] not-italic relative shrink-0 text-[14.6px] text-white w-[400px]">
              <p className="leading-[normal]">{titleJpn}</p>
            </div>
          )}
          
          {/* 정보 텍스트 */}
          <div className="[text-shadow:rgba(0,0,0,0.4)_0px_0px_14.85px] font-medium font-['Pretendard'] leading-[0] not-italic relative shrink-0 text-[14.6px] text-white w-[400px]">
            <p className="leading-[normal]">
              {year}년 {getQuarterInKorean(quarter)} · {medium === 'MOVIE' ? '극장판' : medium} 
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
      
      {/* 우측 작은 이미지 */}
      <div 
        className="absolute bg-center bg-cover bg-no-repeat h-[206.958px] left-[419.53px] rounded-[8.91px] top-[111.38px] w-[146.423px]"
        style={{ 
          backgroundImage: `url('${currentPosterImage}')`
        }} 
      />
      
      {/* 하단 정보 패널 */}
      <div 
        className="absolute bg-white box-border content-stretch flex flex-col gap-[9.653px] items-center justify-start left-0 overflow-clip pt-[10px] px-0 rounded-bl-[12px] rounded-br-[12px] w-[584px]"
        style={{ 
          top: `${lowerPanelTop}px`,
          height: `${lowerPanelHeight}px`
        }}
      >
        
        {/* 탭 메뉴 */}
        <div 
          ref={containerRef}
          className="content-stretch flex items-center justify-center relative shrink-0 w-full"
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
                  "h-11 relative shrink-0 flex items-center justify-center transition-all duration-200",
                  isBeta ? "opacity-50" : "cursor-pointer",
                  option.width
                )}
              >
                <div className={cn(
                  "justify-start text-[18px] font-normal font-['Pretendard'] leading-snug text-center transition-colors duration-200",
                  isBeta 
                    ? "font-normal text-[#adb5bd]"
                    : isSelected || isHovered
                      ? "font-semibold text-[#990033]"
                      : "font-normal text-[#adb5bd]"
                )}>
                  <p className="leading-[16.336px] whitespace-pre">{option.label}</p>
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
              height: `${characterScrollContainerHeight}px`,
              scrollbarWidth: 'thin',
              scrollbarColor: '#CBD5E0 #F7FAFC'
            }}
          >
            <CharacterList
              characters={characters || mockCharacters}
              className="w-full"
            />
          </div>
        )}

        {/* 정보 내용 - 애니 정보와 분기 성적 탭용 */}
        {currentTab !== 'characters' && (
          <div 
            className="bg-[#f8f9fa] box-border pl-[25px] relative rounded-[12px] shrink-0 w-[554px]"
            style={{ 
              height: `${infoContentHeight}px`,
              paddingTop: '10px',
              paddingBottom: '10px'
            }}
          >
            {/* 스크롤 컨테이너 */}
            <div 
              className="overflow-y-auto custom-scrollbar"
              style={{ 
                width: 'calc(100% + 12.5px)',
                marginRight: '10px',
                height: `${scrollContainerHeight}px`
              }}
            >
            
            {/* 탭별 내용 렌더링 */}
            {currentTab === 'info' && (
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0px'
            }}>
              {/* 왼쪽 정보 */}
              <div 
                className="box-border flex flex-col items-start justify-start p-[11.138px] pr-[0px] relative shrink-0"
              >
            <div className="box-border content-stretch flex flex-col gap-[11.138px] items-start justify-center leading-[0] not-italic px-[17.821px] py-[2.97px] relative shrink-0 text-[18.25px] w-full" style={{ height: `${Math.max(77.41 * heightRatio, 50)}px` }}>
              <div className="font-['Pretendard'] font-normal relative shrink-0 text-[#adb5bd] text-center text-nowrap">
                <p className="leading-[16.336px] whitespace-pre">제작사</p>
              </div>
              <div className="font-['Pretendard'] font-medium relative shrink-0 text-black w-full" style={{ height: `${Math.max(44 * heightRatio, 30)}px` }}>
                <p className="leading-[normal]">{studio || ''}</p>
              </div>
            </div>
            
            <div className="box-border content-stretch flex flex-col gap-[11.138px] items-start justify-center leading-[0] not-italic px-[17.821px] py-[2.97px] relative shrink-0 text-[18.25px] w-full" style={{ height: `${Math.max(77.41 * heightRatio, 50)}px` }}>
              <div className="font-['Pretendard'] font-normal relative shrink-0 text-[#adb5bd] text-center text-nowrap">
                <p className="leading-[16.336px] whitespace-pre">감독</p>
              </div>
              <div className="font-['Pretendard'] font-medium relative shrink-0 text-black w-full" style={{ height: `${Math.max(44 * heightRatio, 30)}px` }}>
                <p className="leading-[normal]">{director || ''}</p>
              </div>
            </div>
            
            <div className="box-border content-stretch flex flex-col gap-[11.138px] items-start justify-start leading-[0] not-italic px-[17.821px] py-[2.97px] relative shrink-0 text-[18.25px] w-full">
              <div className="font-['Pretendard'] font-normal relative shrink-0 text-[#adb5bd] text-center text-nowrap">
                <p className="leading-[16.336px] whitespace-pre">장르</p>
              </div>
              <div className="font-['Pretendard'] font-medium relative shrink-0 text-black w-full">
                <p className="leading-[normal]">{genre || ''}</p>
              </div>
            </div>
          </div>
          
          {/* 오른쪽 정보 */}
          <div 
            className="box-border flex flex-col items-start justify-start pl-[11.138px] py-[11.138px] relative shrink-0"
          >
            <div className="box-border content-stretch flex flex-col gap-[11.138px] items-start justify-center leading-[0] not-italic px-[17.821px] py-[2.97px] relative shrink-0 text-[18.25px] w-full" style={{ height: `${Math.max(77.41 * heightRatio, 50)}px` }}>
              <div className="font-['Pretendard'] font-normal relative shrink-0 text-[#adb5bd] text-center text-nowrap">
                <p className="leading-[16.336px] whitespace-pre">원작</p>
              </div>
              <div className="font-['Pretendard'] font-medium relative shrink-0 text-black w-full" style={{ height: `${Math.max(44 * heightRatio, 30)}px` }}>
                <p className="leading-[normal]">{source || ''}</p>
              </div>
            </div>
            
            <div className="box-border content-stretch flex flex-col gap-[11.138px] items-start justify-center leading-[0] not-italic px-[17.821px] py-[2.97px] relative shrink-0 text-[18.25px] w-full" style={{ height: `${Math.max(77.41 * heightRatio, 50)}px` }}>
              <div className="font-['Pretendard'] font-normal relative shrink-0 text-[#adb5bd] text-center text-nowrap">
                <p className="leading-[16.336px] whitespace-pre">{medium === 'MOVIE' ? '개봉일' : '방영 시작일'}</p>
              </div>
              <div className="font-['Pretendard'] font-medium relative shrink-0 text-black w-full" style={{ height: `${Math.max(44 * heightRatio, 30)}px` }}>
                <p className="leading-[normal]">{startDate || ''}</p>
              </div>
            </div>
            
            <div className="box-border content-stretch flex flex-col gap-[11.138px] items-start justify-start leading-[0] not-italic px-[17.821px] py-[2.97px] relative shrink-0 text-[18.25px] w-full">
              <div className="font-['Pretendard'] font-normal relative shrink-0 text-[#adb5bd] text-center text-nowrap">
                <p className="leading-[16.336px] whitespace-pre">등급</p>
              </div>
              <div className="font-['Pretendard'] font-medium relative shrink-0 text-black w-full" style={{ height: `${Math.max(44 * heightRatio, 30)}px` }}>
                <p className="leading-[normal]">{rating || ''}</p>
              </div>
            </div>
            
            <div className="box-border content-stretch flex flex-col gap-[11.138px] items-start justify-start leading-[0] not-italic px-[17.821px] py-[2.97px] relative shrink-0 text-[18.25px] w-full">
              <div className="font-['Pretendard'] font-normal relative shrink-0 text-[#adb5bd] text-center text-nowrap">
                <p className="leading-[16.336px] whitespace-pre">공식 사이트</p>
              </div>
              <div className="font-['Pretendard'] font-medium relative shrink-0 text-black w-[225.727px]">
                <div className="flex flex-wrap gap-[6px] items-start justify-start">
                {officialSite ? (
                  // officialSite가 문자열인 경우
                  typeof officialSite === 'string' ? (
                    <a 
                      href={officialSite} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="relative shrink-0 w-[25px] h-[25px] cursor-pointer hover:opacity-80 transition-opacity"
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
                    // OTHERS를 맨 앞으로 정렬
                    Object.entries(officialSite as Record<string, string>)
                      .sort(([a], [b]) => {
                        if (a === 'OTHERS') return -1;
                        if (b === 'OTHERS') return 1;
                        return 0;
                      })
                      .map(([siteType, url], index) => (
                      <a 
                        key={index}
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="relative shrink-0 w-[25px] h-[25px] cursor-pointer hover:opacity-80 transition-opacity"
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
                    ))
                  )
                ) : null}
                </div>
              </div>
            </div>
          </div>
          
          {/* Synopsis 섹션 - 그리드 아래에 배치 */}
          {synopsis && (
            <div className="col-span-2 mt-4 pt-3 pl-[15px] pr-[50px]">
              {/* 구분선 */}
              <div className="mb-4 border-b border-gray-200"></div>
              
              <div className="font-['Pretendard'] font-normal text-[#adb5bd] text-[18.25px] mb-2 pb-1">
                <p className="leading-[16.336px]">줄거리</p>
              </div>
               <div 
                 ref={synopsisRef}
                 className={cn(
                   "font-['Pretendard'] font-medium text-black text-[16px] leading-[1.6] transition-all duration-300",
                   !isSynopsisExpanded && showExpandButton && "line-clamp-2"
                 )}
                 style={{
                   display: !isSynopsisExpanded && showExpandButton ? '-webkit-box' : 'block',
                   WebkitLineClamp: !isSynopsisExpanded && showExpandButton ? 2 : 'unset',
                   WebkitBoxOrient: 'vertical',
                   overflow: 'hidden'
                 }}
               >
                 <p className="text-justify">{synopsis}</p>
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
    </>
  );
}
