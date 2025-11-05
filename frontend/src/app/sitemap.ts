import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://duckstar.kr';

interface ApiResponse<T> {
  isSuccess: boolean;
  code: string;
  message: string;
  result: T;
}

// 애니메이션 목록을 가져오는 함수
async function getAllAnimeIds(): Promise<number[]> {
  try {
    const response = await fetch(`${BASE_URL}/api/v1/animes/ids`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // sitemap은 항상 최신 데이터를 가져와야 함
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const apiResponse: ApiResponse<number[]> = await response.json();
    
    if (!apiResponse.isSuccess) {
      throw new Error(apiResponse.message);
    }

    return apiResponse.result;
  } catch (error) {
    console.error('애니메이션 목록 가져오기 실패:', error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://duckstar.kr';
  
  // 정적 페이지
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/vote`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/chart`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];

  // 동적 페이지: 애니메이션 상세 페이지
  try {
    const animeIds = await getAllAnimeIds();
    const animePages: MetadataRoute.Sitemap = animeIds.map((animeId) => ({
      url: `${baseUrl}/animes/${animeId}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    return [...staticPages, ...animePages];
  } catch (error) {
    console.error('Sitemap 생성 실패:', error);
    // 에러 발생 시 정적 페이지만 반환
    return staticPages;
  }
}

