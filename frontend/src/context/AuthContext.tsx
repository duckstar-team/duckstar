'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
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
import { setUserId } from '@/utils/gtag';

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
  const [tokenExpiryTimer, setTokenExpiryTimer] =
    useState<NodeJS.Timeout | null>(null);
  const [lastActivityTime, setLastActivityTime] = useState<number>(Date.now());
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [inactivityTimer, setInactivityTimer] = useState<NodeJS.Timeout | null>(
    null
  );

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
    // 토큰 만료 타이머 정리
    if (tokenExpiryTimer) {
      clearTimeout(tokenExpiryTimer);
      setTokenExpiryTimer(null);
    }
    // 비활성 타이머 정리
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
      setInactivityTimer(null);
    }
  };

  // 사용자 활동 감지 (타이머 리셋만)
  const handleUserActivity = async () => {
    const now = Date.now();
    setLastActivityTime(now);

    // 비활성 타이머 재설정
    setupInactivityTimer();
  };

  // 비활성 상태 자동 감지 타이머 (1시간 후 로그아웃)
  const setupInactivityTimer = () => {
    // 기존 비활성 타이머 정리
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
    }

    const inactivityTime = 60 * 60 * 1000; // 1시간

    const timer = setTimeout(async () => {
      // 1시간 비활성 시 로그아웃
      logoutUser();
    }, inactivityTime);

    setInactivityTimer(timer);
  };

  // 토큰 만료 감지 및 자동 로그아웃
  const setupTokenExpiryTimer = () => {
    // 기존 타이머 정리
    if (tokenExpiryTimer) {
      clearTimeout(tokenExpiryTimer);
    }

    // 운영 환경: 50분 후 자동 토큰 갱신 시도
    const refreshTime = 50 * 60 * 1000; // 50분
    const logoutTime = 60 * 60 * 1000; // 1시간

    setTimeout(async () => {
      const refreshSuccess = await attemptTokenRefresh();

      if (!refreshSuccess) {
        // 갱신 실패 시에만 사용자에게 알림
        if (typeof window !== 'undefined' && (window as any).showToast) {
          (window as any).showToast(
            '세션이 만료되었습니다. 다시 로그인해주세요.',
            'error',
            5000
          );
        }
      }
    }, refreshTime);

    // 자동 로그아웃 타이머
    const timer = setTimeout(() => {
      logoutUser();
    }, logoutTime);

    setTokenExpiryTimer(timer);
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
        const data = await response.json();
        // 토큰 갱신 성공, 새로운 만료 타이머 설정
        setupTokenExpiryTimer();
        return true;
      } else {
        // 토큰 갱신 실패, 로그아웃
        logoutUser();
        return false;
      }
    } catch (error) {
      logoutUser();
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
      // 중복 투표 방지 시간 초기화
      localStorage.removeItem('duckstar_vote_block_until');
      // 토큰 만료 타이머 설정
      console.log('로그인 성공, 토큰 만료 타이머 설정');
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

        // 비활성 감지 타이머 설정
        setupInactivityTimer();
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

  // 최적화된 인증 로직: 쿠키 체크 후 API 호출
  // 사용자 활동 이벤트 리스너 설정
  useEffect(() => {
    if (!isAuthenticated) return;

    const activityEvents = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    const handleActivity = () => {
      handleUserActivity();
    };

    // 이벤트 리스너 등록
    activityEvents.forEach((event) => {
      document.addEventListener(event, handleActivity, true);
    });

    return () => {
      // 이벤트 리스너 정리
      activityEvents.forEach((event) => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [isAuthenticated, lastActivityTime]);

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
        const userData = await getCurrentUser();
        const user = userData.result || userData;
        setUser(user as User);
        setIsAuthenticated(true);

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

              // returnUrl 처리
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
                window.location.href = returnUrl;
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
