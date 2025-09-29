/**
 * 스크롤 관련 유틸리티 함수들
 */

/**
 * 페이지를 맨 위로 스크롤 (100% 확실한 버전)
 */
export function scrollToTop(): void {
  // 1. 모든 가능한 스크롤 방법을 동시에 사용
  window.scrollTo(0, 0);
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: 'instant'
  });
  
  // 2. document 요소들 직접 설정
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
  document.body.scrollLeft = 0;
  document.documentElement.scrollLeft = 0;
  
  // 3. 모든 스크롤 가능한 요소들 처리
  const scrollableElements = document.querySelectorAll('*');
  scrollableElements.forEach(element => {
    const htmlElement = element as HTMLElement;
    if (htmlElement.scrollTop !== undefined) {
      htmlElement.scrollTop = 0;
    }
    if (htmlElement.scrollLeft !== undefined) {
      htmlElement.scrollLeft = 0;
    }
  });
  
  // 4. 강제 리플로우로 확실한 적용
  document.body.offsetHeight;
  document.documentElement.offsetHeight;
  
  // 5. 추가 보장을 위한 지연 실행
  setTimeout(() => {
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  }, 0);
  
  // 6. 한 번 더 지연 실행으로 확실히 보장
  setTimeout(() => {
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  }, 10);
}

/**
 * 특정 위치로 스크롤
 * @param y - Y 좌표
 */
export function scrollToPosition(y: number): void {
  window.scrollTo({
    top: y,
    left: 0,
    behavior: 'instant'
  });
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
