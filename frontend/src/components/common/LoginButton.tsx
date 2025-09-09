'use client';

import { useAuth } from '@/context/AuthContext';
import { startKakaoLogin } from '@/api/client';
import Image from 'next/image';

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
  const { isAuthenticated, user, logout } = useAuth();

  const handleLoginClick = () => {
    startKakaoLogin();
  };

  const handleLogoutClick = () => {
    logout();
  };

  if (isAuthenticated && user) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {showProfileImage && user.profileImageUrl && (
          <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
            <Image
              src={user.profileImageUrl}
              alt="프로필 이미지"
              width={24}
              height={24}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <span className={`font-[Pretendard] font-semibold text-gray-700 truncate max-w-[80px] sm:max-w-[120px] ${
          variant === 'compact' ? 'text-sm' : 'text-sm sm:text-base'
        }`}>
          {user.nickname || '사용자'}
        </span>
        <button 
          onClick={handleLogoutClick}
          className={`font-[Pretendard] font-semibold text-[#8E8E93] hover:text-gray-600 transition-colors flex-shrink-0 cursor-pointer ${
            variant === 'compact' ? 'text-sm' : 'text-sm sm:text-base'
          }`}
        >
          로그아웃
        </button>
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
