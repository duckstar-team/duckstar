'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import LeftInfoPanel from '@/components/anime/LeftInfoPanel';
import RightCommentPanel from '@/components/anime/RightCommentPanel';
import { getAnimeDetail } from '@/api/search';
import { useImagePreloading } from '@/hooks/useImagePreloading';
import { CharacterData } from '@/components/anime/CharacterCard';

// 타입 정의
interface OttDto {
  ottType: string;
  watchUrl?: string;
}

interface AnimeDetailDto {
  animeId: number;
  mainThumbnailUrl: string;
  mainImageUrl?: string; // 배경용 이미지 추가
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
  studio?: string;
  director?: string;
  source?: string;
  startDate?: string;
  rating?: string;
  synopsis?: string;
  officialSite?: string | Record<string, string>; // 문자열 또는 객체
  ottDtos: OttDto[];
}

// mock 데이터 제거 - API 실패 시 null 처리

export default function AnimeDetailClient() {
  const params = useParams();
  const router = useRouter();
  const animeId = params.animeId as string;
  const [anime, setAnime] = useState<AnimeDetailDto | null>(null);
  const [characters, setCharacters] = useState<CharacterData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [rawAnimeData, setRawAnimeData] = useState<any>(null); // 백엔드 원본 데이터 저장
  const isLoadingRef = useRef(false); // 중복 호출 방지용
  const prevAnimeIdRef = useRef<string | null>(null); // 이전 animeId 추적
  
  // 캐시된 데이터 확인
  const [cachedData, setCachedData] = useState<{ anime: AnimeDetailDto; characters: CharacterData[] } | null>(null);
  
  // 이미지 프리로딩 훅
  const { preloadAnimeDetails } = useImagePreloading();
  
  // 이전 화면으로 돌아가기 (스크롤 복원)
  const navigateBackToSearch = () => {
    console.log('🔙 navigateBackToSearch 함수 호출됨');
    // 스크롤 복원을 위한 네비게이션
    
    // to-anime-detail 플래그가 있으면 from-anime-detail 플래그 설정
    const toAnimeDetail = sessionStorage.getItem('to-anime-detail');
    console.log('🔍 상세화면에서 to-anime-detail 확인:', toAnimeDetail);
    if (toAnimeDetail === 'true') {
      sessionStorage.setItem('from-anime-detail', 'true');
      sessionStorage.removeItem('to-anime-detail');
      console.log('🎬 from-anime-detail 플래그 설정 완료');
      
      // vote-result-scroll이 있으면 투표 결과 화면에서 온 것으로 판단
      const voteResultScroll = sessionStorage.getItem('vote-result-scroll');
      if (voteResultScroll) {
        sessionStorage.setItem('to-vote-result', 'true');
      }
    }
    
    // 브라우저 히스토리를 고려하여 이전 페이지로 이동
    // 히스토리가 있으면 router.back() 사용, 없으면 기본 페이지로 이동
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/search');
    }
  };
  
  // 컴포넌트 언마운트 시 from-anime-detail 플래그 설정
  useEffect(() => {
    return () => {
      console.log('🔙 컴포넌트 언마운트 감지');
      const toAnimeDetail = sessionStorage.getItem('to-anime-detail');
      if (toAnimeDetail === 'true') {
        sessionStorage.setItem('from-anime-detail', 'true');
        sessionStorage.setItem('detail-restore-done', 'true'); // 즉시 설정
        sessionStorage.removeItem('to-anime-detail');
        console.log('🎬 from-anime-detail 플래그 설정 완료 (언마운트)');
      }
    };
  }, []);
  
  const [error, setError] = useState<string | null>(null);
  
  // 백그라운드에서 최신 데이터 가져오기
  const fetchLatestData = async () => {
    try {
      const data = await getAnimeDetail(parseInt(animeId));
      setRawAnimeData(data); // 백엔드 원본 데이터 저장
      // 최신 데이터로 업데이트 (사용자에게는 보이지 않음)
      // 필요시 여기서 상태 업데이트
    } catch (error) {
      // 백그라운드 업데이트 실패는 무시
    }
  };

  // 컴포넌트 마운트 시 스크롤을 맨 위로 강제 이동 (상세화면에서만)
  useEffect(() => {
    // to-anime-detail 플래그가 있으면 상세화면 진입으로 판단
    const toAnimeDetail = sessionStorage.getItem('to-anime-detail');
    if (toAnimeDetail === 'true') {
      console.log('🎬 상세화면: 스크롤 맨 위로 강제 이동');
      
      // 여러 방법으로 스크롤을 맨 위로 강제 이동
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      
      // 추가로 setTimeout으로 지연 실행
      setTimeout(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }, 0);
      
      setTimeout(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }, 100);
      
      // from-anime-detail 플래그 미리 설정
      sessionStorage.setItem('from-anime-detail', 'true');
      
      // vote-result-scroll이 있으면 투표 결과 화면에서 온 것으로 판단
      const voteResultScroll = sessionStorage.getItem('vote-result-scroll');
      if (voteResultScroll) {
        sessionStorage.setItem('to-vote-result', 'true');
      }
    } else {
      console.log('🎬 상세화면: 스크롤 강제 이동 건너뛰기 (홈페이지에서 돌아온 경우)');
    }
  }, []);

  useEffect(() => {
    // 애니메이션 상세화면 진입 시 스크롤을 맨 위로 강제 이동
    window.scrollTo(0, 0);
    
    const fetchAnimeData = async () => {
      // 중복 호출 방지
      if (isLoadingRef.current) {
        return;
      }
      
      // animeId가 변경되지 않았으면 API 호출하지 않음
      if (prevAnimeIdRef.current === animeId) {
        return;
      }
      
      try {
        isLoadingRef.current = true;
        prevAnimeIdRef.current = animeId;
        setLoading(true);
        setError(null);
        
        
        // 실제 API 호출 (병렬 처리로 성능 최적화)
        const data = await Promise.race([
          getAnimeDetail(parseInt(animeId)),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), 10000)
          )
        ]) as unknown;
        
        // 백엔드 원본 데이터 저장
        setRawAnimeData(data);
        
        // API 응답을 AnimeDetailDto 형식으로 변환
        // data는 AnimeHomeDto 구조: { animeInfoDto, animeStatDto, episodeDtos, rackUnitDtos, castPreviews }
        const dataTyped = data as { 
          animeInfoDto?: {
            mainImageUrl?: string;
            mainThumbnailUrl?: string;
            titleKor?: string;
            titleOrigin?: string;
            status?: string;
            dayOfWeek?: string;
            airTime?: string;
            synopsis?: string;
            genre?: string;
            medium?: string;
            seasonDtos?: Array<{ year?: number; seasonType?: string }>;
            corp?: string;
            director?: string;
            author?: string;
            premiereDateTime?: string;
            minAge?: number;
            officalSite?: string;
            ottDtos?: Array<{ ottType: string; watchUrl?: string }>;
          };
          castPreviews?: unknown[];
        };
        const animeInfo = dataTyped.animeInfoDto;
        const castPreviews = dataTyped.castPreviews || [];
        
        // 디버깅: API 응답 구조 확인
        
        // 이미지 매핑 - 각각 다른 용도로 사용
        // mainImageUrl: 전체 큰 배경 이미지용 (고화질)
        // mainThumbnailUrl: 오른쪽 포스터 이미지용 (중간 화질)
        const backgroundImageUrl = animeInfo?.mainImageUrl || "/banners/duckstar-logo.svg";
        const posterImageUrl = animeInfo?.mainThumbnailUrl || animeInfo?.mainImageUrl || "/banners/duckstar-logo.svg";
        
        // 썸네일 URL 생성 (저화질 버전) - 실제로는 mainThumbnailUrl을 썸네일로 사용
        const thumbnailImageUrl = animeInfo?.mainThumbnailUrl || "/banners/duckstar-logo.svg";
        const thumbnailPosterUrl = animeInfo?.mainThumbnailUrl || "/banners/duckstar-logo.svg";
        
        
        
        const animeDetail: AnimeDetailDto = {
          animeId: parseInt(animeId),
          mainThumbnailUrl: posterImageUrl, // 포스터용 이미지
          mainImageUrl: backgroundImageUrl, // 배경용 이미지
          thumbnailImageUrl: thumbnailImageUrl, // 배경용 썸네일
          thumbnailPosterUrl: thumbnailPosterUrl, // 포스터용 썸네일
          titleKor: animeInfo?.titleKor || "제목 없음",
          titleJpn: animeInfo?.titleOrigin || "제목 없음",
          status: (animeInfo?.status as "UPCOMING" | "NOW_SHOWING" | "COOLING" | "ENDED") || "UPCOMING",
          dayOfWeek: (animeInfo?.dayOfWeek as "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN" | "SPECIAL" | "NONE") || "NONE",
          scheduledAt: animeInfo?.airTime || new Date().toISOString(),
          genre: animeInfo?.genre || "장르 없음",
          medium: (animeInfo?.medium as "SPECIAL" | "TVA" | "MOVIE" | "OVA") || "TVA",
          year: animeInfo?.seasonDtos?.[0]?.year || 2025,
          quarter: animeInfo?.seasonDtos?.[0]?.seasonType === "SPRING" ? 2 : 
                   animeInfo?.seasonDtos?.[0]?.seasonType === "SUMMER" ? 3 :
                   animeInfo?.seasonDtos?.[0]?.seasonType === "AUTUMN" ? 4 :
                   animeInfo?.seasonDtos?.[0]?.seasonType === "WINTER" ? 1 : 2,
          seasons: animeInfo?.seasonDtos || [], // 모든 시즌 정보 저장
          studio: animeInfo?.corp || "",
          director: animeInfo?.director || "",
          source: animeInfo?.author || "",
          synopsis: animeInfo?.synopsis || undefined,
          startDate: animeInfo?.premiereDateTime ? new Date(animeInfo.premiereDateTime).toLocaleDateString('ko-KR') : "",
          rating: animeInfo?.minAge ? `${animeInfo.minAge}세 이상` : "",
          officialSite: animeInfo?.officalSite || undefined,
          ottDtos: animeInfo?.ottDtos?.map((ott: { ottType: string; watchUrl?: string }) => ({
            ottType: ott.ottType,
            watchUrl: ott.watchUrl
          })) || []
        };
        
        setAnime(animeDetail);
        
        // 캐릭터 데이터 변환
        const mapCastPreviewsToCharacters = (castPreviews: unknown[]): CharacterData[] => {
          if (!castPreviews || !Array.isArray(castPreviews)) {
            return [];
          }

          return castPreviews.map((cast, index) => {
            const castData = cast as Record<string, unknown>;
            return {
              characterId: (castData.characterId as number) || index + 1,
              nameKor: (castData.nameKor as string) || '이름 없음',
              nameJpn: (castData.nameJpn as string),
              nameEng: (castData.nameEng as string),
              imageUrl: (castData.mainThumbnailUrl as string), // API에서 mainThumbnailUrl 사용
              description: (castData.description as string),
              voiceActor: (castData.cv as string) || '미정', // API에서 cv 사용
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
        
        const characterData = mapCastPreviewsToCharacters(castPreviews);
        setCharacters(characterData);
        
        
        // 애니메이션 상세 이미지 프리로딩 (비동기로 처리하여 로딩 속도 향상)
        setTimeout(() => {
          preloadAnimeDetails(animeDetail);
        }, 0);
      } catch (error) {
        setError('애니메이션 정보를 불러오는데 실패했습니다.');
        // 에러 시 mock 데이터 제거
        setAnime(null);
      } finally {
        setLoading(false);
        isLoadingRef.current = false;
      }
    };

    if (animeId) {
      fetchAnimeData();
    }

    // cleanup 함수: 컴포넌트 언마운트 시 스크롤 복원
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [animeId]); // animeId가 변경될 때만 실행

  if (loading) {
    return (
      <div className="w-full" style={{ backgroundColor: '#F8F9FA' }}>
        <div className="w-full flex justify-center">
          <div className="max-w-7xl w-auto flex">
            {/* 왼쪽 영역: 스켈레톤 로딩 */}
            <div className="fixed top-[90px] z-10" style={{ width: '584px', left: 'calc(50% - 511px)' }}>
              <div className="bg-white rounded-2xl shadow-lg animate-pulse" style={{ minHeight: 'calc(100vh - 120px)' }}>
                {/* 메인 이미지 스켈레톤 */}
                <div className="h-[300px] bg-gradient-to-r from-gray-200 to-gray-300 rounded-t-2xl"></div>
                
                {/* 정보 영역 스켈레톤 */}
                <div className="p-6 space-y-3">
                  {/* 제목 영역 */}
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  
                  {/* 탭 영역 스켈레톤 */}
                  <div className="flex gap-4 mt-4">
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                    <div className="h-8 bg-gray-200 rounded w-20"></div>
                    <div className="h-8 bg-gray-200 rounded w-18"></div>
                  </div>
                  
                  {/* 컨텐츠 영역 스켈레톤 - 간소화 */}
                  <div className="space-y-2 mt-4">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                  </div>
                  
                  {/* 추가 정보 영역 */}
                  <div className="space-y-2 mt-4">
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 오른쪽 영역: 스켈레톤 로딩 */}
            <div className="ml-[612px]" style={{ width: '610px' }}>
              <div className="bg-white border-l border-r border-gray-300 animate-pulse" style={{ minHeight: 'calc(100vh - 60px)' }}>
                {/* 에피소드 섹션 스켈레톤 */}
                <div className="flex justify-center pt-7 pb-1">
                  <div className="w-[534px] h-[200px] bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg"></div>
                </div>
                
                {/* 댓글 헤더 스켈레톤 */}
                <div className="sticky top-[60px] z-20 bg-white px-6 py-4">
                  <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                </div>
                
                {/* 댓글 작성 폼 스켈레톤 */}
                <div className="px-6 py-4">
                  <div className="bg-gray-100 rounded-lg p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-20 bg-gray-200 rounded"></div>
                    <div className="flex justify-end">
                      <div className="h-8 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                </div>
                
                {/* 댓글 목록 스켈레톤 */}
                <div className="px-6 space-y-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                      </div>
                      <div className="space-y-2 ml-11">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 뒤로가기 핸들러 (search 화면으로만 스크롤 복원)
  const handleBack = () => {
    console.log('🔙 handleBack 함수 호출됨');
    navigateBackToSearch();
  };

  return (
    <div className="w-full" style={{ backgroundColor: '#F8F9FA' }}>
      <div className="w-full flex justify-center">
        <div className="max-w-7xl w-auto flex">
          {/* 왼쪽 영역: fixed 고정 */}
          <div className="fixed top-[90px] z-10" style={{ width: '584px', left: 'calc(50% - 511px)' }}>
            {/* LeftInfoPanel */}
            <LeftInfoPanel 
              anime={anime} 
              onBack={handleBack} 
              characters={characters}
              onImageModalToggle={setIsImageModalOpen}
            />
          </div>
          
          {/* 오른쪽 영역 */}
          <div className="flex-1 ml-[612px]">
            <RightCommentPanel 
              animeId={parseInt(animeId)} 
              isImageModalOpen={isImageModalOpen}
              animeData={anime} // 애니메이션 데이터 전달
              rawAnimeData={rawAnimeData} // 백엔드 원본 데이터 전달
            />
          </div>
        </div>
      </div>
    </div>
  );
}
