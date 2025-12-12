'use client';

import type { NextPage } from 'next';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import LoginButton from '@/components/common/LoginButton';
import { useAuth } from '@/context/AuthContext';
import { scrollToTop } from '@/utils/scrollUtils';
import { Menu } from 'lucide-react';
import MobileSidebar from './MobileSidebar';

export type HeaderType = {
  className?: string;
};

const Header: NextPage<HeaderType> = ({ className = '' }) => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const menuContainerRef = useRef<HTMLDivElement>(null);

  // 덕스타 로고 클릭 시 스크롤 탑으로 이동
  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    sessionStorage.setItem('logo-navigation', 'true');
    sessionStorage.setItem('home-scroll-top', 'true');
    scrollToTop();

    // 모바일에서 홈으로 이동 시 페이지 새로고침으로 레이아웃 전환
    if (window.innerWidth < 768) {
      window.location.href = '/';
    } else {
      router.push('/');
    }
  };

  // 검색 실행
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    if (searchQuery.trim()) {
      // 검색 페이지로 이동 (keyword 파라미터 사용)
      router.push(`/search?keyword=${encodeURIComponent(searchQuery.trim())}`);

      // 검색 후 검색창 비우기 및 모바일 검색창 닫기
      setSearchQuery('');
      setIsSearchOpen(false);
    }
  };

  // 모바일 검색 토글
  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
  };

  // 엔터 키 처리
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(e);
    }
  };

  // ESC 키로 검색창 닫기
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };

    if (isSearchOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSearchOpen]);

  // 화면 크기 감지
  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 375);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;

      // 사이드바 메뉴 영역 클릭인지 확인 (메뉴 항목, 사이드바 컨테이너, 오버레이 제외)
      if (
        target.closest('[data-mobile-sidebar]') ||
        target.closest('[data-menu-item]') ||
        target.closest('[data-sidebar-container]')
      ) {
        return; // 사이드바 관련 클릭이면 무시
      }

      // 모바일 검색창 외부 클릭 시 닫기
      if (isSearchOpen && !target.closest('form')) {
        setIsSearchOpen(false);
      }
    };

    if (isSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSearchOpen]);

  const toggleMenu = () => {
    if (isMenuOpen) {
      closeMenu();
    } else {
      setIsMenuOpen(true);
      setIsClosing(false);
    }
  };

  const closeMenu = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsMenuOpen(false);
      setIsClosing(false);
    }, 300); // 애니메이션 시간과 동일
  };

  return (
    <>
      <header
        className={`relative h-[60px] w-full border-b border-[#DADCE0] backdrop-blur-[6px] ${className}`}
      >
        {/* Background Layer */}
        <div className="absolute inset-0 bg-white opacity-80 backdrop-blur-[12px]"></div>

        {/* Hamburger - vote, search, anime, chart, profile-setup, about, terms, privacy-policy pages mobile only, placed to the left of the logo */}
        {(pathname === '/' ||
          pathname === '/vote' ||
          pathname === '/search' ||
          pathname.startsWith('/search/') ||
          pathname.startsWith('/animes/') ||
          pathname === '/chart' ||
          pathname.startsWith('/chart/') ||
          pathname === '/profile-setup' ||
          pathname === '/about' ||
          pathname === '/terms' ||
          pathname === '/privacy-policy') && (
          <div
            ref={menuContainerRef}
            className="absolute top-1/2 left-1 z-10 -translate-y-1/2 lg:hidden"
          >
            <button
              type="button"
              aria-label="Open menu"
              aria-expanded={isMenuOpen}
              onClick={toggleMenu}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/80 backdrop-blur-[12px]"
            >
              <Menu color="#990033" />
            </button>
          </div>
        )}

        {/* Logo */}
        <Link
          href="/"
          onClick={handleLogoClick}
          className="absolute top-0 left-[50px] z-10 h-[60px] w-[80px] cursor-pointer sm:left-[58px] sm:w-[93px] lg:left-[25px]"
        >
          <img
            src="/logo.svg"
            alt="Duckstar Logo"
            className="h-full w-full object-contain"
          />
        </Link>

        {/* Right Section - Search Bar + Login Button */}
        <div
          className={`absolute top-0 right-[25px] z-10 flex h-[60px] items-center sm:right-3 md:right-[25px] ${
            isAuthenticated ? 'pr-[8px]' : 'pr-0'
          }`}
          style={{
            gap: isSmallScreen ? '0px' : isAuthenticated ? '4px' : '25px',
          }}
        >
          {/* Desktop Search Bar */}
          <form
            onSubmit={handleSearch}
            className="hidden w-[150px] items-center justify-start gap-4 overflow-hidden rounded-xl border border-[#E9ECEF] bg-[#F1F3F5] pt-[9px] pr-4 pb-[9px] pl-4 transition-opacity hover:opacity-100 sm:w-[200px] md:flex md:w-[248px]"
          >
            {/* Search Icon */}
            <div className="relative h-5 w-5 overflow-hidden">
              <img
                src="/icons/header-search.svg"
                alt="Search"
                className="h-full w-full"
              />
            </div>

            {/* Separator */}
            <div className="h-4 w-px bg-[#CED4DA]"></div>

            {/* Search Input */}
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="제목, 초성으로 애니 찾기"
                className="w-full bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
              />
            </div>
          </form>

          {/* Mobile Search Toggle Button */}
          <button
            onClick={toggleSearch}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-transparent md:hidden"
            aria-label="검색"
          >
            <img
              src="/icons/header-search.svg"
              alt="검색"
              className="h-5 w-5 object-contain"
            />
          </button>

          {/* Mobile Search Bar */}
          {isSearchOpen && (
            <form
              onSubmit={handleSearch}
              className="absolute top-[6px] right-0 flex h-[50px] w-[160px] items-center justify-start gap-4 overflow-hidden rounded-xl border border-[#E9ECEF] bg-[#F1F3F5] pt-[9px] pr-4 pb-[9px] pl-4 sm:w-[200px] md:hidden"
            >
              {/* Search Icon */}
              <div className="relative h-5 w-5 overflow-hidden">
                <img
                  src="/icons/header-search.svg"
                  alt="Search"
                  className="h-full w-full"
                />
              </div>

              {/* Separator */}
              <div className="h-4 w-px bg-[#CED4DA]"></div>

              {/* Search Input */}
              <div className="flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="애니 검색"
                  className="w-full bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
                  autoFocus
                />
              </div>
            </form>
          )}

          {/* Login/Logout Button */}
          <div
            className={`flex items-center ${isSearchOpen ? 'hidden md:block' : ''}`}
          >
            <LoginButton
              variant="default"
              showProfileImage={true}
              className="max-w-[120px] sm:max-w-[150px] md:max-w-[180px]"
            />
          </div>
        </div>
      </header>

      {/* Mobile Sidebar */}
      <MobileSidebar
        isOpen={isMenuOpen}
        isClosing={isClosing}
        onClose={closeMenu}
      />
    </>
  );
};

export default Header;
