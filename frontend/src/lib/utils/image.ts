/**
 * 이미지 URL 유틸리티 함수
 * img.duckstar.kr 이미지를 프록시를 통해 로드하여 CORS 문제 해결
 */

/**
 * 이미지 URL이 프록시를 통해 로드되어야 하는지 확인
 * @param url 이미지 URL
 * @returns 프록시 필요 여부
 */
export function needsProxy(url: string | null | undefined): boolean {
  if (!url) return false;

  // 이미 프록시 URL이거나 data URL이면 스킵
  if (url.startsWith('data:') || url.startsWith('/api/image-proxy')) {
    return false;
  }

  // 상대 경로는 프록시 불필요
  if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
    return false;
  }

  // img.duckstar.kr 도메인은 무조건 프록시 필요 (CORS 문제 해결)
  // 이 체크를 먼저 수행하여 배포 환경에서도 프록시를 사용하도록 보장
  if (url.includes('img.duckstar.kr')) {
    return true;
  }

  // 같은 도메인 이미지인지 정확하게 비교 (hostname 기준)
  if (typeof window !== 'undefined') {
    try {
      const target = new URL(url, window.location.origin);
      if (target.hostname === window.location.hostname) {
        return false;
      }
    } catch {
      // URL 파싱 실패 시 (상대 경로 등) 프록시 불필요
      return false;
    }
  }

  return false;
}

/**
 * 이미지 URL을 프록시 URL로 변환
 * @param url 원본 이미지 URL
 * @returns 프록시 URL 또는 원본 URL
 */
export function getProxiedImageUrl(url: string | null | undefined): string {
  if (!url) return '';

  // 프록시가 필요하지 않으면 원본 URL 반환
  if (!needsProxy(url)) {
    return url;
  }

  // 프록시 URL 생성
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
}
