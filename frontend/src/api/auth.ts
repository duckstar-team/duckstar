import { apiCall } from './http';

// 카카오 로그인 API
export function startKakaoLogin() {
  // 현재 페이지 URL을 sessionStorage에 저장
  if (typeof window !== 'undefined') {
    const currentUrl = window.location.href;
    sessionStorage.setItem('returnUrl', currentUrl);

    // 카카오 로그인 페이지로 이동
    window.location.href = '/oauth2/authorization/kakao';
  }
}

// 구글 로그인 API
export function startGoogleLogin() {
  // 현재 페이지 URL을 sessionStorage에 저장
  if (typeof window !== 'undefined') {
    const currentUrl = window.location.href;
    sessionStorage.setItem('returnUrl', currentUrl);

    // 구글 로그인 페이지로 이동
    window.location.href = '/oauth2/authorization/google';
  }
}

// 네이버 로그인 API
export function startNaverLogin() {
  // 현재 페이지 URL을 sessionStorage에 저장
  if (typeof window !== 'undefined') {
    const currentUrl = window.location.href;
    sessionStorage.setItem('returnUrl', currentUrl);

    // 네이버 로그인 페이지로 이동
    window.location.href = '/oauth2/authorization/naver';
  }
}

// 토큰 갱신 API
export async function refreshToken() {
  return apiCall<{ accessToken: string }>('/api/v1/auth/token/refresh', {
    method: 'POST',
  });
}

// 로그아웃 API
export async function logout() {
  return apiCall<void>('/api/v1/auth/logout', { method: 'POST' });
}

// TODO: 미사용 확인 필요 (or 카카오와 통합)
export async function withdraw() {
  return apiCall<void>(
    '/api/v1/auth/withdraw/kakao',
    { method: 'POST' },
    '회원탈퇴 실패'
  );
}

// 카카오 회원탈퇴 API
export async function withdrawKakao() {
  return apiCall<void>(
    '/api/v1/auth/withdraw/kakao',
    { method: 'POST' },
    '카카오 회원탈퇴 실패'
  );
}

// 구글 회원탈퇴 API
export async function withdrawGoogle() {
  return apiCall<void>(
    '/api/v1/auth/withdraw/google',
    { method: 'POST' },
    '구글 회원탈퇴 실패'
  );
}

// 네이버 회원탈퇴 API
export async function withdrawNaver() {
  return apiCall<void>(
    '/api/v1/auth/withdraw/naver',
    { method: 'POST' },
    '네이버 회원탈퇴 실패'
  );
}
