import type { NextPage } from "next";
import Image from 'next/image';

export type HeaderType = {
  className?: string;
};

const Header: NextPage<HeaderType> = ({ className = "" }) => {
  return (
    <header
      className={`w-full h-[60px] relative border-b border-[#DADCE0] backdrop-blur-[6px] ${className}`}
    >
      {/* Background Layer */}
      <div className="absolute inset-0 bg-white opacity-80 backdrop-blur-[12px]"></div>
      {/* 검색창 및 로그인 영역 */}
      <div className="w-[336px] h-[38px] right-[40px] top-[11px] absolute z-10">
        {/* 로그인 버튼 */}
        <div className="w-[42px] h-[22px] right-0 top-[7px] absolute">
          <button className="text-center text-[#8E8E93] text-[16px] font-[Pretendard] font-semibold leading-[22px] break-words hover:text-gray-700 transition-colors">
            로그인
          </button>
        </div>
        
        {/* 검색창 */}
        <div className="w-[248px] pl-4 pr-4 pt-[9px] pb-[9px] left-0 top-0 absolute bg-[#F1F3F5] overflow-hidden rounded-xl border border-[#E9ECEF] flex justify-start items-center gap-4">
          {/* 검색 아이콘 */}
          <div className="w-5 h-5 relative overflow-hidden">
            <Image
              src="/icons/header-search.svg"
              alt="Search"
              width={20}
              height={20}
              className="w-full h-full"
            />
          </div>
          
          {/* 구분선 */}
          <div className="w-px h-4 bg-[#E9ECEF]"></div>
          
          {/* 검색 입력창 */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="검색어를 입력하세요"
              className="w-full bg-transparent outline-none text-sm text-gray-600 placeholder-gray-400"
            />
          </div>
        </div>
      </div>
      
      {/* 로고 */}
      <div className="w-[93px] h-[60px] left-[25px] top-0 absolute z-10">
        <div className="w-[93px] h-[60px] left-0 top-0 absolute">
          <div className="w-[93px] h-[60px] left-0 top-0 absolute bg-[#990033] opacity-100 mix-blend-normal">
            <Image
              src="/logo.svg"
              alt="Duckstar Logo"
              width={93}
              height={60}
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
