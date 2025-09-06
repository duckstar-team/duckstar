import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // API 프록시 설정
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
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
    ],
    // 이미지 최적화 비활성화 (외부 이미지 로딩 문제 해결)
    unoptimized: true,
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