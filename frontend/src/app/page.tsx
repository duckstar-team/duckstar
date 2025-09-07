'use client';

import { useEffect } from "react";

export default function Home() {
  // 페이지 진입 시 스크롤을 맨 위로 고정
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="font-sans min-h-screen bg-white flex pt-[40px] md:pt-[80px]">
      <div className="container mx-auto px-4">
        <main className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)]">
          {/* 빈 메인 영역 - 새로운 홈 화면 구현을 위해 준비됨 */}
        </main>
      </div>
    </div>
  );
}
