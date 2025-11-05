import { Metadata } from 'next';
import { getOgLogoUrl } from '@/lib/logoImages';

export const metadata: Metadata = {
  title: '애니메이션 차트 - 덕스타',
  description: '주차별 애니메이션 순위 차트를 확인하세요. 한국 순위, 해외 순위(AniLab, Anime Corner)를 한눈에 비교할 수 있습니다.',
  keywords: '애니메이션 차트, 애니메이션 순위, 주차별 차트, 덕스타 차트, AniLab, Anime Corner',
  openGraph: {
    title: '애니메이션 차트 - 덕스타',
    description: '주차별 애니메이션 순위 차트를 확인하세요. 한국 순위, 해외 순위(AniLab, Anime Corner)를 한눈에 비교할 수 있습니다.',
    url: 'https://duckstar.kr/chart',
    siteName: '덕스타',
    type: 'website',
    images: [
      {
        url: getOgLogoUrl('jpg'),
        width: 1200,
        height: 630,
        alt: '덕스타 - 애니메이션 차트',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '애니메이션 차트 - 덕스타',
    description: '주차별 애니메이션 순위 차트를 확인하세요',
    images: [getOgLogoUrl('jpg')],
  },
  alternates: {
    canonical: 'https://duckstar.kr/chart',
  },
};

export default function ChartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

