import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from 'next/font/local';
import { Suspense } from 'react';
import "./globals.css";
import Footer from '@/components/Footer';
import { AuthProvider } from '@/context/AuthContext';
import QueryProvider from '@/components/providers/QueryProvider';
import MigrationToast from '@/components/common/MigrationToast';
import ClientAppContainer from '@/components/ClientAppContainer';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Pretendard 폰트 추가
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
        {/* 투표 이미지 프리로딩 */}
        <link rel="preload" href="/voted-normal.svg" as="image" type="image/svg+xml" />
        <link rel="preload" href="/voted-bonus.svg" as="image" type="image/svg+xml" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${pretendard.variable} antialiased`}
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
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
