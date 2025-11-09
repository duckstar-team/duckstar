import { Metadata } from 'next';
import { getOgLogoUrl } from '@/lib/logoImages';

export const metadata: Metadata = {
  title: '애니메이션 투표 - 덕스타',
  description: '애니메이션 투표에 참여하고 주차별 순위를 확인하세요. 분기 신작 애니메이션에 투표하고 결과를 실시간으로 확인할 수 있습니다.',
  keywords: '애니메이션 투표, 애니메이션 순위, 덕스타 투표, 분기 애니메이션 투표',
  openGraph: {
    title: '애니메이션 투표 - 덕스타',
    description: '애니메이션 투표에 참여하고 주차별 순위를 확인하세요. 분기 신작 애니메이션에 투표하고 결과를 실시간으로 확인할 수 있습니다.',
    url: 'https://duckstar.kr/vote',
    siteName: '덕스타',
    type: 'website',
    images: [
      {
        url: getOgLogoUrl(),
        width: 1200,
        height: 630,
        alt: '덕스타 - 애니메이션 투표',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '애니메이션 투표 - 덕스타',
    description: '애니메이션 투표에 참여하고 주차별 순위를 확인하세요',
    images: [getOgLogoUrl()],
  },
  alternates: {
    canonical: 'https://duckstar.kr/vote',
  },
};

export default function VoteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

