import { Schemas } from '@/types';

// 공통 API 응답 타입을 제네릭으로 확장
export type ApiResponse<T> = Omit<Schemas['ApiResponseVoid'], 'result'> & {
  result: T;
};

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
export async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {},
  errorMessage: string = 'API 호출 실패'
): Promise<ApiResponse<T>> {
  const url = endpoint;
  const defaultOptions = getDefaultOptions();

  // FormData인 경우 Content-Type 헤더 제거 (브라우저가 자동으로 multipart/form-data 설정)
  const isFormData = options.body instanceof FormData;
  const headers = isFormData
    ? { ...options.headers } // FormData일 때는 Content-Type 제거
    : {
        ...defaultOptions.headers,
        ...options.headers,
      };

  const config = {
    ...defaultOptions,
    ...options,
    headers,
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
        // 갱신 실패 시 쿠키 정리를 위해 로그아웃 호출 후 리다이렉트 (무한 리프레시 방지)
        if (typeof window !== 'undefined') {
          const targetUrl = '/';
          // 이미 홈(/)이면 리다이렉트하지 않고 인증 실패 응답 반환 → 콘솔 에러 방지
          if (window.location.pathname === targetUrl) {
            return {
              isSuccess: false,
              code: 'UNAUTHORIZED',
              message: '토큰 갱신 실패',
              result: undefined as T,
            } as ApiResponse<T>;
          }
          try {
            await fetch('/api/v1/auth/logout', {
              method: 'POST',
              credentials: 'include',
            });
          } catch (_) {
            // 로그아웃 실패해도 리다이렉트 진행
          }
          window.location.href = targetUrl;
        }
        throw new Error('토큰 갱신 실패');
      }
    } catch (error) {
      console.error('토큰 갱신 중 오류:', error);
      // 네트워크 오류(ECONNREFUSED 등) 시 리다이렉트하지 않음 → 무한 리프레시 방지
      // 백엔드 다운 시 에러 UI만 표시하고 사용자가 "다시 시도" 가능하도록 함
      throw error;
    }
  }

  if (!response.ok) {
    throw new Error(
      `${errorMessage}: ${response.status} ${response.statusText}`
    );
  }

  // 응답 본문 읽기 (한 번만 읽을 수 있으므로 먼저 text로 읽음)
  const contentType = response.headers.get('content-type');
  const text = await response.text();

  // 응답이 비어있는 경우 (회원탈퇴 등)
  if (!text.trim()) {
    return {
      isSuccess: true,
      code: 'SUCCESS',
      message: '',
      result: undefined as T,
    } as ApiResponse<T>;
  }

  // JSON 응답인 경우 파싱
  if (contentType && contentType.includes('application/json')) {
    try {
      return JSON.parse(text) as ApiResponse<T>;
    } catch (error) {
      // JSON 파싱 실패 시 기본값 반환
      return {
        isSuccess: true,
        code: 'SUCCESS',
        message: '',
        result: undefined as T,
      } as ApiResponse<T>;
    }
  }

  // JSON이 아닌 경우 기본값 반환
  return {
    isSuccess: true,
    code: 'SUCCESS',
    message: '',
    result: undefined as T,
  } as ApiResponse<T>;
}
