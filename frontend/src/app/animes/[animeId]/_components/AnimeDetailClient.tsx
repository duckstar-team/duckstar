'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import LeftInfoPanel from './LeftInfoPanel';
import RightCommentPanel from './RightCommentPanel';
import { AnimeDetailSkeleton } from '@/components/skeletons';
import { getAnimeDetail } from '@/api/search';
import { useImagePreloading } from '@/hooks/useImagePreloading';
import { useAuth } from '@/context/AuthContext';
import { updateAnimeImage } from '@/api/admin';
import { Schemas } from '@/types';

export default function AnimeDetailClient() {
  const params = useParams();
  const router = useRouter();
  const animeId = params.animeId as string;
  const [anime, setAnime] = useState<Schemas['AnimeInfoDto'] | null>(null);
  const [characters, setCharacters] = useState<Schemas['CastPreviewDto'][]>([]);
  const [episodes, setEpisodes] = useState<Schemas['EpisodeDto'][]>([]);
  const [loading, setLoading] = useState(true);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const isLoadingRef = useRef(false); // 중복 호출 방지용
  const prevAnimeIdRef = useRef<string | null>(null); // 이전 animeId 추적

  // 관리자 인증 및 이미지 수정 관련 상태
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const [leftPanelPosition, setLeftPanelPosition] = useState({
    left: 0,
    width: 584,
  });

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

        // 실제 API 호출 (병렬 처리로 성능 최적화)
        const data = (await Promise.race([
          getAnimeDetail(parseInt(animeId)),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), 10000)
          ),
        ])) as Schemas['AnimeHomeDto'];

        setAnime(data.animeInfoDto);
        setCharacters(data.castPreviews);
        setEpisodes(data.episodeResponseDtos);
        // 애니메이션 상세 이미지 프리로딩 (비동기로 처리하여 로딩 속도 향상)
        setTimeout(() => {
          if (data.animeInfoDto.mainThumbnailUrl) {
            preloadAnimeDetails(data.animeInfoDto);
          }
        }, 0);
      } catch (error) {
        setAnime(null);
        setCharacters([]);
        setEpisodes([]);
      } finally {
        setLoading(false);
        isLoadingRef.current = false;
      }
    };

    if (animeId) {
      fetchAnimeData();
    }
  }, [animeId]);

  // LeftInfoPanel 위치 계산
  useEffect(() => {
    const updateLeftPanelPosition = () => {
      if (leftPanelRef.current) {
        const rect = leftPanelRef.current.getBoundingClientRect();
        setLeftPanelPosition({
          left: rect.left,
          width: rect.width,
        });
      }
    };

    updateLeftPanelPosition();
    window.addEventListener('resize', updateLeftPanelPosition);
    window.addEventListener('scroll', updateLeftPanelPosition, {
      passive: true,
    });

    return () => {
      window.removeEventListener('resize', updateLeftPanelPosition);
      window.removeEventListener('scroll', updateLeftPanelPosition);
    };
  }, [anime]);

  if (loading) {
    return <AnimeDetailSkeleton />;
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
      className="w-full max-w-full overflow-hidden"
      style={{ minHeight: 'calc(100vh - 60px)' }}
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
            {/* 왼쪽 영역: 반응형 너비 - fixed로 고정 */}
            <div
              ref={leftPanelRef}
              className="max-w-[584px] min-w-0 flex-1 pt-[30px]"
            >
              {/* 공간 유지를 위한 플레이스홀더 */}
              <div className="invisible">
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
              {/* 실제 고정된 패널 */}
              <div
                className="fixed z-10"
                style={{
                  top: '60px',
                  left: `${leftPanelPosition.left}px`,
                  width: `${leftPanelPosition.width}px`,
                }}
              >
                <div className="pt-[30px]">
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
              </div>
            </div>

            {/* 오른쪽 영역 */}
            <div className="w-full max-w-[610px] min-w-0 flex-1 xl:w-[610px] xl:flex-none">
              <RightCommentPanel
                animeId={parseInt(animeId)}
                isImageModalOpen={isImageModalOpen}
                animeData={anime}
                episodes={episodes}
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
                episodes={episodes || []}
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
            episodes={episodes || []}
          />
        </div>
      </div>
    </main>
  );
}
