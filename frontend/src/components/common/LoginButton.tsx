'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useModal } from '@/components/AppContainer';

interface LoginButtonProps {
  variant?: 'default' | 'compact';
  showProfileImage?: boolean;
  className?: string;
}

export default function LoginButton({ 
  variant = 'default', 
  showProfileImage = true,
  className = '' 
}: LoginButtonProps) {
  const { isAuthenticated, isLoading, user, logout, withdraw } = useAuth();
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
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 로딩 중일 때
  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-6 h-6 rounded-full bg-gray-200 animate-pulse"></div>
        <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        <button
          onClick={toggleDropdown}
          className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors cursor-pointer"
        >
          {showProfileImage && user.profileImageUrl && (
            <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
              <img
                src={user.profileImageUrl}
                alt="프로필 이미지"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <span className={`font-[Pretendard] font-semibold text-gray-700 truncate max-w-[80px] sm:max-w-[120px] ${
            variant === 'compact' ? 'text-sm' : 'text-sm sm:text-base'
          }`}>
            {user.nickname || '사용자'}
          </span>
          <svg 
            className={`w-4 h-4 text-gray-500 transition-transform ${
              isDropdownOpen ? 'rotate-180' : ''
            }`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* 드롭다운 메뉴 */}
        {isDropdownOpen && (
          <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-fit">
            {/* 관리자 메뉴 - ADMIN 권한이 있는 경우에만 표시 */}
            {user.role === 'ADMIN' && (
              <>
                <button
                  onClick={handleAdminMenuClick}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap cursor-pointer"
                >
                  관리자 메뉴
                </button>
                <div className="border-t border-gray-200 my-1"></div>
              </>
            )}
            <button
              onClick={handleProfileEditClick}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap cursor-pointer"
            >
              프로필 수정
            </button>
            <button
              onClick={handleLogoutClick}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap cursor-pointer"
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
      className={`font-[Pretendard] font-semibold text-[#8E8E93] hover:text-gray-600 transition-colors cursor-pointer ${
        variant === 'compact' ? 'text-sm' : 'text-sm sm:text-base'
      } ${className}`}
    >
      로그인
    </button>
  );
}
