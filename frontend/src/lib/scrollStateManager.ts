/**
 * 전역 스크롤 상태 관리자
 * 단일 책임: 스크롤 위치 저장/복원/정리
 */
class ScrollStateManager {
  private static instance: ScrollStateManager;
  private scrollPositions: Map<string, number> = new Map();
  
  static getInstance(): ScrollStateManager {
    if (!ScrollStateManager.instance) {
      ScrollStateManager.instance = new ScrollStateManager();
    }
    return ScrollStateManager.instance;
  }
  
  /**
   * 스크롤 위치 저장
   * @param key 페이지 식별자 (예: 'search-/search')
   */
  saveScrollPosition(key: string): void {
    // 다중 방법으로 스크롤 위치 확인
    const scrollY = window.scrollY || 0;
    const documentScrollTop = document.documentElement.scrollTop || 0;
    const bodyScrollTop = document.body.scrollTop || 0;
    const position = Math.max(scrollY, documentScrollTop, bodyScrollTop);
    
    // 메모리와 sessionStorage에 저장
    this.scrollPositions.set(key, position);
    sessionStorage.setItem(`scroll-${key}`, position.toString());
    
    // 추가 보호: 즉시 확인
    if (process.env.NODE_ENV === 'development') {
      console.log(`💾 스크롤 저장: ${key} = ${position}`);
    }
  }

  /**
   * 특정 스크롤 위치 저장 (현재 위치를 다시 읽지 않음)
   * @param key 페이지 식별자
   * @param position 저장할 스크롤 위치
   */
  saveScrollPositionAt(key: string, position: number): void {
    // 메모리와 sessionStorage에 저장
    this.scrollPositions.set(key, position);
    sessionStorage.setItem(`scroll-${key}`, position.toString());
    
    // 추가 보호: 즉시 확인
    if (process.env.NODE_ENV === 'development') {
      console.log(`💾 스크롤 저장 (특정 위치): ${key} = ${position}`);
    }
  }
  
  /**
   * 스크롤 위치 복원
   * @param key 페이지 식별자
   */
  restoreScrollPosition(key: string): void {
    const position = this.scrollPositions.get(key) || 
                    parseInt(sessionStorage.getItem(`scroll-${key}`) || '0');
    
    console.log(`🔄 ScrollStateManager 복원 시도: ${key} = ${position}`);
    console.log(`🔄 메모리에서 찾은 위치: ${this.scrollPositions.get(key)}`);
    console.log(`🔄 sessionStorage에서 찾은 위치: ${sessionStorage.getItem(`scroll-${key}`)}`);
    
    if (position > 0) {
      console.log(`🔄 ScrollStateManager 즉시 스크롤 복원: ${position}`);
      // 즉시 스크롤 복원 (애니메이션 없이)
      window.scrollTo({ top: position, left: 0, behavior: 'auto' });
      
      // 추가 보호: 다중 지연 복원
      setTimeout(() => {
        window.scrollTo({ top: position, left: 0, behavior: 'auto' });
        console.log(`🔄 ScrollStateManager 지연 스크롤 복원 1: ${position}`);
      }, 10);
      
      setTimeout(() => {
        window.scrollTo({ top: position, left: 0, behavior: 'auto' });
        console.log(`🔄 ScrollStateManager 지연 스크롤 복원 2: ${position}`);
      }, 100);
      
      setTimeout(() => {
        window.scrollTo({ top: position, left: 0, behavior: 'auto' });
        console.log(`🔄 ScrollStateManager 지연 스크롤 복원 3: ${position}`);
      }, 300);
    } else {
      console.log(`⚠️ ScrollStateManager 스크롤 위치 없음: ${key}`);
    }
  }
  
  /**
   * 스크롤 위치 정리
   * @param key 페이지 식별자
   */
  clearPosition(key: string): void {
    this.scrollPositions.delete(key);
    sessionStorage.removeItem(`scroll-${key}`);
  }
  
  /**
   * 특정 키의 스크롤 위치가 있는지 확인
   * @param key 페이지 식별자
   */
  hasPosition(key: string): boolean {
    return this.scrollPositions.has(key) || 
           sessionStorage.getItem(`scroll-${key}`) !== null;
  }
}

export default ScrollStateManager;
