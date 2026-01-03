'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import LoginButton from '@/components/common/LoginButton';
import { useAuth } from '@/context/AuthContext';
import { Menu } from 'lucide-react';
import { cn } from '@/lib';

export default function Header({ toggleMenu }: { toggleMenu: () => void }) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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

  return (
    <header className="flex h-15 w-full items-center justify-between border-b border-[#DADCE0] bg-white/80 p-4 backdrop-blur-sm transition md:pr-6 md:pl-4">
      <div className="flex items-center gap-4 md:gap-5">
        {/* Hamburger Menu Button */}
        <button type="button" aria-label="Open menu" onClick={toggleMenu}>
          <Menu className="text-brand size-7 stroke-[1.5px]" />
        </button>

        {/* Logo */}
        <Link href="/" className="h-full w-auto">
          <img
            src="/logo.svg"
            alt="Duckstar Logo"
            className="h-full w-full object-contain"
          />
        </Link>
      </div>

      {/* Right Section - Search Bar + Login Button */}
      <div
        className={cn(
          'flex h-15 items-center',
          isAuthenticated ? 'gap-1 pr-2' : 'gap-6'
        )}
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

          {/* Search Input */}
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="제목, 초성으로 애니 찾기"
              className="w-full bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
            />
          </div>
        </form>

        {/* Mobile Search Bar */}
        {isSearchOpen ? (
          <form
            onSubmit={handleSearch}
            className="flex h-[50px] w-[160px] items-center justify-start gap-4 overflow-hidden rounded-xl border border-[#E9ECEF] bg-[#F1F3F5] pt-[9px] pr-4 pb-[9px] pl-4 sm:w-[200px] md:hidden"
          >
            {/* Search Icon */}
            <div className="relative h-5 w-5 overflow-hidden">
              <img
                src="/icons/header-search.svg"
                alt="Search"
                className="h-full w-full"
              />
            </div>

            {/* Search Input */}
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="애니 검색"
                className="w-full bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
                autoFocus
              />
            </div>
          </form>
        ) : (
          <button
            onClick={toggleSearch}
            className="md:hidden"
            aria-label="검색"
          >
            <img src="/icons/header-search.svg" alt="검색" />
          </button>
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
  );
}
