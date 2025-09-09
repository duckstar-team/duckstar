import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from 'next/font/local';
import "./globals.css";
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';
import { AuthProvider } from '@/context/AuthContext';
import QueryProvider from '@/components/providers/QueryProvider';

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
            {/* Fixed Header */}
            <div className="fixed top-0 left-0 right-0 z-[9999]">
              <Header />
            </div>
            
            {/* Fixed Sidebar */}
            <div className="fixed top-[60px] left-0 bottom-0 z-[9999999]">
              <Sidebar />
            </div>
            
            {/* Main Content */}
            <main className="ml-[50px] sm:ml-[55px] md:ml-[200px] mt-[60px] bg-gray-50 transition-all duration-300 ease-in-out group-hover:ml-[200px]">
              {children}
            </main>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
