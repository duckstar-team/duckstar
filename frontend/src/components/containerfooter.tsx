import type { NextPage } from "next";
import Link from 'next/link';

export type ContainerfooterType = {
  className?: string;
};

const Containerfooter: NextPage<ContainerfooterType> = ({ className = "" }) => {
  return (
    <div
      className={`w-full h-full flex flex-col justify-start items-start gap-[21px] inline-flex ${className}`}
    >
      {/* 상단 링크 영역 */}
      <div className="w-[161px] h-[42px] relative">
        {/* 하단 링크들 */}
        <div className="left-[0.5px] top-[21px] absolute flex justify-start items-center gap-[5px]">
          <div className="w-[49px] h-[21px] relative">
            <Link 
              href="/terms" 
              className="left-0 top-0 absolute flex justify-center flex-col text-[#586672] text-[14px] font-[Pretendard] font-normal leading-[21px] break-words hover:text-gray-800 transition-colors"
            >
              이용약관
            </Link>
          </div>
          <div className="flex justify-center flex-col text-[#586672] text-[14px] font-[Pretendard] font-normal leading-[21px] break-words">
            ·
          </div>
          <div className="w-[97px] h-[21px] relative">
            <Link 
              href="/privacy" 
              className="left-0 top-0 absolute flex justify-center flex-col text-[#586672] text-[14px] font-[Pretendard] font-normal leading-[21px] break-words hover:text-gray-800 transition-colors"
            >
              개인정보처리방침
            </Link>
          </div>
        </div>
        
        {/* 상단 링크 */}
        <div className="w-[65px] h-[21px] left-[0.5px] top-0 absolute">
          <Link 
            href="/about" 
            className="left-0 top-0 absolute flex justify-center flex-col text-[#586672] text-[14px] font-[Pretendard] font-normal leading-[21px] break-words hover:text-gray-800 transition-colors"
          >
            덕스타 소개
          </Link>
        </div>
      </div>

      {/* 저작권 텍스트 */}
      <div className="flex justify-center flex-col text-[#586672] text-[14px] font-[Pretendard] font-normal leading-[21px] break-words">
        © 2025 DUCKSTAR
      </div>
    </div>
  );
};

export default Containerfooter;
