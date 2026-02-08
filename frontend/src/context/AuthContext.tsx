'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from 'react';
import {
  logout,
  withdraw,
  withdrawKakao,
  withdrawGoogle,
  withdrawNaver,
} from '@/api/auth';
import { getCurrentUser } from '@/api/member';
import { setUserId } from '@/lib';

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
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const tokenExpiryTimerRef = useRef<NodeJS.Timeout | null>(null);

  // user 상태 변경 시 GA 사용자 ID 자동 동기화
  useEffect(() => {
    if (user) {
      setUserId(user.id);
    } else {
      setUserId(null);
    }
  }, [user]);

  const resetAuthState = () => {
    setUser(null);
    setIsAuthenticated(false);
    setIsLoading(false);
    setHasCheckedAuth(false);
    if (tokenExpiryTimerRef.current) {
      clearTimeout(tokenExpiryTimerRef.current);
      tokenExpiryTimerRef.current = null;
    }
  };

  // 토큰 갱신만 수행, 자동 로그아웃 없음 (직접 로그아웃 시에만 로그아웃)
  const setupTokenExpiryTimer = () => {
    if (tokenExpiryTimerRef.current) {
      clearTimeout(tokenExpiryTimerRef.current);
    }

    const refreshInterval = 50 * 60 * 1000; // 50분마다 갱신 시도 (access token 1시간 전)

    const scheduleRefresh = () => {
      tokenExpiryTimerRef.current = setTimeout(async () => {
        const refreshSuccess = await attemptTokenRefresh();
        if (
          !refreshSuccess &&
          typeof window !== 'undefined' &&
          (window as any).showToast
        ) {
          (window as any).showToast(
            '세션 갱신에 실패했습니다. 일부 기능 사용 시 재로그인이 필요할 수 있습니다.',
            'error',
            5000
          );
        }
        scheduleRefresh(); // 다음 주기 예약 (자동 로그아웃 없이 계속 시도)
      }, refreshInterval);
    };

    scheduleRefresh();
  };

  // 토큰 갱신 시도 (중복 요청 방지)
  const attemptTokenRefresh = async () => {
    // 이미 갱신 중이면 중복 요청 방지
    if (isRefreshing) {
      return false;
    }

    setIsRefreshing(true);

    try {
      const response = await fetch('/api/v1/auth/token/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        await response.json();
        setupTokenExpiryTimer();
        return true;
      } else {
        // 토큰 갱신 실패, 로그아웃
        return false;
      }
    } catch (error) {
      return false;
    } finally {
      setIsRefreshing(false);
    }
  };

  const login = async (userData?: User) => {
    if (userData) {
      // 사용자 데이터가 제공된 경우 (OAuth 로그인 후)
      setUser(userData);
      setIsAuthenticated(true);
      setIsLoading(false);
      localStorage.removeItem('duckstar_vote_block_until');
      setupTokenExpiryTimer();
    } else {
      // 수동 로그인의 경우 API에서 사용자 정보 가져오기
      setIsLoading(true);
      try {
        const userData = await getCurrentUser();
        const user = userData.result || userData;
        setUser(user as User);
        setIsAuthenticated(true);
        // 중복 투표 방지 시간 초기화
        localStorage.removeItem('duckstar_vote_block_until');
        // 토큰 만료 타이머 설정
        setupTokenExpiryTimer();
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
      const response = await fetch('/api/v1/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const timeLeftSec = data.result; // ApiResponseLong의 result 값

        if (timeLeftSec > 0) {
          // 중복 투표 방지 시간을 localStorage에 저장
          const blockUntil = Date.now() + timeLeftSec * 1000;
          localStorage.setItem(
            'duckstar_vote_block_until',
            blockUntil.toString()
          );
        } else {
          // 시간이 0이면 저장된 값 삭제
          localStorage.removeItem('duckstar_vote_block_until');
        }
      }
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
      const userData = await getCurrentUser();
      const user = userData.result || userData;
      setUser(user as User);
      setIsAuthenticated(true);
      setHasCheckedAuth(true);
    } catch (error) {
      resetAuthState();
    }
  };

  useEffect(() => {
    const checkAuthStatus = async () => {
      if (hasCheckedAuth || isLoading) return;

      setIsLoading(true);
      setHasCheckedAuth(true);

      try {
        const userData = await getCurrentUser();
        // 토큰 갱신 실패 등 인증 실패 시 조용히 비로그인 상태로 처리 (콘솔 에러 방지)
        if (!userData?.isSuccess && userData?.code === 'UNAUTHORIZED') {
          resetAuthState();
          return;
        }
        const user = userData.result || userData;
        setUser(user as User);
        setIsAuthenticated(true);
        setupTokenExpiryTimer();

        // OAuth 콜백 처리 (LOGIN_STATE 쿠키가 있을 때만)
        const hasLoginState = document.cookie.includes('LOGIN_STATE=');
        if (hasLoginState) {
          try {
            const loginStateCookie = document.cookie
              .split('; ')
              .find((row) => row.startsWith('LOGIN_STATE='));

            if (loginStateCookie) {
              const encoded = loginStateCookie.split('=')[1];
              const decoded = atob(encoded);
              const loginState = JSON.parse(decoded);

              // returnUrl 처리 (같은 경로면 리다이렉트 스킵 → 무한 리프레시 방지)
              const returnUrl = sessionStorage.getItem('returnUrl');
              if (returnUrl) {
                if (
                  loginState.isNewUser &&
                  window.location.pathname !== '/profile-setup'
                ) {
                  window.location.href = '/profile-setup';
                  return;
                }

                if (loginState.isMigrated) {
                  sessionStorage.setItem('migration_completed', 'true');
                }

                sessionStorage.removeItem('returnUrl');
                try {
                  const returnPath = new URL(returnUrl, window.location.origin)
                    .pathname;
                  if (returnPath !== window.location.pathname) {
                    window.location.href = returnUrl;
                  }
                } catch {
                  window.location.href = returnUrl;
                }
                return;
              }

              if (loginState.isMigrated) {
                sessionStorage.setItem('migration_completed', 'true');
              }

              if (
                loginState.isNewUser &&
                window.location.pathname !== '/profile-setup'
              ) {
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
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
