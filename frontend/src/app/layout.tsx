import type { Metadata } from "next";
import localFont from 'next/font/local';
import { Suspense } from 'react';
import "./globals.css";
import Footer from '@/components/Footer';
import { AuthProvider } from '@/context/AuthContext';
import QueryProvider from '@/components/providers/QueryProvider';
import MigrationToast from '@/components/common/MigrationToast';
import ClientAppContainer from '@/components/ClientAppContainer';
import { ToastContainer } from '@/components/common/Toast';

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
        {/* PC 버전 강제 설정 - 모바일에서도 데스크톱 뷰포트 사용 */}
        <meta name="viewport" content="width=1200, initial-scale=1.0, user-scalable=no" />
        
        {/* 투표 이미지 프리로딩 */}
        <link rel="preload" href="/voted-normal-2025-autumn.svg" as="image" type="image/svg+xml" />
        <link rel="preload" href="/voted-bonus-2025-autumn.svg" as="image" type="image/svg+xml" />
      </head>
      <body
        className={`${pretendard.variable} antialiased`}
      >
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
