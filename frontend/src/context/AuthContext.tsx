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
      resetAuthState();
    }
  };

  const withdrawUser = async () => {
    try {
      await withdraw();
    } catch (error) {
      // 에러 처리 로직 추가 가능
    } finally {
      resetAuthState();
    }
  };

  const updateUser = (userData: User) => {
    setUser(userData);
  };

  useEffect(() => {
    const checkUserAuth = async () => {
      try {
        const userData = await getUserInfo();
        login(userData as unknown as User);
      } catch (error) {
        // 사용자 인증 실패 처리
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
