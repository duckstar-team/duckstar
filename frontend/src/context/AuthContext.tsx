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
  login: (userData?: User) => Promise<void>;
  logout: () => Promise<void>;
  withdraw: () => Promise<void>;
  updateUser: (userData: User) => void;
  refreshAuthStatus: () => Promise<void>;
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
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  const resetAuthState = () => {
    setUser(null);
    setIsAuthenticated(false);
    setIsLoading(false);
    setHasCheckedAuth(false);
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

  // 프로필 설정 완료 후 인증 상태 재확인
  const refreshAuthStatus = async () => {
    try {
      const userData = await getUserInfo();
      const user = userData.result || userData;
      setUser(user as User);
      setIsAuthenticated(true);
      setHasCheckedAuth(true);
    } catch (error) {
      resetAuthState();
    }
  };

  // 최적화된 인증 로직: 쿠키 체크 후 API 호출
  useEffect(() => {
    const checkAuthStatus = async () => {
      if (hasCheckedAuth || isLoading) return;

      // AUTH_STATUS 쿠키 체크 (백엔드에서 설정한 인증 상태 쿠키)
      const hasAuthStatus = document.cookie.includes('AUTH_STATUS=');
      const hasLoginState = document.cookie.includes('LOGIN_STATE=');
      
      if (!hasAuthStatus && !hasLoginState) {
        setHasCheckedAuth(true);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setHasCheckedAuth(true);
      
      try {
        const userData = await getUserInfo();
        const user = userData.result || userData;
        setUser(user as User);
        setIsAuthenticated(true);
        
        // OAuth 콜백 처리 (LOGIN_STATE 쿠키가 있을 때만)
        const hasLoginState = document.cookie.includes('LOGIN_STATE=');
        if (hasLoginState) {
          try {
            const loginStateCookie = document.cookie
              .split('; ')
              .find(row => row.startsWith('LOGIN_STATE='));
              
            if (loginStateCookie) {
              const encoded = loginStateCookie.split('=')[1];
              const decoded = atob(encoded);
              const loginState = JSON.parse(decoded);
              
              // returnUrl 처리
              const returnUrl = sessionStorage.getItem('returnUrl');
              if (returnUrl) {
                if (loginState.isNewUser && window.location.pathname !== '/profile-setup') {
                  window.location.href = '/profile-setup';
                  return;
                }
                
                if (loginState.isMigrated) {
                  sessionStorage.setItem('migration_completed', 'true');
                }
                
                sessionStorage.removeItem('returnUrl');
                window.location.href = returnUrl;
                return;
              }
              
              if (loginState.isMigrated) {
                sessionStorage.setItem('migration_completed', 'true');
              }
              
              if (loginState.isNewUser && window.location.pathname !== '/profile-setup') {
                window.location.href = '/profile-setup';
                return;
              }
            }
          } catch (error) {
            // LOGIN_STATE 쿠키 파싱 실패 시 조용히 처리
          }
        }
        
      } catch (error) {
        resetAuthState();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);


  const contextValue: AuthContextType = {
    isAuthenticated,
    isLoading,
    user,
    login,
    logout: logoutUser,
    withdraw: withdrawUser,
    updateUser,
    refreshAuthStatus,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
