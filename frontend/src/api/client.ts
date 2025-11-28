import {
  ApiResponse,
  ApiResponseAnimeCandidateListDto,
  ApiResponseAnimeVoteStatusDto,
  ApiResponseLiveCandidateListDto,
  ApiResponseStarInfoDto,
  ApiResponseVoteReceiptDto,
  UpdateProfileResponseDto,
} from '@/types/api';
import { CandidateDto, CandidateListDto, VoteResultDto } from '@/types/vote';

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

// Device fingerprint 생성 함수
async function generateDeviceFingerprint(): Promise<string> {
  if (typeof window === 'undefined') {
    return 'no-fp';
  }

  try {
    const components = [
      navigator.userAgent || '',
      navigator.language || '',
      navigator.languages?.join(',') || '',
      screen.width?.toString() || '',
      screen.height?.toString() || '',
      screen.colorDepth?.toString() || '',
      new Date().getTimezoneOffset().toString(),
      navigator.platform || '',
      navigator.hardwareConcurrency?.toString() || '',
      (navigator as any).deviceMemory?.toString() || '',
    ];

    const fingerprintString = components.join('|');

    // Web Crypto API를 사용한 SHA-256 해시 생성
    const encoder = new TextEncoder();
    const data = encoder.encode(fingerprintString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    // 최소 20자 이상이어야 하므로 전체 해시 반환 (64자)
    return hashHex;
  } catch (error) {
    console.error('Fingerprint 생성 실패:', error);
    // Fallback: 간단한 base64 인코딩
    try {
      const components = [
        navigator.userAgent || '',
        navigator.language || '',
        screen.width?.toString() || '',
        screen.height?.toString() || '',
      ];
      const fingerprintString = components.join('|');
      return btoa(fingerprintString)
        .replace(/[^a-zA-Z0-9]/g, '')
        .substring(0, 64);
    } catch {
      return 'no-fp';
    }
  }
}

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
          throw new Error(
            `API 호출 실패: ${retryResponse.status} ${retryResponse.statusText}`
          );
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
    // 서버에서 표준 오류 포맷을 내려주면 그대로 throw하여 클라이언트에서 메시지를 활용
    const errorPayload: ApiResponse<{ body: string }> = await response.json();
    throw errorPayload;
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
    throw new Error(
      `카카오 회원탈퇴 실패: ${response.status} ${response.statusText}`
    );
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
    throw new Error(
      `구글 회원탈퇴 실패: ${response.status} ${response.statusText}`
    );
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
    throw new Error(
      `네이버 회원탈퇴 실패: ${response.status} ${response.statusText}`
    );
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

export async function updateProfile(
  formData: FormData
): Promise<UpdateProfileResponseDto> {
  const headers: Record<string, string> = {};

  // localStorage에서 accessToken 가져오기
  if (typeof window !== 'undefined') {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
  }

  const response = await fetch(
    `${API_CONFIG.baseUrl}${ENDPOINTS.auth.updateProfile}`,
    {
      method: 'PATCH',
      headers,
      credentials: API_CONFIG.credentials,
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error(
      `프로필 업데이트 실패: ${response.status} ${response.statusText}`
    );
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

export async function revoteAnime(
  submissionId: number,
  voteData: Record<string, unknown>
) {
  return apiCall<ApiResponse<void>>(
    `${ENDPOINTS.vote.candidates}/${submissionId}`,
    {
      method: 'POST',
      body: JSON.stringify(voteData),
    }
  );
}

// 별점 투표/수정 API (비로그인 허용)
export async function submitStarVote(
  episodeId: number,
  starScore: number,
  episodeStarId?: number
) {
  const fingerprint = await generateDeviceFingerprint();

  return apiCall<ApiResponseStarInfoDto>('/api/v1/vote/star', {
    method: 'POST',
    headers: {
      'X-DEVICE-FP': fingerprint,
    },
    body: JSON.stringify({
      episodeId,
      starScore,
      episodeStarId,
    }),
  });
}

// 투표 폼(모달) 투표/수정 API (로그인 ONLY)
export async function submitVoteForm(voteData: Record<string, unknown>) {
  const response = await apiCall<ApiResponse<VoteResultDto>>(
    '/api/v1/vote/star-form',
    {
      method: 'POST',
      body: JSON.stringify(voteData),
    }
  );

  if (!response.isSuccess) {
    throw response;
  }

  return response;
}

// 실시간 투표 리스트 조회 API
export async function getStarCandidates() {
  return apiCall<ApiResponseLiveCandidateListDto>('/api/v1/vote/star');
}

// 주차 후보 목록 조회 API
export async function getCandidateList(
  year: number,
  quarter: number,
  week: number
) {
  return apiCall<ApiResponse<CandidateListDto[]>>(
    `/api/v1/vote/episodes/${year}/${quarter}/${week}`,
    {
      method: 'GET',
    }
  );
}

// 후보 단건 조회 API
export async function getCandidate(episodeId: number) {
  return apiCall<ApiResponse<CandidateDto>>(
    `/api/v1/vote/episodes/${episodeId}`,
    {
      method: 'GET',
    }
  );
}

// 별점 회수 API
export async function withdrawStar(episodeId: number, episodeStarId?: number) {
  // TODO: episodeStarId 필수 처리
  return apiCall<ApiResponse<void>>(
    `/api/v1/vote/withdraw/${episodeId}/${episodeStarId}`,
    {
      method: 'POST',
    }
  );
}

// Admin API functions
export async function createAnime(animeData: Record<string, unknown>) {
  return apiCall(ENDPOINTS.admin.animes, {
    method: 'POST',
    body: JSON.stringify(animeData),
  });
}

// Admin Submission API functions
export interface SubmissionCountDto {
  weekId: number;
  year: number;
  quarter: number;
  week: number;
  ipHash: string;
  count: number;
  isBlocked: boolean;
  isAllWithdrawn: boolean;
  firstCreatedAt: string;
  lastCreatedAt: string;
}

export interface PageInfo {
  hasNext: boolean;
  page: number;
  size: number;
}

export interface SubmissionCountSliceDto {
  submissionCountDtos: SubmissionCountDto[];
  pageInfo: PageInfo;
}

export interface ApiResponseSubmissionCountSliceDto {
  isSuccess: boolean;
  code: string;
  message: string;
  result: SubmissionCountSliceDto;
}

export interface EpisodeStarDto {
  titleKor: string;
  starScore: number;
  isBlocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponseListEpisodeStarDto {
  isSuccess: boolean;
  code: string;
  message: string;
  result: EpisodeStarDto[];
}

export async function getSubmissionCountGroupByIp(
  page: number = 0,
  size: number = 50,
  sort?: string[]
): Promise<ApiResponseSubmissionCountSliceDto> {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });

  if (sort && sort.length > 0) {
    sort.forEach((s) => params.append('sort', s));
  }

  return apiCall<ApiResponseSubmissionCountSliceDto>(
    `/api/admin/submissions?${params.toString()}`
  );
}

export async function getSubmissionsByWeekAndIp(
  weekId: number,
  ipHash: string
): Promise<ApiResponseListEpisodeStarDto> {
  const params = new URLSearchParams({
    weekId: weekId.toString(),
    ipHash: ipHash,
  });

  return apiCall<ApiResponseListEpisodeStarDto>(
    `/api/admin/ip?${params.toString()}`
  );
}

// IP 차단 토글
export async function banIp(
  ipHash: string,
  enabled: boolean,
  reason: string
): Promise<void> {
  const params = new URLSearchParams({
    ipHash,
    enabled: enabled.toString(),
    reason,
  });
  return apiCall<void>(`/api/admin/ip/ban?${params.toString()}`, {
    method: 'POST',
  });
}

// 표 몰수
export async function withdrawVotesByWeekAndIp(
  weekId: number,
  ipHash: string,
  reason: string
): Promise<void> {
  const params = new URLSearchParams({
    weekId: weekId.toString(),
    ipHash,
    reason,
  });
  return apiCall<void>(`/api/admin/ip/withdraw?${params.toString()}`, {
    method: 'POST',
  });
}

// 표 몰수 되돌리기
export async function undoWithdrawnSubmissions(
  logId: number,
  weekId: number,
  ipHash: string,
  reason: string
): Promise<void> {
  if (!logId || !weekId || !ipHash || !reason) {
    throw new Error('필수 파라미터가 누락되었습니다.');
  }

  const params = new URLSearchParams({
    logId: logId.toString(),
    weekId: weekId.toString(),
    ipHash,
    reason,
  });
  return apiCall<void>(`/api/admin/ip/withdraw/undo?${params.toString()}`, {
    method: 'POST',
  });
}

// IP 관리 로그 관련 타입
export interface IpManagementLogDto {
  logId: number;
  memberId: number;
  profileImageUrl: string;
  managerNickname: string;
  weekId: number | null;
  year: number | null;
  quarter: number | null;
  week: number | null;
  ipHash: string;
  taskType: 'BAN' | 'UNBAN' | 'WITHDRAW' | 'UNDO_WITHDRAW';
  reason: string;
  managedAt: string;
  isUndoable: boolean;
}

export interface IpManagementLogSliceDto {
  ipManagementLogDtos: IpManagementLogDto[];
  pageInfo: PageInfo;
}

export interface ApiResponseIpManagementLogSliceDto {
  isSuccess: boolean;
  code: string;
  message: string;
  result: IpManagementLogSliceDto;
}

// IP 관리 로그 조회
export async function getAdminLogsOnIpManagement(
  page: number = 0,
  size: number = 10,
  sort?: string[]
): Promise<ApiResponseIpManagementLogSliceDto> {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });

  if (sort && sort.length > 0) {
    sort.forEach((s) => params.append('sort', s));
  }

  return apiCall<ApiResponseIpManagementLogSliceDto>(
    `/api/admin/submissions/logs?${params.toString()}`
  );
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

  const response = await fetch(
    `${API_CONFIG.baseUrl}${ENDPOINTS.admin.animes}/${animeId}`,
    {
      method: 'POST',
      headers,
      credentials: API_CONFIG.credentials,
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error(
      `애니메이션 이미지 수정 실패: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

// SWR fetcher function
export const fetcher = <T>(url: string): Promise<T> => {
  return apiCall<T>(url);
};
