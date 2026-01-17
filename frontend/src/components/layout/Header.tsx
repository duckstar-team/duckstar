'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import LoginButton from '@/components/common/LoginButton';
import { useAuth } from '@/context/AuthContext';
import { Menu } from 'lucide-react';
import { cn } from '@/lib';
import SearchBar from '@/components/domain/search/SearchBar';
import { IoSearch } from 'react-icons/io5';

export default function Header({ toggleMenu }: { toggleMenu: () => void }) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // 검색 실행
  const handleSearch = () => {
    if (searchQuery.trim()) {
      // 검색 페이지로 이동 (keyword 파라미터 사용)
      router.push(`/search?keyword=${encodeURIComponent(searchQuery.trim())}`);

      // 검색 후 검색창 비우기 및 모바일 검색창 닫기
      setSearchQuery('');
      setIsSearchOpen(false);
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
      if (isSearchOpen && !target.closest('[data-search-bar]')) {
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
    <header className="flex h-15 w-full items-center justify-between border-b border-[#DADCE0] bg-white/80 p-4 backdrop-blur-sm transition md:pr-6 md:pl-4 dark:border-zinc-800 dark:bg-zinc-900/80">
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
        {/* Search Bar - Desktop: 항상 표시, Mobile: isSearchOpen일 때만 표시 */}
        <div
          className={cn(
            'w-[160px] sm:w-[200px]',
            'md:flex md:w-full',
            isSearchOpen ? 'flex' : 'hidden'
          )}
        >
          <SearchBar
            variant="header"
            value={searchQuery}
            onChange={setSearchQuery}
            onSearch={handleSearch}
            placeholder={
              isSearchOpen ? '애니 검색' : '제목, 초성으로 애니 찾기'
            }
          />
        </div>

        {/* Mobile: 검색바가 닫혀있을 때만 버튼 표시 */}
        {!isSearchOpen && (
          <button
            onClick={() => setIsSearchOpen(true)}
            className="md:hidden"
            aria-label="검색"
          >
            <IoSearch className="size-5 text-gray-400" />
          </button>
        )}

        {/* Login/Logout Button */}
        <div
          className={cn(
            'flex shrink-0 items-center',
            isSearchOpen && 'hidden md:block'
          )}
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
