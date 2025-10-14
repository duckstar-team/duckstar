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
  admin: {
    animes: '/api/admin/animes',
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

// API call helper function - 성능 최적화 및 토큰 만료 처리
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
  
  // 토큰 만료 감지 (401 Unauthorized)
  if (response.status === 401) {
    console.log('토큰 만료 감지, 갱신 시도');
    
    // 리프레시 토큰으로 갱신 시도
    try {
      const refreshResponse = await fetch('/api/v1/auth/token/refresh', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (refreshResponse.ok) {
        console.log('토큰 갱신 성공, 원래 요청 재시도');
        // 토큰 갱신 성공, 원래 요청 재시도
        const retryResponse = await fetch(url, config);
        if (!retryResponse.ok) {
          throw new Error(`API 호출 실패: ${retryResponse.status} ${retryResponse.statusText}`);
        }
        return retryResponse.json();
      } else {
        console.log('토큰 갱신 실패, 로그아웃 필요');
        // 갱신 실패 시 로그아웃 처리
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
        throw new Error('토큰 갱신 실패');
      }
    } catch (error) {
      console.error('토큰 갱신 중 오류:', error);
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
      throw error;
    }
  }
  
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
    }
  }
}

export async function withdrawKakao(): Promise<void> {
  const url = `${API_CONFIG.baseUrl}${ENDPOINTS.auth.withdraw}`;
  const config = {
    ...getDefaultOptions(),
    method: 'POST',
  };

  const response = await fetch(url, config);
  
  if (!response.ok) {
    throw new Error(`카카오 회원탈퇴 실패: ${response.status} ${response.statusText}`);
  }
  
  // 응답이 비어있거나 JSON이 아닌 경우 처리
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      await response.json();
    } catch (error) {
      // JSON 파싱 실패 시 무시 (성공으로 처리)
    }
  }
}

export async function withdrawGoogle(): Promise<void> {
  const url = `${API_CONFIG.baseUrl}${ENDPOINTS.auth.withdrawGoogle}`;
  const config = {
    ...getDefaultOptions(),
    method: 'POST',
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
    }
  }
}

export async function withdrawNaver(): Promise<void> {
  const url = `${API_CONFIG.baseUrl}${ENDPOINTS.auth.withdrawNaver}`;
  const config = {
    ...getDefaultOptions(),
    method: 'POST',
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

export async function revoteAnime(submissionId: number, voteData: Record<string, unknown>) {
  return apiCall<ApiResponseVoid>(`${ENDPOINTS.vote.candidates}/${submissionId}`, {
    method: 'POST',
    body: JSON.stringify(voteData),
  });
}

// 별점 투표 API
export async function submitStarVote(episodeId: number, starScore: number) {
  return apiCall<ApiResponseStarInfoDto>('/api/v1/vote/star', {
    method: 'POST',
    body: JSON.stringify({
      episodeId,
      starScore
    }),
  });
}

// 별점 투표 후보자 조회 API
export async function getStarCandidates() {
  return apiCall<ApiResponseStarCandidateListDto>('/api/v1/vote/star');
}

// 별점 회수 API
export async function withdrawStar(episodeId: number) {
  return apiCall<ApiResponseVoid>(`/api/v1/vote/withdraw/${episodeId}`, {
    method: 'POST',
  });
}

// Admin API functions
export async function createAnime(animeData: Record<string, unknown>) {
  return apiCall(ENDPOINTS.admin.animes, {
    method: 'POST',
    body: JSON.stringify(animeData),
  });
}

export async function updateAnimeImage(animeId: number, imageFile: File) {
  const formData = new FormData();
  formData.append('mainImage', imageFile);
  
  const headers: Record<string, string> = {};
  
  // localStorage에서 accessToken 가져오기
  if (typeof window !== 'undefined') {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
  }
  
  const response = await fetch(`${API_CONFIG.baseUrl}${ENDPOINTS.admin.animes}/${animeId}`, {
    method: 'POST',
    headers,
    credentials: API_CONFIG.credentials,
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error(`애니메이션 이미지 수정 실패: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

// SWR fetcher function
export const fetcher = <T>(url: string): Promise<T> => {
  return apiCall<T>(url);
};
