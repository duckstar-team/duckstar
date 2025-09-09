import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 환경 변수 기본값 설정
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://duckstar.kr',
  },
  
  // ESLint 비활성화 (배포용)
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // TypeScript 에러 무시 (배포용)
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // 스크롤 복원 비활성화
  experimental: {
    scrollRestoration: false,
  },
  
  // API 프록시 설정
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://duckstar.kr';
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },

  // HTTP 헤더 설정 (브라우저 캐시 TTL)
  async headers() {
    return [
      {
        source: "/_next/image(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, s-maxage=604800, stale-while-revalidate=86400", // 7일 캐시
          },
        ],
      },
      {
        source: "/banners/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable", // 1년 캐시 (정적 리소스)
          },
        ],
      },
    ];
  },

  // 외부 이미지 설정
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "data.onnada.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "img.duckstar.kr",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "img1.kakaocdn.net",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "img1.kakaocdn.net",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "t1.kakaocdn.net",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "t1.kakaocdn.net",
        port: "",
        pathname: "/**",
      },
    ],
    // 이미지 최적화 비활성화 (SVG 문제 해결)
    unoptimized: true,
    // 이미지 캐시 TTL 설정 (7일)
    minimumCacheTTL: 604800, // 7일 = 7 * 24 * 60 * 60
    // 이미지 로딩 실패 시 대체 처리
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // webpack 설정
  webpack(config) {
    config.module?.rules?.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    return config;
  },
};

export default nextConfig;