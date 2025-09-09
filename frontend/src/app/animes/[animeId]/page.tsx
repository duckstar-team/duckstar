import { Metadata } from 'next';
import AnimeDetailClient from './AnimeDetailClient';
import { getAnimeDetail } from '@/api/search';

// SEO를 위한 동적 메타데이터 생성 (서버 사이드에서만 실행)
export async function generateMetadata({ params }: { params: { animeId: string } }): Promise<Metadata> {
  try {
    const data = await getAnimeDetail(parseInt(params.animeId));
    const animeInfo = data?.animeInfoDto;
    const titleKor = animeInfo?.titleKor || '애니메이션';
    const synopsis = animeInfo?.synopsis || '';
    const genre = animeInfo?.genre || '';
    
    // 키노라이츠 스타일의 설명 생성
    const createDescription = (title: string, synopsis: string, genre: string) => {
      if (synopsis && synopsis.trim().length > 20) {
        // 시놉시스가 있으면 150자까지 잘라서 사용
        const truncatedSynopsis = synopsis.length > 150 
          ? synopsis.substring(0, 150) + '...' 
          : synopsis;
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
    
    return {
      title: `${titleKor} 다시보기`,
      description: description,
      keywords: `${titleKor}, 애니메이션, 다시보기, 덕스타, 투표, 에피소드, 캐릭터, ${animeInfo?.genre || ''}`,
      openGraph: {
        title: `${titleKor} 다시보기`,
        description: description,
        images: [animeInfo?.mainThumbnailUrl || '/icons/favicon.svg'],
        type: 'website',
        siteName: '덕스타',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${titleKor} 다시보기`,
        description: description,
        images: [animeInfo?.mainThumbnailUrl || '/icons/favicon.svg'],
      },
      // 추가 SEO 메타데이터
      alternates: {
        canonical: `https://duckstar.kr/animes/${params.animeId}`,
      },
    };
  } catch (error) {
    return {
      title: '애니메이션 다시보기',
      description: '애니메이션 정보, 에피소드, 캐릭터, 댓글을 확인하고 투표에 참여하세요.',
    };
  }
}

export default function AnimeDetailPage() {
  return <AnimeDetailClient />;
}