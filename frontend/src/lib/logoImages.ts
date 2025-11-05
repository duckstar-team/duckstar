/**
 * 로고 이미지 경로 관리
 * 여러 형식의 로고 이미지를 용도에 맞게 사용
 */

const BASE_URL = 'https://duckstar.kr';

/**
 * 로고 이미지 형식 타입
 */
export type LogoFormat = 'svg' | 'png' | 'jpg' | 'webp';

/**
 * 로고 이미지 용도별 경로 반환
 */
export const logoImages = {
  /**
   * 기본 로고 (SVG)
   * 일반 웹 페이지에서 사용
   */
  default: {
    svg: '/banners/duckstar-logo.svg',
    png: '/banners/duckstar-logo.png',
    jpg: '/banners/duckstar-logo.jpg',
    webp: '/banners/duckstar-logo.webp',
  },
  
  /**
   * Open Graph용 로고 (1200x630)
   * 소셜 미디어 공유 시 사용
   */
  og: {
    svg: '/banners/og-logo.svg',
    png: '/banners/og-logo.png',
    jpg: '/banners/og-logo.jpg',
    webp: '/banners/og-logo.webp',
  },
  
  /**
   * Favicon용 로고
   * 브라우저 탭 아이콘용
   */
  favicon: {
    svg: '/icons/favicon.svg',
    png: '/icons/favicon.png',
    ico: '/favicon.ico',
  },
} as const;

/**
 * 로고 이미지 URL 반환 (절대 경로)
 * @param type 로고 타입 ('default' | 'og' | 'favicon')
 * @param format 이미지 형식 ('svg' | 'png' | 'jpg' | 'webp')
 * @returns 절대 URL
 */
export function getLogoUrl(
  type: 'default' | 'og' | 'favicon',
  format: LogoFormat
): string {
  const logo = logoImages[type];
  const path = (logo as any)[format];
  
  if (!path) {
    // 폴백: 기본 형식 사용
    const fallback = type === 'favicon' ? 'svg' : 'png';
    return `${BASE_URL}${(logo as any)[fallback] || logo.svg}`;
  }
  
  return `${BASE_URL}${path}`;
}

/**
 * Open Graph용 로고 이미지 URL
 * @param format 이미지 형식 (기본값: 'jpg')
 * @returns OG용 로고 URL
 */
export function getOgLogoUrl(format: LogoFormat = 'jpg'): string {
  return getLogoUrl('og', format);
}

/**
 * 기본 로고 이미지 URL
 * @param format 이미지 형식 (기본값: 'svg')
 * @returns 기본 로고 URL
 */
export function getDefaultLogoUrl(format: LogoFormat = 'svg'): string {
  return getLogoUrl('default', format);
}

