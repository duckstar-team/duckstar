import { Metadata } from 'next';
import HomeClient from './_components/HomeClient';
import WebsiteStructuredData from '@/components/seo/WebsiteStructuredData';
import { OG_LOGO_URL } from '@/lib';

export const metadata: Metadata = {
  title: '덕스타 - 애니메이션 투표 플랫폼',
  description:
    '분기 신작 애니메이션 투표 및 차트 서비스. 한국에서 런칭한 애니메이션 투표 플랫폼으로 주차별 순위를 확인하고 투표에 참여하세요.',
  keywords:
    '애니메이션, 투표, 차트, 분기 신작, 덕스타, 애니메이션 순위, 애니메이션 차트',
  openGraph: {
    title: '덕스타 - 애니메이션 투표 플랫폼',
    description:
      '분기 신작 애니메이션 투표 및 차트 서비스. 한국에서 런칭한 애니메이션 투표 플랫폼으로 주차별 순위를 확인하고 투표에 참여하세요.',
    url: 'https://duckstar.kr',
    siteName: '덕스타',
    images: [
      {
        url: OG_LOGO_URL,
        width: 1200,
        height: 630,
        alt: '덕스타 로고',
      },
    ],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '덕스타 - 애니메이션 투표 플랫폼',
    description: '분기 신작 애니메이션 투표 및 차트 서비스',
    images: [OG_LOGO_URL],
  },
  alternates: {
    canonical: 'https://duckstar.kr',
  },
};

export default function Home() {
  return (
    <>
      <WebsiteStructuredData />
      <HomeClient />
    </>
  );
}
