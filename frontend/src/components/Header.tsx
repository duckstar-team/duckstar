import type { NextPage } from "next";
import Image from 'next/image';
import Link from 'next/link';

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
      
      {/* Logo */}
      <div className="w-[80px] sm:w-[93px] h-[60px] left-0 md:left-[25px] top-0 absolute z-10 cursor-not-allowed">
        <Image
          src="/logo.svg"
          alt="Duckstar Logo"
          width={93}
          height={60}
          className="w-full h-full object-contain"
        />
      </div>
      
      {/* Login Button */}
      <div className="w-[42px] h-[22px] right-[12px] sm:right-[16px] md:right-[40px] top-[19px] absolute z-10">
        <button 
          disabled
          className="text-center text-[#8E8E93] text-[14px] sm:text-[16px] font-[Pretendard] font-semibold leading-[22px] break-words opacity-30 cursor-not-allowed relative"
        >
          로그인
          <span className="hidden md:block absolute -top-2 -right-8 text-[10px] bg-gray-100 text-gray-600 px-1 py-0.25 rounded">준비중</span>
        </button>
      </div>
      
      {/* 준비중 배지 - 모바일에서만 우상단에 표시 */}
      <div className="block md:hidden absolute top-0 right-0 z-20">
        <span className="text-[10px] bg-gray-100 text-gray-600 px-1 py-0.25 rounded opacity-30">준비중</span>
      </div>
      
      {/* Search Bar */}
      <div className="w-[200px] sm:w-[248px] pl-4 pr-4 pt-[9px] pb-[9px] right-[60px] sm:right-[80px] md:right-[100px] top-[8px] absolute bg-[#F1F3F5] overflow-hidden rounded-xl border border-[#E9ECEF] flex justify-start items-center gap-4 opacity-50 hidden md:flex">
        {/* Search Icon */}
        <div className="w-5 h-5 relative overflow-hidden">
          <Image
            src="/icons/header-search.svg"
            alt="Search"
            width={20}
            height={20}
            className="w-full h-full"
          />
        </div>
        
        {/* Separator */}
        <div className="w-px h-4 bg-[#E9ECEF]"></div>
        
        {/* Search Input */}
        <div className="flex-1">
          <input
            type="text"
            disabled
            placeholder="베타 - 곧 업데이트됩니다."
            className="w-full bg-transparent outline-none text-sm text-gray-400 placeholder-gray-400 cursor-not-allowed"
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
