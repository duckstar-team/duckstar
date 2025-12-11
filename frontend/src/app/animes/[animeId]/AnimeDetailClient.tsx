'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import LeftInfoPanel from '@/components/anime/LeftInfoPanel';
import RightCommentPanel from '@/components/anime/RightCommentPanel';
import { getAnimeDetail } from '@/api/search';
import { useImagePreloading } from '@/hooks/useImagePreloading';
import { CharacterData } from '@/components/anime/CharacterCard';
import { useAuth } from '@/context/AuthContext';
import { updateAnimeImage } from '@/api/admin';
import { AnimeInfoDto, AnimePreviewDto } from '@/types';

export default function AnimeDetailClient() {
  const params = useParams();
  const router = useRouter();
  const animeId = params.animeId as string;
  const [anime, setAnime] = useState<AnimeInfoDto | null>(null);
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

  const handleImageFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
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
      if (
        updatedData &&
        typeof updatedData === 'object' &&
        'animeInfoDto' in updatedData
      ) {
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
          errorMessage =
            '파일 크기가 너무 큽니다. 20MB 이하의 파일을 선택해주세요.';
        } else if (error.message.includes('400')) {
          errorMessage =
            '지원하지 않는 파일 형식입니다. JPG, PNG, GIF, WebP 파일만 업로드 가능합니다.';
        } else if (error.message.includes('500')) {
          errorMessage =
            '서버에서 이미지 처리 중 오류가 발생했습니다. 다른 이미지를 시도해주세요.';
        } else if (error.message.includes('timeout')) {
          errorMessage =
            '업로드 시간이 초과되었습니다. 파일 크기를 줄이거나 다시 시도해주세요.';
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
        const data = (await Promise.race([
          getAnimeDetail(parseInt(animeId)),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), 10000)
          ),
        ])) as unknown;

        // 백엔드 원본 데이터 저장
        setRawAnimeData(data);

        // data는 AnimeHomeDto 구조
        const dataTyped = data as {
          animeInfoDto: AnimeInfoDto;
          castPreviews?: unknown[];
        };
        const animeInfo = dataTyped.animeInfoDto;
        const castPreviews = dataTyped.castPreviews || [];

        setAnime(animeInfo);

        // 캐릭터 데이터 변환
        const mapCastPreviewsToCharacters = (
          castPreviews: unknown[]
        ): CharacterData[] => {
          if (!castPreviews || !Array.isArray(castPreviews)) {
            return [];
          }

          return castPreviews.map((cast, index) => {
            const castData = cast as Record<string, unknown>;
            return {
              characterId: (castData.characterId as number) || index + 1,
              nameKor: (castData.nameKor as string) || '이름 없음',
              nameJpn: castData.nameJpn as string,
              nameEng: castData.nameEng as string,
              imageUrl: castData.mainThumbnailUrl as string, // API에서 mainThumbnailUrl 사용
              description: castData.description as string,
              voiceActor: (castData.cv as string) || '미정', // API에서 cv 사용
              role:
                (castData.role as 'MAIN' | 'SUPPORTING' | 'MINOR') ||
                (index < 2 ? 'MAIN' : index < 4 ? 'SUPPORTING' : 'MINOR'),
              gender:
                (castData.gender as 'FEMALE' | 'MALE' | 'OTHER' | undefined) ||
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

        const characterData = mapCastPreviewsToCharacters(castPreviews);
        setCharacters(characterData);

        // 애니메이션 상세 이미지 프리로딩 (비동기로 처리하여 로딩 속도 향상)
        setTimeout(() => {
          preloadAnimeDetails(animeInfo as unknown as AnimePreviewDto);
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
      <main
        className="w-full max-w-full overflow-x-hidden overflow-y-visible"
        style={{ backgroundColor: '#F8F9FA', minHeight: 'calc(100vh - 60px)' }}
      >
        {/* 데스크톱 스켈레톤 - 1280px 이상 */}
        <div className="hidden w-full xl:block">
          <div className="w-full px-4">
            <div className="mx-auto flex max-w-7xl gap-4">
              {/* 왼쪽 영역: 스켈레톤 로딩 */}
              <div className="max-w-[584px] min-w-0 flex-1">
                <div
                  className="animate-pulse rounded-2xl bg-white shadow-lg"
                  style={{ minHeight: 'calc(100vh - 120px)' }}
                >
                  {/* 메인 이미지 스켈레톤 */}
                  <div className="h-[300px] rounded-t-2xl bg-gradient-to-r from-gray-200 to-gray-300"></div>

                  {/* 정보 영역 스켈레톤 */}
                  <div className="space-y-3 p-6">
                    {/* 제목 영역 */}
                    <div className="h-6 w-3/4 rounded bg-gray-200"></div>
                    <div className="h-4 w-1/2 rounded bg-gray-200"></div>

                    {/* 탭 영역 스켈레톤 */}
                    <div className="mt-4 flex gap-4">
                      <div className="h-8 w-16 rounded bg-gray-200"></div>
                      <div className="h-8 w-20 rounded bg-gray-200"></div>
                      <div className="h-8 w-18 rounded bg-gray-200"></div>
                    </div>

                    {/* 컨텐츠 영역 스켈레톤 - 간소화 */}
                    <div className="mt-4 space-y-2">
                      <div className="h-4 rounded bg-gray-200"></div>
                      <div className="h-4 w-5/6 rounded bg-gray-200"></div>
                      <div className="h-4 w-4/6 rounded bg-gray-200"></div>
                    </div>

                    {/* 추가 정보 영역 */}
                    <div className="mt-4 space-y-2">
                      <div className="h-3 w-1/3 rounded bg-gray-200"></div>
                      <div className="h-3 w-1/4 rounded bg-gray-200"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 오른쪽 영역: 스켈레톤 로딩 */}
              <div className="w-full max-w-[610px] min-w-0 flex-1">
                <div
                  className="animate-pulse border-r border-l border-gray-300 bg-white"
                  style={{ minHeight: 'calc(100vh - 60px)' }}
                >
                  {/* 에피소드 섹션 스켈레톤 */}
                  <div className="flex justify-center pt-7 pb-1">
                    <div className="h-[200px] w-[534px] rounded-lg bg-gradient-to-r from-gray-200 to-gray-300"></div>
                  </div>

                  {/* 댓글 헤더 스켈레톤 */}
                  <div className="sticky top-[60px] z-20 bg-white px-6 py-4">
                    <div className="h-6 w-1/3 rounded bg-gray-200"></div>
                  </div>

                  {/* 댓글 작성 폼 스켈레톤 */}
                  <div className="px-6 py-4">
                    <div className="space-y-3 rounded-lg bg-gray-100 p-4">
                      <div className="h-4 w-1/4 rounded bg-gray-200"></div>
                      <div className="h-20 rounded bg-gray-200"></div>
                      <div className="flex justify-end">
                        <div className="h-8 w-16 rounded bg-gray-200"></div>
                      </div>
                    </div>
                  </div>

                  {/* 댓글 목록 스켈레톤 */}
                  <div className="space-y-4 px-6">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gray-200"></div>
                          <div className="h-4 w-20 rounded bg-gray-200"></div>
                          <div className="h-3 w-16 rounded bg-gray-200"></div>
                        </div>
                        <div className="ml-11 space-y-2">
                          <div className="h-4 rounded bg-gray-200"></div>
                          <div className="h-4 w-3/4 rounded bg-gray-200"></div>
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
        <div className="hidden w-full lg:block xl:hidden">
          <div className="w-full px-4">
            <div className="mx-auto max-w-7xl">
              <div className="mx-auto max-w-[584px] pt-[30px]">
                <div
                  className="animate-pulse rounded-2xl bg-white shadow-lg"
                  style={{ minHeight: 'calc(100vh - 120px)' }}
                >
                  {/* 메인 이미지 스켈레톤 */}
                  <div className="h-[300px] rounded-t-2xl bg-gradient-to-r from-gray-200 to-gray-300"></div>

                  {/* 정보 영역 스켈레톤 */}
                  <div className="space-y-3 p-6">
                    {/* 제목 영역 */}
                    <div className="h-6 w-3/4 rounded bg-gray-200"></div>
                    <div className="h-4 w-1/2 rounded bg-gray-200"></div>

                    {/* 탭 영역 스켈레톤 */}
                    <div className="mt-4 flex gap-4">
                      <div className="h-8 w-16 rounded bg-gray-200"></div>
                      <div className="h-8 w-20 rounded bg-gray-200"></div>
                      <div className="h-8 w-18 rounded bg-gray-200"></div>
                    </div>

                    {/* 컨텐츠 영역 스켈레톤 - 간소화 */}
                    <div className="mt-4 space-y-2">
                      <div className="h-4 rounded bg-gray-200"></div>
                      <div className="h-4 w-5/6 rounded bg-gray-200"></div>
                      <div className="h-4 w-4/6 rounded bg-gray-200"></div>
                    </div>

                    {/* 추가 정보 영역 */}
                    <div className="mt-4 space-y-2">
                      <div className="h-3 w-1/3 rounded bg-gray-200"></div>
                      <div className="h-3 w-1/4 rounded bg-gray-200"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 모바일 스켈레톤 - 1024px 미만 (right panel 숨김) */}
        <div className="w-full lg:hidden">
          <div className="w-full px-1">
            <div
              className="animate-pulse rounded-2xl bg-white shadow-lg"
              style={{ minHeight: 'calc(100vh - 120px)' }}
            >
              {/* 메인 이미지 스켈레톤 */}
              <div className="h-[300px] rounded-t-2xl bg-gradient-to-r from-gray-200 to-gray-300"></div>

              {/* 정보 영역 스켈레톤 */}
              <div className="space-y-3 p-6">
                {/* 제목 영역 */}
                <div className="h-6 w-3/4 rounded bg-gray-200"></div>
                <div className="h-4 w-1/2 rounded bg-gray-200"></div>

                {/* 탭 영역 스켈레톤 */}
                <div className="mt-4 flex gap-4">
                  <div className="h-8 w-16 rounded bg-gray-200"></div>
                  <div className="h-8 w-20 rounded bg-gray-200"></div>
                  <div className="h-8 w-18 rounded bg-gray-200"></div>
                </div>

                {/* 컨텐츠 영역 스켈레톤 - 간소화 */}
                <div className="mt-4 space-y-2">
                  <div className="h-4 rounded bg-gray-200"></div>
                  <div className="h-4 w-5/6 rounded bg-gray-200"></div>
                  <div className="h-4 w-4/6 rounded bg-gray-200"></div>
                </div>

                {/* 추가 정보 영역 */}
                <div className="mt-4 space-y-2">
                  <div className="h-3 w-1/3 rounded bg-gray-200"></div>
                  <div className="h-3 w-1/4 rounded bg-gray-200"></div>
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
    <main
      className="w-full max-w-full overflow-x-hidden overflow-y-visible"
      style={{ backgroundColor: '#F8F9FA', minHeight: 'calc(100vh - 60px)' }}
    >
      {/* 숨겨진 파일 입력 필드 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageFileChange}
        className="hidden"
      />

      {/* 데스크톱 레이아웃 - 1280px 이상 */}
      <div className="hidden w-full xl:block">
        <div className="w-full px-4">
          <div className="mx-auto flex max-w-7xl justify-center gap-7">
            {/* 왼쪽 영역: 반응형 너비 */}
            <div className="max-w-[584px] min-w-0 flex-1 pt-[30px]">
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
            <div className="w-full max-w-[610px] min-w-0 flex-1 xl:w-[610px] xl:flex-none">
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
      <div className="hidden w-full lg:block xl:hidden">
        <div className="w-full px-4">
          <div className="mx-auto max-w-7xl">
            {/* 왼쪽 영역 */}
            <div className="mx-auto max-w-[584px] pt-[30px]">
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
      <div className="w-full lg:hidden">
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
