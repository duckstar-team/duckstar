import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Standalone 모드 활성화 (Docker 최적화)
  output: 'standalone',

  // 환경 변수 기본값 설정
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
    NEXT_PUBLIC_GA_MEASUREMENT_ID:
      process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-FV68BFV3GX',
  },

  // ESLint 비활성화 (배포용)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // TypeScript 에러 무시 (배포용)
  typescript: {
    ignoreBuildErrors: true,
  },

  // 성능 최적화 설정
  experimental: {
    scrollRestoration: false,
    // optimizeCss: true, // CSS 최적화 (critters 의존성 문제로 임시 비활성화)
    optimizePackageImports: ['@tanstack/react-query', 'framer-motion'], // 패키지 임포트 최적화
  },

  // 컴파일러 최적화
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production', // 프로덕션에서 console 제거
  },

  // API 프록시 설정
  async rewrites() {
    // Docker 환경에서는 서비스 이름 사용, 로컬에서는 localhost 사용
    // 빌드 타임에 BACKEND_URL이 설정되어 있으면 사용, 없으면 localhost 사용
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
    return [
      {
        source: '/oauth2/:path*',
        destination: `${backendUrl}/oauth2/:path*`,
      },
      {
        source: '/login/:path*',
        destination: `${backendUrl}/login/:path*`,
      },
      // /api/image-proxy는 Next.js 라우트 핸들러로 처리되므로 제외
      {
        source: '/api/:path((?!image-proxy).*)',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },

  // HTTP 헤더 설정 (브라우저 캐시 TTL + 프록시 설정)
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Connection',
            value: 'keep-alive',
          },
          {
            key: 'Keep-Alive',
            value: 'timeout=5, max=1000',
          },
        ],
      },
      {
        source: '/_next/image(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value:
              'public, max-age=604800, s-maxage=604800, stale-while-revalidate=86400', // 7일 캐시
          },
        ],
      },
      {
        source: '/banners/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable', // 1년 캐시 (정적 리소스)
          },
        ],
      },
    ];
  },

  // 외부 이미지 설정
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'data.onnada.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.duckstar.kr',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'img1.kakaocdn.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img1.kakaocdn.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 't1.kakaocdn.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 't1.kakaocdn.net',
        port: '',
        pathname: '/**',
      },
    ],
    // 이미지 최적화 활성화 (WebP 최적화를 위해)
    unoptimized: false,
    // 이미지 캐시 TTL 설정 (7일)
    minimumCacheTTL: 604800, // 7일 = 7 * 24 * 60 * 60
    // 이미지 로딩 실패 시 대체 처리
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // webpack 설정 - SVG 파일을 일반 정적 파일로 처리
  webpack(config) {
    // SVG 파일을 React 컴포넌트로 변환하지 않고 일반 정적 파일로 처리
    config.module?.rules?.push({
      test: /\.svg$/,
      type: 'asset/resource',
    });

    return config;
  },
};

export default nextConfig;
