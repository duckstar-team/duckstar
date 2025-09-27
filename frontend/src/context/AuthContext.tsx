'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getUserInfo, logout, withdraw } from '../api/client';

interface User {
  id: number;
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
      await withdraw();
    } catch (error) {
      // 에러 처리 로직 추가 가능
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
