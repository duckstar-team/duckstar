import type { Metadata } from "next";
import localFont from 'next/font/local';
import { Suspense } from 'react';
import Script from 'next/script';
import "./globals.css";
import Footer from '@/components/Footer';
import { AuthProvider } from '@/context/AuthContext';
import QueryProvider from '@/components/providers/QueryProvider';
import MigrationToast from '@/components/common/MigrationToast';
import ClientAppContainer from '@/components/ClientAppContainer';
import { ToastContainer } from '@/components/common/Toast';
import PageViewTracker from '@/components/analytics/PageViewTracker';
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics';

// Pretendard 폰트만 사용 (성능 최적화)
const pretendard = localFont({
  src: [
    {
      path: '../fonts/Pretendard-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../fonts/Pretendard-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../fonts/Pretendard-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-pretendard',
});

export const metadata: Metadata = {
  title: "덕스타 - 애니메이션 투표 플랫폼",
  description: "애니메이션 투표 및 차트 서비스",
  icons: {
    icon: '/icons/favicon.svg',
    shortcut: '/icons/favicon.svg',
    apple: '/icons/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        {/* 반응형 뷰포트 설정 */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
        
        {/* 투표 이미지 프리로딩 - 현재 사용하지 않음 */}
        {/* <link rel="preload" href="/voted-normal-2025-autumn.svg" as="image" type="image/svg+xml" />
        <link rel="preload" href="/voted-bonus-2025-autumn.svg" as="image" type="image/svg+xml" /> */}
      </head>
      <body
        className={`${pretendard.variable} antialiased`}
      >
        {/* Google Analytics 4 - 개발 환경에서는 로드하지 않음 */}
        <GoogleAnalytics />
        
        {/* 페이지뷰 자동 추적 */}
        <Suspense fallback={null}>
          <PageViewTracker />
        </Suspense>

        <QueryProvider>
          <AuthProvider>
            <ClientAppContainer>
              {children}
            </ClientAppContainer>
            
            {/* 마이그레이션 완료 토스트 - 모든 페이지에서 작동 */}
            <Suspense fallback={null}>
              <MigrationToast />
            </Suspense>
            
            {/* 토스트 컨테이너 - 모든 페이지에서 작동 */}
            <ToastContainer />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
