'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import LeftInfoPanel from '@/components/anime/LeftInfoPanel';
import RightCommentPanel from '@/components/anime/RightCommentPanel';
import { getAnimeDetail } from '@/api/search';
import { useImagePreloading } from '@/hooks/useImagePreloading';
import { CharacterData } from '@/components/anime/CharacterCard';
import { useAuth } from '@/context/AuthContext';
import { updateAnimeImage } from '@/api/client';

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
  
  // 관리자 인증 및 이미지 수정 관련 상태
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 캐시된 데이터 확인
  const [cachedData, setCachedData] = useState<{ anime: AnimeDetailDto; characters: CharacterData[] } | null>(null);
  
  // 이미지 프리로딩 훅
  const { preloadAnimeDetails } = useImagePreloading();
  
  // 브라우저 기본 동작 사용 (커스텀 플래그 제거)
  
  // 관리자 권한 체크
  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      setIsAdmin(true);
    }
  }, [user]);
  
  // 이미지 수정 핸들러
  const handleImageEdit = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      setIsEditingImage(true);
    }
  };
  
  const handleImageUpdate = async () => {
    if (!imageFile || !anime) return;
    
    setIsUploading(true);
    
    try {
      // 파일 크기 재검증 (20MB)
      if (imageFile.size > 20 * 1024 * 1024) {
        alert('파일 크기는 20MB를 초과할 수 없습니다.');
        return;
      }
      
      // 파일 타입 재검증
      if (!imageFile.type.startsWith('image/')) {
        alert('이미지 파일만 업로드할 수 있습니다.');
        return;
      }
      
      await updateAnimeImage(parseInt(animeId), imageFile);
      
        // 성공 시 애니메이션 데이터 새로고침
        const updatedData = await getAnimeDetail(parseInt(animeId));
        if (updatedData && typeof updatedData === 'object' && 'animeInfoDto' in updatedData) {
          setAnime((updatedData as any).animeInfoDto);
          setRawAnimeData(updatedData);
        }
      
      setIsEditingImage(false);
      setImageFile(null);
      alert('이미지가 성공적으로 업데이트되었습니다!');
    } catch (error: any) {
      console.error('이미지 업데이트 실패:', error);
      
      // 구체적인 에러 메시지 표시
      let errorMessage = '이미지 업데이트에 실패했습니다.';
      
      if (error.message) {
        if (error.message.includes('413')) {
          errorMessage = '파일 크기가 너무 큽니다. 20MB 이하의 파일을 선택해주세요.';
        } else if (error.message.includes('400')) {
          errorMessage = '지원하지 않는 파일 형식입니다. JPG, PNG, GIF, WebP 파일만 업로드 가능합니다.';
        } else if (error.message.includes('500')) {
          errorMessage = '서버에서 이미지 처리 중 오류가 발생했습니다. 다른 이미지를 시도해주세요.';
        } else if (error.message.includes('timeout')) {
          errorMessage = '업로드 시간이 초과되었습니다. 파일 크기를 줄이거나 다시 시도해주세요.';
        } else {
          errorMessage = `업로드 실패: ${error.message}`;
        }
      }
      
      alert(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleImageEditCancel = () => {
    setIsEditingImage(false);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  
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
    const fromAnimeDetail = sessionStorage.getItem('from-anime-detail');
    
    // 애니메이션 상세화면에서 돌아오는 경우가 아닐 때만 스크롤 탑으로 이동
    if (toAnimeDetail === 'true' && fromAnimeDetail !== 'true') {
      
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
      
      // to-anime-detail 플래그 정리
      sessionStorage.removeItem('to-anime-detail');
      
      // vote-result-scroll이 있으면 투표 결과 화면에서 온 것으로 판단
      const voteResultScroll = sessionStorage.getItem('vote-result-scroll');
      if (voteResultScroll) {
        sessionStorage.setItem('to-vote-result', 'true');
      }
    } else {
      // to-anime-detail 플래그가 없어도 정리
      sessionStorage.removeItem('to-anime-detail');
    }
  }, []);

  useEffect(() => {
    // 애니메이션 상세화면에서 돌아오는 경우가 아닐 때만 스크롤 탑으로 이동
    const fromAnimeDetail = sessionStorage.getItem('from-anime-detail');
    if (fromAnimeDetail !== 'true') {
      // 애니메이션 상세화면 진입 시 스크롤을 맨 위로 강제 이동
      window.scrollTo(0, 0);
    }
    
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
           seasons: animeInfo?.seasonDtos?.map((season: any) => ({
             year: season.year || 0,
             seasonType: season.seasonType || 'SPRING'
           })) || [], // 모든 시즌 정보 저장
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
               gender: (castData.gender as 'FEMALE' | 'MALE' | 'OTHER' | undefined) || (index % 2 === 0 ? 'FEMALE' : 'MALE'),
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
      <main className="w-full overflow-x-hidden overflow-y-visible max-w-full" style={{ backgroundColor: '#F8F9FA', minHeight: 'calc(100vh - 60px)' }}>
        {/* 데스크톱 스켈레톤 - 1280px 이상 */}
        <div className="hidden xl:block w-full">
          <div className="w-full px-4">
            <div className="max-w-7xl mx-auto flex gap-4">
              {/* 왼쪽 영역: 스켈레톤 로딩 */}
              <div className="flex-1 max-w-[584px] min-w-0">
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
              <div className="flex-1 max-w-[610px] min-w-0 w-full">
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

        {/* 중간 레이아웃 스켈레톤 - 1024px~1279px (left panel 584px 고정) */}
        <div className="hidden lg:block xl:hidden w-full">
          <div className="w-full px-4">
            <div className="max-w-7xl mx-auto">
              <div className="pt-[30px] max-w-[584px] mx-auto">
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
            </div>
          </div>
        </div>

        {/* 모바일 스켈레톤 - 1024px 미만 (right panel 숨김) */}
        <div className="lg:hidden w-full">
          <div className="w-full px-1">
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
        </div>
      </main>
    );
  }

  // 뒤로가기 핸들러 - 브라우저 뒤로가기와 정확히 일치
  const handleBack = () => {
    // 브라우저의 뒤로가기와 정확히 동일한 동작
    // 커스텀 스크롤 복원 로직을 비활성화하고 브라우저 기본 동작 사용
    sessionStorage.removeItem('from-anime-detail');
    sessionStorage.removeItem('scroll-search-return');
    router.back();
  };

  return (
    <main className="w-full overflow-x-hidden overflow-y-visible max-w-full" style={{ backgroundColor: '#F8F9FA', minHeight: 'calc(100vh - 60px)' }}>
      {/* 숨겨진 파일 입력 필드 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageFileChange}
        className="hidden"
      />
      
      {/* 데스크톱 레이아웃 - 1280px 이상 */}
      <div className="hidden xl:block w-full">
        <div className="w-full px-4">
          <div className="max-w-7xl mx-auto flex gap-7 justify-center">
            {/* 왼쪽 영역: 반응형 너비 */}
            <div className="flex-1 pt-[30px] max-w-[584px] min-w-0">
              <LeftInfoPanel 
                anime={anime!} 
                onBack={handleBack} 
                characters={characters}
                onImageModalToggle={setIsImageModalOpen}
                isAdmin={isAdmin}
                onImageEdit={handleImageEdit}
                isEditingImage={isEditingImage}
                imageFile={imageFile}
                onImageUpdate={handleImageUpdate}
                onImageEditCancel={handleImageEditCancel}
                isUploading={isUploading}
                isMobile={false}
              />
            </div>
            
            {/* 오른쪽 영역 */}
            <div className="flex-1 max-w-[610px] min-w-0 w-full xl:w-[610px] xl:flex-none">
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

      {/* 중간 레이아웃 - 1024px~1279px (댓글 패널을 왼쪽 아래에 배치) */}
      <div className="hidden lg:block xl:hidden w-full">
        <div className="w-full px-4">
          <div className="max-w-7xl mx-auto">
            {/* 왼쪽 영역 */}
            <div className="pt-[30px] max-w-[584px] mx-auto">
              <LeftInfoPanel 
                anime={anime!} 
                onBack={handleBack} 
                characters={characters}
                onImageModalToggle={setIsImageModalOpen}
                isAdmin={isAdmin}
                onImageEdit={handleImageEdit}
                isEditingImage={isEditingImage}
                imageFile={imageFile}
                onImageUpdate={handleImageUpdate}
                onImageEditCancel={handleImageEditCancel}
                isUploading={isUploading}
                isMobile={false}
                animeId={parseInt(animeId)}
                rawAnimeData={rawAnimeData}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 모바일 레이아웃 */}
      <div className="lg:hidden w-full">
        <div className="w-full px-1">
          {/* 모바일용 LeftInfoPanel */}
          <LeftInfoPanel 
            anime={anime!} 
            onBack={handleBack} 
            characters={characters}
            onImageModalToggle={setIsImageModalOpen}
            isAdmin={isAdmin}
            onImageEdit={handleImageEdit}
            isEditingImage={isEditingImage}
            imageFile={imageFile}
            onImageUpdate={handleImageUpdate}
            onImageEditCancel={handleImageEditCancel}
            isUploading={isUploading}
            isMobile={true}
            animeId={parseInt(animeId)}
            rawAnimeData={rawAnimeData}
          />
        </div>
      </div>
    </main>
  );
}
