/**
 * 스크롤 관련 유틸리티 함수들
 */

/**
 * 페이지를 맨 위로 스크롤
 */
export function scrollToTop(): void {
  window.scrollTo(0, 0);
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
}

/**
 * 특정 위치로 스크롤
 * @param y - Y 좌표
 */
export function scrollToPosition(y: number): void {
  window.scrollTo(0, y);
  document.body.scrollTop = y;
  document.documentElement.scrollTop = y;
}

/**
 * sessionStorage에서 스크롤 위치를 가져오고 복원
 * @param key - sessionStorage 키
 * @param delay - 지연 시간 (ms)
 */
export function restoreScrollFromStorage(key: string, delay: number = 0): void {
  const savedY = sessionStorage.getItem(key);
  if (savedY) {
    const y = parseInt(savedY);
    if (delay > 0) {
      setTimeout(() => scrollToPosition(y), delay);
    } else {
      scrollToPosition(y);
    }
  }
}

/**
 * 현재 스크롤 위치를 sessionStorage에 저장
 * @param key - sessionStorage 키
 */
export function saveScrollToStorage(key: string): void {
  const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
  sessionStorage.setItem(key, scrollY.toString());
}

/**
 * sessionStorage 플래그들을 정리
 * @param keys - 제거할 키들
 */
export function clearStorageFlags(...keys: string[]): void {
  keys.forEach(key => sessionStorage.removeItem(key));
}
