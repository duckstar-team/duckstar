'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useModal } from '@/components/layout/AppContainer';

interface LoginButtonProps {
  variant?: 'default' | 'compact';
  showProfileImage?: boolean;
  className?: string;
}

export default function LoginButton({
  variant = 'default',
  showProfileImage = true,
  className = '',
}: LoginButtonProps) {
  const { isAuthenticated, user, logout } = useAuth();
  const { openLoginModal } = useModal();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleLoginClick = () => {
    openLoginModal();
  };

  const handleProfileEditClick = () => {
    router.push('/profile-setup');
    setIsDropdownOpen(false);
  };

  const handleAdminMenuClick = () => {
    router.push('/admin');
    setIsDropdownOpen(false);
  };

  const handleLogoutClick = () => {
    logout();
    setIsDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (isAuthenticated && user) {
    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        <button
          onClick={toggleDropdown}
          className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800"
        >
          {showProfileImage && user.profileImageUrl && (
            <div className="h-6 w-6 flex-shrink-0 overflow-hidden rounded-full">
              <img
                src={user.profileImageUrl}
                alt="프로필 이미지"
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <span
            className={`max-w-[80px] truncate font-[Pretendard] font-semibold text-gray-700 sm:max-w-[120px] dark:text-zinc-300 ${
              variant === 'compact' ? 'text-sm' : 'text-sm sm:text-base'
            }`}
          >
            {user.nickname || '사용자'}
          </span>
          <svg
            className={`h-4 w-4 text-gray-500 transition-transform ${
              isDropdownOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {/* 드롭다운 메뉴 */}
        {isDropdownOpen && (
          <div className="absolute top-full right-0 z-50 mt-2 min-w-fit rounded-lg border border-gray-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
            {/* 관리자 메뉴 - ADMIN 권한이 있는 경우에만 표시 */}
            {user.role === 'ADMIN' && (
              <>
                <button
                  onClick={handleAdminMenuClick}
                  className="w-full cursor-pointer px-4 py-2 text-left text-sm whitespace-nowrap text-gray-700 transition-colors hover:bg-gray-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  관리자 메뉴
                </button>
                <div className="border-brand-zinc-200 border-t"></div>
              </>
            )}
            <button
              onClick={handleProfileEditClick}
              className="w-full cursor-pointer px-4 py-2 text-left text-sm whitespace-nowrap text-gray-700 transition-colors hover:bg-gray-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              프로필 수정
            </button>
            <button
              onClick={handleLogoutClick}
              className="w-full cursor-pointer px-4 py-2 text-left text-sm whitespace-nowrap text-gray-700 transition-colors hover:bg-gray-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              로그아웃
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={handleLoginClick}
      className={`cursor-pointer font-[Pretendard] font-semibold text-[#8E8E93] transition-colors hover:text-gray-600 ${
        variant === 'compact' ? 'text-sm' : 'text-sm sm:text-base'
      } ${className}`}
    >
      로그인
    </button>
  );
}
