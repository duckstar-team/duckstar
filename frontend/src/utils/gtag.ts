/**
 * Google Analytics 4 유틸리티 함수
 */

// GA 측정 ID (환경 변수에서 가져오기)
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-FV68BFV3GX';

// 개발 환경 감지 (로컬호스트 또는 개발 서버)
export const isDevelopment = (): boolean => {
  if (typeof window === 'undefined') {
    return process.env.NODE_ENV === 'development';
  }
  
  const hostname = window.location.hostname;
  return (
    process.env.NODE_ENV === 'development' ||
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    hostname.endsWith('.local')
  );
};

// gtag 함수 타입 정의
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

/**
 * 페이지뷰 추적
 * @param url 페이지 URL
 * @param title 페이지 제목 (선택사항)
 */
export const pageview = (url: string, title?: string) => {
  // 개발 환경에서는 추적하지 않음
  if (isDevelopment()) return;
  
  if (typeof window === 'undefined' || !window.gtag) return;
  
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: url,
    page_title: title,
  });
};

/**
 * 커스텀 이벤트 추적
 * @param eventName 이벤트 이름
 * @param eventParams 이벤트 파라미터 (선택사항)
 */
export const event = (
  eventName: string,
  eventParams?: Record<string, any>
) => {
  // 개발 환경에서는 추적하지 않음
  if (isDevelopment()) return;
  
  if (typeof window === 'undefined' || !window.gtag) return;
  
  window.gtag('event', eventName, eventParams);
};

/**
 * 사용자 ID 설정 (로그인한 사용자)
 * @param userId 사용자 ID
 */
export const setUserId = (userId: string | number | null) => {
  // 개발 환경에서는 추적하지 않음
  if (isDevelopment()) return;
  
  if (typeof window === 'undefined' || !window.gtag) return;
  
  if (userId) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      user_id: userId.toString(),
    });
  } else {
    // 로그아웃 시 사용자 ID 제거
    window.gtag('config', GA_MEASUREMENT_ID, {
      user_id: null,
    });
  }
};

/**
 * 사용자 속성 설정
 * @param properties 사용자 속성 객체
 */
export const setUserProperties = (properties: Record<string, any>) => {
  // 개발 환경에서는 추적하지 않음
  if (isDevelopment()) return;
  
  if (typeof window === 'undefined' || !window.gtag) return;
  
  window.gtag('set', 'user_properties', properties);
};

