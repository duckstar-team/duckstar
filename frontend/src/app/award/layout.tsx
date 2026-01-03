import React from 'react';
import { OG_LOGO_URL } from '@/lib';
import { Metadata } from 'next';
import AwardHeader from './_components/AwardHeader';

export const metadata: Metadata = {
  title: '애니메이션 어워드 - 덕스타',
  description:
    '애니메이션 어워드에서 최고의 애니메이션에 투표하고, 어워드 결과를 확인하세요.',
  keywords:
    '애니메이션 어워드, 애니메이션 순위, 덕스타 어워드, 분기 애니메이션 어워드',
  openGraph: {
    title: '애니메이션 어워드 - 덕스타',
    description:
      '애니메이션 어워드에서 최고의 애니메이션에 투표하고, 어워드 결과를 확인하세요.',
    url: 'https://duckstar.kr/award',
    siteName: '덕스타',
    type: 'website',
    images: [
      {
        url: OG_LOGO_URL,
        width: 1200,
        height: 630,
        alt: '덕스타 - 애니메이션 투표',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '애니메이션 어워드 - 덕스타',
    description: '애니메이션 투표에 참여하고 주차별 순위를 확인하세요',
    images: [OG_LOGO_URL],
  },
  alternates: {
    canonical: 'https://duckstar.kr/award',
  },
};

export default function AwardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AwardHeader />
      <div className="pb-20">{children}</div>
    </>
  );
}
