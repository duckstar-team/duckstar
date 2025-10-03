/**
 * 페이지 상태 캐시 관리자
 * 단일 책임: 페이지 데이터 캐싱 및 복원
 */
class PageStateCache {
  private static instance: PageStateCache;
  private cache: Map<string, any> = new Map();
  
  static getInstance(): PageStateCache {
    if (!PageStateCache.instance) {
      PageStateCache.instance = new PageStateCache();
    }
    return PageStateCache.instance;
  }
  
  /**
   * 페이지 상태 캐싱
   * @param key 페이지 식별자
   * @param data 캐싱할 데이터
   */
  setPageState(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
  
  /**
   * 페이지 상태 복원
   * @param key 페이지 식별자
   * @param maxAge 캐시 유효 시간 (밀리초, 기본 5분)
   */
  getPageState(key: string, maxAge: number = 5 * 60 * 1000): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    // 캐시 만료 확인
    if (Date.now() - cached.timestamp > maxAge) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }
  
  /**
   * 페이지 상태 정리
   * @param key 페이지 식별자
   */
  clearPageState(key: string): void {
    this.cache.delete(key);
  }
  
  /**
   * 모든 캐시 정리
   */
  clearAll(): void {
    this.cache.clear();
  }
}

export default PageStateCache;
