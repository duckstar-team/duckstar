'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
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
  studio?: string;
  director?: string;
  source?: string;
  startDate?: string;
  rating?: string;
  synopsis?: string;
  officialSite?: string | Record<string, string>; // 문자열 또는 객체
  ottDtos: OttDto[];
}

// 임시 애니메이션 데이터 (API 실패 시 fallback)
const mockAnimeData: AnimeDetailDto = {
  animeId: 1,
  mainThumbnailUrl: "/banners/duckstar-logo.svg",
  mainImageUrl: "/banners/duckstar-logo.svg",
  titleKor: "노랫소리는 밀푀유",
  titleJpn: "うたごえはミルフィーユ",
  status: "UPCOMING" as const,
  dayOfWeek: "THU" as const,
  scheduledAt: "2025-01-23T21:25:00Z",
  genre: "음악, 아카펠라",
  medium: "TVA" as const,
  year: 2025,
  quarter: 2,
  studio: "쥬몬도",
  director: "사토 타쿠야",
  source: "포니 캐니온",
  startDate: "2025.07.10",
  rating: "12세 이상",
  officialSite: "https://example.com",
  ottDtos: [
    { ottType: "LAFTEL", watchUrl: "https://laftel.net" },
    { ottType: "NETFLIX", watchUrl: "https://netflix.com" }
  ]
};

