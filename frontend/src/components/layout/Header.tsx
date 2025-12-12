'use client';

import type { NextPage } from 'next';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import LoginButton from '@/components/common/LoginButton';
import { useAuth } from '@/context/AuthContext';
import { useChart } from './AppContainer';
import { scrollToTop } from '@/utils/scrollUtils';
import ThinNavDetail from './ThinNavDetail';

export type HeaderType = {
  className?: string;
};

const Header: NextPage<HeaderType> = ({ className = '' }) => {
  const { isAuthenticated } = useAuth();
  const { weeks, selectedWeek } = useChart();
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
  const handleKeyPress = (e: React.KeyboardEvent) => {
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

      if (
        menuContainerRef.current &&
        !menuContainerRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }

      // 모바일 검색창 외부 클릭 시 닫기
      if (isSearchOpen && !target.closest('form')) {
        setIsSearchOpen(false);
      }
    };

    if (isMenuOpen || isSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen, isSearchOpen]);

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

  const handleNavClick = (href: string) => {
    // 메뉴 즉시 닫기
    setIsMenuOpen(false);
    setIsClosing(false);
    // 페이지 이동
    router.push(href);
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
              <img
                src="/icons/mobile-hamburger.svg"
                alt="Menu"
                className="h-5 w-5 object-contain"
              />
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
                onKeyPress={handleKeyPress}
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
                  onKeyPress={handleKeyPress}
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

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div
          data-mobile-sidebar
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 99999,
          }}
        >
          {/* Overlay background */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(4px)',
            }}
            onClick={closeMenu}
          />

          {/* Sidebar menu */}
          <div
            data-sidebar-container
            suppressHydrationWarning
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width:
                pathname === '/chart' || pathname.startsWith('/chart/')
                  ? '243px'
                  : '240px',
              maxWidth:
                pathname === '/chart' || pathname.startsWith('/chart/')
                  ? '243px'
                  : '240px',
              height: '100%',
              backgroundColor: '#ffffff',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              transform: isClosing ? 'translateX(-100%)' : 'translateX(0)',
              transition: 'transform 0.3s ease-out',
              zIndex: 100000,
              display: 'flex',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Main Navigation */}
            <div
              style={{
                padding: '24px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                width:
                  pathname === '/chart' || pathname.startsWith('/chart/')
                    ? '100px'
                    : '240px',
                flexShrink: 0,
              }}
            >
              {/* Header */}
              <div style={{ marginBottom: '32px' }}>
                <h2
                  style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    color: '#111827',
                  }}
                >
                  메뉴
                </h2>
              </div>

              {/* Navigation items */}
              <nav
                style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
              >
                <button
                  data-menu-item
                  onClick={() => {
                    closeMenu();
                    // 모바일에서 홈으로 이동 시 페이지 새로고침으로 레이아웃 전환
                    if (window.innerWidth < 768) {
                      window.location.href = '/';
                    } else {
                      router.push('/');
                    }
                  }}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background:
                      pathname === '/'
                        ? 'linear-gradient(to right, #cb285e, #9c1f49)'
                        : 'transparent',
                    color: pathname === '/' ? '#ffffff' : '#586672',
                    fontSize: '16px',
                    fontWeight: pathname === '/' ? 'bold' : '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    textDecoration: 'none',
                    border: 'none',
                    outline: 'none',
                    width: '100%',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    if (pathname !== '/') {
                      e.currentTarget.style.backgroundColor = '#ffd4e2';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (pathname !== '/') {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <img
                    src={
                      pathname === '/'
                        ? '/icons/home-active.svg'
                        : '/icons/home-default.svg'
                    }
                    alt="홈"
                    style={{ width: '20px', height: '20px' }}
                  />
                  <span
                    style={{
                      display:
                        pathname === '/chart' || pathname.startsWith('/chart/')
                          ? 'none'
                          : 'inline',
                    }}
                  >
                    홈
                  </span>
                </button>
                <button
                  data-menu-item
                  onClick={() => {
                    router.push('/chart');
                    closeMenu();
                  }}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background:
                      pathname === '/chart' || pathname.startsWith('/chart/')
                        ? 'linear-gradient(to right, #cb285e, #9c1f49)'
                        : 'transparent',
                    color:
                      pathname === '/chart' || pathname.startsWith('/chart/')
                        ? '#ffffff'
                        : '#586672',
                    fontSize: '16px',
                    fontWeight:
                      pathname === '/chart' || pathname.startsWith('/chart/')
                        ? 'bold'
                        : '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    textDecoration: 'none',
                    border: 'none',
                    outline: 'none',
                    width: '100%',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    if (
                      pathname !== '/chart' &&
                      !pathname.startsWith('/chart/')
                    ) {
                      e.currentTarget.style.backgroundColor = '#ffd4e2';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (
                      pathname !== '/chart' &&
                      !pathname.startsWith('/chart/')
                    ) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <img
                    src={
                      pathname === '/chart' || pathname.startsWith('/chart/')
                        ? '/icons/chart-active.svg'
                        : '/icons/chart-default.svg'
                    }
                    alt="주간 차트"
                    style={{ width: '20px', height: '20px' }}
                  />
                  <span
                    style={{
                      display:
                        pathname === '/chart' || pathname.startsWith('/chart/')
                          ? 'none'
                          : 'inline',
                    }}
                  >
                    주간 차트
                  </span>
                </button>
                <button
                  data-menu-item
                  onClick={() => {
                    router.push('/vote');
                    closeMenu();
                  }}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background:
                      pathname === '/vote'
                        ? 'linear-gradient(to right, #cb285e, #9c1f49)'
                        : 'transparent',
                    color: pathname === '/vote' ? '#ffffff' : '#586672',
                    fontSize: '16px',
                    fontWeight: pathname === '/vote' ? 'bold' : '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    textDecoration: 'none',
                    border: 'none',
                    outline: 'none',
                    width: '100%',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    if (pathname !== '/vote') {
                      e.currentTarget.style.backgroundColor = '#ffd4e2';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (pathname !== '/vote') {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <img
                    src={
                      pathname === '/vote'
                        ? '/icons/vote-active.svg'
                        : '/icons/vote-default.svg'
                    }
                    alt="투표하기"
                    style={{ width: '20px', height: '20px' }}
                  />
                  <span
                    style={{
                      display:
                        pathname === '/chart' || pathname.startsWith('/chart/')
                          ? 'none'
                          : 'inline',
                    }}
                  >
                    투표하기
                  </span>
                </button>
                <button
                  data-menu-item
                  onClick={() => {
                    router.push('/search');
                    closeMenu();
                  }}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background:
                      pathname === '/search' || pathname.startsWith('/search/')
                        ? 'linear-gradient(to right, #cb285e, #9c1f49)'
                        : 'transparent',
                    color:
                      pathname === '/search' || pathname.startsWith('/search/')
                        ? '#ffffff'
                        : '#586672',
                    fontSize: '16px',
                    fontWeight:
                      pathname === '/search' || pathname.startsWith('/search/')
                        ? 'bold'
                        : '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    textDecoration: 'none',
                    border: 'none',
                    outline: 'none',
                    width: '100%',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    if (
                      pathname !== '/search' &&
                      !pathname.startsWith('/search/')
                    ) {
                      e.currentTarget.style.backgroundColor = '#ffd4e2';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (
                      pathname !== '/search' &&
                      !pathname.startsWith('/search/')
                    ) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <img
                    src={
                      pathname === '/search' || pathname.startsWith('/search/')
                        ? '/icons/search-active.svg'
                        : '/icons/search-default.svg'
                    }
                    alt="애니/시간표 검색"
                    style={{ width: '20px', height: '20px' }}
                  />
                  <span
                    style={{
                      display:
                        pathname === '/chart' || pathname.startsWith('/chart/')
                          ? 'none'
                          : 'inline',
                    }}
                  >
                    <span className="md:hidden">시간표 검색</span>
                    <span className="hidden md:inline">애니/시간표 검색</span>
                  </span>
                </button>
                <button
                  data-menu-item
                  onClick={() => {
                    router.push('/mypage');
                    closeMenu();
                  }}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background:
                      pathname === '/mypage'
                        ? 'linear-gradient(to right, #cb285e, #9c1f49)'
                        : 'transparent',
                    color: pathname === '/mypage' ? '#ffffff' : '#9ca3af',
                    fontSize: '16px',
                    fontWeight: pathname === '/mypage' ? 'bold' : '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    textDecoration: 'none',
                    border: 'none',
                    outline: 'none',
                    width: '100%',
                    textAlign: 'left',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    if (pathname !== '/mypage') {
                      e.currentTarget.style.backgroundColor = '#ffd4e2';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (pathname !== '/mypage') {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <img
                    src={
                      pathname === '/mypage'
                        ? '/icons/mypage-active.svg'
                        : '/icons/mypage-default.svg'
                    }
                    alt="마이페이지"
                    style={{
                      width: '20px',
                      height: '20px',
                      opacity: pathname === '/mypage' ? '1' : '0.5',
                    }}
                  />
                  <div
                    style={{
                      position: 'relative',
                      flex: 1,
                      display:
                        pathname === '/chart' || pathname.startsWith('/chart/')
                          ? 'none'
                          : 'block',
                    }}
                  >
                    <span>마이페이지</span>
                    <span
                      style={{
                        position: 'absolute',
                        top: '3.5px',
                        right: '-25px',
                        fontSize: '10px',
                        fontWeight: '600',
                        color: '#6b7280',
                        backgroundColor: '#f3f4f6',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        zIndex: 1,
                      }}
                    >
                      준비중
                    </span>
                  </div>
                </button>

                {/* 푸터 항목들 */}
                <div
                  style={{
                    marginTop: 'auto',
                    paddingTop: '24px',
                    borderTop: '1px solid #e5e7eb',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0',
                    position: 'absolute',
                    bottom: '0',
                    left: '0',
                    right: '0',
                    paddingBottom: '16px',
                  }}
                >
                  <button
                    data-menu-item
                    onClick={() => {
                      router.push('/about');
                      closeMenu();
                    }}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      background: 'transparent',
                      color: '#6b7280',
                      fontSize: '14px',
                      fontWeight: '400',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out',
                      display: 'flex',
                      alignItems: 'center',
                      textDecoration: 'none',
                      border: 'none',
                      outline: 'none',
                      width: '100%',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                      e.currentTarget.style.color = '#374151';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#6b7280';
                    }}
                  >
                    덕스타 소개
                  </button>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '0 16px',
                      flexWrap: 'nowrap',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <button
                      data-menu-item
                      onClick={() => {
                        router.push('/terms');
                        closeMenu();
                      }}
                      style={{
                        padding: '8px 0',
                        background: 'transparent',
                        color: '#6b7280',
                        fontSize: '14px',
                        fontWeight: '400',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease-in-out',
                        textDecoration: 'none',
                        border: 'none',
                        outline: 'none',
                        textAlign: 'left',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#374151';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#6b7280';
                      }}
                    >
                      이용약관
                    </button>
                    <span
                      style={{
                        color: '#d1d5db',
                        fontSize: '14px',
                        flexShrink: 0,
                      }}
                    >
                      ·
                    </span>
                    <button
                      data-menu-item
                      onClick={() => {
                        router.push('/privacy-policy');
                        closeMenu();
                      }}
                      style={{
                        padding: '8px 0',
                        background: 'transparent',
                        color: '#6b7280',
                        fontSize: '14px',
                        fontWeight: '400',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease-in-out',
                        textDecoration: 'none',
                        border: 'none',
                        outline: 'none',
                        textAlign: 'left',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#374151';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#6b7280';
                      }}
                    >
                      개인정보처리방침
                    </button>
                  </div>

                  <div
                    style={{
                      padding: '8px 16px',
                      color: '#9ca3af',
                      fontSize: '12px',
                      textAlign: 'left',
                    }}
                  >
                    © 2025 DUCKSTAR
                  </div>
                </div>
              </nav>
            </div>

            {/* ThinNavDetail for Chart Pages - integrated within same container */}
            {(pathname === '/chart' || pathname.startsWith('/chart/')) && (
              <div
                style={{
                  width: '143px',
                  height: '100%',
                  backgroundColor: '#212529',
                  flexShrink: 0,
                  position: 'relative',
                }}
              >
                {/* Close button positioned at 1 o'clock direction */}
                <button
                  onClick={closeMenu}
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '4px',
                    border: 'none',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    cursor: 'pointer',
                    zIndex: 10,
                  }}
                >
                  <svg
                    style={{ width: '14px', height: '14px', color: 'white' }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
                <ThinNavDetail
                  weeks={weeks}
                  selectedWeek={selectedWeek}
                  hideTextOnMobile={false}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
