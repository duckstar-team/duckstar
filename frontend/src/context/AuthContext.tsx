'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getUserInfo, logout, withdraw, withdrawKakao, withdrawGoogle, withdrawNaver } from '../api/client';

interface User {
  id: number;
  provider?: string;
  nickname: string;
  profileImageUrl?: string;
  role: string;
  isProfileInitialized?: boolean;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  accessToken: string | null;
  login: (userData?: User) => Promise<void>;
  logout: () => Promise<void>;
  withdraw: () => Promise<void>;
  updateUser: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  const resetAuthState = () => {
    setUser(null);
    setIsAuthenticated(false);
    setAccessToken(null);
    setIsLoading(false);
    setHasCheckedAuth(false); // 🔑 인증 확인 상태도 초기화
  };

  const login = async (userData?: User) => {
    if (userData) {
      // 사용자 데이터가 제공된 경우 (OAuth 로그인 후)
      setUser(userData);
      setIsAuthenticated(true);
      setIsLoading(false);
    } else {
      // 수동 로그인의 경우 API에서 사용자 정보 가져오기
      setIsLoading(true);
      try {
        const userData = await getUserInfo();
        const user = userData.result || userData;
        setUser(user as User);
        setIsAuthenticated(true);
      } catch (error) {
console.error('사용자 정보 가져오기 실패:', error);
        resetAuthState();
      } finally {
        setIsLoading(false);
      }
    }
  };

  const logoutUser = async () => {
    try {
      // 백엔드 로그아웃 API 호출
      await fetch('/api/v1/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
console.error('로그아웃 API 호출 실패:', error);
    } finally {
      // localStorage에서 토큰 제거
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        // 프로필 설정 페이지에서 로그아웃 시 홈페이지로 리다이렉트
        if (window.location.pathname === '/profile-setup') {
          window.location.href = '/';
        }
      }
      resetAuthState();
    }
  };

  const withdrawUser = async () => {
    try {
      // 사용자의 provider에 따라 다른 API 호출
      if (!user?.provider) {
        throw new Error('사용자 정보를 찾을 수 없습니다.');
      }

      switch (user.provider.toLowerCase()) {
        case 'kakao':
          await withdrawKakao();
          break;
        case 'google':
          await withdrawGoogle();
          break;
        case 'naver':
          await withdrawNaver();
          break;
        default:
          // 기본값으로 기존 withdraw 사용 (하위 호환성)
          await withdraw();
      }
    } catch (error) {
console.error('회원탈퇴 실패:', error);
      throw error; // 에러를 다시 던져서 UI에서 처리할 수 있도록 함
    } finally {
      // localStorage에서 토큰 제거
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
      }
      resetAuthState();
    }
  };

  const updateUser = (userData: User) => {
    setUser(userData);
  };

  // 🔑 핵심: 초기 로드 시 인증 상태 확인 (단순하고 명확한 설계)
  useEffect(() => {
    const checkAuthStatus = async () => {
      // 로딩 중이 아닐 때만 실행
      if (!isLoading) {
        setIsLoading(true);
        try {
          const userData = await getUserInfo();
          const user = userData.result || userData;
          setUser(user as User);
          setIsAuthenticated(true);
        } catch (error) {
          // 401 에러는 정상적인 동작이므로 조용히 처리
          resetAuthState();
        } finally {
          setIsLoading(false);
        }
      }
    };

    checkAuthStatus();
  }, []); // 🔑 한 번만 실행

  // OAuth 로그인 후 처리 (LOGIN_STATE 쿠키 확인)
  useEffect(() => {
    const handleOAuthCallback = () => {
      if (typeof window === 'undefined') return;

      // LOGIN_STATE 쿠키 확인
      const loginStateCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('LOGIN_STATE='));
      
      if (loginStateCookie) {
        try {
          const encoded = loginStateCookie.split('=')[1];
          const decoded = atob(encoded);
          const loginState = JSON.parse(decoded);
          
          
          // returnUrl이 있으면 해당 페이지로 리다이렉트 (새 사용자와 기존 사용자 모두)
          const returnUrl = sessionStorage.getItem('returnUrl');
          
          if (returnUrl) {
            // 새 사용자인 경우 returnUrl을 보존하고 프로필 설정 페이지로 리다이렉트
            if (loginState.isNewUser && window.location.pathname !== '/profile-setup') {
              window.location.href = '/profile-setup';
              return;
            }
            // 기존 사용자인 경우 returnUrl로 리다이렉트
            
            // 기존 사용자도 마이그레이션이 일어났으면 토스트 설정
            if (loginState.isMigrated) {
              sessionStorage.setItem('migration_completed', 'true');
            }
            
            sessionStorage.removeItem('returnUrl');
            window.location.href = returnUrl;
            return;
          }
          
          // 마이그레이션이 일어났는지 확인 (returnUrl 처리 후)
          if (loginState.isMigrated) {
            sessionStorage.setItem('migration_completed', 'true');
          }
          
          // returnUrl이 없는 경우 새 사용자는 프로필 설정 페이지로 리다이렉트
          if (loginState.isNewUser && window.location.pathname !== '/profile-setup') {
            window.location.href = '/profile-setup';
            return;
          }
          
        } catch (error) {
          console.error('LOGIN_STATE 쿠키 파싱 실패:', error);
        }
      }
    };

    // 페이지 로드 시 OAuth 콜백 처리
    handleOAuthCallback();
  }, []);


  const contextValue: AuthContextType = {
    isAuthenticated,
    isLoading,
    user,
    accessToken,
    login,
    logout: logoutUser,
    withdraw: withdrawUser,
    updateUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
