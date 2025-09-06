'use client';

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";

export default function Home() {
  // 페이지 진입 시 스크롤을 맨 위로 고정
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const handleResultClick = (e: React.MouseEvent) => {
    e.preventDefault();
    alert('곧 출시됩니다.');
  };

  return (
    <div className="font-sans min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex pt-[40px] md:pt-[80px]">
      <div className="container mx-auto px-4">
        <main className="flex flex-col items-center text-center space-y-12">
          {/* Hero Section */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white px-4">
                애니메이션 투표 플랫폼, 덕스타
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto px-4 leading-relaxed">
                좋아하는 애니메이션과 캐릭터에 투표하고, 커뮤니티와 함께 즐겨보세요
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <Link
              href="/vote"
              className="rounded-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-lg px-8 py-4 transition-colors duration-200 flex items-center gap-2"
            >
              <Image
                src="/icons/vote-active.svg"
                alt="Vote icon"
                width={24}
                height={24}
              />
              투표하기
            </Link>
            <button
              onClick={handleResultClick}
              className="rounded-full border-2 border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium text-lg px-8 py-4 transition-colors duration-200 flex items-center gap-2"
            >
              <Image
                src="/icons/chart-active.svg"
                alt="Chart icon"
                width={24}
                height={24}
              />
              결과 보기
            </button>
          </div>

          {/* Features Section */}
          <div className="grid md:grid-cols-3 gap-8 mt-16 max-w-4xl">
            <div className="text-center space-y-4 p-6 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <div className="w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Image
                  src="/icons/vote-active.svg"
                  alt="Vote"
                  width={32}
                  height={32}
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                실시간 투표
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                실시간으로 업데이트되는 투표 결과를 확인하세요
              </p>
            </div>

            <div className="text-center space-y-4 p-6 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <Image
                  src="/icons/textBalloon.svg"
                  alt="Community"
                  width={32}
                  height={32}
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                커뮤니티
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                다른 팬들과 의견을 나누고 소통하세요
              </p>
            </div>

            <div className="text-center space-y-4 p-6 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <div className="w-16 h-16 mx-auto bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <Image
                  src="/icons/chart-active.svg"
                  alt="Analytics"
                  width={32}
                  height={32}
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                상세 분석
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                투표 결과에 대한 상세한 통계와 분석을 제공합니다
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
