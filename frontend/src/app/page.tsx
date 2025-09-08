'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  // 홈이 개발되기 전까지 애니/캐릭터 찾기 페이지로 리다이렉트
  useEffect(() => {
    router.replace('/search');
  }, [router]);

  return (
    <div className="font-sans min-h-screen bg-white flex pt-[40px] md:pt-[80px]">
      <div className="container mx-auto px-4">
        <main className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)]">
          {/* 리다이렉트 중... */}
          <div className="text-center">
            <p className="text-gray-500">리다이렉트 중...</p>
          </div>
        </main>
      </div>
    </div>
  );
}
