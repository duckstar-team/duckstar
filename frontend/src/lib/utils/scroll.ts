/**
 * 페이지를 맨 위로 스크롤
 */
export function scrollToTop(): void {
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: 'instant',
  });

  // 추가 보장을 위한 document 요소 직접 설정
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
}

/**
 * 전역 스크롤 상태 관리자
 * 단일 책임: 스크롤 위치 저장
 */
export class ScrollStateManager {
  private static instance: ScrollStateManager;
  private scrollPositions: Map<string, number> = new Map();

  static getInstance(): ScrollStateManager {
    if (!ScrollStateManager.instance) {
      ScrollStateManager.instance = new ScrollStateManager();
    }
    return ScrollStateManager.instance;
  }

  /**
   * 현재 스크롤 위치 저장
   * @param key 페이지 식별자 (예: 'search-/search')
   */
  saveScrollPosition(key: string): void {
    const scrollY = window.scrollY || 0;
    const documentScrollTop = document.documentElement.scrollTop || 0;
    const bodyScrollTop = document.body.scrollTop || 0;
    const position = Math.max(scrollY, documentScrollTop, bodyScrollTop);

    this._savePosition(key, position);
  }

  /**
   * 특정 스크롤 위치 저장 (현재 위치를 다시 읽지 않음)
   * @param key 페이지 식별자
   * @param position 저장할 스크롤 위치
   */
  saveScrollPositionAt(key: string, position: number): void {
    this._savePosition(key, position);
  }

  /**
   * 내부: 스크롤 위치 저장 로직
   */
  private _savePosition(key: string, position: number): void {
    this.scrollPositions.set(key, position);
    sessionStorage.setItem(`scroll-${key}`, position.toString());

    if (process.env.NODE_ENV === 'development') {
      console.log(`💾 스크롤 저장: ${key} = ${position}`);
    }
  }
}
