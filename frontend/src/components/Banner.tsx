import type { NextPage } from "next";

export type BannerType = {
  className?: string;
};

const Banner: NextPage<BannerType> = ({ className = "" }) => {
  return (
    <div
      className={`bg-gradient-to-r from-purple-600 to-pink-600 text-white p-8 rounded-lg ${className}`}
    >
      <h1 className="text-3xl font-bold text-center">
        2025 SUMMER 애니메이션 투표
      </h1>
    </div>
  );
};

export default Banner;
