import type { Configuration } from "webpack";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // App Router만 사용하도록 설정
  experimental: {
    appDir: true,
  },
  
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
  },

  // webpack 설정
  webpack(config: Configuration) {
    config.module?.rules?.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    return config;
  },
};

export default nextConfig;