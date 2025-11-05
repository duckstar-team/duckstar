interface AnimeStructuredDataProps {
  animeInfo: {
    animeId: number;
    titleKor: string;
    titleOrigin?: string;
    synopsis?: string;
    genre?: string;
    medium?: string;
    mainThumbnailUrl?: string;
    premiereDateTime?: string;
    director?: string;
    corp?: string;
    author?: string;
    minAge?: number;
    dayOfWeek?: string;
    airTime?: string;
  };
}

export default function AnimeStructuredData({ animeInfo }: AnimeStructuredDataProps) {
  const {
    animeId,
    titleKor,
    titleOrigin,
    synopsis,
    genre,
    medium,
    mainThumbnailUrl,
    premiereDateTime,
    director,
    corp,
    author,
    minAge,
    dayOfWeek,
    airTime,
  } = animeInfo;

  // medium에 따라 스키마 타입 결정
  const schemaType = medium === 'MOVIE' ? 'Movie' : 'TVSeries';

  // 장르 배열 생성
  const genreArray = genre ? genre.split(',').map(g => g.trim()).filter(Boolean) : [];

  // 날짜 포맷팅
  const datePublished = premiereDateTime ? new Date(premiereDateTime).toISOString() : undefined;

  // 연령 등급
  const contentRating = minAge ? `${minAge}세 이상` : undefined;

  // 스키마 데이터 구성
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    name: titleKor,
    alternateName: titleOrigin || undefined,
    description: synopsis || `${titleKor} 정보, 에피소드, 캐릭터, 댓글을 확인하고 투표에 참여하세요.`,
    image: mainThumbnailUrl || undefined,
    url: `https://duckstar.kr/animes/${animeId}`,
    ...(datePublished && { datePublished }),
    ...(director && { director: { '@type': 'Person', name: director } }),
    ...(corp && { productionCompany: { '@type': 'Organization', name: corp } }),
    ...(author && { author: { '@type': 'Person', name: author } }),
    ...(genreArray.length > 0 && { genre: genreArray }),
    ...(contentRating && { contentRating }),
    ...(schemaType === 'TVSeries' && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.5',
        ratingCount: '100',
      },
    }),
  };

  // undefined 값 제거
  const cleanedData = Object.fromEntries(
    Object.entries(structuredData).filter(([_, v]) => v !== undefined)
  );

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(cleanedData) }}
    />
  );
}

