'use client';

import React, { useState, useRef, useEffect } from 'react';
import '@/styles/customScrollbar.css';
import { cn, getSeasonInKorean } from '@/lib';
import CharacterList from '@/components/domain/anime/CharacterList';
import { Character, AnimeInfoDto } from '@/types/dtos';
import ImageModal from '@/components/domain/anime/ImageModal';
import { useImageCache } from '@/hooks/useImageCache';
import RightCommentPanel from './RightCommentPanel';
import { OttType } from '@/types/enums';
import { format } from 'date-fns';

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
  isUploading?: boolean; // 이미지 업로드 중 여부
  isMobile?: boolean;
  animeId?: number; // 댓글 패널용 애니 ID
  rawAnimeData?: any; // 댓글 패널용 원본 데이터
  anime: AnimeInfoDto;
  characters?: Character[];
}

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
  isUploading = false,
  isMobile = false,
  animeId,
  rawAnimeData,
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
    transition: 'all 0.3s ease-out',
  });
  const [hoveredBarStyle, setHoveredBarStyle] = useState({
    width: '0px',
    left: '0px',
    opacity: 0,
    transition: 'all 0.3s ease-out',
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
  const tabRefs = useRef<{ [key in TabOption]: HTMLButtonElement | null }>(
    {} as Record<TabOption, HTMLButtonElement | null>
  );

  // 높이 계산 (헤더 높이 60px, 상단 여백 30px, 하단 여백 30px)
  const headerHeight = 60;
  const topPadding = 30;
  const bottomPadding = 30;
  const availableHeight =
    windowHeight - headerHeight - topPadding - bottomPadding;
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
  const panelBottomPadding = 0; // 하단 패딩
  const totalPadding = panelTopPadding + gapBetween + panelBottomPadding;

  const infoContentHeight = Math.max(
    lowerPanelHeight - tabMenuHeight - totalPadding + 5,
    125
  ); // 5px 추가, 최소 높이도 5px 증가

  // 스크롤 컨테이너 높이 계산 (회색 블록 내부 패딩 제외)
  const grayBlockPadding = 20; // 회색 블록 내부 상하 패딩 (10px + 10px)
  const scrollContainerHeight = Math.max(
    infoContentHeight - grayBlockPadding + 10,
    100
  ); // 10px 추가 여유 공간

  // 등장인물 탭용 스크롤 컨테이너 높이 계산
  const characterScrollContainerHeight = Math.max(infoContentHeight, 90);

  const tabOptions: TabOptionConfig[] =
    isMobile || (animeId && rawAnimeData)
      ? [
          {
            key: 'info' as const,
            label: '애니 정보',
            width: 'flex-1',
            isBeta: false,
          },
          {
            key: 'characters' as const,
            label: '등장인물',
            width: 'flex-1',
            isBeta: false,
          },
          {
            key: 'performance' as const,
            label: '분기 성적',
            width: 'flex-1',
            isBeta: true,
            badgeText: '준비중',
          },
          {
            key: 'comments' as const,
            label: '댓글',
            width: 'flex-1',
            isBeta: false,
          },
        ]
      : [
          {
            key: 'info' as const,
            label: '애니 정보',
            width: 'flex-1',
            isBeta: false,
          },
          {
            key: 'characters' as const,
            label: '등장인물',
            width: 'flex-1',
            isBeta: false,
          },
          {
            key: 'performance' as const,
            label: '분기 성적',
            width: 'flex-1',
            isBeta: true,
            badgeText: '준비중',
          },
        ];

  // 네비게이션 바 위치 업데이트
  const updateNavigationBar = (tab: TabOption | null, immediate = false) => {
    if (!tab || !tabRefs.current[tab] || !containerRef.current) {
      setSelectedBarStyle({
        width: '0px',
        left: '0px',
        opacity: 0,
        transition: 'all 0.3s ease-out',
      });
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
      transition: immediate ? 'none' : 'all 0.3s ease-out',
    });
  };

  // 호버된 네비게이션 바 위치 업데이트
  const updateHoveredBar = (tab: TabOption | null) => {
    if (!tab || !tabRefs.current[tab] || !containerRef.current) {
      setHoveredBarStyle({
        width: '0px',
        left: '0px',
        opacity: 0,
        transition: 'all 0.3s ease-out',
      });
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
      transition: 'all 0.3s ease-out',
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
    setHoveredBarStyle((prev) => ({ ...prev, opacity: 0 }));
  };

  // anime 객체가 null인 경우 early return
  if (!anime) {
    return (
      <div
        className={`w-full ${isMobile ? '' : 'max-w-[612px]'} flex h-[1144px] items-center justify-center rounded-xl border border-[#D1D1D6] bg-white`}
      >
        <div className="text-gray-500">애니메이션 정보를 불러오는 중...</div>
      </div>
    );
  }

  const {
    mainThumbnailUrl,
    mainImageUrl,
    titleKor,
    titleOrigin,
    dayOfWeek,
    airTime,
    genre,
    medium,
    corp,
    author,
    director,
    synopsis,
    officalSite: officialSite, // TODO: 응답 오타 수정 후 수정
    ottDtos,
    premiereDateTime,
    minAge,
  } = anime;

  const { year = 2025, seasonType: quarter } = anime.seasonDtos[0];

  // 이미지 로딩 상태 관리 (간소화)
  const [currentPosterImage, setCurrentPosterImage] = useState(
    mainThumbnailUrl || '/banners/duckstar-logo.svg'
  );
  const [currentBackgroundImage, setCurrentBackgroundImage] = useState(
    mainImageUrl || '/banners/duckstar-logo.svg'
  );
  const [backgroundPosition, setBackgroundPosition] = useState('center center');
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
        let position = 'center center';

        if (imageAspectRatio > containerAspectRatio) {
          // 이미지가 더 넓음 - 높이에 맞춤, 좌우 중앙
          position = 'center center';
        } else {
          // 이미지가 더 높음 - 너비에 맞춤, 상하 중앙
          position = 'center center';
        }

        resolve(position);
      };
      img.onerror = () => resolve('center center');
      img.src = imageUrl;
    });
  };

  // 초기 캐시 확인 및 이미지 설정
  useEffect(() => {
    if (
      mainImageUrl &&
      mainThumbnailUrl &&
      mainImageUrl !== mainThumbnailUrl &&
      !initialImageSet
    ) {
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
    if (
      mainImageUrl &&
      mainThumbnailUrl &&
      mainImageUrl !== mainThumbnailUrl &&
      !isCachedImage
    ) {
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
      MON: '월',
      TUE: '화',
      WED: '수',
      THU: '목',
      FRI: '금',
      SAT: '토',
      SUN: '일',
    };
    return dayMap[day] || day;
  };

  // 분기 한글 변환
  const getQuarterInKorean = (quarter: number) => {
    const quarterMap: { [key: number]: string } = {
      1: '겨울',
      2: '봄',
      3: '여름',
      4: '가을',
    };
    return quarterMap[quarter] || '';
  };

  // 방영 시간 포맷팅
  const formatAirTime = (scheduledAt: string) => {
    if (!scheduledAt) return '';

    // ISO 문자열이 아닌 경우 (예: "21:25" 또는 "21:25:00") 직접 반환
    if (scheduledAt.includes(':') && !scheduledAt.includes('T')) {
      // HH:MM 또는 HH:MM:SS 형식인 경우 (LocalTime은 HH:MM:SS로 올 수 있음)
      if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(scheduledAt)) {
        const [hoursStr, minutesStr] = scheduledAt.split(':');
        let hours = parseInt(hoursStr, 10);
        // 00:00 ~ 04:59인 경우 24시간 더하기
        if (hours < 5) {
          hours += 24;
        }
        return `${hours.toString().padStart(2, '0')}:${minutesStr}`;
      }
      return scheduledAt;
    }

    try {
      const date = new Date(scheduledAt);
      // 유효한 날짜인지 확인
      if (isNaN(date.getTime())) {
        return '';
      }
      let hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      // 00:00 ~ 04:59인 경우 24시간 더하기
      if (hours < 5) {
        hours += 24;
      }
      return `${hours.toString().padStart(2, '0')}:${minutes}`;
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
  const mapCastPreviewsToCharacters = (
    castPreviews: unknown[]
  ): Character[] => {
    if (!castPreviews || !Array.isArray(castPreviews)) {
      return [];
    }

    return castPreviews.map((cast, index) => {
      const castData = cast as Record<string, unknown>;
      return {
        characterId: (castData.characterId as number) || index + 1,
        nameKor:
          (castData.nameKor as string) ||
          (castData.name as string) ||
          '이름 없음',
        nameJpn:
          (castData.nameJpn as string) || (castData.nameOrigin as string),
        nameEng:
          (castData.nameEng as string) || (castData.nameEnglish as string),
        imageUrl:
          (castData.imageUrl as string) ||
          (castData.characterImageUrl as string),
        description:
          (castData.description as string) ||
          (castData.characterDescription as string),
        voiceActor:
          (castData.voiceActor as string) ||
          (castData.cvName as string) ||
          (castData.cv as string),
        role:
          (castData.role as 'MAIN' | 'SUPPORTING' | 'MINOR') ||
          (index < 2 ? 'MAIN' : index < 4 ? 'SUPPORTING' : 'MINOR'),
        gender:
          (castData.gender as 'FEMALE' | 'MALE' | 'OTHER') ||
          (index % 2 === 0 ? 'FEMALE' : 'MALE'),
        age: castData.age as number,
        height: castData.height as number,
        weight: castData.weight as number,
        birthday: castData.birthday as string,
        bloodType: castData.bloodType as string,
        occupation: castData.occupation as string,
        personality: castData.personality
          ? Array.isArray(castData.personality)
            ? (castData.personality as string[])
            : [castData.personality as string]
          : [],
        abilities: castData.abilities
          ? Array.isArray(castData.abilities)
            ? (castData.abilities as string[])
            : [castData.abilities as string]
          : [],
        relationships: (
          (castData.relationships as Array<{
            characterName: string;
            relationship: string;
          }>) || []
        ).map((rel, relIndex) => ({
          characterId: relIndex + 1,
          characterName: rel.characterName,
          relationship: rel.relationship,
        })),
      };
    });
  };

  // 캐릭터 이미지 프리로딩
  const preloadCharacterImages = (characters: Character[]) => {
    characters.forEach((character) => {
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
        className="relative w-full overflow-hidden rounded-[12px]"
        style={{ height: isSmallScreen ? 'auto' : `${panelHeight}px` }}
        data-name="Left_Info_Pannel"
      >
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute z-50 rounded-[13px] border-2 border-solid border-[#ced4da] dark:border-zinc-800 ${isMobile ? 'inset-0' : ''}`}
          style={
            !isMobile
              ? { top: '-1px', left: '-1px', right: '-1px', bottom: '-1px' }
              : {}
          }
        />

        {/* 이전 버튼 - left panel 좌상단 */}
        <div className="absolute top-4 left-4 z-20">
          <button
            onClick={onBack}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/90 shadow-md transition-all duration-200 hover:bg-white hover:shadow-lg"
          >
            <svg
              className="h-4 w-4 text-gray-700"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        </div>

        {/* 메인 이미지 섹션 */}
        <div
          className={`${isSmallScreen ? 'relative' : 'absolute'} top-0 left-0 w-full cursor-pointer overflow-clip rounded-tl-[12px] rounded-tr-[12px] transition-opacity duration-200 hover:opacity-95`}
          style={{ height: isSmallScreen ? 'auto' : `${mainImageHeight}px` }}
          onClick={handleImageClick}
          title="이미지를 클릭하여 크게 보기"
        >
          <div
            className={`${isSmallScreen ? 'relative' : 'absolute'} w-full bg-cover bg-center bg-no-repeat ${!skipTransition && !isMainImageLoaded && !isCachedImage ? 'transition-opacity duration-300' : ''}`}
            style={{
              backgroundImage: `url('${currentBackgroundImage}')`,
              backgroundPosition: 'center center',
              backgroundSize: 'cover',
              opacity: isMainImageLoaded || isCachedImage ? 1 : 0.9,
              height: isSmallScreen ? '400px' : isMobile ? '100%' : '828px',
              top: isSmallScreen ? 'auto' : isMobile ? '0' : '-221px',
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
                  className="flex items-center gap-2 rounded-lg bg-black/50 px-3 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-black/70"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
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
                    disabled={isUploading}
                    className="flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isUploading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        <span>저장 중...</span>
                      </>
                    ) : (
                      '저장'
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onImageEditCancel?.();
                    }}
                    disabled={isUploading}
                    className="rounded-lg bg-gray-600 px-3 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    취소
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 편집 중일 때 선택된 파일 정보 표시 */}
          {isEditingImage && imageFile && (
            <div className="absolute right-4 bottom-4 left-4 rounded-lg bg-black/70 p-3 text-white">
              <div className="text-sm font-medium">
                선택된 파일: {imageFile.name}
              </div>
              <div className="mt-1 text-xs text-gray-300">
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
            top: isSmallScreen ? 'auto' : `${titleOverlayTop}px`,
          }}
        >
          <div
            className={`absolute right-[0.1px] bottom-0 left-0 flex flex-col content-stretch items-start justify-start gap-[9.653px] overflow-clip bg-gradient-to-b from-[#00000000] via-[#00000033] via-[11.628%] to-[#00000073] to-[93.023%] pt-[29.701px] pb-[15px] ${isMobile ? 'pr-4 pl-4' : 'pr-[11.88px] pl-[22.276px]'}`}
          >
            {/* 한글 제목 */}
            <div
              className={`relative w-full shrink-0 text-[29.2px] leading-[0] font-bold text-white not-italic [text-shadow:rgba(0,0,0,0.4)_0px_0px_14.85px] ${isMobile ? 'max-w-none' : 'max-w-[395px]'}`}
            >
              <p className="leading-[normal]">{titleKor}</p>
            </div>

            {/* 일본어 제목 */}
            {titleOrigin && (
              <div
                className={`relative w-full shrink-0 text-[14.6px] leading-[0] font-medium text-white not-italic [text-shadow:rgba(0,0,0,0.4)_0px_0px_14.85px] ${isMobile ? 'max-w-none' : 'max-w-[400px]'}`}
              >
                <p className="leading-[normal]">{titleOrigin}</p>
              </div>
            )}

            {/* 정보 텍스트 */}
            <div
              className={`relative w-full shrink-0 text-[14.6px] leading-[0] font-medium text-white not-italic [text-shadow:rgba(0,0,0,0.4)_0px_0px_14.85px] ${isMobile ? 'max-w-none' : 'max-w-[400px]'}`}
            >
              <p className="leading-[normal]">
                {`${year}년 ${getSeasonInKorean(quarter)}`} ·{' '}
                {medium === 'MOVIE' ? '극장판' : medium}
                {dayOfWeek !== 'NONE' &&
                  ` · ${getDayInKorean(dayOfWeek)} ${formatAirTime(airTime || '')}`}
              </p>
            </div>

            {/* OTT 서비스 아이콘들 */}
            <div
              className="relative flex shrink-0 content-stretch items-start justify-start gap-3"
              data-name="ottList"
            >
              {ottDtos?.map((ott, index) => (
                <div
                  key={index}
                  className="relative h-9 w-9 shrink-0 cursor-pointer transition-opacity hover:opacity-80"
                  data-node-id={`ott-${index}`}
                  onClick={() => handleOttClick(ott.watchUrl)}
                  title={`${ott.ottType} 클릭하여 시청하기`}
                >
                  <div className="absolute top-0 left-0 h-9 w-9">
                    {ott.ottType === 'NETFLIX' && (
                      <img
                        src="/icons/netflix-logo.svg"
                        alt="Netflix"
                        className="h-full w-full object-contain"
                      />
                    )}
                    {ott.ottType === OttType.Laftel && (
                      <img
                        src="/icons/laftel-logo.svg"
                        alt="LAFTEL"
                        className="h-full w-full object-contain"
                      />
                    )}
                    {ott.ottType === 'TVING' && (
                      <img
                        src="/icons/tving-logo.svg"
                        alt="TVING"
                        className="h-full w-full object-contain"
                      />
                    )}
                    {ott.ottType === 'WAVVE' && (
                      <img
                        src="/icons/wavve-logo.svg"
                        alt="WAVVE"
                        className="h-full w-full object-contain"
                      />
                    )}
                    {ott.ottType === 'WATCHA' && (
                      <img
                        src="/icons/watcha-logo.svg"
                        alt="WATCHA"
                        className="h-full w-full object-contain"
                      />
                    )}
                    {/* 기타 OTT 서비스에 대한 fallback */}
                    {![
                      'NETFLIX',
                      'LAFTEL',
                      'TVING',
                      'WAVVE',
                      'WATCHA',
                    ].includes(ott.ottType) && (
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-white/90 shadow-sm">
                        <span className="text-xs font-bold text-gray-800">
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
            className="absolute top-[111.38px] right-[18px] h-[206.958px] w-[146.423px] cursor-pointer rounded-[8.91px] bg-cover bg-center bg-no-repeat shadow-lg transition-opacity duration-200 hover:opacity-95 hover:shadow-xl"
            style={{
              backgroundImage: `url('${currentPosterImage}')`,
            }}
            onClick={handleImageClick}
            title="이미지를 클릭하여 크게 보기"
          />
        )}

        {/* 하단 정보 패널 */}
        <div
          className={`${isSmallScreen ? 'relative' : 'absolute'} left-0 flex w-full flex-col content-stretch items-center justify-start gap-[9.653px] overflow-clip rounded-br-[12px] rounded-bl-[12px] bg-white pb-[10px] dark:bg-zinc-900 ${isMobile ? 'px-1' : 'px-0'}`}
          style={{
            top: isSmallScreen ? 'auto' : `${lowerPanelTop}px`,
            height: isSmallScreen ? 'auto' : `${lowerPanelHeight}px`,
          }}
        >
          {/* 탭 메뉴 */}
          <div
            ref={containerRef}
            className="relative flex items-center justify-start overflow-hidden"
            style={{
              width: '100%',
              maxWidth: isMobile ? '100%' : '584px',
            }}
            onMouseLeave={handleMouseLeave}
          >
            {/* 선택된 탭의 네비게이션 바 */}
            <div
              className="bg-brand pointer-events-none absolute bottom-0 h-[1.856px]"
              style={{
                width: selectedBarStyle.width,
                left: selectedBarStyle.left,
                opacity: selectedBarStyle.opacity,
                transition: selectedBarStyle.transition,
              }}
            />

            {/* 호버된 탭의 네비게이션 바 */}
            <div
              className={cn(
                'pointer-events-none absolute bottom-0 h-[1.856px]',
                hoveredTab &&
                  tabOptions.find((opt) => opt.key === hoveredTab)?.isBeta
                  ? 'bg-gray-400'
                  : 'bg-brand'
              )}
              style={{
                width: hoveredBarStyle.width,
                left: hoveredBarStyle.left,
                opacity: hoveredBarStyle.opacity,
                transition: hoveredBarStyle.transition,
              }}
            />

            {tabOptions.map((option) => {
              const isSelected = currentTab === option.key;
              const isHovered = hoveredTab === option.key;
              const isBeta = option.isBeta || false;

              return (
                <button
                  key={option.key}
                  ref={(el) => {
                    tabRefs.current[option.key] = el;
                  }}
                  onClick={() => {
                    if (!isBeta) {
                      setCurrentTab(option.key);
                      updateNavigationBar(option.key, true); // 클릭 시 즉시 이동
                    }
                  }}
                  onMouseEnter={() => handleMouseEnter(option.key)}
                  className={cn(
                    'relative flex h-11 flex-shrink-0 items-center justify-center transition-all duration-200',
                    isBeta ? 'opacity-50' : 'cursor-pointer',
                    option.width
                  )}
                >
                  <div
                    className={cn(
                      `justify-start text-center leading-snug font-normal transition-colors duration-200 ${isVerySmallScreen ? 'text-[16px]' : 'text-[18px]'}`,
                      isBeta
                        ? 'font-normal text-[#adb5bd]'
                        : isSelected || isHovered
                          ? 'text-brand font-semibold'
                          : 'font-normal text-[#adb5bd]'
                    )}
                  >
                    <p
                      className={`whitespace-pre ${isVerySmallScreen ? 'leading-[14px]' : 'leading-[16.336px]'}`}
                    >
                      {option.label}
                    </p>
                  </div>

                  {/* 준비중 배지 */}
                  {isBeta && option.badgeText && (
                    <div className="absolute right-4 bottom-1 z-10">
                      <span className="rounded bg-gray-100 px-1 py-0.5 text-[10px] text-gray-600">
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
              className="custom-scrollbar w-full overflow-y-auto"
              style={{
                height: isSmallScreen
                  ? 'auto'
                  : `${characterScrollContainerHeight}px`,
                scrollbarWidth: 'thin',
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
          {(isMobile || (animeId && rawAnimeData)) &&
            currentTab === 'comments' && (
              <div
                className="custom-scrollbar w-full overflow-y-auto"
                style={{
                  height: isSmallScreen
                    ? 'auto'
                    : `${characterScrollContainerHeight}px`,
                  scrollbarWidth: 'thin',
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
              className={`relative w-full shrink-0 rounded-[12px] bg-[#f8f9fa] dark:bg-zinc-900 ${isMobile ? 'pr-2 pl-2' : 'pl-[25px]'}`}
              style={{
                height: isSmallScreen ? 'auto' : `${infoContentHeight}px`,
                paddingTop: '10px',
                paddingBottom: '10px',
                maxWidth: isMobile ? '100%' : '554px',
              }}
            >
              {/* 스크롤 컨테이너 */}
              <div
                className="overflow-y-auto"
                style={{
                  width: isMobile ? '100%' : 'calc(100% + 12.5px)',
                  marginRight: isMobile ? '0' : '10px',
                  height: isSmallScreen ? 'auto' : `${scrollContainerHeight}px`,
                }}
              >
                {/* 탭별 내용 렌더링 */}
                {currentTab === 'info' && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '50% 50%' : '1fr 1fr',
                      gap: '0px',
                      width: '100%',
                      overflow: 'hidden',
                    }}
                  >
                    {/* 왼쪽 정보 */}
                    <div
                      className={`flex flex-col ${isMobile ? 'items-center' : 'items-start'} relative shrink-0 justify-start ${isMobile ? 'w-full p-2' : 'p-[11.138px]'}`}
                    >
                      <div
                        className={`flex flex-col content-stretch gap-[11.138px] ${isMobile ? 'items-center' : 'items-start'} justify-center leading-[0] not-italic ${isMobile ? 'px-2 py-2' : 'px-[11.138px] py-[2.97px]'} relative shrink-0 ${isMobile ? 'text-[20px]' : 'text-[18.25px]'} w-full`}
                        style={{
                          height: `${Math.max(77.41 * heightRatio, 50)}px`,
                        }}
                      >
                        <div
                          className={`relative shrink-0 font-normal text-[#adb5bd] ${isMobile ? (isMediumScreen ? 'text-lg' : 'text-base') : 'text-[18.25px]'} text-center`}
                        >
                          <p className="leading-[16.336px] whitespace-nowrap">
                            제작사
                          </p>
                        </div>
                        <div
                          className={`relative w-full shrink-0 font-medium ${isMobile ? 'text-center' : 'text-left'}`}
                          style={{
                            height: `${Math.max(44 * heightRatio, 30)}px`,
                          }}
                        >
                          <p
                            className={`${isMobile ? (isMediumScreen ? 'text-lg' : 'text-base') : 'text-[18px]'} leading-[normal] break-words`}
                          >
                            {corp ? corp : '정보 없음'}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`flex flex-col content-stretch gap-[11.138px] ${isMobile ? 'items-center' : 'items-start'} justify-center leading-[0] not-italic ${isMobile ? 'px-2 py-2' : 'px-[11.138px] py-[2.97px]'} relative shrink-0 ${isMobile ? (isMediumScreen ? 'text-lg' : 'text-base') : 'text-[18.25px]'} w-full`}
                        style={{
                          height: `${Math.max(77.41 * heightRatio, 50)}px`,
                        }}
                      >
                        <div
                          className={`relative shrink-0 font-normal text-[#adb5bd] ${isMobile ? (isMediumScreen ? 'text-lg' : 'text-base') : 'text-[18.25px]'} text-center`}
                        >
                          <p className="leading-[16.336px] whitespace-nowrap">
                            감독
                          </p>
                        </div>
                        <div
                          className={`relative w-full shrink-0 font-medium ${isMobile ? 'text-center' : 'text-left'}`}
                          style={{
                            height: `${Math.max(44 * heightRatio, 30)}px`,
                          }}
                        >
                          <p
                            className={`${isMobile ? (isMediumScreen ? 'text-lg' : 'text-base') : 'text-[18px]'} leading-[normal] break-words`}
                          >
                            {director ? director : '정보 없음'}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`flex flex-col content-stretch gap-[11.138px] ${isMobile ? 'items-center' : 'items-start'} justify-start leading-[0] not-italic ${isMobile ? 'px-2 py-2' : 'px-[11.138px] py-[2.97px]'} relative shrink-0 ${isMobile ? (isMediumScreen ? 'text-lg' : 'text-base') : 'text-[18.25px]'} w-full`}
                      >
                        <div
                          className={`relative shrink-0 font-normal text-[#adb5bd] ${isMobile ? (isMediumScreen ? 'text-lg' : 'text-base') : 'text-[18.25px]'} text-center`}
                        >
                          <p className="leading-[16.336px] whitespace-nowrap">
                            장르
                          </p>
                        </div>
                        <div
                          className={`relative w-full shrink-0 font-medium ${isMobile ? 'text-center' : 'text-left'}`}
                        >
                          <p
                            className={`${isMobile ? (isMediumScreen ? 'text-lg' : 'text-base') : 'text-[18px]'} leading-[normal] break-words`}
                          >
                            {genre || ''}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 오른쪽 정보 */}
                    <div
                      className={`flex flex-col ${isMobile ? 'items-center' : 'items-start'} relative shrink-0 justify-start ${isMobile ? 'w-full p-2' : 'p-[11.138px]'}`}
                    >
                      <div
                        className={`flex flex-col content-stretch gap-[11.138px] ${isMobile ? 'items-center' : 'items-start'} justify-center leading-[0] not-italic ${isMobile ? 'px-2 py-2' : 'px-[17.821px] py-[2.97px]'} relative shrink-0 ${isMobile ? (isMediumScreen ? 'text-lg' : 'text-base') : 'text-[18.25px]'} w-full`}
                        style={{
                          height: `${Math.max(77.41 * heightRatio, 50)}px`,
                        }}
                      >
                        <div
                          className={`relative shrink-0 font-normal text-[#adb5bd] ${isMobile ? (isMediumScreen ? 'text-lg' : 'text-base') : 'text-[18.25px]'} text-center`}
                        >
                          <p className="leading-[16.336px] whitespace-nowrap">
                            원작
                          </p>
                        </div>
                        <div
                          className={`relative w-full shrink-0 font-medium ${isMobile ? 'text-center' : 'text-left'}`}
                          style={{
                            height: `${Math.max(44 * heightRatio, 30)}px`,
                          }}
                        >
                          <p
                            className={`${isMobile ? (isMediumScreen ? 'text-lg' : 'text-base') : 'text-[18px]'} leading-[normal] break-words`}
                          >
                            {author ? author : '정보 없음'}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`flex flex-col content-stretch gap-[11.138px] ${isMobile ? 'items-center' : 'items-start'} justify-center leading-[0] not-italic ${isMobile ? 'px-2 py-2' : 'px-[17.821px] py-[2.97px]'} relative shrink-0 ${isMobile ? (isMediumScreen ? 'text-lg' : 'text-base') : 'text-[18.25px]'} w-full`}
                        style={{
                          height: `${Math.max(77.41 * heightRatio, 50)}px`,
                        }}
                      >
                        <div
                          className={`relative shrink-0 font-normal text-[#adb5bd] ${isMobile ? (isMediumScreen ? 'text-lg' : 'text-base') : 'text-[18.25px]'} text-center`}
                        >
                          <p className="leading-[16.336px] whitespace-nowrap">
                            {medium === 'MOVIE' ? '개봉일' : '방영 시작일'}
                          </p>
                        </div>
                        <div
                          className={`relative w-full shrink-0 font-medium ${isMobile ? 'text-center' : 'text-left'}`}
                          style={{
                            height: `${Math.max(44 * heightRatio, 30)}px`,
                          }}
                        >
                          <p
                            className={`${isMobile ? (isMediumScreen ? 'text-lg' : 'text-base') : 'text-[18px]'} leading-[normal] break-words`}
                          >
                            {format(premiereDateTime, 'yyyy. MM. dd')}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`flex flex-col content-stretch gap-[11.138px] ${isMobile ? 'items-center' : 'items-start'} justify-start leading-[0] not-italic ${isMobile ? 'px-2 py-2' : 'px-[17.821px] py-[2.97px]'} relative shrink-0 ${isMobile ? (isMediumScreen ? 'text-lg' : 'text-base') : 'text-[18.25px]'} w-full`}
                      >
                        <div
                          className={`relative shrink-0 font-normal text-[#adb5bd] ${isMobile ? (isMediumScreen ? 'text-lg' : 'text-base') : 'text-[18.25px]'} text-center`}
                        >
                          <p className="leading-[16.336px] whitespace-nowrap">
                            등급
                          </p>
                        </div>
                        <div
                          className={`relative w-full shrink-0 font-medium ${isMobile ? 'text-center' : 'text-left'}`}
                          style={{
                            height: `${Math.max(44 * heightRatio, 30)}px`,
                          }}
                        >
                          <p
                            className={`${isMobile ? (isMediumScreen ? 'text-lg' : 'text-base') : 'text-[18px]'} leading-[normal] break-words`}
                          >
                            {minAge ? `${minAge}세 이상` : '전체 관람가'}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`flex flex-col content-stretch gap-[11.138px] ${isMobile ? 'items-center' : 'items-start'} justify-start leading-[0] not-italic ${isMobile ? 'px-2 py-2' : 'px-[17.821px] py-[2.97px]'} relative shrink-0 ${isMobile ? (isMediumScreen ? 'text-lg' : 'text-base') : 'text-[18.25px]'} w-full`}
                      >
                        <div
                          className={`relative shrink-0 font-normal text-[#adb5bd] ${isMobile ? (isMediumScreen ? 'text-lg' : 'text-base') : 'text-[18.25px]'} text-center`}
                        >
                          <p className="leading-[16.336px] whitespace-nowrap">
                            공식 사이트
                          </p>
                        </div>
                        <div
                          className={`relative shrink-0 font-medium ${isMobile ? 'flex w-full justify-center' : 'w-[225.727px]'}`}
                        >
                          <div
                            className={`flex flex-wrap ${isMobile ? 'gap-2' : 'gap-[6px]'} items-start ${isMobile ? 'justify-center' : 'justify-start'}`}
                          >
                            {officialSite ? (
                              // officialSite가 문자열인 경우
                              typeof officialSite === 'string' ? (
                                <a
                                  href={officialSite}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`relative shrink-0 ${isMobile ? 'h-6 w-6' : 'h-[25px] w-[25px]'} cursor-pointer transition-opacity hover:opacity-80`}
                                  title="공식 사이트 방문"
                                >
                                  <img
                                    src="/icons/aniHome-site-others.svg"
                                    alt="Official Site"
                                    className="h-full w-full object-contain"
                                  />
                                </a>
                              ) : (
                                // officialSite가 객체인 경우 모든 사이트 표시
                                // OTHERS를 맨 앞으로 정렬하고, OTHERS가 여러 개일 때 모두 처리
                                Object.entries(
                                  officialSite as Record<string, string>
                                )
                                  .sort(([a], [b]) => {
                                    if (a === 'OTHERS') return -1;
                                    if (b === 'OTHERS') return 1;
                                    return 0;
                                  })
                                  .flatMap(([siteType, url], index) => {
                                    // OTHERS가 여러 URL을 포함한 경우 (쉼표나 세미콜론으로 구분)
                                    if (
                                      siteType === 'OTHERS' &&
                                      (url.includes(',') || url.includes(';'))
                                    ) {
                                      const urls = url
                                        .split(/[,;]/)
                                        .map((u) => u.trim())
                                        .filter((u) => u);
                                      return urls.map((singleUrl, urlIndex) => (
                                        <a
                                          key={`${index}-${urlIndex}`}
                                          href={singleUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className={`relative shrink-0 ${isMobile ? 'h-6 w-6' : 'h-[25px] w-[25px]'} cursor-pointer transition-opacity hover:opacity-80`}
                                          title={`${siteType} 방문하기`}
                                        >
                                          <img
                                            src="/icons/aniHome-site-others.svg"
                                            alt="Others"
                                            className="h-full w-full object-contain"
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
                                        className={`relative shrink-0 ${isMobile ? 'h-6 w-6' : 'h-[25px] w-[25px]'} cursor-pointer transition-opacity hover:opacity-80`}
                                        title={`${siteType} 방문하기`}
                                      >
                                        {/* 사이트 타입에 따른 아이콘 매핑 */}
                                        {siteType === 'X' && (
                                          <img
                                            src="/icons/aniHome-site-x.svg"
                                            alt="X (Twitter)"
                                            className="h-full w-full object-contain"
                                          />
                                        )}
                                        {siteType === 'INSTAGRAM' && (
                                          <img
                                            src="/icons/aniHome-site-instagram.svg"
                                            alt="Instagram"
                                            className="h-full w-full object-contain"
                                          />
                                        )}
                                        {siteType === 'YOUTUBE' && (
                                          <img
                                            src="/icons/aniHome-site-youtube.svg"
                                            alt="YouTube"
                                            className="h-full w-full object-contain"
                                          />
                                        )}
                                        {siteType === 'TIKTOK' && (
                                          <img
                                            src="/icons/aniHome-site-tiktok.svg"
                                            alt="TikTok"
                                            className="h-full w-full object-contain"
                                          />
                                        )}
                                        {siteType === 'OTHERS' && (
                                          <img
                                            src="/icons/aniHome-site-others.svg"
                                            alt="Others"
                                            className="h-full w-full object-contain"
                                          />
                                        )}
                                        {/* 매핑되지 않은 사이트 타입은 기본 아이콘 사용 */}
                                        {![
                                          'X',
                                          'INSTAGRAM',
                                          'YOUTUBE',
                                          'TIKTOK',
                                          'OTHERS',
                                        ].includes(siteType) && (
                                          <img
                                            src="/icons/aniHome-site-others.svg"
                                            alt={siteType}
                                            className="h-full w-full object-contain"
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
                      <div
                        className={`col-span-2 mt-4 pt-3 pb-5 ${isMobile ? 'px-2' : 'pr-[50px] pl-[15px]'}`}
                      >
                        {/* 구분선 */}
                        <div className="mb-4 border-b border-gray-200 dark:border-zinc-800"></div>

                        <div className="mb-2 pb-1 text-[18.25px] font-normal text-[#adb5bd]">
                          <p className="leading-[16.336px]">줄거리</p>
                        </div>
                        <div
                          ref={synopsisRef}
                          className={cn(
                            'text-[16px] leading-[1.6] font-medium transition-all duration-300',
                            !isSynopsisExpanded &&
                              showExpandButton &&
                              'line-clamp-2',
                            isMobile && 'w-full max-w-full overflow-hidden'
                          )}
                          style={{
                            display:
                              !isSynopsisExpanded && showExpandButton
                                ? '-webkit-box'
                                : 'block',
                            WebkitLineClamp:
                              !isSynopsisExpanded && showExpandButton
                                ? 2
                                : 'unset',
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            whiteSpace: 'pre-wrap', // 줄바꿈 문자(\n)를 실제 줄바꿈으로 표시
                            wordBreak: isMobile ? 'break-word' : 'normal',
                            maxWidth: isMobile ? '100%' : 'none',
                          }}
                        >
                          <p
                            className={`${isMobile ? 'text-left break-words' : 'text-justify'}`}
                          >
                            {synopsis}
                          </p>
                        </div>
                        {showExpandButton && (
                          <div className="mt-2 flex justify-end">
                            <button
                              onClick={() => {
                                setIsSynopsisExpanded(!isSynopsisExpanded);
                                // 펼치기 버튼을 눌렀을 때만 스크롤을 바텀으로 이동
                                if (!isSynopsisExpanded) {
                                  setTimeout(() => {
                                    const scrollContainer =
                                      document.querySelector(
                                        '.custom-scrollbar'
                                      );
                                    if (scrollContainer) {
                                      scrollContainer.scrollTo({
                                        top: scrollContainer.scrollHeight,
                                        behavior: 'smooth',
                                      });
                                    }
                                  }, 200); // 애니메이션 완료 후 스크롤
                                }
                              }}
                              className="text-brand flex cursor-pointer items-center gap-1 text-[14px] font-medium transition-all duration-200 hover:underline"
                            >
                              <span>
                                {isSynopsisExpanded ? '접기' : '펼치기'}
                              </span>
                              <svg
                                className={`h-3 w-3 transition-transform duration-200 ${isSynopsisExpanded ? 'rotate-180' : ''}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                  clipRule="evenodd"
                                />
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
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <div className="mb-2 text-lg font-medium text-gray-400">
                        분기 성적
                      </div>
                      <div className="text-sm text-gray-300">준비 중입니다</div>
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
