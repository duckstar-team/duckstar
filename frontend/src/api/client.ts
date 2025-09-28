import { 
  ApiResponseAnimeCandidateListDto, 
  ApiResponseAnimeVoteStatusDto, 
  ApiResponseVoteReceiptDto,
  UpdateProfileResponseDto
} from '@/types/api';

// Next.js 프록시를 사용하므로 상대 경로 사용
export const BASE_URL = '';

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
    googleLogin: '/oauth2/authorization/google',
    naverLogin: '/oauth2/authorization/naver',
    refreshToken: '/api/v1/auth/token/refresh',
    logout: '/api/v1/auth/logout',
    withdraw: '/api/v1/auth/withdraw/kakao',
    withdrawGoogle: '/api/v1/auth/withdraw/google',
    withdrawNaver: '/api/v1/auth/withdraw/naver',
    userInfo: '/api/v1/members/me',
    updateProfile: '/api/v1/members/me/profile',
  },
  vote: {
    candidates: '/api/v1/vote/anime',
    status: '/api/v1/vote/anime/status',
  },
} as const;

// Default fetch options
const getDefaultOptions = (): RequestInit => {
  return {
    credentials: 'include', // ACCESS_TOKEN 쿠키 첨부 필수
    headers: {
      'Content-Type': 'application/json',
    },
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
    const currentUrl = window.location.href;
    sessionStorage.setItem('returnUrl', currentUrl);
    
    // 카카오 로그인 페이지로 이동
    window.location.href = `${API_CONFIG.baseUrl}${ENDPOINTS.auth.kakaoLogin}`;
  }
}

export function startGoogleLogin() {
  // 현재 페이지 URL을 sessionStorage에 저장
  if (typeof window !== 'undefined') {
    const currentUrl = window.location.href;
    sessionStorage.setItem('returnUrl', currentUrl);
    
    // 구글 로그인 페이지로 이동
    window.location.href = `${API_CONFIG.baseUrl}${ENDPOINTS.auth.googleLogin}`;
  }
}

export function startNaverLogin() {
  // 현재 페이지 URL을 sessionStorage에 저장
  if (typeof window !== 'undefined') {
    const currentUrl = window.location.href;
    sessionStorage.setItem('returnUrl', currentUrl);
    
    // 네이버 로그인 페이지로 이동
    window.location.href = `${API_CONFIG.baseUrl}${ENDPOINTS.auth.naverLogin}`;
  }
}

export async function refreshToken(): Promise<{ accessToken: string }> {
  return apiCall(ENDPOINTS.auth.refreshToken, { method: 'POST' });
}

export async function logout(): Promise<void> {
  await apiCall(ENDPOINTS.auth.logout, { method: 'POST' });
}

export async function withdraw(): Promise<void> {
  const url = `${API_CONFIG.baseUrl}${ENDPOINTS.auth.withdraw}`;
  const config = {
    ...getDefaultOptions(),
    method: 'POST',
  };

  const response = await fetch(url, config);
  
  if (!response.ok) {
    throw new Error(`회원탈퇴 실패: ${response.status} ${response.statusText}`);
  }
  
  // 응답이 비어있거나 JSON이 아닌 경우 처리
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      await response.json();
    } catch (error) {
      // JSON 파싱 실패 시 무시 (성공으로 처리)
      console.log('회원탈퇴 성공 (빈 응답)');
    }
  }
}

// 구글 OAuth를 통한 회원탈퇴
export function startGoogleWithdraw(): void {
  if (typeof window !== 'undefined') {
    // 현재 페이지 URL을 sessionStorage에 저장
    const currentUrl = window.location.href;
    sessionStorage.setItem('returnUrl', currentUrl);
    sessionStorage.setItem('withdrawMode', 'true');
    sessionStorage.setItem('withdrawProvider', 'GOOGLE');
    
    // Spring Security OAuth2 기본 플로우 사용 (회원탈퇴 모드 파라미터 추가)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://duckstar.kr';
    const backendUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:8080' : baseUrl;
    const googleAuthUrl = `${backendUrl}/oauth2/authorization/google?withdraw=true`;
    
    window.location.href = googleAuthUrl;
  }
}

// 네이버 OAuth를 통한 회원탈퇴
export function startNaverWithdraw(): void {
  if (typeof window !== 'undefined') {
    // 현재 페이지 URL을 sessionStorage에 저장
    const currentUrl = window.location.href;
    sessionStorage.setItem('returnUrl', currentUrl);
    sessionStorage.setItem('withdrawMode', 'true');
    sessionStorage.setItem('withdrawProvider', 'NAVER');
    
    // 네이버 OAuth 직접 URL 구성
    const naverClientId = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID || '5FSULVAe_1CvKyiDRee7';
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://duckstar.kr';
    
    // state 파라미터 생성 (CSRF 보호용)
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('naverState', state);
    
    // Spring Security OAuth2 기본 플로우 사용 (회원탈퇴 모드 파라미터 추가)
    const backendUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:8080' : baseUrl;
    const naverAuthUrl = `${backendUrl}/oauth2/authorization/naver?withdraw=true`;
    
    window.location.href = naverAuthUrl;
  }
}

// 구글 OAuth authorization code를 받아서 회원탈퇴 처리
export async function withdrawWithGoogleCode(code: string): Promise<void> {
  const url = `${API_CONFIG.baseUrl}${ENDPOINTS.auth.withdrawGoogle}`;
  const config = {
    ...getDefaultOptions(),
    method: 'POST',
    body: JSON.stringify({ code }),
  };

  const response = await fetch(url, config);
  
  if (!response.ok) {
    throw new Error(`구글 회원탈퇴 실패: ${response.status} ${response.statusText}`);
  }
  
  // 응답이 비어있거나 JSON이 아닌 경우 처리
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      await response.json();
    } catch (error) {
      // JSON 파싱 실패 시 무시 (성공으로 처리)
      console.log('구글 회원탈퇴 성공 (빈 응답)');
    }
  }
}

// 네이버 OAuth authorization code와 state를 받아서 회원탈퇴 처리
export async function withdrawWithNaverCode(code: string, state: string): Promise<void> {
  const url = `${API_CONFIG.baseUrl}${ENDPOINTS.auth.withdrawNaver}`;
  const config = {
    ...getDefaultOptions(),
    method: 'POST',
    body: JSON.stringify({ code, state }),
  };

  const response = await fetch(url, config);
  
  if (!response.ok) {
    throw new Error(`네이버 회원탈퇴 실패: ${response.status} ${response.statusText}`);
  }
  
  // 응답이 비어있거나 JSON이 아닌 경우 처리
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      await response.json();
    } catch (error) {
      // JSON 파싱 실패 시 무시 (성공으로 처리)
      console.log('네이버 회원탈퇴 성공 (빈 응답)');
    }
  }
}

export async function getUserInfo(): Promise<Record<string, unknown>> {
  return apiCall(ENDPOINTS.auth.userInfo);
}

export async function updateProfile(formData: FormData): Promise<UpdateProfileResponseDto> {
  const headers: Record<string, string> = {};
  
  // localStorage에서 accessToken 가져오기
  if (typeof window !== 'undefined') {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
  }
  
  const response = await fetch(`${API_CONFIG.baseUrl}${ENDPOINTS.auth.updateProfile}`, {
    method: 'PATCH',
    headers,
    credentials: API_CONFIG.credentials,
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error(`프로필 업데이트 실패: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
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
