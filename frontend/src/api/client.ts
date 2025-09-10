import { 
  ApiResponseAnimeCandidateListDto, 
  ApiResponseAnimeVoteStatusDto, 
  ApiResponseVoteReceiptDto 
} from '@/types/api';

export const BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

// API Configuration
const API_CONFIG = {
  baseUrl: BASE_URL,
  defaultHeaders: {
    'Content-Type': 'application/json',
  },
  credentials: 'include' as const,
} as const;

// API Endpoints
const ENDPOINTS = {
  auth: {
    kakaoLogin: '/oauth2/authorization/kakao',
    refreshToken: '/api/v1/auth/token/refresh',
    logout: '/api/v1/auth/logout',
    withdraw: '/api/v1/auth/withdraw/kakao',
    userInfo: '/api/v1/members/me',
  },
  vote: {
    candidates: '/api/v1/vote/anime',
    status: '/api/v1/vote/anime/status',
  },
} as const;

// Default fetch options
const getDefaultOptions = (): RequestInit => {
  const headers: Record<string, string> = { ...API_CONFIG.defaultHeaders };
  
  // localStorage에서 accessToken 가져오기
  if (typeof window !== 'undefined') {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
  }
  
  return {
    credentials: API_CONFIG.credentials,
    headers,
  };
};

// API call helper function - 성능 최적화
async function apiCall<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_CONFIG.baseUrl}${endpoint}`;
  const config = {
    ...getDefaultOptions(),
    ...options,
    headers: {
      ...getDefaultOptions().headers,
      ...options.headers,
    },
    // 성능 최적화 옵션 추가
    cache: 'default' as RequestCache,
    keepalive: true,
  };

  const response = await fetch(url, config);
  
  if (!response.ok) {
    throw new Error(`API 호출 실패: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

// Auth API functions
export function startKakaoLogin() {
  // 현재 페이지 URL을 sessionStorage에 저장
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('returnUrl', window.location.href);
  }
  
  // 카카오 로그인 페이지로 이동
  window.location.href = `${API_CONFIG.baseUrl}${ENDPOINTS.auth.kakaoLogin}`;
}

export async function refreshToken(): Promise<{ accessToken: string }> {
  return apiCall(ENDPOINTS.auth.refreshToken, { method: 'POST' });
}

export async function logout(): Promise<void> {
  await apiCall(ENDPOINTS.auth.logout, { method: 'POST' });
}

export async function withdraw(): Promise<void> {
  await apiCall(ENDPOINTS.auth.withdraw, { method: 'POST' });
}

export async function getUserInfo(): Promise<Record<string, unknown>> {
  return apiCall(ENDPOINTS.auth.userInfo);
}

// Vote API functions
export async function getVoteCandidates() {
  return apiCall<ApiResponseAnimeCandidateListDto>(ENDPOINTS.vote.candidates);
}

export async function getVoteStatus() {
  return apiCall<ApiResponseAnimeVoteStatusDto>(ENDPOINTS.vote.status);
}

export async function submitVote(voteData: Record<string, unknown>) {
  return apiCall<ApiResponseVoteReceiptDto>(ENDPOINTS.vote.candidates, {
    method: 'POST',
    body: JSON.stringify(voteData),
  });
}

// SWR fetcher function
export const fetcher = <T>(url: string): Promise<T> => {
  return apiCall<T>(url);
};