export default function AnimeDetailClient() {
  const params = useParams();
  const router = useRouter();
  const animeId = params.animeId as string;
  const [anime, setAnime] = useState<AnimeDetailDto>(mockAnimeData);
  const [characters, setCharacters] = useState<CharacterData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 캐시된 데이터 확인
  const [cachedData, setCachedData] = useState<{ anime: AnimeDetailDto; characters: CharacterData[] } | null>(null);
  
  // 이미지 프리로딩 훅
  const { preloadAnimeDetails } = useImagePreloading();
  
  // search 화면으로 돌아가기 (스크롤 복원)
  const navigateBackToSearch = () => {
    console.log('🔙 search 화면으로 돌아가기 - 스크롤 복원');
    
    // 디버깅: 현재 sessionStorage 상태 확인
    console.log('🔍 뒤로가기 클릭 시 sessionStorage 상태:', {
      'to-anime-detail': sessionStorage.getItem('to-anime-detail'),
      'search-scroll': sessionStorage.getItem('search-scroll'),
      'vote-result-scroll': sessionStorage.getItem('vote-result-scroll')
    });
    
    // to-anime-detail 플래그가 있으면 from-anime-detail 플래그 설정
    const toAnimeDetail = sessionStorage.getItem('to-anime-detail');
    if (toAnimeDetail === 'true') {
      sessionStorage.setItem('from-anime-detail', 'true');
      sessionStorage.removeItem('to-anime-detail');
      console.log('🔍 from-anime-detail 플래그 설정 (to-anime-detail 확인됨)');
      
      // vote-result-scroll이 있으면 투표 결과 화면에서 온 것으로 판단
      const voteResultScroll = sessionStorage.getItem('vote-result-scroll');
      if (voteResultScroll) {
        sessionStorage.setItem('to-vote-result', 'true');
        console.log('🔍 투표 결과 화면에서 온 것으로 판단 - to-vote-result 플래그 설정');
      }
    } else {
      console.log('🔍 to-anime-detail 플래그 없음 - 스크롤 복원 안함');
    }
    
    // router.back() 대신 명시적으로 search 화면으로 이동
    router.push('/search');
  };
  
  const [error, setError] = useState<string | null>(null);
  
  // 백그라운드에서 최신 데이터 가져오기
  const fetchLatestData = async () => {
    try {
      const data = await getAnimeDetail(parseInt(animeId));
      // 최신 데이터로 업데이트 (사용자에게는 보이지 않음)
      // 필요시 여기서 상태 업데이트
    } catch (error) {
      // 백그라운드 업데이트 실패는 무시
    }
  };

  // 컴포넌트 마운트 시 스크롤을 맨 위로 강제 이동
  useEffect(() => {
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
    
    console.log('🔝 애니메이션 상세화면 마운트 - 스크롤 맨 위로 강제 이동');
    
    // to-anime-detail 플래그가 있으면 from-anime-detail 플래그 미리 설정
    const toAnimeDetail = sessionStorage.getItem('to-anime-detail');
    if (toAnimeDetail === 'true') {
      sessionStorage.setItem('from-anime-detail', 'true');
      console.log('🔍 애니메이션 상세화면 마운트 시 from-anime-detail 플래그 미리 설정');
      
      // vote-result-scroll이 있으면 투표 결과 화면에서 온 것으로 판단
      const voteResultScroll = sessionStorage.getItem('vote-result-scroll');
      if (voteResultScroll) {
        sessionStorage.setItem('to-vote-result', 'true');
        console.log('🔍 애니메이션 상세화면 마운트 시 투표 결과 화면에서 온 것으로 판단 - to-vote-result 플래그 설정');
      }
    }
  }, []);

  useEffect(() => {
    // 애니메이션 상세화면 진입 시 스크롤을 맨 위로 강제 이동
    window.scrollTo(0, 0);
    console.log('🔝 애니메이션 상세화면 진입 - 스크롤 맨 위로 이동');
    
    const fetchAnimeData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 캐시된 데이터가 있으면 먼저 사용
        const cacheKey = `anime-${animeId}`;
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          try {
            const parsedCache = JSON.parse(cached);
            setAnime(parsedCache.anime);
            setCharacters(parsedCache.characters);
            setLoading(false);
            // 백그라운드에서 최신 데이터 가져오기
            setTimeout(() => fetchLatestData(), 0);
            return;
          } catch (e) {
            // 캐시 파싱 실패 시 무시하고 새로 가져오기
          }
        }
        
        // 실제 API 호출 (병렬 처리로 성능 최적화)
        const data = await Promise.race([
          getAnimeDetail(parseInt(animeId)),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), 10000)
          )
        ]) as unknown;
        
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
        
        // 캐시에 저장
        const cacheData = { anime: animeDetail, characters: characterData };
        sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));
        
        // 애니메이션 상세 이미지 프리로딩 (비동기로 처리하여 로딩 속도 향상)
        setTimeout(() => {
          preloadAnimeDetails(animeDetail);
        }, 0);
      } catch (error) {
        setError('애니메이션 정보를 불러오는데 실패했습니다.');
        // 에러 시 mock 데이터 사용
        setAnime(mockAnimeData);
      } finally {
        setLoading(false);
      }
    };

    if (animeId) {
      fetchAnimeData();
    }

    // cleanup 함수: 컴포넌트 언마운트 시 스크롤 복원
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [animeId]);

  if (loading) {
    return (
      <div className="w-full" style={{ backgroundColor: '#F8F9FA' }}>
        <div className="w-full flex justify-center">
          <div className="max-w-7xl w-auto flex">
            {/* 왼쪽 영역: 스켈레톤 로딩 */}
            <div className="fixed top-[90px] z-10" style={{ width: '584px', left: 'calc(50% - 292px)' }}>
              <div className="bg-white rounded-2xl shadow-lg h-[600px] animate-pulse">
                <div className="h-[300px] bg-gray-200 rounded-t-2xl"></div>
                <div className="p-6 space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            </div>
            
            {/* 오른쪽 영역: 스켈레톤 로딩 */}
            <div className="flex-1 ml-[612px]">
              <div className="bg-white border-l border-r border-gray-300 h-[600px] animate-pulse">
                <div className="p-6 space-y-4">
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 뒤로가기 핸들러 (search 화면으로만 스크롤 복원)
  const handleBack = navigateBackToSearch;

  return (
    <div className="w-full" style={{ backgroundColor: '#F8F9FA' }}>
      <div className="w-full flex justify-center">
        <div className="max-w-7xl w-auto flex">
          {/* 왼쪽 영역: fixed 고정 */}
          <div className="fixed top-[90px] z-10" style={{ width: '584px', left: 'calc(50% - 511px)' }}>
            {/* LeftInfoPanel */}
            <LeftInfoPanel anime={anime} onBack={handleBack} characters={characters} />
          </div>
          
          {/* 오른쪽 영역 */}
          <div className="flex-1 ml-[612px]">
            <RightCommentPanel animeId={parseInt(animeId)} />
          </div>
        </div>
      </div>
    </div>
  );
}
