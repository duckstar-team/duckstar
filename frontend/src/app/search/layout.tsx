import { Metadata } from 'next';
import { OG_LOGO_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: '애니메이션 검색 - 덕스타',
  description:
    '애니메이션 검색 및 편성표 확인. 분기별 애니메이션 정보, 요일별 편성표, 곧 시작하는 애니메이션을 확인하세요.',
  keywords:
    '애니메이션 검색, 편성표, 분기 애니메이션, 애니메이션 스케줄, 덕스타',
  openGraph: {
    title: '애니메이션 검색 - 덕스타',
    description:
      '애니메이션 검색 및 편성표 확인. 분기별 애니메이션 정보, 요일별 편성표, 곧 시작하는 애니메이션을 확인하세요.',
    url: 'https://duckstar.kr/search',
    siteName: '덕스타',
    type: 'website',
    images: [
      {
        url: OG_LOGO_URL,
        width: 1200,
        height: 630,
        alt: '덕스타 - 애니메이션 검색',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '애니메이션 검색 - 덕스타',
    description: '애니메이션 검색 및 편성표 확인',
    images: [OG_LOGO_URL],
  },
  alternates: {
    canonical: 'https://duckstar.kr/search',
  },
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
