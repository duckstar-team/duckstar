import type { Configuration } from "webpack";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // API 프록시 설정
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8080/api/:path*",
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