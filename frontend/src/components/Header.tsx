'use client';

import type { NextPage } from "next";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import LoginButton from './common/LoginButton';
import { useAuth } from '../context/AuthContext';
import { scrollToTop } from '../utils/scrollUtils';

export type HeaderType = {
  className?: string;
};

const Header: NextPage<HeaderType> = ({ className = "" }) => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  
  // 덕스타 로고 클릭 시 스크롤 탑으로 이동
  const handleLogoClick = () => {
    sessionStorage.setItem('logo-navigation', 'true');
    sessionStorage.setItem('home-scroll-top', 'true');
    scrollToTop();
  };

  // 검색 실행
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // 헤더 검색 플래그 설정
      sessionStorage.setItem('from-header-search', 'true');
      // 검색 결과 페이지로 이동하면서 검색어 전달
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      // 검색 후 검색창 비우기
      setSearchQuery('');
    }
  };

  // 엔터 키 처리
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(e);
    }
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
      <div className={`absolute right-0 md:right-[25px] top-0 h-[60px] flex items-center gap-7 z-10 ${
        isAuthenticated ? 'gap-7' : 'gap-4'
      }`}>
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="w-[200px] sm:w-[248px] pl-4 pr-4 pt-[9px] pb-[9px] bg-[#F1F3F5] overflow-hidden rounded-xl border border-[#E9ECEF] flex justify-start items-center gap-4 hover:opacity-100 transition-opacity hidden md:flex">
          {/* Search Icon */}
          <div className="w-5 h-5 relative overflow-hidden">
            <img
              src="/icons/header-search.svg"
              alt="Search"
              className="w-full h-full"
            />
          </div>
          
          {/* Separator */}
          <div className="w-px h-4 bg-[#CED4DA]"></div>
          
          {/* Search Input */}
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="제목으로 애니 찾기..."
              className="w-full bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
            />
          </div>
        </form>
        
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
