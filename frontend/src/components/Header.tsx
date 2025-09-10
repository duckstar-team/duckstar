'use client';

import type { NextPage } from "next";
import Link from 'next/link';
import LoginButton from './common/LoginButton';
import { useAuth } from '../context/AuthContext';

export type HeaderType = {
  className?: string;
};

const Header: NextPage<HeaderType> = ({ className = "" }) => {
  const { isAuthenticated } = useAuth();
  
  // 덕스타 로고 클릭 시 스크롤 탑으로 이동
  const handleLogoClick = () => {
    sessionStorage.setItem('logo-navigation', 'true');
    console.log('🔝 덕스타 로고 클릭 - 스크롤 맨 위로 이동');
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  };
  
  return (
    <header
      className={`w-full h-[60px] relative border-b border-[#DADCE0] backdrop-blur-[6px] ${className}`}
    >
      {/* Background Layer */}
      <div className="absolute inset-0 bg-white opacity-80 backdrop-blur-[12px]"></div>
      
      {/* Logo */}
      <Link href="/" onClick={handleLogoClick} className="w-[80px] sm:w-[93px] h-[60px] left-0 md:left-[25px] top-0 absolute z-10 cursor-pointer">
        <img
          src="/logo.svg"
          alt="Duckstar Logo"
          className="w-full h-full object-contain"
        />
      </Link>
      
      {/* Right Section - Search Bar + Login Button */}
      <div className={`absolute right-0 md:right-[25px] top-0 h-[60px] flex items-center gap-3 z-10 ${
        isAuthenticated ? 'gap-6' : 'gap-2'
      }`}>
        {/* Search Bar */}
        <div className="w-[200px] sm:w-[248px] pl-4 pr-4 pt-[9px] pb-[9px] bg-[#F1F3F5] overflow-hidden rounded-xl border border-[#E9ECEF] flex justify-start items-center gap-4 opacity-50 hidden md:flex">
          {/* Search Icon */}
          <div className="w-5 h-5 relative overflow-hidden">
            <img
              src="/icons/header-search.svg"
              alt="Search"
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
              className="w-full bg-transparent outline-none text-sm text-gray-400 placeholder-gray-400"
            />
          </div>
        </div>
        
        {/* Login/Logout Button */}
        <div className="flex items-center">
          <LoginButton 
            variant="default" 
            showProfileImage={true}
            className="max-w-[200px] sm:max-w-[250px] md:max-w-none"
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
