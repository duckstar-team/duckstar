import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /chart 경로로 접근 시 최신 주차로 리디렉션
  if (pathname === '/chart') {
    try {
      // API URL 구성 (서버 사이드에서는 절대 경로 필요)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const response = await fetch(
        `${apiUrl}/api/v1/chart/weeks?isPrepared=true`,
        {
        headers: {
          'Content-Type': 'application/json',
        },
        // 서버 사이드에서 실행되므로 캐시 사용
        next: { revalidate: 60 }, // 60초마다 재검증
        },
      );

      if (!response.ok) {
        // API 호출 실패 시 원래 경로로 진행
        return NextResponse.next();
      }

      const data = await response.json();
      const weeks = data.result || [];

      if (weeks.length > 0) {
        // 최신 주차 찾기 (year, quarter, week 기준으로 정렬)
        const latestWeek = [...weeks].sort((a: any, b: any) => {
          if (a.year !== b.year) return b.year - a.year;
          if (a.quarter !== b.quarter) return b.quarter - a.quarter;
          return b.week - a.week;
        })[0];

        // 최신 주차로 리디렉션
        const redirectUrl = new URL(
          `/chart/${latestWeek.year}/${latestWeek.quarter}/${latestWeek.week}`,
          request.url
        );
        return NextResponse.redirect(redirectUrl);
      }
    } catch (error) {
      console.error('차트 리디렉션 실패:', error);
      // 에러 발생 시 원래 경로로 진행
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/chart',
};
