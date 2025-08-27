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