import { Metadata } from 'next';
import AnimeDetailClient from './AnimeDetailClient';
import { getAnimeDetail } from '@/api/search';
import AnimeStructuredData from '@/components/seo/AnimeStructuredData';
import { getAnimeOgImageUrl } from '@/lib/ogImage';

// SEO를 위한 동적 메타데이터 생성 (서버 사이드에서만 실행)
export async function generateMetadata({
  params,
}: {
  params: Promise<{ animeId: string }>;
}): Promise<Metadata> {
  try {
    const { animeId } = await params;
    const data = await getAnimeDetail(parseInt(animeId));
    const animeInfo = data?.animeInfoDto;
    const titleKor = animeInfo?.titleKor || '애니메이션';
    const synopsis = animeInfo?.synopsis || '';
    const genre = animeInfo?.genre || '';

    // 키노라이츠 스타일의 설명 생성
    const createDescription = (
      title: string,
      synopsis: string,
      genre: string
    ) => {
      if (synopsis && synopsis.trim().length > 20) {
        // 시놉시스가 있으면 150자까지 잘라서 사용
        const truncatedSynopsis =
          synopsis.length > 150 ? synopsis.substring(0, 150) + '...' : synopsis;
        return truncatedSynopsis;
      }

      // 시놉시스가 없으면 장르와 기본 정보로 설명 생성
      if (genre && genre.trim()) {
        return `${title} (${genre}) 정보, 에피소드, 캐릭터, 댓글을 확인하고 투표에 참여하세요.`;
      }

      // 기본 설명
      return `${title} 정보, 에피소드, 캐릭터, 댓글을 확인하고 투표에 참여하세요.`;
    };

    const description = createDescription(titleKor, synopsis, genre);

    // OG 이미지 URL 생성 (WebP를 JPG로 변환)
    const ogImageUrl = getAnimeOgImageUrl(animeInfo?.mainThumbnailUrl);

    return {
      title: `${titleKor} 다시보기`,
      description: description,
      keywords: `${titleKor}, 애니메이션, 다시보기, 덕스타, 투표, 에피소드, 캐릭터, ${animeInfo?.genre || ''}`,
      openGraph: {
        title: `${titleKor} 다시보기`,
        description: description,
        url: `https://duckstar.kr/animes/${animeId}`,
        siteName: '덕스타',
        type: 'website',
        locale: 'ko_KR',
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: `${titleKor} 포스터`,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${titleKor} 다시보기`,
        description: description,
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: `${titleKor} 포스터`,
          },
        ],
      },
      // 추가 SEO 메타데이터
      alternates: {
        canonical: `https://duckstar.kr/animes/${animeId}`,
      },
    };
  } catch (error) {
    return {
      title: '애니메이션 다시보기',
      description:
        '애니메이션 정보, 에피소드, 캐릭터, 댓글을 확인하고 투표에 참여하세요.',
    };
  }
}

export default async function AnimeDetailPage({
  params,
}: {
  params: Promise<{ animeId: string }>;
}) {
  const { animeId } = await params;
  let animeInfo = null;

  try {
    const data = await getAnimeDetail(parseInt(animeId));
    animeInfo = data?.animeInfoDto;
  } catch (error) {
    // 에러 발생 시 structured data 없이 렌더링
  }

  return (
    <>
      {animeInfo && (
        <AnimeStructuredData
          animeInfo={{
            animeId: parseInt(animeId),
            titleKor: animeInfo.titleKor || '애니메이션',
            titleOrigin: animeInfo.titleOrigin,
            synopsis: animeInfo.synopsis || '',
            genre: animeInfo.genre,
            medium: animeInfo.medium,
            mainThumbnailUrl: animeInfo.mainThumbnailUrl,
            premiereDateTime: animeInfo.premiereDateTime,
            director: animeInfo.director,
            corp: animeInfo.corp,
            author: animeInfo.author,
            minAge: animeInfo.minAge,
            dayOfWeek: animeInfo.dayOfWeek,
            airTime: animeInfo.airTime || '',
          }}
        />
      )}
      <AnimeDetailClient />
    </>
  );
}
