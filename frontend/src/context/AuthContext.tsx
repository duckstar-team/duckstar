'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getUserInfo, logout, withdraw } from '../api/client';

interface User {
  id: number;
  nickname: string;
  profileImageUrl?: string;
  role: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  login: (userData: User) => void;
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
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const resetAuthState = () => {
    setUser(null);
    setIsAuthenticated(false);
    setAccessToken(null);
  };

  const login = (userData: User) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logoutUser = async () => {
    try {
      await logout();
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

  useEffect(() => {
    const checkUserAuth = async () => {
      try {
        // URL에서 accessToken 파라미터 확인 (로그인 후 리다이렉트)
        const urlParams = new URLSearchParams(window.location.search);
        const accessTokenFromUrl = urlParams.get('accessToken');
        const isNewUser = urlParams.get('isNewUser') === 'true';
        
        if (accessTokenFromUrl) {
          // accessToken을 localStorage에 저장
          localStorage.setItem('accessToken', accessTokenFromUrl);
          setAccessToken(accessTokenFromUrl);
          
          // URL에서 파라미터 제거 (보안상 이유)
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('accessToken');
          newUrl.searchParams.delete('isNewUser');
          window.history.replaceState({}, '', newUrl.toString());
          
          // 새로 가입한 사용자라면 프로필 설정 페이지로 리다이렉트
          if (isNewUser) {
            window.location.href = '/profile-setup';
            return;
          }
          
          // 저장된 returnUrl이 있으면 해당 페이지로 리다이렉트
          const returnUrl = sessionStorage.getItem('returnUrl');
          if (returnUrl && returnUrl !== window.location.href) {
            sessionStorage.removeItem('returnUrl');
            window.location.href = returnUrl;
            return; // 리다이렉트하므로 아래 코드 실행하지 않음
          }
        }

        // localStorage에서 accessToken 확인 - 토큰이 있을 때만 getUserInfo 호출
        const storedToken = localStorage.getItem('accessToken');
        if (storedToken) {
          const userData = await getUserInfo();
          // API 응답에서 실제 사용자 데이터 추출
          const user = userData.data || userData;
          login(user as User);
        }
      } catch (error) {
        // 사용자 인증 실패 처리 - 로그인되지 않은 상태
        // 토큰이 유효하지 않으면 localStorage에서 제거
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
        }
        resetAuthState();
      }
    };

    checkUserAuth();
  }, []);

  const contextValue: AuthContextType = {
    isAuthenticated,
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
