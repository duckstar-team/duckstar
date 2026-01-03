/**
 * Open Graph 이미지 URL 생성 헬퍼
 * WebP 이미지를 JPG/PNG로 변환하는 API를 호출
 */

import { OG_LOGO_URL } from '../constants';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://duckstar.kr';

/**
 * URL이 절대 경로인지 확인
 */
function isAbsoluteUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

/**
 * OG 태그용 이미지 URL 생성
 * @param imageUrl 원본 이미지 URL (WebP 가능)
 * @param format 변환할 형식 ('jpg' 또는 'png', 기본값: 'jpg')
 * @param width 이미지 너비 (선택적, 기본값: 1200)
 * @param height 이미지 높이 (선택적, 기본값: 630)
 * @returns 변환된 이미지 URL (절대 경로 보장)
 */
export function getOgImageUrl(
  imageUrl: string | null | undefined,
  format: 'jpg' | 'png' = 'jpg',
  width?: number,
  height?: number
): string {
  // 이미지 URL이 없으면 기본 로고 사용
  if (!imageUrl || imageUrl.trim() === '') {
    // 기본 로고는 정적 파일이므로 직접 반환 (OG용 JPG 사용)
    return OG_LOGO_URL;
  }

  // 상대 경로인 경우 절대 경로로 변환
  let absoluteImageUrl = imageUrl;
  if (!isAbsoluteUrl(imageUrl)) {
    // 상대 경로인 경우 API_BASE_URL을 기준으로 절대 경로 생성
    if (imageUrl.startsWith('/')) {
      absoluteImageUrl = `${API_BASE_URL}${imageUrl}`;
    } else {
      absoluteImageUrl = `${API_BASE_URL}/${imageUrl}`;
    }
  }

  // S3 URL이 아니거나 이미 JPG/PNG인 경우 (HTTPS로 변환)
  if (
    !absoluteImageUrl.includes('img.duckstar.kr') &&
    !absoluteImageUrl.includes('duckstar.kr')
  ) {
    // HTTP를 HTTPS로 변환 (카카오톡은 HTTPS 필요)
    if (absoluteImageUrl.startsWith('http://')) {
      absoluteImageUrl = absoluteImageUrl.replace('http://', 'https://');
    }
    return absoluteImageUrl;
  }

  // 변환 API 호출 URL 생성
  const params = new URLSearchParams({
    url: absoluteImageUrl,
    format: format,
  });

  if (width) {
    params.append('width', width.toString());
  }
  if (height) {
    params.append('height', height.toString());
  }

  return `${API_BASE_URL}/api/v1/images/og?${params.toString()}`;
}

/**
 * 애니메이션 상세 페이지용 OG 이미지 URL
 * @param thumbnailUrl 썸네일 URL
 * @returns OG 이미지 URL
 */
export function getAnimeOgImageUrl(
  thumbnailUrl: string | null | undefined
): string {
  return getOgImageUrl(thumbnailUrl, 'jpg', 1200, 630);
}
